var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var MessagePersistence = require('../../models/messagePersistence.js');
var exceptions = require('../../lib/exceptions.js');
var Feed = require('../../models/feed.js');
var Member = require('../../models/member.js');
var modelManager = require('../../models/modelManager.js');

var CreateMessageController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.feedId = Parameter.String(true)
    .apiAlias('feed_id')
    .description('the feed id for the feed where this message is being posted');
  this.taggedMessage = Parameter.String(true)
    .apiAlias('tagged_message')
    .description('the textual message that is being posted');

  this.run = function(authenticatedUser, responseFactory) {
    var me = this;
    return new Feed({ 'feed_id' : this.feedId }).fetch()
      .then(function(feed) {
        if (feed) {
          if (feed.get('is_public')) {
            return me._persistMessage(authenticatedUser, feed).then(function(message) {
              return responseFactory.success(message);
            });
          } else {
            return new Member({ 'user_id' : authenticatedUser.id, 'feed_id' : this.feedId }).fetch()
              .then(function(member) {
                if (member) {
                  return me._persistMessage(authenticatedUser, feed).then(function(message) {
                    return responseFactory.success(message);
                  });
                } else {
                  throw exceptions.Forbidden('You are not authorized to post messages to feed <' + this.feedId + '>');
                }
              });
          }
        } else {
          throw exceptions.UnprocessableEntity('There is no feed for the provided feed id <' + this.feedId + '>');
        }
      });
  }

  this._persistMessage = function(authenticatedUser, feed) {
    return MessagePersistence.persistMessage({
      feedId: this.feedId,
      authorUserId: authenticatedUser.id,
      taggedText: this.taggedMessage
    }).then(function(message) {
      return modelManager.saveModel(feed, {
        'last_message_id' : message.message_id
      }, Feed).then(function() {
        return message;
      });
    });
  }
}

module.exports = CreateMessageController;
