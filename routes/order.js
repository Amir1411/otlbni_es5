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

exports.pending_order = function(req, res){
    var place_id = req.body.place_id;
    var status = 0;

    var manvalues = [place_id];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        var pending_order_url = "SELECT * FROM `order_details` WHERE `place_id`=? AND `status`=?";
        connection.query(pending_order_url, [place_id,status], function(err, result) {
            if (err) {
                responses.sendError(res);
                return;
            } else if ( result.length > 0 ) {

                var userByArray = [];
                for (var i = 0; i < result.length; i++) {
                    var created_by_id = result[i].created_by_id;
                    userByArray.push(created_by_id);
                }
                console.log(userByArray);

                var my_order_url = "SELECT `user_name`, `profile_url` FROM `user` WHERE `user_id` IN (?)";
                connection.query(my_order_url, [userByArray], function(err, userResult) {
                    console.log(userResult);
                    if (err) {
                        responses.sendError(res);
                        return;
                    } else {
                        for (var i = 0; i < userResult.length; i++) {
                           if ( userResult[i].profile_url != "" ) {
                                userResult[i].profile_url = "/user/"+userResult[i].profile_url;
                            }
                        }
                        
                        for (var k = 0; k < result.length; k++) {
                            for (var j = 0; j < userResult.length; j++) {
                                result[k]["user_details"] = userResult[j];
                            }
                        }

                        var response = {
                            flag: 1,
                            response: result,
                            message: "Pending order list details"
                        };
                        // res.send(JSON.stringify(response));
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    }
                });
            } else {
                var response = {
                    flag: 1,
                    response: {},
                    message: "No data found"
                };
                // res.send(JSON.stringify(response));
                res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
            }
        });
    }
};

exports.my_order = function(req, res){
    var access_token = req.body.access_token;
    var https = require('https');
    var key = config.get("mapKey");

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
                // res.send(JSON.stringify(response));
                res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
                return;
            } else {
                var user_id = result[0].user_id;
                var arrayId = [];
                for (var i = 0; i < result.length; i++) {
                    var user_id = result[i].user_id;
                    arrayId.push(user_id);
                }

                async.parallel(
                    [  
                        function(callback) {
                            get_myorderinactive_details(arrayId,req,res,function(get_myorderinactive_details_result){
                                callback(null,get_myorderinactive_details_result);
                            });
                        },
                        //calling total rides for today function
                        function(callback) {
                            get_myorderactive_details(arrayId,req,res,function(get_myorderactive_details_result){
                                callback(null,get_myorderactive_details_result);
                            });
                        }
                    ], function(err, results) {
                        console.log(err);
                        console.log(results);
                        var response = {
                            flag: 1,
                            response: {"inactive_order": results[0], "active_order": results[1]},
                            message: "Data fetched successfully"
                        }
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    }
                );
            }
        });
    }
};

function get_myorder_place(resultItem, callback) {
    var key = config.get("mapKey");
    // var place_id = resultItem.place_id;
    // console.log(place_id);
    var place_details = [];
    var place_length = resultItem.length;
    var j = 1;
    for (var i in resultItem) {

        var https = require('https');
        var url = "https://maps.googleapis.com/maps/api/place/details/json?placeid="+resultItem[i].place_id+"&key="+key;
        console.log(url);
        https.get(url, function(response) {
            var body ='';
            response.on('data', function(chunk) {
            body += chunk;
        });

        response.on('end', function() {

            var places = JSON.parse(body);
            var locations = places.result;

            place_details.push(locations);
            if (j < place_length) {
                j++;
            } else {
                callback(place_details);
            }
            // if( 0 === --place_length ) {
            //     callback(place_details); //callback if all queries are processed
            // }
        });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
            var response = {
                status: constants.responseFlags.NO_RESULT_FOUND,
                flag: 1,
                response: {},
                message: "No details found"
            };
            // callback(0);
        });
    }
    // callback(place_details)

}

