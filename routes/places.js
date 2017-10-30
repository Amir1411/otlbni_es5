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
var async =require('async');

exports.get_near_by_restaurant_list = function(req, res){

    var key = config.get("mapKey");
    var lattitude = req.body.lattitude;
    var longitude = req.body.longitude;
    var location = lattitude+','+longitude;
    var radius = 1000;
    var sensor = false;
    var types = req.body.types;

    var https = require('https');
    var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+location+"&radius="+radius+"&type="+types+"&key="+key+"&language=ar";

    https.get(url, function(response) {
        var body ='';
        response.on('data', function(chunk) {
        body += chunk;
    });

    response.on('end', function() {
        var places = JSON.parse(body);
        var locations = places.results; 
        var responseArray = [];
        var mostActiveArray = [];
        console.log(locations);
        for (var i = 0; i < locations.length; i++) {
            if ( locations[i].photos == undefined ) {
                locations[i].photos = "";
            } else {
                locations[i].photos = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="+locations[i].photos[0].photo_reference+"&key="+key;
            }
            console.log(locations[i].opening_hours);

            if ( locations[i].opening_hours != undefined ) {
                console.log(locations[i].opening_hours.open_now);
                if ( locations[i].opening_hours.open_now == true ) {
                    mostActiveArray.push(locations[i]);
                }
            }
        }
        responseArray = {"near_by" : locations, "most_active": mostActiveArray};
        res.status(constants.responseFlags.ACTION_COMPLETE).json(responseArray);
    });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
};

exports.get_place_details = function(req, res){

    var key = config.get("mapKey");
    var place_id = req.body.place_id;
    var lattitude = req.body.lattitude;
    var longitude = req.body.longitude;
    var access_token = req.body.access_token;

    var https = require('https');
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
        var responseArray = [];
        console.log(locations);
        
        var sql = "SELECT * FROM `courier`";
        connection.query(sql, [], function(err, placeResult){
            if (err) {
                responses.sendError(res);
                return;
            } else {
                var userArray = [];
                for ( var i=0; i<placeResult.length; i++) {
                    userArray.push(placeResult[i].user_id);
                }
                if (placeResult.length > 0 ) {
                    var sql = "SELECT * FROM `user` WHERE `user_id` IN(?)";
                    connection.query(sql, [userArray], function(err, userResult){
                        console.log(err);
                        if (err) {
                            responses.sendError(res);
                            return;
                        } else {
                            var checking_km_count = 0;
                            for (var i in userResult) {
                                //  For calculate distance
                                var radlat1 = Math.PI * parseInt(lattitude)/180;
                                var radlat2 = Math.PI * parseInt(userResult[i].lattitude)/180;
                                var theta = parseInt(longitude)-parseInt(userResult[i].longitude);
                                var radtheta = Math.PI * theta/180;
                                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                                dist = Math.acos(dist);
                                dist = dist * 180/Math.PI;
                                dist = dist * 60 * 1.1515;
                                // in KM
                                dist = dist * 1.609344;

                                if (dist < 20) {
                                    checking_km_count++;
                                }
                            }
                            if ( access_token != "" ) {
                                var sql = "SELECT * FROM `user` WHERE `access_token`=? and is_blocked = 0 and is_deleted = 0 LIMIT 1";
                                connection.query(sql, [access_token], function(err, result) {
                                    if (err) {
                                        console.log(err);
                                    } else if ( result.length > 0 ) {
                                        var user_id = result[0].user_id;
                                        var get_checkin_count = "SELECT * FROM `courier` WHERE `place_id`=? AND `user_id`=?";
                                        connection.query(get_checkin_count, [place_id, user_id], function(err, isChecking) {
                                            if (err) {
                                                console.log(err);
                                            } else if ( isChecking.length > 0 ) {
                                                var responseArray = {
                                                    flag: 1,
                                                    response: {"place_details" : locations, "checkin_count": checking_km_count, "is_checkin_by_me": 1},
                                                    message: "Successfully data fetched"
                                                };
                                                res.status(constants.responseFlags.ACTION_COMPLETE).json(responseArray);
                                            } else {
                                                var responseArray = {
                                                    flag: 1,
                                                    response: {"place_details" : locations, "checkin_count": checking_km_count, "is_checkin_by_me": 0},
                                                    message: "Successfully data fetched"
                                                };
                                                res.status(constants.responseFlags.ACTION_COMPLETE).json(responseArray);
                                            }
                                        });
                                    } else {
                                        var responseArray = {
                                            flag: 1,
                                            response: {"place_details" : locations, "checkin_count": checking_km_count, "is_checkin_by_me": 0},
                                            message: "Successfully data fetched"
                                        };
                                        res.status(constants.responseFlags.ACTION_COMPLETE).json(responseArray);
                                    }
                                });
                            } else {     
                                var responseArray = {
                                    flag: 1,
                                    response: {"place_details" : locations, "checkin_count": checking_km_count, "is_checkin_by_me": 0},
                                    message: "Successfully data fetched"
                                };
                                res.status(constants.responseFlags.ACTION_COMPLETE).json(responseArray);
                            }
                        }
                    });
                } else {
                    var responseArray = {
                        flag: 1,
                        response: {
                            "place_details" : locations, 
                            "checkin_count": 0, 
                            "is_checkin_by_me": 0
                        },
                        message: "Successfully data fetched"
                    };
                    res.status(constants.responseFlags.ACTION_COMPLETE).json(responseArray);
                }
            }
        });
    });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        var response = {
            flag: 1,
            response: {},
            message: "No details found"
        };
        res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
    });
};

