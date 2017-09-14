var request = require('request');
var async = require('async');

var commonFunc = require('./commonfunction');
var utils = require('./../utils/commonfunction');
var pushNotification = require('./../utils/pushnotification');
var logging = require('./logging');
var messenger = require('./messenger');
var constants = require('./constants');
var responses = require('./responses');
var FCM = require('fcm-node');

exports.send_notification = function(device_token,device_type,message,title) {
	
    var serverKey = config.get('serverFCMKey'); //put your server key here 
    var fcm = new FCM(serverKey);
 
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
        to: device_token, 
        collapse_key: 'otlbni',
        
        notification: {
            title: title, 
            body: message 
        }
    };
    
    fcm.send(message, function(err, response){
        if (err) {
            return callback(0);
        } else {
            return callback(1);
        }
    });
}

exports.get_user_notification_list = function(req, res) {
	var access_token = req.body.access_token;
	var manvalues = [access_token];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	             var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {
	        	var user_id = result[0].user_id;
	        	var sql = "SELECT * FROM `notification` where `receiver_id`=?";
	        	connection.query(sql, [user_id], function(err, result) {
	        		if ( err ) {
	        			responses.sendError(res);
                    	return;
	        		} else {
	        			// console.log(result);
	        			var response = {
	        				flag: 1,
	        				message: "Get notification List",
	        				responses: result
	        			}
	        			res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
	        		}
	        	});
	        }
	    });
	}
}