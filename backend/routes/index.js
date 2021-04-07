const express = require('express')

const db = require('../db')
const { ConfigManager } = require('@zwave-js/config')
const { key, apis: APIs } = require('../config/app')
const createValidator = require('../config/validator')

const router = express.Router()

async function authMiddleware (req, res, next) {
  const token = req.headers['x-api-token']
  // third-party cookies must be allowed in order to work
  try {
    if (!token) {
      throw Error('Missing API token')
    }

    if (token === key) {
      next()
    } else {
      throw Error('Invalid API token')
    }
  } catch (error) {
    res.status(error.message === 'Invalid API token' ? 403 : 401).send(error.message)
  }
}

/* GET home page. */
router.post(APIs.statistics, authMiddleware, ...createValidator(APIs.statistics), async (req, res) => {
  try {
    const result = await db.upsert(req.body)
    res.json({ success: true, result })
  } catch (error) {
    console.error(error)
    res.json({ success: false, error: error.toString() })
  }
})

router.post(APIs.updateDb, authMiddleware, async (req, res) => {
  try {
    const manager = new ConfigManager()

    await manager.loadFulltextDeviceIndex()

    // https://zwave-js.github.io/node-zwave-js/#/api/config-manager?id=getfulltextindex
    const deviceIndex = manager.getFulltextIndex()

    const manufacturers = new Map()
    const products = new Map()

    for (const device of deviceIndex) {
      manufacturers.set(device.manufacturerId, {
        manufacturerId: device.manufacturerId,
        name: device.manufacturer
      })

      products.set(`${device.manufacturerId}-${device.productType}-${device.productId}`, {
        manufacturer: device.manufacturerId,
        productType: device.productType,
        productId: device.productId,
        label: device.label,
        description: device.description
      })
    }

    await db.drop('manufacturer')
    await db.drop('product')

    await db.upsert({ collection: 'manufacturer', data: [...manufacturers.values()], ignoreTime: true })
    await db.upsert({ collection: 'product', data: [...products.values()], ignoreTime: true })

    res.json({ success: true, result: 'done' })
  } catch (error) {
    res.json({ success: false, error })
  }
})

module.exports = router
