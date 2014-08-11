var env = require("../environment.js");
var knex = require('knex')({
  client: 'mysql',
  connection: env.dbConnection,
  debug: true
});

var schemas = {
  users: function(table) {
    table.string('box_user_id', 11).primary();
    table.string('first_name', 45);
    table.string('last_name', 45);
    table.string('img_url', 100); 
    table.string('enterprise_id', 11).index();
  }
}

function createTableIfNeeded(tableName, workAfter)
{
  knex.schema.hasTable(tableName).then(function(exists) {
    if (exists) {
      workAfter();
    } else {
      knex.schema.createTable(tableName, schemas[tableName]).then(workAfter);
    }
  });
}

createTableIfNeeded('users', function() {
  knex.destroy(function() {
    console.log("Finished");
  });
});
