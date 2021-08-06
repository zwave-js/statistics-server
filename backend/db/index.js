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

/**
 * @template T
 * @param {T} it
 * @returns {it is T & Record<string, unknown>}
 */
function isObject (it) {
  return Object.prototype.toString.call(it) === '[object Object]'
}

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
      const wantedIndex = collections[c].index
      const createIndex = async (index) => {
        try {
          // @ts-ignore
          await collection.createIndex(...index)
        } catch (e) {
          console.error(`ERROR: ${e.message}`)
        }
      }
      if (isObject(wantedIndex)) {
        // If this is an object, we know which indexes we want to exist
        try {
          // Get all existing indexes, except the default one for _id
          const indexNames = (await collection.indexes()).map(i => i.name).filter(i => i !== '_id_')
          // Drop those we don't want
          const unwanted = indexNames.filter(i => !(i in wantedIndex))
          for (const i of unwanted) {
            console.log(`${c}: dropping index ${i}`)
            await collection.dropIndex(i)
          }
          // And create the new ones
          for (const [name, defn] of Object.entries(wantedIndex)) {
            const index = defn[0]
            const options = defn[1] ?? {}
            options.name = name
            options.background = true
            console.log(`${c}: creating index ${JSON.stringify([index, options])}`)
            await createIndex([index, options])
          }
        } catch (e) {
          console.error(`${c}: Cannot create indexes: ${e}`)
        }
      } else {
        // Only the default index was specified, create it
        console.log(`${c}: creating index ${JSON.stringify(wantedIndex)}`)
        await createIndex(wantedIndex)
      }
    }
    console.log('MongoDB client connected successfully to server')
  },
  close: () => {
    console.log('Closing mongodb client...')
    return client.close()
  }
}
