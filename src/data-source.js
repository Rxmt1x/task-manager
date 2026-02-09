require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: process.env.DB_SCHEMA,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [require('./entity/User'), require('./entity/Task')],
  migrations: ['src/migration/**/*.js'],
});
console.log('Entities loaded:', AppDataSource.entityMetadatas.map(e => e.name));

module.exports = AppDataSource;