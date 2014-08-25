var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var exceptions = require('../../lib/exceptions.js');
var MessagePersistence = require('../../models/messagePersistence.js');
var feedPermissionChecker = require('../../models/feedPermissions.js');

var ListMessagesController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.feedId = Parameter.String(true)
    .apiAlias('feed_id')
    .description('feed whose messages to list');
  this.limit = Parameter.UnsignedInteger(true, { maxValue: 100 })
    .defaultValue(20)
    .description('maximum number of messages that will be returned');
  this.lastMessageId = Parameter.String(false)
    .apiAlias('last_message_id')
    .description('search before the message specified by this id');

  this.run = function(authenticatedUser, responseFactory) {
    var me = this;
    return feedPermissionChecker.isUserAuthorizedToView(authenticatedUser, this.feedId)
      .then(function(feed) {
        if (feed) {
          return MessagePersistence.scanMessages(feed, this.lastMessageId).then(function(messages) {
            return responseFactory.success({ 'messages' : messages });
          });
        } else {
          throw exceptions.Forbidden('You are not authorized to post messages to feed <' + this.feedId + '>');
        }
      });
  }
}

module.exports = ListMessagesController;
