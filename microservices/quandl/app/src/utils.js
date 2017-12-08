const request = require('request');
const config = require('./config');

function customRequest(options, callback, shouldLog) {
    if (shouldLog === null) {
        shouldLog = false;
    }
    if (shouldLog) {
        console.log('REQUEST OPTIONS-------------------------');
        console.log(options);
    }
    request(options, function (error, response, body) {
        if (shouldLog) {
            console.log('RESPONSE--------------------------');
            console.log(response);
        }
        if (error) {
            callback(error, null);
        } else if (response.statusCode >= 200 && response.statusCode < 300) {
            callback(null, JSON.parse(body));
        } else {
            callback(body, null);
        }
    });
}

const adminHeaders = {
    'content-type': 'application/json',
    'X-Hasura-User-Id': 1,
    'X-Hasura-Role': 'admin'
};

//Replaces special chars with underscore
function getValidColumnName(columnName) {
    return columnName.replace(/[^a-zA-Z0-9]/g, '_');
}


function quandlToHasuraConverter(response) {
    const rows = response.datatable.data;
    const columns = response.datatable.columns;
    var insertArray = [];
    rows.every(function(row, index) {
        var insertObj = {};
        row.forEach(function(columnValue, index, columnArray) {
            insertObj[getValidColumnName(columns[index].name)] = columnValue;
        });
        insertArray.push(insertObj);
        return true;
    });
    return insertArray;
}

function getTableName(vendorCode, datatableCode) {
    return (vendorCode + '_' + datatableCode).toLowerCase();
    // return (tableMetadata.datatable.vendor_code + '_' + tableMetadata.datatable.datatable_code).toLowerCase();
}

function getPostgresqlTypeFromColumnType(columnType) {
    switch (columnType.toLowerCase()) {
        case 'string': return 'text';
        case 'date': return 'date';
        case 'double': return 'numeric';
    }
    if (columnType.toLowerCase().indexOf("bigdecimal") !== -1) {
        return "decimal";
    }
    return null;
}


module.exports = {
    customRequest,
    getValidColumnName,
    adminHeaders,
    quandlToHasuraConverter,
    getTableName,
    getValidColumnName,
    getPostgresqlTypeFromColumnType
};
