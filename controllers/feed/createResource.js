var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var exceptions = require('../../lib/exceptions.js');
var Feed = require('../../models/feed.js');
var Member = require('../../models/member.js');
var Q = require('q');

var CreateFeedController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.name = Parameter.String(true)
    .description('the name of the feed');
  this.description = Parameter.String(false)
    .defaultValue('')
    .description('the description of the feed');
  this.isPublic = Parameter.Boolean(true)
    .apiAlias('is_public')
    .description('whether the feed should be visible by everyone in the company or not');
  this.isChannel = Parameter.Boolean(true)
    .apiAlias('is_channel')
    .description("is this feed a channel? If yes, is_membership_locked shouldn't be set");
  this.isMembershipLocked = Parameter.Boolean(true)
    .apiAlias('is_membership_locked')
    .description('whether new people can be invited to this feed or not');
  this.members = Parameter.Array(Parameter.String, false)
    .defaultValue([])
    .description('an array of user ids of people to invite to the feed');
  this.invitees = Parameter.Array(Parameter.String, false)
    .defaultValue([])
    .description('an array of emails of people to invite to the feed');

  this.run = function(authenticatedUser, responseFactory) {
    if (this.isChannel && this.isMembershipLocked) {
      throw exceptions.UnprocessableEntity("Can't create a channel with locked membership.");
    }
    var me = this;
    return new Feed().save({
      'owner_id' : authenticatedUser.id,
      'name' : this.name,
      'description' : this.description,
      'last_message_id' : null,
      'enterprise_id' : authenticatedUser.get('enterprise_id'),
      'is_public' : this.isPublic,
      'is_invite_locked' : this.isMembershipLocked,
      'is_channel' : this.isChannel
    }).then(function(savedFeed) {
      if (!me.isPublic) {
        var members = me.members;
        members.push(authenticatedUser.id);
        var promises = [];
        var feedId = savedFeed.id;
        for (var i = 0; i < members.length; i++) {
          var memberId = members[i];
          promises.push(new Member().save({
            'user_id' : memberId,
            'feed_id' : feedId,
            'last_read_message_id' : null,
            'is_following' : true,
            'is_muting' : false
          }));
        }
        return Q.all(promises).then(function() {
          return responseFactory.success({ feed: savedFeed });
        });
      } else {
        return responseFactory.success({ feed: savedFeed });
      }
    });
  }
}

module.exports = CreateFeedController;
