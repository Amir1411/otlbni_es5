/* Module for sending message using Twilio */

var request = require('request');
var logging = require('./logging');
var constants = require('./constants');
var utils = require('./../utils/commonfunction');
var datetime_utils = require('./../utils/datetimefunctions');
// var Handlebars = require('handlebars');

var client = undefined;
exports.sendMessageByTwillio = sendMessageByTwillio;

function getClient() {
	var accountSid = config.get('twillioCredentials.accountSid');
	var authToken = config.get('twillioCredentials.authToken');
	//require the Twilio module and create a REST client
	client = require('twilio')(accountSid, authToken);
}

// function getMessageTemplate(templateName, variables, callback) {
// 	var sql = "SELECT `value` FROM `tb_message_templates` WHERE `key`=? LIMIT 1";
// 	connection.query(sql, [templateName], function(err, template) {
// 		if(template.length == 0 || err ){
// 			console.log("template not found");
// 			console.log(templateName);
// 			callback(err,"");
// 		}
// 		else{
// 			if(template.length)
// 			{
// 				callback(err, Handlebars.compile(template[0].value)(variables));
// 			}
// 		}
// 	});
// }

function sendMessageByTwillio(to, msg, variables) {
	console.log("sending twilio message");
	// console.log(to, msg, template, variables);
	if (client === undefined) {
		getClient();
	}
	client.messages.create({
		to: to,
		from: config.get('twillioCredentials.fromNumber'),
		body: msg
	},
	function(err, message) {
		console.log("Twilio error: " + JSON.stringify(err));
		console.log("Twilio message: " + JSON.stringify(message));
	});
}

exports.sendFurtherInfo = function(data) {
	// SEND_OTP :  Dear {{USER_NAME}}, Your One Time Password is {{OTP}}. Team: {{PROJECT_NAME}}
    var variables = {
		USER_NAME : data.userData.userName.split(' ')[0],
		USER_PHONE : data.userData.userPhone,
		FURTHER_INFO:data.otherInfo.furtherInfo ,
		DRIVER_NAME : data.driverData.driverName.split(' ')[0],
		PROJECT_NAME : config.get('projectName')
    };
    sendMessageByTwillio(data.driverData.driverPhone, null , "SEND_FURTHER_INFO" , variables);
};

exports.sendOTP = function(name, to, otp) {
	var message = "Dear " + name.split(' ')[0] + ", Your One Time Password is " + otp + "." + "  Team: " + config.get('projectName');
	// SEND_OTP :  Dear {{USER_NAME}}, Your One Time Password is {{OTP}}. Team: {{PROJECT_NAME}}
	var variables = {
		USER_NAME : name.split(' ')[0],
		OTP:otp ,
		PROJECT_NAME : config.get('projectName')
	};
	sendMessageByTwillio(to, message , variables);
};

exports.sendArrivalText = function(driver_name, driver_phone, car_no, cust_name, cust_phone) {
	var message = "Dear " + cust_name + ", our " + config.get('projectName') + " driver " + driver_name + "(" + driver_phone + " && " + car_no + ") has reached the requested destination. We are ready to get you on board.";
	// DRIVER_ARRIVAL :  Dear {{USER_NAME}}, our {{PROJECT_NAME}} driver {{DRIVER_NAME}}({{DRIVER_PHONE}} && {{CAR_NUMBER}}) has reached the requested destination. We are ready to get you on board.
	var variables = {
		USER_NAME : cust_name,
		DRIVER_NAME:driver_name ,
		DRIVER_PHONE:driver_phone,
		CAR_NUMBER:car_no,
		PROJECT_NAME : config.get('projectName')
	};
	sendMessageByTwillio(cust_phone, message ,"DRIVER_ARRIVAL" , variables);
};

exports.sendReasonForBlocking = function(to, reason) {
    var message = "";
    var sendMessage = true;
    switch (reason) {
        case constants.blockingReasons.SUSPECTED_NUMBER:
            message = "This number is suspected to not to belong to the actual owner and we are blocking its use in " + config.get('projectName') + ". To unblock please send a mail to " + config.get('emailCredentials.senderEmail');
            break;
        case constants.blockingReasons.INVALID_EMAIL:
            message = "The email ID used with this number is invalid. To unblock please send a mail to " + config.get('emailCredentials.senderEmail') + "";
            break;
        case constants.blockingReasons.TERMS_VIOLATION:
            message = "We found the usage against the Terms of Use and we have blocked this number. To unblock please send a mail to " + config.get('emailCredentials.senderEmail');
            break;
        default:
            sendMessage = false;
    }
    if (sendMessage) {
        sendMessageByTwillio(to, message);
    }
};


