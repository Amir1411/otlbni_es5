var request = require('request');
var logging = require('./../routes/logging');
var constants = require('./../routes/constants');
var nodemailer = require("nodemailer");
var md5 = require('MD5');
var responses = require('./../routes/responses');

var debugging_enabled = true;
var smtpTransport = undefined;



function authenticationHandler(data, res, callback) {
    authenticateUser(data.accessToken, function(result) {
        if (result === 0) {
            responses.authenticationErrorResponse(res);
            callback(-1, null);
            return;
        } else {
            data.userData = result[0];
            return callback(null, data);
        }
    });
}


exports.authenticationHandler =authenticationHandler;

/*
 * -----------------------------------------------
 * AUTHENTICATE ADMIN ACCESS TOKEN
 * -----------------------------------------------
 */
authenticateAdminAccessToken = function(userAccessToken, callback) {
    var sql = "SELECT `admin_id` FROM `tb_admin` WHERE `access_token`=? LIMIT 1";
    connection.query(sql, [userAccessToken], function(err, result) {

        console.log(err)
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};
exports.authenticateAdminAccessToken = authenticateAdminAccessToken;

/**
 * Function to check whether array contains an empty value or not
 * @param arr
 * @returns {number}
 */

 checkBlank = function(arr, req, res)
{
    var arrlength = arr.length;
    for (var i = 0; i < arrlength; i++)
    {

        if (arr[i] === '' || arr[i] === "" || arr[i] == undefined)
        {
            return 1;
            break;
        }
    }
    return 0;
};
exports.checkBlank = checkBlank;
exports.checkBlankAsync = function (res, manValues, callback) {

    var checkBlankData = checkBlank(manValues);

    if (checkBlankData) {
         responses.parameterMissingResponse(res);
     return process.nextTick(callback.bind(null,null));
    }
    else {
         return  process.nextTick(callback.bind(null,null));
    }
};

exports.clearUserDeviceToken = clearUserDeviceToken;

function clearUserDeviceToken(deviceToken, userId, deviceId) {


    if (typeof deviceId == 'undefined') {
        deviceId = 'undefind'
    }

    if (deviceToken == ''){
        return
    }else
    {

        var sql = "Select `reg_as` from `tb_users` where `user_id`= ? limit 1";
        connection.query(sql, [userId], function (err, result) {

            if (result.length > 0) {

                var reg_as = result[0].reg_as;


                var accessToken = md5(generateRandomString() + new Date());
                var sql = " update tb_users set current_user_status = 0 , user_device_token = '' , is_available = 0, access_token = CONCAT(user_id,?)  where (user_device_token = ? or unique_device_id = ? ) and user_id <> ? and `reg_as` = ? ";
                connection.query(sql, [accessToken, deviceToken, deviceId, userId, reg_as], function (err, result) {

                    console.log(err, result);
                    console.log("removing duplicate device tokens");
                });
            }
        });
    }
}


    // var selectReg = "Select u.`reg_as` from `tb_users` u where u.`user_id`= ?";
    // connection.query(selectReg, [userId], function(err, result) {

    //     var regAs = 0;
    //     if (result[0].reg_as == 0) {
    //         regAs = 1;
    //     }

// var accessToken = md5( generateRandomString() + new Date());

//         var sql = " update tb_users   set  user_device_token = '' , is_available = 0 , access_token = ?  where (user_device_token = ? or unique_device_id = ? ) and user_id <> ? ";
//         connection.query(sql, [deviceToken, deviceId,accessToken,userId, regAs], function(err, result) {


//             //     console.log(err , result);


//         });


    // });


/**
 * Function to generate a random string
 * @returns {string}
 */

generateRandomString = function() {
    var text = "";
    var possible = "123456789";

    for (var i = 0; i < 4; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
exports.generateRandomString = generateRandomString;


/**
 * Function to remove invalid email ID's
 * @param allIds
 * @returns {Array}
 */

function removeInvalidIds(allIds) {
    // done to handle the case where array is passed after stringifying
    allIds = allIds.toString();
    allIds = allIds.split(',');

    var i = 0;
    var isInvalid = false;
    var regularExp = /@facebook.com/i;
    var index = allIds.length;
    while (index--) {
        allIds[index] = allIds[index].trim();
        isInvalid = regularExp.test(allIds[index]);
        if (isInvalid === true) {
            allIds.splice(index, 1);
        }
    }
    return allIds;
}



/**
 * Function to send plaintext email
 * @param to
 * @param cc
 * @param bcc
 * @param subject
 * @param message
 * @param callback
 */

exports.sendPlainTextEmail = function(to, cc, bcc, subject, message, callback) {

    var nodemailer = require("nodemailer");
    if (smtpTransport === undefined) {
        smtpTransport = nodemailer.createTransport({
            host: config.get('emailCredentials.host'),
            port: config.get('emailCredentials.port'),
            auth: {
                user: config.get('emailCredentials.senderEmail'),
                pass: config.get('emailCredentials.senderPassword')
            }
        });
    }

    if (to) {
        to = removeInvalidIds(to);
    }
    if (cc) {
        cc = removeInvalidIds(cc);
    }
    if (bcc) {
        bcc = removeInvalidIds(bcc);
    }

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: config.get('emailCredentials.From'), // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: message // plaintext body
            //html: "<b>Hello world ?</b>" // html body
    };

    if (cc) {
        mailOptions.cc = cc;
    }
    if (bcc) {
        mailOptions.bcc = bcc;
    }

    // send mail with defined transport object
    if (to.length > 0 || cc.length > 0 || bcc.length > 0) {
        smtpTransport.sendMail(mailOptions, function(error, response) {
            console.log("Sending Mail Error: " + JSON.stringify(error));
            console.log("Sending Mail Response: " + JSON.stringify(response));
            return process.nextTick(callback.bind(null, error, response));
        });
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
};



/**
 * Function to send email
 * @param receiverMailId
 * @param message
 * @param subject
 * @param callback
 */


exports.sendEmailForPassword = function(receiverMailId, message, subject, callback) {
    if (smtpTransport === undefined) {
        smtpTransport = nodemailer.createTransport({
            host: config.get('emailCredentials.host'),
            port: config.get('emailCredentials.port'),
            auth: {
                user: config.get('emailCredentials.senderEmail'),
                pass: config.get('emailCredentials.senderPassword')
            }
        });
    }

    receiverMailId = removeInvalidIds(receiverMailId);

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: config.get('emailCredentials.From'), // sender address
        to: receiverMailId, // list of receivers
        subject: subject, // Subject line
        text: message // plaintext body
            //html: "<b>Hello world ?</b>" // html body
    };

    // send mail with defined transport object
    if (receiverMailId.length > 0) {
        smtpTransport.sendMail(mailOptions, function(error, response) {
            console.log("Sending Mail Error: " + error);
            console.log("Sending Mail Response: " + response);
            if (error) {
                return callback(0);
            } else {
                return callback(1);
            }

        });
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
};


/* Email Formatting */
exports.emailFormatting = function(senderID, message1, andriodAppLinkPath, iOSAppLinkPath, forgotlink, callback) {
        var msg = '<div style="width:700px !important;margin:auto;color:#424242;font-size:17px;background-color:whitesmoke;border: 1px solid #a1a1a1;padding: 10px 10px;border-radius: 4px;">'
        msg += '<p style="text-decoration:none;margin-top:35px"> Hi <b>' + senderID + ',</b></p>';
        msg += '<div><p style="text-decoration:none;margin-top:25px"> ' + message1 + ' </p></div>';
        if (forgotlink != '') {
            msg += '<div><p style="text-decoration:none;margin-top:25px">Forgot your password, huh? No big deal.<br>To create a new password, just follow this link:</p></div>';
        }
        if (forgotlink != '') {
            msg += '<div><p style="text-decoration:none;margin-top:25px"> <a href=' + forgotlink + '>Click here to reset your password.</a></p></div>';
            msg += '<hr>';
            msg += '<div><p style="text-decoration:none;margin-top:25px"> You received this email, because it was requested by ' + config.get('projectname') + ' admin. This is part of the procedure to create a new password on the system. If you DID NOT request a new password then please ignore this email and your password will remain the same.</p></div>';
        }
        msg += '<hr>';
        msg += '<table align="center"><tbody>';
        msg += '<tr>';
        msg += '<td>';
        msg += '<a href="' + andriodAppLinkPath + '"><img style="width: 132px;height: 39px;" src="http://cabit.clicklabs.in/appstore.png"/></a>';
        msg += '</td>';
        msg += '<td>';
        msg += '<a href="' + iOSAppLinkPath + '"><img style="width: 132px;height: 43px;"  src="http://cabit.clicklabs.in/googleplay.jpeg"/></a>';
        msg += '</td>';
        msg += '</tr>';
        msg += '</tbody></table>';
        msg += config.get('emailCredentials.signature');
        msg += '</div></div>';
        return callback(msg);
    }
    /* Email Formatting */
exports.emailFormattingSignupDriver = function(senderID, message1, andriodAppLinkPath, iOSAppLinkPath, forgotlink, callback) {
        var msg = '<div style="width:700px !important;margin:auto;color:#424242;font-size:17px;background-color:whitesmoke;border: 1px solid #a1a1a1;padding: 10px 10px;border-radius: 4px;">'
        msg += '<p style="text-decoration:none;margin-top:35px"> Hi <b>' + senderID + ',</b></p>';
        msg += '<div><p style="text-decoration:none;margin-top:25px"> ' + message1 + ' </p></div>';
        if (forgotlink != '') {
            msg += '<div><p style="text-decoration:none;margin-top:25px">Just follow this link to signup</p></div>';
        }
        if (forgotlink != '') {
            msg += '<div><p style="text-decoration:none;margin-top:25px"> <a href=' + forgotlink + '>Click here to signup.</a></p></div>';
            msg += '<hr>';
            //  msg +='<div><p style="text-decoration:none;margin-top:25px"> You received this email, because it was requested by a AutoVerdi admin. This is part of the procedure to create a new password on the system. If you DID NOT request a new password then please ignore this email and your password will remain the same.</p></div>';
        }
        msg += '<hr>';
        msg += '<table align="center"><tbody>';
        msg += '<tr>';
        msg += '<td>';
        msg += '<a href="' + andriodAppLinkPath + '"><img style="width: 132px;height: 39px;" src="http://cabit.clicklabs.in/appstore.png"/></a>';
        msg += '</td>';
        msg += '<td>';
        msg += '<a href="' + iOSAppLinkPath + '"><img style="width: 132px;height: 43px;"  src="http://cabit.clicklabs.in/googleplay.jpeg"/></a>';
        msg += '</td>';
        msg += '</tr>';
        msg += '</tbody></table>';
        msg += config.get('emailCredentials.signature');
        msg += '</div></div>';
        return callback(msg);
    }
    /**
     * Function to send HTML content in email
     * @param receiverMailId
     * @param html
     * @param subject
     * @param callback
     */

exports.sendHtmlContent = function(receiverMailId, html, subject, callback) {
    if (smtpTransport === undefined) {
        smtpTransport = nodemailer.createTransport({
            host: config.get('emailCredentials.host'),
            port: config.get('emailCredentials.port'),
            auth: {
                user: config.get('emailCredentials.senderEmail'),
                pass: config.get('emailCredentials.senderPassword')
            }
        });
    }

    receiverMailId = removeInvalidIds(receiverMailId);

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: config.get('emailCredentials.From'), // sender address
        to: receiverMailId, // list of receivers
        subject: subject, // Subject line
        html: html // html body
    }

    // send mail with defined transport object
    if (receiverMailId.length > 0) {

        smtpTransport.sendMail(mailOptions, function(error, response) {
            console.log("Sending Mail Error: " + JSON.stringify(error));
            console.log("Sending Mail Response: " + JSON.stringify(response));
            if (error) {
                return callback(0);
            } else {
                return callback(1);
            }
        });
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
};


/**
 * Function to send HTML email as BCC
 * @param receiverMailId
 * @param html
 * @param subject
 * @param callback
 */

exports.sendHtmlContent_UseBCC = function(receiverMailId, html, subject, callback) {
    if (smtpTransport === undefined) {
        smtpTransport = nodemailer.createTransport({
            host: config.get('emailCredentials.host'),
            port: config.get('emailCredentials.port'),
            auth: {
                user: config.get('emailCredentials.senderEmail'),
                pass: config.get('emailCredentials.senderPassword')
            }
        });
    }

    receiverMailId = removeInvalidIds(receiverMailId);

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: config.get('emailCredentials.from'), // sender address
        bcc: receiverMailId, // list of receivers
        subject: subject, // Subject line
        html: html // html body
    }

    // send mail with defined transport object
    if (receiverMailId.length > 0) {
        smtpTransport.sendMail(mailOptions, function(error, response) {
            if (error) {
                return callback(0);
            } else {
                return callback(1);
            }
        });
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
};


/**
 * Function to encrypt plaintext
 * @param text
 * @returns {*}
 */

exports.encrypt = function(text) {
    var crypto = require('crypto');
    var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};


/**
 * Function to authenticate user
 * @param userAccessToken
 * @param callback
 */       //`total_rating_got_driver`, `total_rating_driver`

 authenticateUser = function(userAccessToken, callback) {
    var sql = "SELECT * FROM `user` WHERE `access_token`=? and is_blocked = 0 and is_deleted = 0 LIMIT 1";
    connection.query(sql, [userAccessToken], function(err, result) {
        //logging.logDatabaseQuery("Authenticating user.", err, result, null);
        if (err) {
            return callback(0);
        }
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};
exports.authenticateUser = authenticateUser;

/**
 * Function to get user deatils
 * @param userId
 * @param callback
 */

exports.getUserInformation = function(userId, callback) {
    var getInformation =
        'SELECT `user_id`, `user_name`, `phone_no`, `user_email`, `is_blocked` ' +
        'FROM `tb_users` ' +
        'WHERE `user_id` = ?';
    connection.query(getInformation, [userId], function(err, user) {
        if (err) {
            return process.nextTick(callback.bind(null, err, user));
        }

        if (user.length == 0) {
            return process.nextTick(callback.bind(null, err, null));
        }

        return process.nextTick(callback.bind(null, err, user[0]));
    });
};



/**
 * Function to calculate displacement b/w two lat long's
 * @param lat1
 * @param long1
 * @param lat2
 * @param long2
 * @returns {toOrder.distance|*|toBe.distance|distance|fare_info.distance|number}
 */

exports.calculateDistance = function(lat1, long1, lat2, long2) {
    var dist = require('geo-distance-js');
    var from = {
        lat: lat1,
        lng: long1
    };
    var to = [{
        lat: lat2,
        lng: long2
    }];

    var result = dist.getDistance(from, to, 'asc', 'metres', 2);
    return result[0].distance;
};



/**
 * Function to sort an object array by key in ascending order
 * @param array
 * @param key
 * @returns {Array.<T>}
 */

exports.sortByKeyAsc = function(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
};


/**
 * Format the raw address obtained using google API
 * @param raw_address
 * @returns {string}
 */



exports.formatLocationAddress = function(raw_address) {
    var pickup_location_address = 'Unnamed';

    var arr_formatted_address = raw_address.split(',');

    var arr_formatted_address_length = arr_formatted_address.length;
    var arr_pickup_location_address = [];
    for (var i = 0; i < arr_formatted_address_length; i++) {
        var flag = 0;
        for (var j = 0; j < arr_formatted_address_length; j++) {
            if ((i != j) && (arr_formatted_address[j].indexOf(arr_formatted_address[i]) > -1)) {
                flag = 1;
                break;
            }
        }
        if (flag == 0) {
            arr_pickup_location_address.push(arr_formatted_address[i]);
        }
    }

    pickup_location_address = arr_pickup_location_address.toString();
    return pickup_location_address;
};


/**
 * Get the address of the location using the location's latitude and longitude
 * @param latitude
 * @param longitude
 * @param callback
 */

exports.getLocationAddress = function(latitude, longitude, callback) {
    request('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude, function(error, response, body) {
        var pickup_address = 'Unnamed';
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            if (body.results.length > 0) {
                var raw_address = body.results[0].formatted_address;
                pickup_address = module.exports.formatLocationAddress(raw_address);
            }
        }
        console.log("Request PickUP address ++++  " + pickup_address);
        callback(pickup_address);
    });
};



/**
 * Get string from enagagement status
 * @param status
 * @returns {string}
 */

exports.engagementStatusToString = function(status) {
    var result_string = "";

    switch (status) {
        case constants.engagementStatus.REQUESTED:
            result_string = "request has been sent";
            break;
        case constants.engagementStatus.ACCEPTED:
            result_string = "request has been accepted by the driver";
            break;
        case constants.engagementStatus.STARTED:
            result_string = "ride has started";
            break;
        case constants.engagementStatus.ENDED:
            result_string = "ride has ended";
            break;
        case constants.engagementStatus.REJECTED_BY_DRIVER:
            result_string = "request rejected by driver";
            break;
        case constants.engagementStatus.CANCELLED_BY_CUSTOMER:
            result_string = "request cancelled by customer";
            break;
        case constants.engagementStatus.TIMEOUT:
            result_string = "request timed out";
            break;
        case constants.engagementStatus.ACCEPTED_BY_OTHER_DRIVER:
            result_string = "request was accepted by another driver";
            break;
        case constants.engagementStatus.ACCEPTED_THEN_REJECTED:
            result_string = "request was accepted and then rejected";
            break;
        case constants.engagementStatus.CLOSED:
            result_string = "request was closed when the driver accepted other request";
            break;
        case constants.engagementStatus.CANCELLED_ACCEPTED_REQUEST:
            result_string = "request was cancelled by the customer after it was accepted by a driver";
            break;
    }
    return result_string;
};


/**
 * Get string from registration status
 * @param status
 * @returns {string}
 */

exports.registrationStatusToString = function(status) {
    var result_string = "";

    switch (status) {
        case constants.userRegistrationStatus.CUSTOMER:
            result_string = "Customer";
            break;
        case constants.userRegistrationStatus.DRIVER:
            result_string = "Ad-hoc driver";
            break;
    }
    return result_string;
};


/**
 * Get string from driver status
 * @param status
 * @returns {string}
 */


exports.driverStatusToString = function(status) {
    var result_string = "";

    switch (status) {
        case constants.userFreeStatus.FREE:
            result_string = "Free";
            break;
        case constants.userFreeStatus.BUSY:
            result_string = "Busy";
            break;
    }
    return result_string;
};


/**
 * Driver availability status to string
 * @param availability
 * @returns {string}
 */

exports.jugnooStatusToString = function(availability) {
    var result_string = "";

    switch (availability) {
        case 0:
            result_string = config.get('projectName') + "OFF";
            break;
        case 1:
            result_string = config.get('projectName') + " ON";
            break;
    }
    return result_string;
};



/**
 * Check whether referral code is already used
 * @param referral_code
 * @param callback
 */


function isCodeAlreadyUsed(referral_code, callback) {
    var get_code = "SELECT `user_id` FROM `tb_users` WHERE `referral_code` = ?";
    connection.query(get_code, [referral_code], function(err, users) {
        //logging.logDatabaseQuery("Checking for duplicacy", err, users);
        if (users.length > 0) {
            callback(true);
        } else {
            callback(false);
        }
    });
};


/**
 * Generate uniques referral code
 * @param user_name
 * @param callback
 */

exports.generateUniqueReferralCode = function(user_name, callback) {
    var max_code = 999;
    var min_code = 100;
    var referral_code = user_name.split(' ')[0].toUpperCase() + Math.floor(Math.random() * (max_code - min_code + 1) + min_code).toString();

    isCodeAlreadyUsed(referral_code, function(isUsed) {
        if (isUsed === true) {
            module.exports.generateUniqueReferralCode(user_name, callback);
        } else {
            var insert_refferal = "INSERT INTO `tb_promotions` (promotion_code, coupon_id, start_date, end_date, num_coupons, num_redeemed, days_validity, description)" +
                "VALUES(?,?,NOW(),'4015-04-12 18:30:00',500,0,?,'This is a Referral code')";
            var params = [referral_code, 1, constants.REFFERAL_DAYS_LIMIT];
            connection.query(insert_refferal, params, function(err, result) {
                callback(referral_code);
            });
        }
    });
};


/**
 * Generate random codes
 * @param callback
 */


exports.generateUniqueCode = function(callback) {
    var validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var code = config.get('startPromoCodeWith');
    var i = 0;
    for (i = 0; i < 6; i++) {
        code += validChars[Math.round(Math.random() * (36 - 1))];
    }
    var check_existing = "SELECT * FROM `tb_promotions` WHERE `promotion_code`=?";
    connection.query(check_existing, [code], function(err, result) {
        if (err) {
            logging.logDatabaseQuery("Getting any existing promtional code", err, result);
            callback(err);
        }
        if (result.length > 0) {
            generateUniqueCode(callback);
        } else {
            callback(err, code);
        }
    });
};


/**
 * Upload file to S3 bucket
 * @param file
 * @param folder
 * @param callback
 */

exports.uploadImageFileToS3Bucket = function(file, folder, callback) {

    var fs = require('fs');
    var AWS = require('aws-sdk');

    var filename = file.name; // actual filename of file
    var path = file.path; //will be put into a temp directory
    var mimeType = file.type;

    console.log("uploadImageFileToS3Bucket....................")
    console.log(file.name)
    console.log(file.path)
    console.log(folder)

    fs.readFile(path, function(error, file_buffer) {
        if (error) {
            return callback(0);
        } else {
            AWS.config.update({
                accessKeyId: config.get('s3BucketCredentials.accessKeyId'),
                secretAccessKey: config.get('s3BucketCredentials.secretAccessKey')
            });
            var s3bucket = new AWS.S3();
            var params = {
                Bucket: config.get('s3BucketCredentials.bucket'),
                Key: folder + '/' + filename,
                Body: file_buffer,
                ACL: 'public-read',
                ContentType: mimeType
            };

            s3bucket.putObject(params, function(err, data) {
                logging.logDatabaseQuery("Uploading image...........................", err, data, null);

                fs.unlink(path, function(err, result1) {});
                if (err) {
                    return callback(0);
                } else {
                    return callback(filename);
                }
            });
        }
    });
};


/**
 * Function to generate random split fare key
 * @type {generateSplitFareKey}
 */

exports.generateSplitFareKey = generateSplitFareKey;


/**
 * Function to generate random split fare key
 * @param callback
 */

function generateSplitFareKey(callback) {

    var validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var split_fare_key = "";
    var i = 0;
    for (i = 0; i < 6; i++) {
        split_fare_key += validChars[Math.round(Math.random() * (36 - 1))];
    }
    var check_existing = "SELECT `split_fare_key` FROM `tb_engagements` WHERE `split_fare_key`=? LIMIT 1";
    connection.query(check_existing, [split_fare_key], function(err, result) {
        if (err) {
            logging.logDatabaseQuery("Getting any existing split fare key", err, result);
            callback(err);
        }
        if (result.length > 0) {
            generateSplitFareKey(callback);
        } else {
            callback(err, split_fare_key);
        }
    });
}
