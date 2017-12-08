var utils = require('./utils');
var customRequest = utils.customRequest;
var hasura = require('./hasura');
var quandl = require('./quandl');
var config = require('./config');
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

//your routes here
app.get('/', function (req, res) {
    res.send("Hello World!!!!");
});

/**
 * request body:
 * {
 *  vendor_code: <>,
 *  datatable_code: <>,
 * }
 *
 */
app.post('/add_data', function (req, res) {
    const vendorCode = req.body.vendor_code;
    const datatableCode = req.body.datatable_code;

    //Check if this exists in quandl_checkpoint table
    hasura.getLatestOffsetForQuandl(vendorCode, datatableCode, function (error, response) {
       if (error) {
           console.log('Getting latest offset from Hasura failed');
           console.log(error);
           res.status(401).json({'error': error.toString()});
       } else if (response) {
           if (response.length === 0) {
               //Create table
               quandl.fetchMetadata(config.getQuandlMetadataUrl(vendorCode, datatableCode), function(error, responseJSON) {
                  if (error) {
                      res.status(401).json({'error': 'Could not fetch quandl metadata'});
                  } else {
                      hasura.createHasuraTable(utils.getTableName(vendorCode, datatableCode), responseJSON.datatable.columns, responseJSON.datatable.primary_key, function(error, response) {
                          if (error) {
                              res.status(401).json({'error': 'Could not create hasura table'});
                          } else {
                              hasura.insertDataToTable('quandl_checkpoint', [{ vendor_code: vendorCode, datatable_code: datatableCode, next_offset: null}], function(error, response) {
                                  if (error) {
                                      res.status(401).json({'error': 'Error inserting quandl_checkpoint'});
                                      console.log(error);
                                  } else {
                                      fetchFromQuandlAndInsertIntoHasura(vendorCode, datatableCode, null, res);
                                  }
                              });
                          }
                      });
                  }
               });
           } else {
               var offset = response[0].next_offset;
               fetchFromQuandlAndInsertIntoHasura(vendorCode, datatableCode, offset, res);
           }
       } else {
           res.status(500).json({'error': 'Unknown error'});
       }
    });
});

function fetchFromQuandlAndInsertIntoHasura(vendorCode, datatableCode, offset, res) {
    quandl.fetchData(config.getQuandlDataUrl(vendorCode, datatableCode, offset), utils.quandlToHasuraConverter, function(error, insertArray, nextOffset) {
        if (error) {
            res.status(401).json({'error': 'Could not get data from quandl'});
        } else {
            hasura.batchInsertDataIntoHasura(utils.getTableName(vendorCode, datatableCode), insertArray, function(error, response) {
                if (error) {
                    res.status(401).json({'error': 'Inserting data into hasura failed'});
                } else {
                    hasura.updateTableCheckpointTable(vendorCode, datatableCode, nextOffset, function(error, response) {
                        if (error) {
                            res.status(401).json({'error': 'Error updating quandl_checkpoint'});
                        } else {
                            res.status(200).json({'message': 'Successfully inserted data into table: ' + utils.getTableName(vendorCode, datatableCode)});
                        }
                    });
                }
            });
        }
    });
}

app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
});
