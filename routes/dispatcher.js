var commonFunc = require('./commonfunction');
var responses   = require('./responses');
var logging = require('./logging');
var md5 = require('MD5');
/*
 * -----------------------------------------------
 * SEARCH CONTACT FROM PHONE NUMBER
 * -----------------------------------------------
 */

exports.searchcustomer_from_phonenumber = function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var phone_no = req.body.phone_no;
    var is_corp = req.body.is_corp;
    var manvalues = [access_token, phone_no];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    }else{
        if(is_corp == 1)
        {
            commonFunc.authenticateCorporateAdminAccessToken(access_token, function (authenticationresult) {
                if (authenticationresult == 0) {
                    responses.authenticationErrorResponse(res);
                    return;
                }
                else {
                    var sql = "SELECT tbu.`access_token`,tbu.`user_id`,tbu.`user_name`,tbu.`phone_no`,tbu.`user_email`, tbu.user_image FROM `tb_users` AS tbu INNER JOIN tb_corporate_user AS tbcu" ;
                    sql +=    " ON tbu.user_id = tbcu.user_id ";
                    sql += "WHERE tbu.`reg_as`=? and tbu.`is_deleted` = 0 and tbu.`is_blocked`= 0 and tbcu.admin_id = ? and tbcu.isdelete = 0 and tbcu.isblock = 0  and (tbu.`phone_no` ";
                    sql += "LIKE '%" + phone_no + "%'  or tbu.user_name LIKE '%"+ phone_no + "%'   or tbu.user_email LIKE '%"+ phone_no + "%'  )";
                    var params = [constants.userRegistrationStatus.CUSTOMER, authenticationresult[0].user_id];
                    connection.query(sql, params, function (err, customerserachresult) {
                        console.log(sql);
                        console.log(params);
                        if(err) {
                            logging.logDatabaseQueryError("Error in fetching corp users : ", err, customerserachresult);
                            responses.sendError(res);
                            return;
                        }
                        else if (customerserachresult.length > 0) {
                            var response = {
                                "message": constants.responseMessages.ACTION_COMPLETE,
                                "status": constants.responseFlags.ACTION_COMPLETE,
                                "data": {"customer_info": customerserachresult}
                            };
                        } else {
                            var response = {
                                "message": constants.responseMessages.ACTION_COMPLETE,
                                "status": constants.responseFlags.ACTION_COMPLETE,
                                "data": {"customer_info": []}
                            };
                        }
                        res.send(JSON.stringify(response));
                    });
                }
            });
        }
        else {
            commonFunc.authenticateAdminAccessToken(access_token, function (authenticationresult) {
                if (authenticationresult == 0) {
                    responses.authenticationErrorResponse(res);
                    return;
                }
                else {
                    var sql = "SELECT `access_token`,`user_id`, is_blocked,`user_name`,`phone_no`,`user_email` , `user_image` FROM `tb_users` ";
                    sql += "WHERE `reg_as`=? and `is_deleted` = 0 and ( `phone_no` ";
                    sql += "LIKE '%" + phone_no + "%'  or user_name LIKE '%"+ phone_no + "%'   or user_email LIKE '%"+ phone_no + "%' ) ";
                    connection.query(sql, [constants.userRegistrationStatus.CUSTOMER], function (err, customerserachresult) {
                        if (customerserachresult.length > 0) {
                            if(customerserachresult[0].is_blocked == 1)
                            {
                                var response = {
                                    "error": "This is a blocked user",
                                    "flag": 1
                                   // "data": {"customer_info": customerserachresult}
                                };
                            }
                            else {
                                var response = {
                                    "message": constants.responseMessages.ACTION_COMPLETE,
                                    "status": constants.responseFlags.ACTION_COMPLETE,
                                    "data": {"customer_info": customerserachresult}
                                };
                            }
                        } else {
                            var response = {
                                "message": constants.responseMessages.ACTION_COMPLETE,
                                "status": constants.responseFlags.ACTION_COMPLETE,
                                "data": {"customer_info": []}
                            };
                        }
                        res.send(JSON.stringify(response));
                    });
                }
            });
        }
    }
};
/*
 * --------------------
 * REGISTER A USER
 * --------------------
 */
