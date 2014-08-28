var BaseController = require('../base.js');
var exceptions = require('../../lib/exceptions.js');
var MessagePersistence = require('../../models/messagePersistence.js');
var feedPermissionChecker = require('../../models/feedPermissions.js');
var printf = require('util').format;

var GetMessageController = function(messageId, log) {
  BaseController.apply(this, arguments);

  this.run = function(authenticatedUser, responseFactory) {
    var me = this;
    var feedId = MessagePersistence.getFeedIdFromMessageId(messageId);
    if (typeof feedId === 'undefined') {
      throw exceptions.UnprocessableEntity(printf("The passed in message id <%s> is not valid.", messageId));
    }
    return feedPermissionChecker.isUserAuthorizedToView(authenticatedUser, feedId)
      .then(function(feed) {
        if (feed) {
          return MessagePersistence.getMessage(messageId).then(function(message) {
            if (!message) {
              throw exceptions.NotFound("There is no message with id: " + messageId);
            }
            return responseFactory.success(message);
          });
        } else {
          throw exceptions.Forbidden('You are not authorized to view this message.');
        }
      });
  }
}

module.exports = GetMessageController;
