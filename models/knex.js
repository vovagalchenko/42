var env = require("../environment.js");
var KnexFactory = require('knex');
var create = function(debugMode) {
  return KnexFactory({
    client: 'mysql',
    connection: env.dbConnection,
    debug: debugMode
  });
}

exports.defaultPool = create(false);
