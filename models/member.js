var defaultPool = require('./knex.js').defaultPool;
var bookshelf = require('bookshelf')(defaultPool);
var Member = bookshelf.Model.extend({
  tableName: 'members',
  idAttribute: 'member_id',
  hasTimestamps: ['created_at', 'updated_at'],
});
module.exports = Member;
