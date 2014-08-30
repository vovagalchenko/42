var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var Member = require('../../models/member.js');
var exceptions = require('../../lib/exceptions.js');
var messagePersistence = require('../../models/messagePersistence.js');
var feedPermissionChecker = require('../../models/feedPermissions.js');
var modelManager = require('../../models/modelManager.js');
var printf = require('util').format;

var UpdateMessageController = function(messageId, log) {
  BaseController.apply(this, arguments);

  this.markAsRead = Parameter.Boolean(true)
    .apiAlias('mark_as_read')
    .description('true if you want to mark this message as read');

  this.run = function(authenticatedUser, responseFactory) {
    var me = this;
    var messageIdComponents = messagePersistence.getMessageIdComponents(messageId);
    if (typeof messageIdComponents === 'undefined') {
      throw exceptions.UnprocessableEntity(printf("The passed in message id <%s> is invalid", messageId));
    }
    var feedId = messageIdComponents.feedId;
    return feedPermissionChecker.isUserAuthorizedToView(authenticatedUser, feedId)
      .spread(function(feed, member) {
        if (feed) {
          var returnNoContent = function() { return responseFactory.noContent(); };
          var currentLastReadMessageTs = 0;
          if (member) {
            var lastReadMessageId = member.get('last_read_message_id');
            if (lastReadMessageId) {
              var lastReadMessageIdTimestamp = messagePersistence.getCreatedAtFromMessageId(lastReadMessageId);
              if (typeof lastReadMessageIdTimestamp !== 'undefined') {
                currentLastReadMessageTs = lastReadMessageIdTimestamp.getTime();
              }
            }
          }
          var newLastReadMessageTs = messageIdComponents.createdAt.getTime();
          if (me.markAsRead && currentLastReadMessageTs < newLastReadMessageTs) {
            return modelManager.saveModel(member, {
              'user_id' : authenticatedUser.id,
              'feed_id' : feed.id,
              'last_read_message_id' : messageId
            }, Member).then(returnNoContent);
          } else {
            return returnNoContent();
          }
        } else {
          throw exceptions.Forbidden('You are not authorized to update messages on feed <' + feedId + '>');
        }
      });
  }
}

module.exports = UpdateMessageController;
