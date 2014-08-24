var thrift = require('thrift');
var HBase = require('../models/gen-nodejs/Hbase.js');
var HBaseTypes = require('../models/gen-nodejs/HBase_types.js');
var logFactory = require('./logging');
var logger = logFactory('none');
var hbaseThriftGatewayInfo = require('../environment.js').hbaseThriftGatewayConnection;
var Q = require('q');

var client = null;
var connection = null;
var deferredsToResolve = [];
function cleanup() {
  connection.end();
  client = null;
  connection = null;
}
exports.getClient = function() {
  var deferred = Q.defer();
  if (client !== null) {
    deferred.resolve(client);
  } else if (connection !== null) {
    // We're already started working on creating this connection
    deferredsToResolve.push(deferred);
  } else {
    connection = thrift.createConnection(hbaseThriftGatewayInfo.host, hbaseThriftGatewayInfo.port, {
      transport: thrift.TFramedTransport,
      protocol: thrift.TBinaryProtocol
    });
    connection.on('connect', function() {
      logger.info('Established connection to HBase\'s Thrift gateway.');
      client = thrift.createClient(HBase, connection);
      deferred.resolve(client);
      for (var i = 0; i < deferredsToResolve.length; i++) {
        deferredsToResolve[i].resolve(client);
      }
      deferredsToResolve = [];
    });
    connection.on('error', function(err) {
      logger.error("HBase connection error", err);
      cleanup();
    });
  }
  return deferred.promise;
}
exports.cleanup = cleanup;
