const { Customer } = require('./src/entities')

module.exports = {
  type: 'postgres',
  host: 'localhost',
  database: 'db',
  username: 'postgres',
  password: 'password',
  entities: [Customer],
  cli: {
    migrationsDir: 'src/migrations',
  },
}
