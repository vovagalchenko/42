var environment = {};

environment.mySQLConnection = {
  host: 'localhost',
  user: 'root',
  database: 'forty_two',
  charset: 'utf8'
};
environment.logPath = '/var/log/42/log';
environment.hbaseThriftGatewayConnection = {
  host: 'localhost',
  port: 9090
};

module.exports = environment;
