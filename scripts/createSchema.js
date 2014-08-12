var env = require("../environment.js");
var knex = require('knex')({
  client: 'mysql',
  connection: env.dbConnection,
  debug: true
});

var schemas = {
  users: function(table) {
    table.string('box_user_id', 11).notNullable().primary();
    table.string('first_name', 45).notNullable();
    table.string('last_name', 45).notNullable();
    table.string('img_url', 100); 
    table.string('enterprise_id', 11).index();
    table.timestamps();
  },
  auth_credentials: function(table) {
    table.bigIncrements('session_id').notNullable();
    table.string('user_id', 11).notNullable().index().references("box_user_id").inTable("users");
    table.string('access_token', 45).notNullable().unique();
    table.timestamps();
  },
  feeds: function(table) {
    table.bigIncrements('feed_id');
    table.string('owner_id', 11).index().references("box_user_id").inTable("users");
    table.string('name', 45);
    table.text('description');
    table.string('last_post_id', 45);
    table.string('enterprise_id', 11).index();
    table.boolean('is_public').notNullable();
    table.boolean('is_invite_locked').notNullable();
    table.boolean('is_channel').notNullable();
    table.timestamps();
  },
  members: function(table) {
    table.bigIncrements('member_id').notNullable();
    table.string('user_id', 11).notNullable().index().references('box_user_id').inTable('users');
    table.bigInteger('feed_id', 20).unsigned().notNullable().index().references('feed_id').inTable('feeds');
    table.string('last_read_post', 45);
    table.boolean('is_following').notNullable();
    table.boolean('is_muting').notNullable();
    table.timestamps();
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

var domain = require('domain');
var schemaCreateDomain = domain.create();
schemaCreateDomain.on('error', function(error) {
  console.log(error);
  knex.destroy(function() { console.log("Closed the DB connection pool") });
});

schemaCreateDomain.run(function() {
  createTableIfNeeded('users', function() {
    createTableIfNeeded('auth_credentials', function() {
      createTableIfNeeded('feeds', function() {
        createTableIfNeeded('members', function() {
          knex.destroy(function() {
            console.log("Finished");
          });
        });
      });
    });
  });
});
