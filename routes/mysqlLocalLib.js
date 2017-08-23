
var mysql = require('mysql');


var db_config = {
    host: config.get('databaseSettings.host'),
    user: config.get('databaseSettings.user'),
    password: config.get('databaseSettings.password'),
    database: config.get('databaseSettings.database'),
    port: config.get('databaseSettings.port'),
    multipleStatements: true
};


function handleDisconnect() {
    
    // Recreate the connection, since the old one cannot be reused.
    connection = mysql.createConnection(db_config); 
    connection.connect(function(err) {              
        // The server is either down or restarting (takes a while sometimes).
        if(err) {                                    
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); 
            // We introduce a delay before attempting to reconnect,
            // to avoid a hot loop, and to allow our node script to
            // process asynchronous requests in the meantime.
            // If you're also serving http, display a 503 error.
        }  
    });                                     

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
            handleDisconnect();                       
        } else {                                      
            throw err;                                
        }
    });
}

handleDisconnect();
