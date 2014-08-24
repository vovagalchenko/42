var HBase = require('../lib/hbase.js');
var ColumnDescriptor = require('../models/gen-nodejs/HBase_types.js').ColumnDescriptor;

HBase.getClient().then(function(client) {
  client.getTableNames(function(err, data) {
    if (err) {
      console.log("Error occurred while attempting to get table names.", err);
      HBase.cleanup();
    } else {
      console.log("Existing HBase tables: ", data);
      var tableName = 'messages';
      if (data.indexOf(tableName) === -1) {
        console.log('Creating the messages table.');
        var columnFamilyDescriptor = new ColumnDescriptor({
          name: 'd',
          maxVersions: 2
        });
        client.createTable(tableName, [columnFamilyDescriptor], function(err, data) {
          if (err) {
            console.log("Error occurred while creating the messages table.", err);
          } else {
            console.log("Message table created successfully.");
          }
          HBase.cleanup();
        });
      } else {
        HBase.cleanup();
      }
    }
  });
});
