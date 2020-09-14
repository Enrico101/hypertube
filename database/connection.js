var mysql = require('mysql');

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root444@',
    database: 'hypertube',
    //password: 'Radnic444',
    //socketPath: '/goinfre/enradcli/Desktop/MAMP/mysql/tmp/mysql.sock',
    });

module.exports = db;