function get_myorderinactive_details(user_id, req, res, callback) {

    var pending_status = 0;
    var accept_status = 1;
    var ontheway_status = 4;
    var my_order_url = "SELECT * FROM `order_details` WHERE `created_by_id`=? AND `status` NOT IN ("+pending_status+","+accept_status+", "+ontheway_status+")";
    
    console.log(my_order_url);
    connection.query(my_order_url, [user_id], function(err, result) {
        if (err) {
            console.log(err);
            responses.sendError(res);
            return;
        } else if ( result.length > 0 ) {
            var userByArray = [];
            for (var i = 0; i < result.length; i++) {
                if ( result[i].order_image != "" ) {
                    result[i].order_image = "/order/"+result[i].order_image;
                }
                if ( result[i].order_by_id != "" ) {
                    var order_by_id = result[i].order_by_id;
                    userByArray.push(order_by_id);
                } 
            }

            get_myorder_place(result, function(placeDetails){
                console.log(userByArray);
                if(userByArray.length > 0){
                    var my_order_url = "SELECT `user_name`, `profile_url` FROM `user` WHERE `user_id` IN(?)";
                    connection.query(my_order_url, [userByArray], function(err, userResult) {
                        if (err) {
                            console.log(err);
                            responses.sendError(res);
                            return;
                        } else {
                            for (var i = 0; i < userResult.length; i++) {
                               if ( userResult[i].profile_url != "" ) {
                                    userResult[i].profile_url = "/user/"+userResult[i].profile_url;
                                }
                            }
                            
                            for (var k = 0; k < result.length; k++) {
                                for (var j = 0; j < userResult.length; j++) {
                                    for (var l = 0; l < placeDetails.length; l++) {
                                        if ( result[k].order_by_id == "" ) {
                                            result[k]["order_by_user_details"] = {};
                                        } else {
                                            result[k]["order_by_user_details"] = userResult[j];
                                        }
                                        var placeResponse = {
                                            place_name: placeDetails[l].name,
                                            photos: placeDetails[l].icon
                                        }
                                        result[k]["place_details"] = placeResponse;
                                    }
                                }
                            }

                            // var response = {
                            //     flag: 1,
                            //     response: result,
                            //     message: "My order list details"
                            // };
                            // // res.send(JSON.stringify(response));
                            // res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                            callback(result);
                        }
                    });
                } else {
                            
                    for (var k = 0; k < result.length; k++) {
                        for (var l = 0; l < placeDetails.length; l++) {
                            result[k]["order_by_user_details"] = {};
                            var placeResponse = {
                                place_name: placeDetails[l].name,
                                photos: placeDetails[l].icon
                            }
                            result[k]["place_details"] = placeResponse;
                        }
                    }

                    // var response = {
                    //     flag: 1,
                    //     response: result,
                    //     message: "My order list details"
                    // };
                    // // res.send(JSON.stringify(response));
                    // res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    callback(result);
                }
            });
        } else {
            // var response = {
            //     flag: 1,
            //     response: {},
            //     message: "No data found"
            // };
            // // res.send(JSON.stringify(response));
            // res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
            var result = [];
            callback(result);
        }
    });

}

