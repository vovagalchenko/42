var defaultPool = require('./knex.js').defaultPool;
var bookshelf = require('bookshelf')(defaultPool);
var Base = bookshelf.Model.extend({
  tableName: "unknown",
  hasTimestamps: ['created_at', 'updated_at'],
  forAPI: function(authenticatedUser) {
    return this.toJSON({shallow: true});
  }
});
module.exports = Base;
