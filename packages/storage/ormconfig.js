/* eslint-disable */

const { Lock } = require('./dist/lock-store/entities')

module.exports = [
  {
    type: 'postgres',
    name: 'lock-store',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'db',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    entities: [Lock],
    cli: {
      migrationsDir: 'src/lock-store/migrations/postgres',
    },
  },
]
