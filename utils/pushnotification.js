var logging = require('./../routes/logging');
var constants = require('./../routes/constants');
var debugging_enabled = true;


/**
 * Send notification to the user with the given user ID with ASSUMPTION: The payload is same for both the devices
 * @param user_id
 * @param message
 * @param flag
 * @param payload
 */
exports.sendNotification = function(user_id, message, flag, payload) {
    console.log("SENDING NOTIFICATION: " + message + " TO: " + user_id);

    console.log("PAYLOAD ========================== ");
    console.log(payload);
    var get_user_device_info = "SELECT `user_id`,`current_user_status`,`device_type`,`user_device_token` FROM `tb_users` WHERE `user_id`=?";
    connection.query(get_user_device_info, [user_id], function(err, result_user) {
        logging.logDatabaseQuery("Get device information for the driver", err, result_user, null);
        module.exports.sendNotificationToDevice(result_user[0].device_type, result_user[0].user_device_token, message, flag, payload, result_user[0].current_user_status);
    });
};


exports.sendBulkNotification = function(user_ids, message, flag, payload) {
    console.log("SENDING NOTIFICATION: " + message + " TO: " + user_ids);
    var get_user_device_info = "SELECT `user_id`,`current_user_status`,`device_type`,`user_device_token` FROM `tb_users` WHERE `user_id` in (" + user_ids.toString() + ")";

    var users = [];
    connection.query(get_user_device_info, [user_ids], function(err, result_user) {
        logging.logDatabaseQuery("Get device information for the driver", err, result_user, null);


        result_user.forEach(function(newUser) {
            var user = {};
            user.userDeviceToken = newUser.user_device_token;
            user.deviceType = newUser.device_type;
            user.current_user_status = newUser.current_user_status;
            users.push(user);
        });

        sendBulkNotificationToDevice(users, message, flag, payload);

    });
};




sendBulkNotificationToDevice = function(users, message, flag, payload) {
    // The user device token can be empty in case of scheduled pickups, hence, the check

    var androidUsers = [];
    var iosDrivers = [];
    var iosCustomers = [];

    users.forEach(function(user) {

        if (user.deviceType == constants.deviceType.ANDROID && user.userDeviceToken != '') {

            androidUsers.push(user.userDeviceToken);

        } else if (user.deviceType == constants.deviceType.iOS && user.userDeviceToken != '' && user.userDeviceToken.length >= 64) {
            if (user.current_user_status == 1) { // 1- driver
                iosDrivers.push(user.userDeviceToken);


            } else if (user.current_user_status == 2) {
                iosCustomers.push(user.userDeviceToken);
                    // 2-customer

            }
        }



    });

        if(androidUsers.length)  module.exports.sendAndroidPushNotification(androidUsers, payload);
        if(iosDrivers.length) module.exports.sendIosPushNotificationToDriver(iosDrivers, message, flag, payload);
        if(iosCustomers.length)  module.exports.sendIosPushNotification(iosCustomers, message, flag, payload);

};
exports.sendBulkNotificationToDevice = sendBulkNotificationToDevice;

/**
 *
 * @param deviceType
 * @param userDeviceToken
 * @param message
 * @param flag
 * @param payload
 * @param current_user_status
 */
exports.sendNotificationToDevice = function(deviceType, userDeviceToken, message, flag, payload, current_user_status) {
    // The user device token can be empty in case of scheduled pickups, hence, the check
    if (deviceType == constants.deviceType.ANDROID && userDeviceToken != '') {
        module.exports.sendAndroidPushNotification(userDeviceToken, payload);
    } else if (deviceType == constants.deviceType.iOS && userDeviceToken != ''  && userDeviceToken.length >= 64) {
        if (current_user_status == 1) { // 1- driver
            module.exports.sendIosPushNotificationToDriver(userDeviceToken, message, flag, payload);
        } else if (current_user_status == 2) { // 2-customer
            module.exports.sendIosPushNotification(userDeviceToken, message, flag, payload);
        }
    }
};



/**
 * Send the notification to the android device
 * @param deviceToken
 * @param message
 */

exports.sendAndroidPushNotification = function(deviceToken, message) {

    console.log(message)
    var gcm = require('node-gcm');
    var message = new gcm.Message({
        delayWhileIdle: false,
        timeToLive: 2419200,
        data: {
            message: message,
            brand_name: config.get('androidPushSettings.brandName')
        }
    });
    var sender = new gcm.Sender(config.get('androidPushSettings.gcmSender'));
    var registrationIds = [];
    registrationIds.push(deviceToken);

    if (typeof deviceToken == "object") {

        console.log("bulkbulkbulkbulkbulkbulkbulkbulk");
           console.log("bulkbulkbulkbulkbulkbulkbulkbulk");
           console.log(deviceToken)
        registrationIds = deviceToken;
    }

    sender.send(message, registrationIds, 4, function(err, result) {
        if (debugging_enabled) {
            console.log("ANDROID NOTIFICATION RESULT: " + JSON.stringify(result));
            console.log("ANDROID NOTIFICATION ERROR: " + JSON.stringify(err));
        }
    });
};


/**
 * sendIosPushNotificationToDriver
 * @param iosDeviceToken
 * @param message
 * @param flag
 * @param payload
 */