exports.sendMessageForScheduledRide = function(customerId, pickupTime, address) {
    console.log("Sending the confirmation to the user that a schedule has been entered in the system.");

    var completeDate = new Date(datetime_utils.changeTimezoneFromUtcToIst(pickupTime));
    //completeDate.setTime(completeDate.getTime() + (3600000 * 5.5));
    var date = completeDate.getDate() + "-" + completeDate.getMonth();
    var time = completeDate.getHours() + ":" + completeDate.getMinutes() + " hrs";

    var customer_info = "SELECT `user_id`,`user_name`,`phone_no` FROM `tb_users` WHERE `user_id`= ? LIMIT 1";
    connection.query(customer_info, [customerId], function(err, customer) {
        logging.logDatabaseQuery("Fetch information for customer", err, customer, null);
        if (customer.length > 0) {
            customer = customer[0];
            var msg =
                "You have scheduled a " + config.get('projectName') + " ride for " + address + " on " + date + " at " + time + ". " +
                "We will confirm your booking 20 minutes before the scheduled pickup time and you will see the driver details in the " + config.get('emailCredentials.senderEmail') + " app. " +
                "We will send you a SMS as well.";
                // SCHEDULE_RIDE :  You have scheduled a {{PROJECT_NAME}} ride for {{ADDRESS}} on {{DATE}} at {{TIME}}.We will confirm your booking 20 minutes before the scheduled pickup time and you will see the driver details in the app.We will send you a SMS as well.
			var variables = {
				ADDRESS : address,
				DATE:date ,
				TIME:time,
				PROJECT_NAME : config.get('projectName')
			};
            sendMessageByTwillio(customer.phone_no, msg , "SCHEDULE_RIDE" , variables);
        }
    });
};

exports.sendMessageForManualFailure = function(customer_id, pickup_time) {
    console.log("Sending message to the user that the manual scheduling of auto has failed");
    var customer_info = "SELECT `user_id`,`user_name`,`phone_no` FROM `tb_users` WHERE `user_id`= ? LIMIT 1";
    connection.query(customer_info, [customer_id], function(err, customer) {
        logging.logDatabaseQuery("Fetch information for customer", err, customer, null);
        if (customer.length > 0) {
            customer = customer[0];
            var msg_user = "We are sorry. Due to exceptional circumstances we could not provide you " + config.get('projectName') + " at your scheduled pickup time. We have cancelled your request.";
            sendMessageByTwillio(customer.phone_no, msg_user);
            //var msg_support = "Couldn't provide pickup scheduled for " + customer.user_name + " at " + pickup_time + ".";
            //sendMessageByTwillio("+918556921929", msg_support);
        }
    });
};

exports.sendDriverInformation = function(customer_id, driver_id, pickup_time) {
    var customer_info = "SELECT `phone_no` , user_name FROM `tb_users` WHERE `user_id`= ? LIMIT 1";
    connection.query(customer_info, [customer_id], function(err, customer) {
        logging.logDatabaseQuery("Fetch information for customer", err, customer, null);
        customer = customer[0];
        var driver_info = "SELECT `user_name`,`phone_no` FROM `tb_users` WHERE `user_id`= ? LIMIT 1";
        connection.query(driver_info, [driver_id], function(err, driver) {
            logging.logDatabaseQuery("Fetch information for driver", err, driver, null);
            driver = driver[0];
            var message =
                driver.user_name + " (" + driver.phone_no + ") will pick you up at your scheduled pickup time of " + pickup_time + ". " +
                "Please call the driver at his number and confirm the location. In case of issues please call at " + config.get('supportPhoneNumber');
                // SCHEDULE_RIDE_DRIVER_INFO :  {{DRIVER_NAME}}({{DRIVER_PHONE}}) will pick you up at your scheduled pickup time of {{PICKUP_TIME}}.Please call the driver at his number and confirm the location. In case of issues please call at {{SUPPORT_NO}}
			var variables = {
				PICKUP_TIME : pickup_time,
				SUPPORT_NO:config.get('supportPhoneNumber') ,
				DRIVER_NAME:driver.user_name,
				DRIVER_PHONE: driver.phone_no,
				PROJECT_NAME : config.get('projectName')
			};
            sendMessageByTwillio(customer.phone_no, message , "SCHEDULE_RIDE_DRIVER_INFO" , variables);
        });
    });
};

exports.sendMessage = function(req, res) {
    var user_id = req.body.user_id;
    var message = req.body.message;

    var customer_info = "SELECT `phone_no` FROM `tb_users` WHERE `user_id`= ? LIMIT 1";
    connection.query(customer_info, [user_id], function(err, customer) {
        logging.logDatabaseQuery("Fetch information for customer", err, customer, null);

        if (customer.length > 0) {
            customer = customer[0];

            sendMessage(customer.phone_no, message);
            res.send(JSON.stringify({
                log: 'message sent'
            }));
        } else {
            res.send(JSON.stringify({
                log: 'user doesn\'t exist'
            }));
        }
    });
};
