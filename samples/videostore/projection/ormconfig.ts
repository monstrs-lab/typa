const { Customer } = require('./src/entities')
const { Film } = require('./src/entities')

module.exports = {
  type: 'postgres',
  host: 'localhost',
  database: 'db',
  username: 'postgres',
  password: 'password',
  entities: [Customer, Film],
  cli: {
    migrationsDir: 'src/migrations',
  },
}