exports.register_a_user = function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var username = req.body.user_name;
    var ph_no = req.body.ph_no;
    var email = req.body.email;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var country = req.body.country;
    var reference = req.body.reference;
    var manValues = [access_token, username, ph_no, latitude, longitude, country];
    var checkblank = commonFunc.checkBlank(manValues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    }else{
        commonFunc.authenticateAdminAccessToken(access_token, function(authenticationresult){
            if (authenticationresult == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                var sql = "SELECT `user_id`,`user_email`,`verification_status`,`reg_as` , phone_no FROM `tb_users` WHERE `user_email`=? or phone_no = ? LIMIT 1"
                connection.query(sql, [email , ph_no], function (err, customeremailcheckresult) {
                   if (customeremailcheckresult.length == 1) {
                       if (customeremailcheckresult[0].reg_as == 0) {
                           var response = {
                               "message": constants.responseMessages.EMAIL_REGISTERED_ALREADY_AS_CUSTOMER,
                               "status": constants.responseFlags.SHOW_ERROR_MESSAGE,
                               "data" : {}
                           };
                           res.send(JSON.stringify(response));
                       }
                       else {
                           var response = {
                               "message": constants.responseMessages.EMAIL_REGISTERED_ALREADY_AS_DRIVER,
                               "status": constants.responseFlags.SHOW_ERROR_MESSAGE,
                               "data" : {}
                           };
                           res.send(JSON.stringify(response));
                       }
                   }
                   else {
                        var accessToken = md5(new Date());
                        var loginTime = new Date();
                        var userImage = config.get('s3BucketCredentials.s3URL')+'/'+config.get('s3BucketCredentials.folder.userProfileImages')+'/'+config.get("s3BucketCredentials.folder.userProfileDefaultImage");
                        var sql = "INSERT into tb_users(reg_web_panel,device_type,user_email,password,user_device_token,access_token,date_registered,current_location_latitude,current_location_longitude,country,os_version,device_name,app_versioncode,current_user_status,user_name,user_image,phone_no,verification_token,reg_as , how_hear_us) " +
                            "values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                        connection.query(sql, [1, 3, email, '', '', accessToken, loginTime, latitude, longitude, country, '', '', '', 0, username, userImage, ph_no, '', 0 , reference], function (err, result) {
                            if (err) {
                                console.log(err);
                            }
                            //commonFunc.sendMessage(ph_no,"Welcome to TaxiMust");
                            var response = {
                                "message": constants.responseMessages.ACTION_COMPLETE,
                                "status": constants.responseFlags.ACTION_COMPLETE,
                                "data" : {
                                    user_id:result.insertId,
                                    access_token: accessToken,
                                    username : username,
                                    phone : ph_no
                                }
                            };
                            res.send(JSON.stringify(response));
                        });
                   }
                });
            }
        });
    }

};

/*
 * -----------------------------------------------
 * FIND DRIVER IN AREA
 * -----------------------------------------------
 */

exports.find_driver_in_area = function(req, res) {
    var access_token = req.body.access_token;
    var customer_lat = req.body.latitude;
    var customer_long = req.body.longitude;
    var manValues = [access_token, customer_lat, customer_long];
    var checkblank = commonFunc.checkBlank(manValues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    }else{
        commonFunc.authenticateAdminAccessToken(access_token, function(authenticationresult) {
            if (authenticationresult == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                findDriversInArea(customer_lat, customer_long, function (freedriversresponse) {
                            var response = {
                                "message": constants.responseMessages.ACTION_COMPLETE,
                                "status": constants.responseFlags.ACTION_COMPLETE,
                                "data":freedriversresponse
                            };
                            res.send(JSON.stringify(response));
                        });
            }
        });
    }
};

/*-----------------------
CREATE MANUAL ENGAGEMENT
 ------------------------
 */
