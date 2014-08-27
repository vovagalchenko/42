var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var MessagePersistence = require('../../models/messagePersistence.js');
var exceptions = require('../../lib/exceptions.js');
var modelManager = require('../../models/modelManager.js');
var feedPermissionChecker = require('../../models/feedPermissions.js');
var Feed = require('../../models/feed.js');

var CreateMessageController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.feedId = Parameter.String(true)
    .apiAlias('feed_id')
    .description('the feed id for the feed where this message is being posted');
  this.taggedText = Parameter.String(true)
    .apiAlias('tagged_text')
    .description('the textual message that is being posted');

  this.run = function(authenticatedUser, responseFactory) {
    var me = this;
    return feedPermissionChecker.isUserAuthorizedToPost(authenticatedUser, me.feedId)
      .then(function(feed) {
        if (feed) {
          return me._persistMessage(authenticatedUser, feed).then(function(message) {
            return responseFactory.success(message);
          });
        } else {
          throw exceptions.Forbidden('You are not authorized to post messages to feed <' + me.feedId + '>');
        }
      });
  }

  this._persistMessage = function(authenticatedUser, feed) {
    return MessagePersistence.persistMessage({
      feedId: this.feedId,
      authorUserId: authenticatedUser.id,
      taggedText: this.taggedText
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
