var bunyan = require('bunyan');
var log = bunyan.createLogger({
  name: 'server_logger',
  streams: [
    {
      stream: process.stdout
    },
    {
      type: 'rotating-file',
      path: '/var/log/42/log',
      count: 730
    }
  ]
});
module.exports = log