exports.create_manual_engagement = function(req, res){
    var access_token = req.body.access_token;
    var customer_id = req.body.customer_id;
    var latitude = req.body.pickup_latitude;
    var longitude = req.body.pickup_longitude;
    var driver_id = req.body.driver_id;

    var manualDestinationLatitude = req.body.manual_destination_latitude;
    var manualDestinationLongitude = req.body.manual_destination_longitude;
    var manualDestinationAddress = req.body.manual_destination_address;
    var manValues = [customer_id, latitude, longitude, driver_id];
    var checkblank = commonFunc.checkBlank(manValues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    }else {
        commonFunc.authenticateAdminAccessToken(access_token, function (authenticationresult) {
            if (authenticationresult == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                var get_session = "SELECT `is_active`, `ride_acceptance_flag`, `session_id` FROM `tb_session` WHERE `user_id`=? ORDER BY `session_id` DESC LIMIT 1";
                connection.query(get_session, [customer_id], function (err, sessions) {

                    if (sessions.length > 0 && sessions[0].is_active == constants.sessionStatus.ACTIVE) {
                        var response = {error: 'The previous session for the customer is already active'};
                        res.send(response);
                    }
                    else {
                        var get_driver_status = "SELECT `status` FROM `tb_users` WHERE `user_id`=? LIMIT 1";
                        connection.query(get_driver_status, [driver_id], function (err, drivers) {
                            if (drivers[0].status == constants.userFreeStatus.BUSY) {
                                var response = {error: 'The driver is busy'};
                                res.send(response);
                            }
                            else {
                                addManualEngagement(customer_id, latitude, longitude, driver_id, manualDestinationLatitude, manualDestinationLongitude, manualDestinationAddress, res);
                            }
                        });
                    }
                });
            }
        });
    }
};


/*-----------------------
 CHECK DRIVER RESPONSE
 ------------------------
 */
exports.driver_response = function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var engagement_id = req.body.engagement_id;
    var driver_user_id = req.body.driver_id;
    var customer_user_id = req.body.customer_id;
    var manvalues = [access_token, driver_user_id, engagement_id, customer_user_id];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function(authenticationresult) {
            if (authenticationresult == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                var response1;
                var sql = "SELECT `status` FROM `tb_engagements` WHERE `engagement_id` = ? LIMIT 1";
                connection.query(sql, [engagement_id], function (err, resultstatus) {
                    var log;
                    if (resultstatus[0].status == 1) {
                            log="Driver Accepted the request";
                    }
                    else if (resultstatus[0].status == 4) {
                        log="Driver Rejected the request";
                    }
                    else{
                        log="No response from driver";
                    }
                    response1 = {
                        "log": log,
                        "engagement_id": engagement_id,
                        "driver_id": driver_user_id
                    };
                    res.send(JSON.stringify(response1));
                });
            }
        });
    }
}

/*
--------------------
FIND DRIVER IN AREA
--------------------
 */
function findDriversInArea(latitude, longitude, callback){
    var fetch_drivers_query = "SELECT * " +
        "FROM" +
        "(" +
        "SELECT * FROM" +
        "(SELECT `user_name`,`phone_no`,`user_image`,`driver_car_image`,`car_type`,`current_location_latitude` as latitude, `current_location_longitude` as longitude," +
        "`user_id`,`total_rating_got_driver`,`total_rating_driver` FROM `tb_users` WHERE `current_user_status`=? && `status`=? && `reg_as`!= ? && `is_available` = 1) AS `drivers`" +
        "JOIN" +
        "(SELECT `driver_id`, `latitude` as home_latitude, `longitude` as home_longitude FROM `tb_home_locations`) AS `home_locations`" +
        "WHERE drivers.user_id = home_locations.driver_id) " +
        "AS `drivers_with_locations`" +
        "JOIN " +
        "`tb_timings` " +
        "WHERE drivers_with_locations.user_id = tb_timings.driver_id && TIME(NOW()) > tb_timings.start_time && TIME(NOW()) < tb_timings.end_time";
    var values = [constants.userCurrentStatus.DRIVER_ONLINE, constants.userFreeStatus.FREE, constants.userRegistrationStatus.CUSTOMER];
    connection.query(fetch_drivers_query, values, function(err, resultdrivers) {
        var drivers = [];
        var resultdrivers_length = resultdrivers.length;
        for (var i = 0; i < resultdrivers_length; i++) {
            if(isDriverAtHome(resultdrivers[i].home_latitude, resultdrivers[i].home_longitude, resultdrivers[i].latitude, resultdrivers[i].longitude)){
                console.log(resultdrivers[i].user_name + " is at home right now");
            }
            else if(Math.abs(resultdrivers[i].latitude) < 0.001 && Math.abs(resultdrivers[i].longitude) < 0.001){
                console.log("The current location of " + resultdrivers[i].user_name + " is at 0,0");
            }
            else{
                resultdrivers[i].distance = commonFunc.calculateDistance(
                    latitude, longitude,
                    resultdrivers[i].latitude, resultdrivers[i].longitude);

                resultdrivers[i].rating = resultdrivers[i].total_rating_driver / resultdrivers[i].total_rating_got_driver;
                delete resultdrivers[i].total_rating_got_driver;
                delete resultdrivers[i].total_rating_driver;

                //if (resultdrivers[i].distance / 1000 < 12) {
                    drivers.push(resultdrivers[i]);
                //}
            }
        }
        drivers = commonFunc.sortByKeyAsc(drivers, "distance");

        callback(drivers);
    });
}

