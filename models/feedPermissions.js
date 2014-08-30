var Q = require('q');
var Feed = require('./feed.js');
var Member = require('./member.js');

function isUserAuthorizedToAccessFeed(user, feedId) {
  var deferred = Q.defer();
  
  new Feed({ 'feed_id' : feedId }).fetch()
    .then(function(feed) {
      if (!feed || !user) {
        deferred.resolve([null, null]);
      } else {
        new Member({ 'user_id' : user.id, 'feed_id' : feed.id }).fetch()
          .then(function(member) {
            var result = false;
            if (member !== null || (feed.get('is_public') && feed.get('enterprise_id') === user.get('enterprise_id'))) {
              result = feed;
            }
            deferred.resolve([result, member]);
          });
      }
    });
  return deferred.promise;
}

exports.isUserAuthorizedToPost = isUserAuthorizedToAccessFeed;
exports.isUserAuthorizedToView = isUserAuthorizedToAccessFeed;
