var env = require("../environment.js");
var KnexFactory = require('knex');
var create = function(debugMode) {
  return KnexFactory({
    client: 'mysql',
    connection: env.mySQLConnection,
    debug: debugMode
  });
}

exports.defaultPool = create(false);
