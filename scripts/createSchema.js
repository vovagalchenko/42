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
    table.timestamps();
  },
  auth_credentials: function(table) {
    table.bigIncrements('session_id');
    table.string('user_id', 11).index().references("box_user_id").inTable("users");
    table.string('access_token', 45).unique();
    table.timestamps();
  },
  feeds: function(table) {
/*
    table.bigIncrements('feed_id');
    table.string('owner_id', 11).index().references("box_user_id").inTable("users");
    table.string('name', 45);
    table.text('description');
    table.string('last_post_id', 45);
    table.string('enterprise_id', 11).index();
    table.boolean('is_public');
    table.boolean('is_invite_locked');
    table.boolean('is_channel');
*/
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
  createTableIfNeeded('auth_credentials', function() {
    knex.destroy(function() {
      console.log("Finished");
    });
  });
});
