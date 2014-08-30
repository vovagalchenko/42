var HBase = require('../lib/hbase.js');
var Q = require('q');
var Mutation = require('./gen-nodejs/HBase_types.js').Mutation;
var uuid = require('node-uuid');
var crypto = require('crypto');
var tableName = 'messages';
var maxDate = new Date(8640000000000000);

// The row key in HBase looks like this:
//  Leading 8 bytes of the MD5 of the feed to which the message belongs
//  The feed id as an 8 byte integer
//  MaxDate minus time at which the message was created in milliseconds as an 8 byte integer
//  2 bytes of a UUID as a tiebreaker in case two messages are posted to the same feed in the same millisecond
var rowKeyComposition = {
  numBytesFromMD5: 8,
  numBytesFromRawFeedId: 8,
  numBytesReverseTimestamp: 8,
  numBytesUUID: 2
};

var messageFields = {
  feedId: 'd:feedId',
  authorUserId: 'd:authorUserId',
  taggedText: 'd:taggedText',
  createdAt: 'd:createdAt'
}

exports.getFeedIdFromMessageId = function(messageId) {
  var messageIdComponents = getMessageIdComponents(messageId);
  return (typeof messageIdComponents === 'undefined')? undefined : messageIdComponents.feedId;
}

exports.getCreatedAtFromMessageId = function(messageId) {
  var messageIdComponents = getMessageIdComponents(messageId);
  return (typeof messageIdComponents === 'undefined')? undefined : messageIdComponents.createdAt;
}

var getMessageIdComponents = exports.getMessageIdComponents = function(messageId) {
  if (!isMessageIdLengthValid(messageId)) {
    return undefined;
  }
  var rawFeedIdHexString = messageId.substring(rowKeyComposition.numBytesFromMD5*2, (rowKeyComposition.numBytesFromMD5 + rowKeyComposition.numBytesFromRawFeedId)*2);
  var feedId = hexToInt(rawFeedIdHexString).toString(10);
  
  // The for loop below checks the validity of the passed in messageId
  var feedPartByteArray = getFeedPartOfRowKey(feedId);
  for (var i = 0; i < feedPartByteArray.length; i++) {
    if (feedPartByteArray[i] !== parseInt(messageId.substring(i*2, i*2 + 2), 16)) {
      return undefined;
    }
  }
  var timestampStartIndex = rowKeyComposition.numBytesFromMD5 + rowKeyComposition.numBytesFromRawFeedId;
  var timestampHexString = messageId.substring(
    timestampStartIndex*2, (timestampStartIndex + rowKeyComposition.numBytesReverseTimestamp)*2
  );
  var timestampInMillis = maxDate.getTime() - hexToInt(timestampHexString);
  var date = new Date(timestampInMillis);

  return {
    feedId: feedId,
    createdAt: date
  };
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
        column: messageFields.feedId,
        value: feedId
      }),
      new Mutation({
        column: messageFields.authorUserId,
        value: authorUserId
      }),
      new Mutation({
        column: messageFields.taggedText,
        value: taggedText
      }),
      new Mutation({
        column: messageFields.createdAt,
        value: createdAt.getTime().toString(10)
      })
    ];
    client.mutateRow(tableName, rowKey, mutations, null, function(err, data) {
      if (err) {
        throw err;
      } else {
        deferred.resolve({
          message_id: binToHex(rowKey),
          feed_id: feedId,
          author_user_id: authorUserId,
          tagged_text: taggedText,
          created_at: createdAt.getTime()
        });
      }
    });
  });
  return deferred.promise;
}

exports.scanMessages = function(feed, boundaryMessageId, limit) {
  var deferred = Q.defer();
  var feedId = feed.id.toString(10);
  if (boundaryMessageId) {
    boundaryMessageId = hexToBin(boundaryMessageId);
  } else {
    boundaryMessageId = getRowKeyBinary(feedId);
  }
  var stopRowKey = getRowKeyBinary(feedId, new Date(0));
  HBase.getClient().then(function(client) {
    client.scannerOpenWithStop(tableName, boundaryMessageId, stopRowKey, [
      messageFields.feedId,
      messageFields.authorUserId,
      messageFields.taggedText,
      messageFields.createdAt
    ], {}, function(io, scannerId) {
      client.scannerGetList(scannerId, limit, function(res, data) {
        client.scannerClose(scannerId, null);
        var resultingMessages = [];
        for (var i = 0; i < data.length; i++) {
          if (i !== 0 || boundaryMessageId !== data[i].row) {
            resultingMessages.push(hbaseRowToMessage(data[i]));
          }
        }
        deferred.resolve(resultingMessages);
      });
    });
  });
  return deferred.promise;
}