exports.sendIosPushNotificationToDriver = function(iosDeviceToken, message, flag, payload) {


    if (iosDeviceToken == "" && iosDeviceToken.length < 10) {
        return;
    }
    console.log("===================================================")
    console.log("To driver");
    console.log("iosDeviceToken");
    console.log(iosDeviceToken)

    console.log(configPath+"/"+config.get('iOSPushSettings.iosApnCertificateForDriver'));
    console.log(config.get('iOSPushSettings.gateway'));


    if(payload == null){
        payload.address = '';
    }
    else if (payload.address == null) {
        payload.address = '';
    }
    console.log(iosDeviceToken)
    console.log(message)
    console.log(flag)
    console.log("payload")
    console.log(payload)
    var status = 1;
    var msg = message;
    var snd = 'Default';
    if (flag == 6 || flag == 40) {
        status = 0;
        msg = '';
        snd = '';
    }
    if(flag == 0){
        snd = 'ping.aiff';
    }

    var apns = require('apn');

    var deviceToken ;


    if (typeof iosDeviceToken == "object") {
         console.log("bulkbulkbulkbulkbulkbulkbulkbulk");
           console.log(iosDeviceToken)

        deviceToken = iosDeviceToken;
    }else {


        deviceToken = new apns.Device(iosDeviceToken);
    }


    // for development

    var options = {
        cert: configPath+"/"+config.get('iOSPushSettings.iosApnCertificateForDriver'),
        certData: null,
        key: configPath+"/"+config.get('iOSPushSettings.iosApnCertificateForDriver'),
        keyData: null,
        passphrase: 'click',
        ca: null,
        pfx: null,
        pfxData: null,
        gateway: config.get('iOSPushSettings.gateway'),
        port: 2195,
        rejectUnauthorized: true,
        enhanced: true,
        cacheLength: 100,
        autoAdjustCache: true,
        connectionTimeout: 0,
        ssl: true
    };



    var apnsConnection = new apns.Connection(options);
    var note = new apns.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.contentAvailable = true;
    note.sound = snd;
    note.alert = msg;
    note.newsstandAvailable = status;
    note.payload = payload;

    apnsConnection.pushNotification(note, deviceToken);

    // Handle these events to confirm that the notification gets
    // transmitted to the APN server or find error if any
    function log(type) {
        return function() {
            if (debugging_enabled)
                console.log("iOS development PUSH NOTIFICATION RESULT: " + type);
        }
    }

    apnsConnection.on('error', log('error'));
    apnsConnection.on('transmitted', log('transmitted'));
    apnsConnection.on('timeout', log('timeout'));
    apnsConnection.on('connected', log('connected'));
    apnsConnection.on('disconnected', log('disconnected'));
    apnsConnection.on('socketError', log('socketError'));
    apnsConnection.on('transmissionError', log('transmissionError'));
    apnsConnection.on('cacheTooSmall', log('cacheTooSmall'));

};

/**
 * Send the notification to the iOS device for customer
 * @param iosDeviceToken
 * @param message
 * @param flag
 * @param payload
 */

exports.sendIosPushNotification = function(iosDeviceToken, message, flag, payload) {
    console.log("NEw engagement payload ====== " + JSON.stringify(payload));
    console.log("To customer")
    console.log("payload")
    console.log(payload)

    console.log("flag")
    console.log(flag)

    console.log(configPath+"/"+config.get('iOSPushSettings.iosApnCertificateForCustomer'))
    console.log(config.get('iOSPushSettings.gateway'))

    if (payload.address) {
        payload.address = '';
    }
    var status = 1;
    var msg = message;
    var snd = 'Default';
    if (flag == 6 || flag == 40) {
        status = 0;
        msg = '';
        snd = '';
    }

    if(flag == 0){
        snd = 'ping.aiff';
    }

    var apns = require('apn');

    var options = {
        cert: configPath+"/"+config.get('iOSPushSettings.iosApnCertificateForCustomer'),
        certData: null,
        key: configPath+"/"+config.get('iOSPushSettings.iosApnCertificateForCustomer'),
        keyData: null,
        passphrase: 'click',
        ca: null,
        pfx: null,
        pfxData: null,
        gateway: config.get('iOSPushSettings.gateway'),
        port: 2195,
        rejectUnauthorized: true,
        enhanced: true,
        cacheLength: 100,
        autoAdjustCache: true,
        connectionTimeout: 0,
        ssl: true
    };


    var deviceToken ;


    if (typeof iosDeviceToken == "object") {

         console.log("bulkbulkbulkbulkbulkbulkbulkbulk");
         console.log(iosDeviceToken)
        deviceToken = iosDeviceToken;
    }else {

        deviceToken = new apns.Device(iosDeviceToken);
    }

    var apnsConnection = new apns.Connection(options);
    var note = new apns.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.contentAvailable = true;
    note.sound = snd;
    note.alert = msg;
    note.newsstandAvailable = status;
    note.payload = payload;

    apnsConnection.pushNotification(note, deviceToken);

    // Handle these events to confirm that the notification gets
    // transmitted to the APN server or find error if any
    function log(type) {
        return function() {
            if (debugging_enabled)
                console.log("iOS PUSH NOTIFICATION RESULT: " + type);
        };
    }

    apnsConnection.on('error', log('error'));
    apnsConnection.on('transmitted', log('transmitted'));
    apnsConnection.on('timeout', log('timeout'));
    apnsConnection.on('connected', log('connected'));
    apnsConnection.on('disconnected', log('disconnected'));
    apnsConnection.on('socketError', log('socketError'));
    apnsConnection.on('transmissionError', log('transmissionError'));
    apnsConnection.on('cacheTooSmall', log('cacheTooSmall'));

};
