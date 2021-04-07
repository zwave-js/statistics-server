module.exports = {
  db: {
    host: process.env.MONGO_HOST || 'localhost',
    db: 'statistics',
    port: process.env.MONGO_PORT || 27017,
    username: process.env.MONGO_USER,
    password: process.env.MONGO_PSW,
    collections: {
      statistics: {
        index: [{ id: 1, date: 1 }, { unique: true }],
        timeseries: true
      },
      // add below custom collections if any
      manufacturer: {
        index: [{ manufacturerId: 1 }, { unique: true }]
      },
      product: {
        index: [{ manufacturerId: 1, productType: 1, productId: 1 }, { unique: true }]
      }
    }
  },
  apis: {
    statistics: '/statistics',
    updateDb: '/update-db'
  },
  port: process.env.PORT || '5000',
  rateLimit: {
    maxRequests: parseInt(process.env.RATELIMIT) || 2, // mind that 1 request needs to be done for auth
    ttl: 60 * 1000 // 1 minute
  },
  key: process.env.KEY
}