exports.set_checkin_place = function(req, res) {
    var place_id = req.body.place_id;
    var access_token = req.body.access_token;
    var is_checkin = req.body.is_checkin;

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
            if ( is_checkin == 1 ) {

                var sql = "DELETE FROM `courier` WHERE `place_id` = ? AND `user_id`= ?";
                connection.query(sql, [place_id, user_id], function (err, result) {
                    if (err) {
                        responses.sendError(res);
                        return;
                    } else {
                        var courier_id = utils.generateRandomString();
                        var courier_unique_id = md5(courier_id);

                        var currentTime = new Date();
                        var currentTime = Math.round(currentTime.getTime() / 1000);
                        // console.log(currentTime);

                        var sql = "INSERT INTO `courier` (`courier_id`, `user_id`, `place_id`, `created_on`) VALUES (?,?,?,?)";
                        var value = [courier_unique_id, user_id, place_id, currentTime];
                        connection.query(sql, value, function (err, result) {
                            if (err) {
                                responses.sendError(res);
                                return;
                            } else {
                                var response = {
                                    flag: 1,
                                    response: "Successfully checked in.",
                                    message: "Successfully checked in."
                                };
                                res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                            }
                        });
                    }
                });

            } else {
                var sql = "DELETE FROM `courier` WHERE `place_id` = ? AND `user_id`= ?";
                connection.query(sql, [place_id, user_id], function (err, result) {
                    if (err) {
                        responses.sendError(res);
                        return;
                    } else {
                        var response = {
                            flag: 1,
                            response: "Successfully checked out.",
                            message: "Successfully checked out."
                        };
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    }
                });
            }
        }
    });
}

exports.my_checkin_list = function(req, res) {
    var key = config.get("mapKey");
    var access_token = req.body.access_token;
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
            console.log(user_id);
            var sql = "SELECT * FROM `courier` WHERE `user_id`= ?";
            connection.query(sql, [user_id], function (err, result) {
                
                if (err) {
                    responses.sendError(res);
                    return;
                } else if ( result.length > 0 ) {
                   // async.map(result, get_place_detail, function(err, respo){
                   //      console.log(err);
                   //      console.log(respo);
                   // });
                    get_place_detail(result, function(places){
                        // console.log(places);
                        var response = {
                            flag: 1,
                            response: {"my_checkin_list": places},
                            message: "My checkin details"
                        }
                        // res.send(response);
                        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    });
                } else {
                    var response = {
                        flag: 1,
                        response: {},
                        message: "No details found."
                    };
                    // res.send(JSON.stringify(response));
                    res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
                }
            });
           
        }
    });
}

function get_place_detail (resultItem, callback) {
    
    var key = config.get("mapKey");
    // var place_id = resultItem.place_id;
    // console.log(place_id);
    var place_details = [];
    var place_length = resultItem.length;

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
            if( 0 === --place_length ) {
                callback(place_details); //callback if all queries are processed
            }
        });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
            var response = {
                status: constants.responseFlags.SHOW_ERROR_MESSAGE,
                flag: 1,
                response: {},
                message: "No details found"
            };
            callback(0);
        });
    }
}

exports.get_search_list = function(req, res){

    var key = config.get("mapKey");
    var lattitude = req.body.lattitude;
    var longitude = req.body.longitude;
    var location = lattitude+','+longitude;
    var radius = 1000;
    var sensor = false;
    var types = req.body.types;

    var https = require('https');
    var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+location+"&radius="+radius+"&type="+types+"&keyword="+types+"&key="+key;

    https.get(url, function(response) {
        var body ='';
        response.on('data', function(chunk) {
        body += chunk;
    });

    response.on('end', function() {
        var places = JSON.parse(body);
        var locations = places.results; 
        var mostActiveArray = [];
        for (var i = 0; i < locations.length; i++) {
            if ( locations[i].photos == undefined ) {
                locations[i].photos = "";
            } else {
                locations[i].photos = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="+locations[i].photos[0].photo_reference+"&key="+key;
            }
            console.log(locations[i].opening_hours);

            if ( locations[i].opening_hours != undefined ) {
                console.log(locations[i].opening_hours.open_now);
                if ( locations[i].opening_hours.open_now == true ) {
                    mostActiveArray.push(locations[i]);
                }
            }
        }

        responseArray = {"near_by" : locations, "most_active": mostActiveArray};
        var response = {
            flag: 1,
            response: responseArray,
            message: "Action complete"
        }
        // res.json(response);
        res.status(constants.responseFlags.ACTION_COMPLETE).json(response);

        // responseArray = {"near_by" : locations, "most_active": mostActiveArray};
        // res.status(constants.responseFlags.ACTION_COMPLETE).json(responseArray);
    });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
         var response = {
            flag: 1,
            response: {},
            message: "No details found"
        }
        // res.json(response);
        res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
    });
};
