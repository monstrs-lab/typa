/* eslint-disable */

const { DomainEventSnapshot } = require('./dist/domain-event-store/entities')
const { DomainEvent } = require('./dist/domain-event-store/entities')
const { ConsumerProgress } = require('./dist/consumer-progress-store/entities')
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
  {
    type: 'postgres',
    name: 'consumer-progress-store',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'db',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    entities: [ConsumerProgress],
    cli: {
      migrationsDir: 'src/consumer-progress-store/migrations/postgres',
    },
  },
  {
    type: 'postgres',
    name: 'domain-event-store',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'db',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    entities: [DomainEventSnapshot, DomainEvent],
    cli: {
      migrationsDir: 'src/domain-event-store/migrations/postgres',
    },
  },
]
