require('dotenv').config({ path: '../../.env' });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false
  }
};
