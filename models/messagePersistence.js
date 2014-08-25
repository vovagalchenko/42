var HBase = require('../lib/hbase.js');
var Q = require('q');
var Mutation = require('./gen-nodejs/HBase_types.js').Mutation;
var uuid = require('node-uuid');
var crypto = require('crypto');

function dateToByteArray(date) {
  var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
  var milliseconds = date.getTime();
  for (var byteIndex = byteArray.length - 1; byteIndex >= 0; byteIndex--) {
    var leastSignificantByte= milliseconds & 0xff;
    byteArray[byteIndex] = leastSignificantByte;
    milliseconds = (milliseconds - leastSignificantByte)/256;
  }
  return byteArray;
}

function keyToHexString(binKey) {
  var result = "";
  for (var i = 0; i < binKey.length; i++) {
    var charCode = binKey.charCodeAt(i);
    var str = charCode.toString(16);
    if (str.length === 1) {
      str = '0' + str;
    }
    result += str;
  }
  return result;
}

function getRowKeyBinary(feedId, createdAt) {
  var hashedFeed = crypto.createHash('md5').update(feedId).digest('bin');
  var hashedFeedArray = [];
  for (var i = 0; i < hashedFeed.length; ++i) {
    hashedFeedArray[i] = hashedFeed[i];
  }
  var timestamp = dateToByteArray(createdAt);
  // use the last two bytes of a guid to break ties for two messages sent to the same feed at the same time
  var tieBreaker = uuid.v4(null, [], 0).slice(-2);
  
  var rowKeyByteArray = hashedFeedArray.concat(timestamp, tieBreaker);
  var rowKey = "";
  for (var i = 0; i < rowKeyByteArray.length; i++) {
    rowKey += String.fromCharCode(rowKeyByteArray[i]);
  }
  return rowKey;
}

exports.persistMessage = function(messageParams) {
  var deferred = Q.defer();
  var createdAt = messageParams['createdAt'] || new Date();
  var feedId = messageParams.feedId;
  var authorUserId = messageParams.authorUserId;
  var taggedText = messageParams.taggedText;
  
  var rowKey = getRowKeyBinary(feedId, new Date());
  HBase.getClient().then(function(client) {
    var mutations = [
      new Mutation({
        column: 'd:feedId',
        value: feedId
      }),
      new Mutation({
        column: 'd:authorUserId',
        value: authorUserId
      }),
      new Mutation({
        column: 'd:taggedText',
        value: taggedText
      }),
      new Mutation({
        column: 'd:createdAt',
        value: createdAt.getTime().toString(10)
      })
    ];
    client.mutateRow('messages', rowKey, mutations, null, function(err, data) {
      if (err) {
        throw err;
      } else {
        deferred.resolve({
          message_id: keyToHexString(rowKey),
          feed_id: feedId,
          author_user_id: authorUserId,
          tagged_text: taggedText,
          created_at: createdAt
        });
      }
    });
  });
  return deferred.promise;
}
