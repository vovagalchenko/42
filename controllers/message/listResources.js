var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var exceptions = require('../../lib/exceptions.js');
var MessagePersistence = require('../../models/messagePersistence.js');
var feedPermissionChecker = require('../../models/feedPermissions.js');
var printf = require('util').format;

var ListMessagesController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.feedId = Parameter.String(true)
    .apiAlias('feed_id')
    .description('feed whose messages to list');
  this.limit = Parameter.UnsignedInteger(true, {
      minValue: 1,
      maxValue: 100
    })
    .defaultValue(20)
    .description('maximum number of messages that will be returned');
  this.lastMessageId = Parameter.String(false)
    .apiAlias('last_message_id')
    .description('search before the message specified by this id');

  this.run = function(authenticatedUser, responseFactory) {
    var me = this;
    if (me.lastMessageId && !MessagePersistence.doesMessageIdBelongToFeed(me.lastMessageId, me.feedId)) {
      throw exceptions.UnprocessableEntity(printf("The passed in last_message_id <%s> does not belong to the feed specified by the passed in feed id <%s>", me.lastMessageId, me.feedId));
    }
    return feedPermissionChecker.isUserAuthorizedToView(authenticatedUser, me.feedId)
      .then(function(feed) {
        if (feed) {
          return MessagePersistence.scanMessages(feed, me.lastMessageId, me.limit).then(function(messages) {
            return responseFactory.success({ 'messages' : messages });
          });
        } else {
          throw exceptions.Forbidden('You are not authorized to view messages on feed <' + me.feedId + '>');
        }
      });
  }
}

module.exports = ListMessagesController;
