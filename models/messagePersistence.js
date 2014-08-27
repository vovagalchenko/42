var HBase = require('../lib/hbase.js');
var Q = require('q');
var Mutation = require('./gen-nodejs/HBase_types.js').Mutation;
var uuid = require('node-uuid');
var crypto = require('crypto');
var tableName = 'messages';

var messageFields = {
  feedId: 'd:feedId',
  authorUserId: 'd:authorUserId',
  taggedText: 'd:taggedText',
  createdAt: 'd:createdAt'
}

exports.doesMessageIdBelongToFeed = function(messageId, feedId) {
  var hashedFeed = crypto.createHash('md5').update(feedId).digest('bin');
  return (messageId.length % 2 === 0 // The message id is valid
    && messageId.indexOf(crypto.createHash('md5').update(feedId).digest('hex')) === 0);
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
        deferred.resolve(data.map(hbaseRowToMessage));
      });
    });
  });
  return deferred.promise;
}

/* ==================== MISC HELPERS ==================== */

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

function dateToByteArray(date) {
  var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
  if (!date) return byteArray;
  var maxDate = new Date(8640000000000000);
  var milliseconds = maxDate.getTime() - date.getTime();
  for (var byteIndex = byteArray.length - 1; byteIndex >= 0; byteIndex--) {
    var leastSignificantByte= milliseconds & 0xff;
    byteArray[byteIndex] = leastSignificantByte;
    milliseconds = (milliseconds - leastSignificantByte)/256;
  }
  return byteArray;
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

/* ==================== BIN/HEX HELPERS ==================== */

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
  for (var i = 0; i < hexString.length; i++) {
    var byteString = hexString.substring(i*2, i*2 + 2);
    bin += String.fromCharCode(parseInt(byteString, 16));
  }
  return bin;
}
