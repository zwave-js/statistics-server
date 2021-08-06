module.exports = {
  db: {
    host: process.env.MONGO_HOST || 'localhost',
    db: 'statistics',
    port: process.env.MONGO_PORT || 27017,
    username: process.env.MONGO_USER,
    password: process.env.MONGO_PSW,
    collections: {
      statistics: {
        index: {
          default: [{ id: 1, date: 1 }, { unique: true }],
          'timestamp last 24h': [{ ts: 1, date: 1, id: 1 }]
        },
        timeseries: true
      },
      // add below custom collections if any
      manufacturer: {
        index: {
          default: [{ manufacturerId: 1 }, { unique: true }]
        }
      },
      product: {
        index: {
          default: [{ manufacturerId: 1, productType: 1, productId: 1 }, { unique: true }]
        }
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
  // When behind a reverse proxy, set this field to `true`, so the rate-limiter can see the user's external IP
  // Make sure to configure the proxy correctly. Details can be found at: http://expressjs.com/en/guide/behind-proxies.html
  // For nginx, the following config will do:
  //   proxy_set_header X-Forwarded-For $remote_addr
  //   proxy_set_header X-Forwarded-Host ""
  //   proxy_set_header X-Forwarded-Proto ""
  proxy: true,
  key: process.env.KEY
}
