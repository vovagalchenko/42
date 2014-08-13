var bunyan = require('bunyan');
var env = require('../environment.js');

var errSkips = {
   // Skip domain keys. `domain` especially can have huge objects that can
   // OOM the app when trying to log the error.
   domain: true,
   domain_emitter: true,
   domain_bound: true,
   domain_thrown: true
};
function errorSerializer(err) {
  if (!err || !err.stack) {
      return err;
  }
  var obj = {
      message: err.message,
      name: err.name,
      stack: err.stack
  }
  Object.keys(err).forEach(function (k) {
      if (err[k] !== undefined && !errSkips[k]) {
          obj[k] = err[k];
      }
  });
  return obj;
};

var logFactory = function(requestId) {
  return bunyan.createLogger({
    name: 'server_logger',
    streams: [
      {
        stream: process.stdout
      },
      {
        type: 'rotating-file',
        path: env.logPath,
        count: 730
      }
    ],
    serializers: {
      err: errorSerializer
    }
  }).child({ 'requestId': requestId });
}
module.exports = logFactory