function isDriverAtHome(home_latitude, home_longitude, current_latitude, current_longitude){
    if(Math.abs(home_latitude) < 0.00001 && Math.abs(home_longitude) < 0.00001){
        return false;
    }
    else if(current_latitude > home_latitude + home_location_tolerance
        || current_latitude < home_latitude - home_location_tolerance
        || current_longitude > home_longitude + home_location_tolerance
        || current_longitude < home_longitude - home_location_tolerance){
        return false;
    }
    else{
        return true;
    }
}
/*
----------------------
 ADD MANUAL ENGAGEMENT
 ----------------------
 */
function addManualEngagement(customer_id, latitude, longitude, driver_id, manualDestinationLatitude, manualDestinationLongitude, manualDestinationAddress, res){
    var get_customer_info = "SELECT `user_id`, `user_name`, `user_email`, `phone_no` " +
        "FROM `tb_users` WHERE `user_id`=?";
    connection.query(get_customer_info, [customer_id], function(err, customer) {

        var get_driver_info = "SELECT `user_id`, `user_name`, `user_email`, `phone_no`, `current_location_latitude`, `current_location_longitude` " +
            "FROM `tb_users` WHERE `user_id`=?";
        connection.query(get_driver_info, [driver_id], function(err, driver) {

            commonFunc.getLocationAddress(latitude, longitude, function(pickup_address){
                // Create a new session
                var create_session = "INSERT INTO `tb_session` (`user_id`, `is_active`, `requested_drivers`, `ride_acceptance_flag`) " +
                    "VALUES (?, ?, ?, ?)";
                var values = [customer_id, constants.sessionStatus.ACTIVE, 1, constants.rideAcceptanceFlag.ACCEPTED];
                connection.query(create_session, values, function(err, session){

                    var create_engagement = "INSERT INTO `tb_engagements` " +
                        "(`user_id`, `driver_id`, `pickup_latitude`, `pickup_location_address`, `pickup_longitude`, `status`, `driver_accept_latitude`, `driver_accept_longitude`, `session_id`, `accept_time`," +
                        "`manual_destination_latitude`,`manual_destination_longitude`,`manual_destination_address`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    var values = [customer_id, driver_id,
                        latitude, pickup_address, longitude,
                        constants.engagementStatus.ACCEPTED,
                        driver[0].current_location_latitude, driver[0].current_location_longitude,
                        session.insertId, new Date(), manualDestinationLatitude, manualDestinationLongitude,manualDestinationAddress];
                    //console.log("VALUES FOR ENGAGEMENT: " + JSON.stringify(values));
                    connection.query(create_engagement, values, function(err, engagement) {

                        var response = {"log": "A manual active engagement has been created", "engagement": engagement.insertId};

                        if (typeof res != 'undefined'){
                            res.send(JSON.stringify(response));
                        }

                        // Send a push notification to the customer and the driver that a
                        // manual engagement has been created for them
                        var message_user = 'A '+config.get('projectName')+' driver has been assigned to you';
                        var payload_user = {
                            flag: constants.notificationFlags.CHANGE_STATE,
                            message: 'A '+config.get('projectName')+' driver has been assigned to you'};
                        var notificationFlag_user = 1;
                        commonFunc.sendNotification(customer_id, message_user, notificationFlag_user, payload_user);

                        var message_driver = 'Please pick the passenger just assigned to you';
                        var payload_driver = {
                            flag: constants.notificationFlags.CHANGE_STATE,
                            message: 'Please pick the passenger just assigned to you'};
                        var notificationFlag_driver = 1;
                        commonFunc.sendNotification(driver_id, message_driver, notificationFlag_driver, payload_driver);
                    });

                    // Set the status of the driver to busy
                    var set_driver_busy_query = "UPDATE `tb_users` SET `status`=? WHERE `user_id`=?";
                    connection.query(set_driver_busy_query, [constants.userFreeStatus.BUSY, driver_id], function(err, results) {
                        logging.logDatabaseQueryError("Setting driver status to busy", err, results, null);
                    });
                });
            });
        });
    });
};