var defaultPool = require('./knex.js').defaultPool;
var bookshelf = require('bookshelf')(defaultPool);
var AuthCredentials = require('./authCredentials.js');

var User = bookshelf.Model.extend({
  tableName: 'users',
  idAttribute: 'box_user_id',
  hasTimestamps: ['created_at', 'updated_at'],
  user: function() {
    return this.belongsTo(User, 'user_id');
  }
});
module.exports = User;