function get_myorderactive_details(user_id, req, res, callback) {

    var pending_status = 0;
    var accept_status = 1;
    var ontheway_status = 4;
    var my_order_url = "SELECT * FROM `order_details` WHERE `created_by_id`=? AND `status` IN("+pending_status+","+accept_status+","+ontheway_status+")";
    connection.query(my_order_url, [user_id], function(err, result) {
        if (err) {
            console.log(err);
            responses.sendError(res);
            return;
        } else if ( result.length > 0 ) {
            var userByArray = [];
            for (var i = 0; i < result.length; i++) {
                if ( result[i].order_image != "" ) {
                    result[i].order_image = "/order/"+result[i].order_image;
                }
                if ( result[i].order_by_id != "" ) {
                    var order_by_id = result[i].order_by_id;
                    userByArray.push(order_by_id);
                } 
            }

            get_myorder_place(result, function(placeDetails){
                console.log(userByArray);
                if(userByArray.length > 0){
                    var my_order_url = "SELECT `user_name`, `profile_url` FROM `user` WHERE `user_id` IN(?)";
                    connection.query(my_order_url, [userByArray], function(err, userResult) {
                        if (err) {
                            console.log(err);
                            responses.sendError(res);
                            return;
                        } else {
                            for (var i = 0; i < userResult.length; i++) {
                               if ( userResult[i].profile_url != "" ) {
                                    userResult[i].profile_url = "/user/"+userResult[i].profile_url;
                                }
                            }
                            
                            for (var k = 0; k < result.length; k++) {
                                for (var j = 0; j < userResult.length; j++) {
                                    for (var l = 0; l < placeDetails.length; l++) {
                                        if ( result[k].order_by_id == "" ) {
                                            result[k]["order_by_user_details"] = {};
                                        } else {
                                            result[k]["order_by_user_details"] = userResult[j];
                                        }
                                        var placeResponse = {
                                            place_name: placeDetails[l].name,
                                            photos: placeDetails[l].icon
                                        }
                                        result[k]["place_details"] = placeResponse;
                                    }
                                }
                            }

                            // var response = {
                            //     flag: 1,
                            //     response: result,
                            //     message: "My order list details"
                            // };
                            // // res.send(JSON.stringify(response));
                            // res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                            callback(result);
                        }
                    });
                } else {
                            
                    for (var k = 0; k < result.length; k++) {
                        for (var l = 0; l < placeDetails.length; l++) {
                            result[k]["order_by_user_details"] = {};
                            var placeResponse = {
                                place_name: placeDetails[l].name,
                                photos: placeDetails[l].icon
                            }
                            result[k]["place_details"] = placeResponse;
                        }
                    }

                    // var response = {
                    //     flag: 1,
                    //     response: result,
                    //     message: "My order list details"
                    // };
                    // // res.send(JSON.stringify(response));
                    // res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    callback(result);
                }
            });
        } else {
            // var response = {
            //     flag: 1,
            //     response: {},
            //     message: "No data found"
            // };
            // // res.send(JSON.stringify(response));
            // res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
            var result = [];
            callback(result);
        }
    });
    
}

exports.create_order = function(req, res) {

    var access_token = req.body.access_token;
    var place_id = req.body.place_id;
    var place_name = req.body.place_name;
    var order_description = req.body.order_description;
    var delivery_address = req.body.delivery_address;
    var lattitude = req.body.lattitude;
    var longitude = req.body.longitude;
    var delivery_address = req.body.delivery_address;
    var delivery_time = req.body.delivery_time;

    var manvalues = [access_token,place_id,order_description,delivery_address,delivery_time, lattitude, longitude];
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
                // res.send(JSON.stringify(response));
                res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
                return;
            } else {
                var user_id = result[0].user_id;
                var order_unique_id = utils.generateRandomString();
                var order_id = md5(order_unique_id);
                var order_number_id = utils.generateRandomString();
                var order_number = md5(order_number_id).slice(0, 6);
                var status = 0;
                var currentTime = new Date();
                var created_on = Math.round(currentTime.getTime() / 1000);

                if ( req.file != undefined ) {
                    create_order(order_id, order_number, user_id, user_id, place_id, place_name, order_description, created_on, status, delivery_time, delivery_address,req.file.filename,lattitude,longitude,req,res);
                } else {
                    var order_image = "";
                    create_order(order_id, order_number, user_id, user_id, place_id, place_name, order_description, created_on, status, delivery_time, delivery_address,order_image,lattitude,longitude,req,res);
                }
            }
        });
    }
}

