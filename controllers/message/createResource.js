var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var MessagePersistence = require('../../models/messagePersistence.js');

var CreateMessageController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.feedId = Parameter.String(true)
    .apiAlias('feed_id')
    .description('the feed id for the feed where this message is being posted');
  this.taggedMessage = Parameter.String(true)
    .apiAlias('tagged_message')
    .description('the textual message that is being posted');

  this.run = function(authenticatedUser, responseFactory) {
    return MessagePersistence.persistMessage({
      feedId: this.feedId,
      authorUserId: authenticatedUser.id,
      taggedText: this.taggedMessage
    }).then(function(message) {
      return responseFactory.success(message);
    });
  }
}

module.exports = CreateMessageController;
