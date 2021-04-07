const { apis: APIs } = require('../config/app')

const Joi = require('joi')
const validator = require('express-joi-validation').createValidator({})

// for each api define the validators schemas
// available validators here are for `body` `query` `params` `headers` `respone` `fields`
// more info: https://www.npmjs.com/package/express-joi-validation#api

/** @type {Record<string, Partial<Record<import("express-joi-validation").ContainerTypes, Joi.ObjectSchema>>>} */
const schemas = {
  [APIs.statistics]: {
    body: Joi.object({
      collection: Joi.string().optional(),
      // data must be an array (between 1 and 10 items) of objects that...
      data: Joi.array()
        .required()
        .min(1)
        .max(10)
        .items(
          Joi.object({
            // ...have at least an "id" property
            id: Joi.string().required().min(1).max(100),
            // ... have no date or ts property, because that is used internally
            ts: Joi.forbidden(),
            date: Joi.forbidden(),
            driverVersion: Joi.string().required().max(100),
            applicationName: Joi.string().required().max(100),
            applicationVersion: Joi.string().required().max(100),
            devices: Joi.array()
              .required()
              .max(255)
              .items(
                Joi.object({
                  manufacturerId: Joi.string().required().regex(/^0x[0-9a-f]{4}$/).allow(''),
                  productType: Joi.string().required().regex(/^0x[0-9a-f]{4}$/).allow(''),
                  productId: Joi.string().required().regex(/^0x[0-9a-f]{4}$/).allow(''),
                  firmwareVersion: Joi.string().required().regex(/^[0-9]{1,3}\.[0-9]{1,3}$/).allow('')
                })
              )
          })
        )
    })
  }
}

/**
 * @param {string} apiName
 */
module.exports = function (apiName) {
  /** @type {import("express").RequestHandler[]} */
  const validators = []
  for (const v in schemas[apiName]) {
    validators.push(validator[v](schemas[apiName][v]))
  }

  return validators
}
