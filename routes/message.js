var commonFunc = require('./commonfunction'); 
var utils = require('./../utils/commonfunction');
var md5 = require('MD5');
var responses = require('./responses');
var logging = require('./logging');
var math = require('mathjs');
var phantom = require('phantom');
var fs = require('fs');
var constants = require('./constants');
var Handlebars = require('handlebars');
var time = require('./time');
var lookup = require('country-data');
var messenger = require('./messenger');
var path = require('path');
var multer = require('multer');
var notification = require('./notification');
var FCM = require('fcm-node');
var async = require('async');

exports.send_bulk_message = function(sender_id, receiver_id, order_id, delivery_amount, delivery_time, delivery_distance) {

    // type :- 1 = text, 2 = latlong, 3 = image 

    var message_unique_idd = utils.generateRandomString();
    var message_id = md5(message_unique_idd);
    // var message_unique_iddd = utils.generateRandomString();
    // var message_unique_id = md5(message_unique_iddd);
    var message_unique_id = order_id;
    var currentTime = new Date();
    var created_on = Math.round(currentTime.getTime() / 1000);

    var order_sql = "SELECT * FROM `order_details` WHERE `order_id`=?";
    connection.query(order_sql, [order_id], function(err, orderResult) {
        console.log(err);
        if ( err ) {
            return 0;
        } else {
            var order_description = orderResult[0].order_description;
            var order_lat_long = orderResult[0].lattitude+','+orderResult[0].longitude;
            var delivery_msg = "Delivery Cost: "+delivery_amount+" Delivery within: "+delivery_time+" Away: "+delivery_distance; 
            
            var message_sql = "INSERT INTO `message` (`message_id`, `sender_id`, `receiver_id`, `message_body`, `message_type`, `message_unique_id`, `created_on`) VALUES ?";
            var values = [
                [message_id, sender_id, receiver_id, order_description, 1, message_unique_id, created_on],
                [message_id, sender_id, receiver_id, order_lat_long, 2, message_unique_id, created_on],
                [message_id, sender_id, receiver_id, delivery_msg, 1, message_unique_id, created_on]
            ];
            console.log(values);
            connection.query(message_sql, [values], function(err) {
                console.log(err);
                if (err) {
                    return 0
                } else {
                    return 1;
                }
            });
        }
    });
}

exports.send_message = function(req, res) {
    var access_token = req.body.access_token;
    var message_unique_id = req.body.message_unique_id;
    var message_to_id = req.body.message_to_id;
    var message_type = req.body.message_type;
    var message_body = req.body.message_body;

    var manvalues = [access_token, message_to_id, message_type];
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
                var sender_id = result[0].user_id;
                var receiver_id = message_to_id;

                var message_unique_idd = utils.generateRandomString();
                var message_id = md5(message_unique_idd);
                var currentTime = new Date();
                var created_on = Math.round(currentTime.getTime() / 1000);
                var user_type = "1";

                if ( req.file != undefined ) { 
                    message_body = req.file.filename;
                }

                var sql = "INSERT INTO `message`(`message_id`, `sender_id`, `receiver_id`, `message_type`, `message_body`, `created_on`, `user_type`, `message_unique_id`) VALUES (?,?,?,?,?,?,?,?)";
                var value = [message_id, sender_id, receiver_id, message_type, message_body, created_on, user_type, message_unique_id];
                connection.query(sql, value, function (err, result) {
                    if (err) {
                        responses.sendError(res);
                        return;
                    } else {
                        var response = {
                            flag: 1,
                            response: {},
                            message: "Successfully send message."
                        }
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    }
                });
            }
        });
    }
}

exports.get_message = function(req, res) {

    var access_token = req.body.access_token;
    var message_unique_id = req.body.message_unique_id;
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
                var sql = "SELECT * FROM `message` WHERE `message_unique_id`=?";
                var value = [message_unique_id];
                connection.query(sql, value, function (err, result) {
                    if (err) {
                        responses.sendError(res);
                        return;
                    } else {
                        for (var i = 0; i < result.length; i++) {
                            if ( result[i].sender_id == user_id ) {
                                result[i].user_type = 1;
                            } else {
                                result[i].user_type = 0;
                            }
                            if ( result[i].message_type == 3 ) {
                                result[i].message_body = "message/"+result[i].message_body;
                            }
                        }
                        var response = {
                            flag: 1,
                            response: result,
                            message: "Data successfully fetched."
                        }
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);             
                    }
                });
            }
        });
    }
}