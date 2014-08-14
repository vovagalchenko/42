var defaultPool = require('./knex.js').defaultPool;
var bookshelf = require('bookshelf')(defaultPool);
var User = require('./user.js');

var AuthCredentials = bookshelf.Model.extend({
  tableName: 'auth_credentials',
  idAttribute: 'session_id',
  hasTimestamps: ['created_at', 'updated_at'],
  user: function() {
    return this.belongsTo(User, 'user_id');
  }
});
module.exports = AuthCredentials;
