module.exports = {
  type: 'postgres',
  url: process.env.DATABASE_URL,  // we'll set this in .env
  synchronize: false,             // NEVER true in production — use migrations
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/entity/**/*.js'], // where your entity files will be
  migrations: ['src/migration/**/*.js'],
  subscribers: ['src/subscriber/**/*.js'],
};