function create_order (order_id, order_number, user_id, user_id, place_id, place_name, order_description, created_on, status, delivery_time, delivery_address,order_image,lattitude,longitude,req,res) {
   
    var sql = "INSERT INTO `order_details`(`order_id`, `order_number`, `user_id`, `created_by_id`, `place_id`, `place_name`, `order_description`, `created_on`, `status`, `delivery_time`, `delivery_address`, `order_image`, `lattitude`, `longitude`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    var value = [order_id, order_number, user_id, user_id, place_id, place_name, order_description, created_on, status, delivery_time, delivery_address, order_image, lattitude, longitude];
    connection.query(sql, value, function (err, result) {
        if (err) {
            responses.sendError(res);
            return;
        } else {

            var sql = "SELECT * FROM `courier` WHERE `place_id`=?";
            connection.query(sql, [place_id], function(err, placeResult){
                if (err) {
                    responses.sendError(res);
                    return;
                } else {
                    for ( var i=0; i<placeResult.length; i++) {
                        // console.log("sjhsjhs");
                        var sql = "SELECT * FROM `user` WHERE `user_id`=?";
                        connection.query(sql, [placeResult[i].user_id], function(err, userResult){
                            if (err) {
                                responses.sendError(res);
                                return;
                            } else {
                                console.log(userResult);
                                var notification_unique_id = utils.generateRandomString();
                                var notification_id = md5(notification_unique_id);
                                var currentTime = new Date();
                                var created_on = Math.round(currentTime.getTime() / 1000);
                                var notification_type = "1";
                                var notification_text = "create order for your checkin";
                                
                                var sql = "INSERT INTO `notification`(`notification_id`,`sender_id`, `reciever_id`, `notification_type`, `notification_text`, `notification_type_id`, `created_on`) VALUES (?,?,?,?,?,?,?)";
                                var value = [notification_id, user_id, userResult[0].user_id, notification_type, notification_text , order_id, created_on];
                                connection.query(sql, value, function (err, result) {
                                    console.log(err);
                                    if (err) {
                                        responses.sendError(res);
                                        return;
                                    } else {
                                        var serverKey = config.get('serverFCMKey'); //put your server key here 
                                        console.log(userResult[0].device_token);
                                        var fcm = new FCM(serverKey);
                                     
                                        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
                                            to: userResult[0].device_token, 
                                            collapse_key: 'otlbni',
                                            
                                            notification: {
                                                title: notification_type, 
                                                body: notification_text 
                                            }
                                        };
                                        
                                        fcm.send(message, function(err, response){
                                            if (err) {
                                                // return callback(0);
                                                console.log(err);
                                            } else {
                                                // return callback(1);
                                                console.log("jhj"+response);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            });
            // notification.send_notification(access_token, function(result) {

            // });

            var response = {
                flag: 1,
                response: "Order created successfully.",
                message: "Order created successfully."
            };
            // console.log(response);
            // res.send(JSON.stringify(response)); 
            res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
        }
    });
}

exports.getCreateOrderDetails = function(req, res) {
    var access_token = req.body.access_token;
    var notification_type = req.body.notification_type;
    var notification_type_id = req.body.notification_type_id;

    var manvalues = [access_token, notification_type, notification_type_id];
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
                // res.send(JSON.stringify(response));
                res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
                return;
            } else {
                // var user_id = result[0].user_id;

                if ( notification_type == "1" ) {
                    var sql = "SELECT * FROM `order_details` WHERE `order_id`=?";
                    connection.query(sql, [notification_type_id], function(err, orderDetails){
                        if (err) {
                            responses.sendError(res);
                            return;
                        } else {
                            var place_id = orderDetails[0].place_id;
                            var user_id = orderDetails[0].created_by_id;

                            async.parallel(
                                [  
                                    function(callback) {
                                        get_place_details(place_id,req,res,function(get_place_details_result){
                                            callback(null,get_place_details_result);
                                        });
                                    },
                                    //calling total rides for today function
                                    function(callback) {
                                        get_user_details(user_id,req,res,function(get_user_details_result){
                                            callback(null,get_user_details_result);
                                        });
                                    }
                                ], function(err, results) {
                                    console.log(err);
                                    console.log(results);
                                    var response = {
                                        flag: 1,
                                        response: {"user_details": results[1], "order_details": orderDetails[0], "place_details": results[0]},
                                        message: "Data fetched successfully"
                                    }
                                    res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                                }
                            );
                        }
                    });
                }
            }
        });
    }
}

function get_place_details (place_id,req, res,callback) {
    var https = require('https');
    var key = config.get("mapKey");

    var url = "https://maps.googleapis.com/maps/api/place/details/json?placeid="+place_id+"&key="+key;
    console.log(url);
    https.get(url, function(response) {
        var body ='';
        response.on('data', function(chunk) {
        body += chunk;
    });

    response.on('end', function() {

        var places = JSON.parse(body);
        var locations = places.result;
        
        callback(locations);
                
    });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        var locations = [];
        
        callback(locations);
    });
}

function get_user_details(user_id,req, res, callback) {

    var sql = "SELECT * FROM `user` WHERE `user_id`=? LIMIT 1";
    connection.query(sql, [user_id], function(err, user_details){
        if (err) {

        } else {
            user_details[0].password = "";
            callback(user_details[0]);
        }
    });
}

exports.create_offer = function(req, res) {
    var access_token = req.body.access_token;
    var offer_created_to_id = req.body.created_by_id;
    var order_id = req.body.order_id;
    var amount = req.body.amount;

    var manvalues = [access_token, offer_created_to_id, order_id];
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
                // res.send(JSON.stringify(response));
                res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
                return;
            } else {
                var offer_created_by_id = result[0].user_id;
                var offer_unique_id = utils.generateRandomString();
                var offer_id = md5(offer_unique_id);
                var status = 0; // 0 = no action 1= accepted 2 = rejected
                var currentTime = new Date();
                var created_on = Math.round(currentTime.getTime() / 1000);

                var sql = "INSERT INTO `offer`(`offer_id`, `offer_created_by_id`, `offer_created_to_id`, `order_id`, `status`, `amount`, `created_on`) VALUES (?,?,?,?,?,?,?)";
                var value = [offer_id, offer_created_by_id, offer_created_to_id, order_id, status, amount, created_on];
                connection.query(sql, value, function (err, result) {
                    if (err) {
                        responses.sendError(res);
                        return;
                    } else {

                        var sql = "SELECT * FROM `user` WHERE `user_id`=?";
                        connection.query(sql, [offer_created_to_id], function(err, userResult){
                            if (err) {
                                responses.sendError(res);
                                return;
                            } else {
                                console.log(userResult);
                                var notification_unique_id = utils.generateRandomString();
                                var notification_id = md5(notification_unique_id);
                                var currentTime = new Date();
                                var created_on = Math.round(currentTime.getTime() / 1000);
                                var notification_type = "2";
                                var notification_text = "Offer for your order";
                                
                                var sql = "INSERT INTO `notification`(`notification_id`,`sender_id`, `reciever_id`, `notification_type`, `notification_text`, `notification_type_id`, `created_on`) VALUES (?,?,?,?,?,?,?)";
                                var value = [notification_id, offer_created_by_id, offer_created_to_id, notification_type, notification_text , order_id, created_on];
                                connection.query(sql, value, function (err, result) {
                                    console.log(err);
                                    if (err) {
                                        responses.sendError(res);
                                        return;
                                    } else {
                                        var serverKey = config.get('serverFCMKey'); //put your server key here 
                                        console.log(userResult[0].device_token);
                                        var fcm = new FCM(serverKey);
                                     
                                        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
                                            to: userResult[0].device_token, 
                                            collapse_key: 'otlbni',
                                            
                                            notification: {
                                                title: notification_type, 
                                                body: notification_text 
                                            }
                                        };
                                        
                                        fcm.send(message, function(err, response){
                                            if (err) {
                                                // return callback(0);
                                                console.log(err);
                                            } else {
                                                // return callback(1);
                                                console.log("jhj"+response);
                                            }
                                        });
                                    }
                                });
                            }
                        });

                        var response = {
                            flag: 1,
                            response: "Offer created successfully.",
                            message: "Offer created successfully."
                        };
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    }
                });
            }
        });
    }
}

exports.cancel_order = function(req, res) {
    var access_token = req.body.access_token;
    var order_id = req.body.order_id;

    var manvalues = [access_token, order_id];
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
                var pending_status = 0;
                var sql = "SELECT * FROM `order_details` WHERE `order_id`=? AND `status`=? AND `created_by_id`=?";
                connection.query(sql, [order_id, pending_status, user_id], function(err, checkResult){
                    if ( err ) {
                        responses.sendError(res);
                        return;
                    } else if ( checkResult.length > 0 ){
                        var cancelled_status = 5;
                        var update_sql = "UPDATE `order_details` SET `status`='"+cancelled_status+"' WHERE `order_id`=? AND `created_by_id`=?";
                        connection.query(update_sql, [order_id, user_id], function(err, updateResult) {
                            if (err) {
                                responses.sendError(res);
                                return;
                            } else {
                                var response = {
                                    flag: 1,
                                    response: {},
                                    message: "Order cancelled successfully"
                                }
                                res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                            }
                        });
                    } else {
                        var response = {
                            flag: 1,
                            response: {},
                            message: "This order can not be cancelled"
                        }
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    }
                });
            }
        });
    }
}