exports.getMessage = function(messageId) {
  var deferred = Q.defer();
  HBase.getClient().then(function(client) {
    client.getRow(tableName, hexToBin(messageId), {}, function(io, results) {
      var result = (results.length === 1)? hbaseRowToMessage(results[0]) : null;
      deferred.resolve(result);
    });
  });
  return deferred.promise;
}

/* ==================== MISC HELPERS ==================== */

function getRowKeyBinary(feedId, createdAt) {
  var hashedFeedArray = getFeedPartOfRowKey(feedId);
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

function dateToByteArray(date) {
  var milliseconds = 0;
  if (date) {
    milliseconds = maxDate.getTime() - date.getTime();
  }
  return intTo8ByteArray(milliseconds);
}

function hbaseRowToMessage(rawHbaseRow) {
  var message = {};
  message.message_id = binToHex(rawHbaseRow.row);
  var columnsDict = rawHbaseRow.columns;
  message.author_user_id = columnsDict[messageFields.authorUserId].value;
  message.tagged_text = columnsDict[messageFields.taggedText].value;
  message.created_at = parseInt(columnsDict[messageFields.createdAt].value);
  return message;
}

function getFeedPartOfRowKey(feedId) {
  var hashedFeed = crypto.createHash('md5').update(feedId).digest('bin');
  var result = [];
  for (var i = 0; i < rowKeyComposition.numBytesFromMD5; i++) {
    result[i] = hashedFeed[i];
  }
  var feedIdByteArray = intTo8ByteArray(parseInt(feedId));
  for (var i = 0; i < rowKeyComposition.numBytesFromRawFeedId; i++) {
    result[rowKeyComposition.numBytesFromMD5 + i] = feedIdByteArray[i];
  }
  return result;
}

function expectedBinaryMessageIdLength() {
  var numBytesInMessage = 0;
  for (var key in rowKeyComposition) {
    numBytesInMessage += rowKeyComposition[key]
  }
  return numBytesInMessage;
}

function isMessageIdLengthValid(messageId) {
  return (messageId.length === expectedBinaryMessageIdLength()*2);
}

/* ==================== BIN/HEX HELPERS ==================== */

function intTo8ByteArray(integer) {
  var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
  for (var byteIndex = byteArray.length - 1; byteIndex >= 0; byteIndex--) {
    var leastSignificantByte = integer & 0xff;
    byteArray[byteIndex] = leastSignificantByte;
    integer = (integer - leastSignificantByte)/256;
  }
  return byteArray;
}

function hexToInt(hexString) {
  if (hexString.length % 2 != 0) throw "Hex string length must be divisible by two to represent an array of bytes.";
  var value = 0;
  var numBytes = hexString.length / 2;
  for (var i = 0; i < numBytes; i++) {
    byteString = hexString.substring(i*2, i*2 + 2);
    value = (value * 256) + parseInt(byteString, 16);
  }
  return value;
}

function binToHex(binString) {
  var result = "";
  for (var i = 0; i < binString.length; i++) {
    var charCode = binString.charCodeAt(i);
    var str = charCode.toString(16);
    if (str.length === 1) {
      str = '0' + str;
    }
    result += str;
  }
  return result;
}

function hexToBin(hexString) {
  if (hexString.length % 2 != 0) throw "Hex string length must be divisible by two to represent an array of bytes.";
  var bin = "";
  var numBytes = hexString.length / 2;
  for (var i = 0; i < numBytes; i++) {
    var byteString = hexString.substring(i*2, i*2 + 2);
    bin += String.fromCharCode(parseInt(byteString, 16));
  }
  return bin;
}
