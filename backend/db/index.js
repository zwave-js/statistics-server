const { MongoClient } = require('mongodb')
const { db: options } = require('../config/app')

const defaultCollection = 'statistics'
const collections = options.collections

// Connection URI
const uri =
  `mongodb://${options.host}:${options.port}/?poolSize=20&writeConcern=majority`

// Create a new MongoClient
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

module.exports = {
  upsert: async ({ collection = defaultCollection, data }) => {
    const bulk = client.db(options.db).collection(collection).initializeOrderedBulkOp()
    const findQuery = Object.assign({}, collections[collection].index[0]) || {
      _id: null
    }

    for (const doc of data) {
      if (collections[collection].timeseries) {
        // If the collection should be a time series, add the current date
        const now = new Date()
        doc.ts = new Date(Date.UTC(
          now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()
        ))
        doc.date = new Date(Date.UTC(
          now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
        ))
      }

      for (const k in findQuery) {
        findQuery[k] = doc[k]
      }

      bulk.find(findQuery).upsert().updateOne({ $set: doc })
    }

    await bulk.execute()
  },
  drop: async (collection) => {
    return client.db(options.db).dropCollection(collection)
  },
  init: async () => {
    await client.connect()
    await client.db('admin').command({ ping: 1 })
    const db = client.db(options.db)
    for (const c in collections) {
      const collection = await db.collection(c)
      await collection.createIndex(...collections[c].index)
    }
    console.log('MongoDB client connected successfully to server')
  },
  close: () => {
    console.log('Closing mongodb client...')
    return client.close()
  }
}
