var KnexFactory = require('../models/knex.js');
var knex = KnexFactory.defaultPool;

var schemas = {
  users: function(table) {
    table.string('box_user_id', 11).notNullable().primary();
    table.string('name', 100).notNullable();
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
  },
  mentions: function(table) {
    table.bigIncrements('mention_id').notNullable();
    table.string('mentioner_user_id', 11).notNullable().index().references('box_user_id').inTable('users');
    table.string('mentioned_entity_type', 11).notNullable();
    table.string('mentioned_entity_id', 20).notNullable();
    table.string('post_id', 45).notNullable();
    table.timestamp('viewed_at');
    table.timestamps();
  },
  
}

var Q = require('Q');
function createTableIfNeeded(tableName)
{
  var deferred = Q.defer();
  knex.schema.hasTable(tableName).then(function(exists) {
    if (exists) {
      deferred.resolve();
    } else {
      knex.schema.createTable(tableName, schemas[tableName]).then(function() { deferred.resolve(); });
    }
  });
  return deferred.promise;
}

var domain = require('domain');
var schemaCreateDomain = domain.create();
schemaCreateDomain.on('error', function(error) {
  console.log(error);
  knex.destroy(function() { console.log("Closed the DB connection pool") });
});

schemaCreateDomain.run(function() {
  createTableIfNeeded('users')
    .then(function() {
      return Q.all([
        createTableIfNeeded('auth_credentials'),
        createTableIfNeeded('mentions'),
        createTableIfNeeded('feeds')
          .then(function() { return createTableIfNeeded('members'); })
      ]);
    })
    .fin(function() {
      console.log("Cleaning up...");
      knex.destroy(function() {
        console.log("Finished");
      });
    });
});
