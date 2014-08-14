var defaultPool = require('./knex.js').defaultPool;
var bookshelf = require('bookshelf')(defaultPool);
var Feed = bookshelf.Model.extend({
  tableName: 'feeds',
  idAttribute: 'feed_id',
  hasTimestamps: ['created_at', 'updated_at'],
});
module.exports = Feed;
