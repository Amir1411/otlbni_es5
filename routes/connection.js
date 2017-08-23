var mysql = require('mysql');
var sys = require('sys');
var exec = require('child_process').exec;
var config = require('config');

var db_config = {
    host: config.get('databaseSettings.db_host'),
    user: config.get('databaseSettings.db_user'),
    password: config.get('databaseSettings.db_password'),
    database: config.get('databaseSettings.database'),
    port : config.get('databaseSettings.mysqlPORT'),
    multipleStatements: true
    //config.get('databaseSettings.connectionLimit')
};


function restart(callback) {

    console.log("RESTART THE SERVER");
    callback();
    // exec(" whoami; pm2 restart dashboard ; ", callback);

}

function handleDisconnect() {
    //connection = mysql.createConnection(db_config); // Recreate the connection, since the old one cannot be reused.
    connection = mysql.createConnection(db_config);

    console.log("in the handleDisconnect");
    connection.connect(function(err) { 
        if(err) { // The server is either down  or restarting (takes a while sometimes).    
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
        else {
            console.log("connection variable created ");
            //console.log(connection);
        }
    });                                     
    // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { 
        // Connection to the MySQL server is usually lost due to either server restart
            handleDisconnect();                         
        }
        else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
            restart();
        }
        else {                                      
            // connnection idle timeout (the wait_timeout server variable configures this)
            throw err;                            
        }
    });
}

handleDisconnect();
