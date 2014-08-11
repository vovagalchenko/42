var environment = {};

environment.dbConnection = {
  host: 'localhost',
  user: 'root',
  database: 'forty_two',
  charset: 'utf8'
};
environment.logPath = '/var/log/42/log';

module.exports = environment;
