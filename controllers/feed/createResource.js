var BaseController = require('../base.js');
var Parameter = require('../../lib/parameter.js');
var exceptions = require('../../lib/exceptions.js');

var CreateFeedController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.name = Parameter.String(true)
    .description('the name of the feed');
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
    .description('an array of user ids of people to invite to the feed');
  this.invitees = Parameter.Array(Parameter.String, false)
    .description('an array of emails of people to invite to the feed');

  this.run = function(authenticatedUser, responseFactory) {
    if (this.isChannel && this.isMembershipLocked) {
      throw exceptions.UnprocessableEntity("Can't create a channel with locked membership.");
    }
    return responseFactory.success({ blah: authenticatedUser });
  }
}

module.exports = CreateFeedController;
