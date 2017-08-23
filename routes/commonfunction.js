var request = require('request');
var logging = require('./logging');
var constants = require('./constants');
var nodemailer = require("nodemailer");
var fs = require('fs');
var phantom = require('phantom');
var debugging_enabled = true;
var smtpTransport = undefined;
var responses = require("./responses");
/*
 * -----------------------------------------------
 * CHECK EACH ELEMENT OF ARRAY FOR BLANK
 * -----------------------------------------------
 */
var checkBlank = function(arr, req, res)
{
    var arrlength = arr.length;
    for (var i = 0; i < arrlength; i++)
    {
        if (arr[i] === undefined) {
            arr[i] = "";
        } else {
            arr[i] = arr[i];
        }
        arr[i] = arr[i].trim();
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
exports.generateAndSavePdf=function(htmlData,HtmlFilePath,FilePath, callback) {
    fs.writeFile(HtmlFilePath, htmlData, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            var options = { 'web-security': 'no' };
            phantom.create({parameters: options},function (ph) {
                ph.createPage(function (page) {
                    page.set('viewportSize', {width: 1440, height: 2036});
                    page.open(HtmlFilePath, function (status) {
                        page.render(FilePath, function () {
                            ph.exit();
                            return callback(2);
                        });
                    });
                });
            });
        }
    });
};

/*
 * -----------------------------------------------
 * Send Email With Attachment
 * -----------------------------------------------
 */
exports.sendEmailWithAttachment = function (Files,Subject,Message,SendTo, callback) {
    var nodemailer = require("nodemailer");
    var smtpTransport = require('nodemailer-smtp-transport');
    var transporter = nodemailer.createTransport(smtpTransport({
        host: "smtp.mandrillapp.com", // hostname
        //secureConnection: true, // use SSL
        port: 587, // port for secure SMTP
        auth: {
            user: config.get('emailCredentials.senderEmail'),
            pass: config.get('emailCredentials.senderPassword')
        }
    }));
    var mailOptions = {
        from: config.get('emailCredentials.senderEmail'), // sender address
        to:SendTo,//IggboLabInvoiceEmailList,
        subject: Subject, // Subject line
        html: Message, //Message
        attachments: Files //Attached Files
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return callback(0);
        } else {
            console.log(info);
            return callback(1);
        }
        // if you don't want to use this transport object anymore, uncomment following line
        //smtpTransport.close(); // shut down the connection pool, no more messages
    });
};
/*
 * -----------------------------------------------
 * AUTHENTICATE ADMIN ACCESS TOKEN
 * -----------------------------------------------
 */
exports.authenticateAdminAccessToken = function(userAccessToken, callback)
{
    var sql = "SELECT `admin_id`, `country`, `currency_code`,`type` FROM `tb_admin` WHERE `access_token`=? LIMIT 1";
    connection.query(sql, [userAccessToken], function(err, result) {

        console.log(err)
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};

/*
 * -----------------------------------------------
 * AUTHENTICATE CORP ADMIN ACCESS TOKEN
 * -----------------------------------------------
 */
exports.authenticateCorpAdminAccessToken = function(userAccessToken, callback)
{
    var sql = "SELECT user_id FROM `tb_corporate_admin` Where access_token = ? LIMIT 1";
    connection.query(sql, [userAccessToken], function(err, result) {

        console.log(err)
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};

/*
 * -----------------------------------------------
 * CORPORATE AUTHENTICATE ADMIN ACCESS TOKEN
 * -----------------------------------------------
 */
exports.authenticateCorporateAdminAccessToken = function(userAccessToken, callback)
{
    var sql = "SELECT * FROM `tb_corporate_admin` WHERE `access_token`=? LIMIT 1";
    connection.query(sql, [userAccessToken], function(err, result) {
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};
/*
 * -----------------------------------------------
 * AUTHENTICATE ADMIN USING EMAIL
 * -----------------------------------------------
 */
//exports.authenticateAdminUsingEMAIL = function(email, callback)
//{
//    var sql = "SELECT `admin_id`,`email`,`verification_token` FROM `tb_admin` WHERE `email`=? LIMIT 1";
//    connection.query(sql, [email], function(err, result) {
//        if (result.length > 0) {
//            return callback(result);
//        } else {
//            return callback(0);
//        }
//    });
//};

/*
 * -----------------------------------------------
 * AUTHENTICATE CORPORATE ADMIN USING EMAIL
 * -----------------------------------------------
 */
exports.authenticateCorporateAdminUsingEMAIL = function(email, callback)
{
    var sql = "SELECT * FROM `tb_corporate_admin` WHERE `email`=? and isblock = 0 and isdelete = 0 LIMIT 1";
    connection.query(sql, [email], function(err, result) {
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};

/*
 * -----------------------------------------------
 * AUTHENTICATE ADMIN USING EMAIL
 * -----------------------------------------------
 */
exports.authenticateAdminUsingEMAIL = function(email, callback)
{
    var sql = "SELECT `admin_id`,`email`,`verification_token` FROM `tb_admin` WHERE `email`=? LIMIT 1";
    connection.query(sql, [email], function(err, result) {
        console.log("authenticateAdminUsingEMAIL authenticateAdminUsingEMAIL");
        console.log(sql + " " + err +" " + email +" "+result);
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};


exports.authenticateDriverUserUsingEmail = function(email, callback)
{
    var sql = "SELECT `user_id`, `is_blocked`, `user_email`, `user_name`, `user_image`,`phone_no`,`date_registered`,"+
        " `current_location_latitude`, `current_location_longitude`, " +
        "`current_user_status`, `reg_as`, " +
        "`app_versioncode`, `device_type` " +
        "FROM `tb_users` WHERE `user_email`=? AND `reg_as` = 1 LIMIT 1";
    connection.query(sql, [email], function(err, result) {
        console.log(err)
        //logging.logDatabaseQuery("Authenticating user.", err, result, null);
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};


/*
 * -----------------------------------------------------------------------------
 * Uploading image to s3 bucket
 * INPUT : file parameter
 * OUTPUT : image path
 * -----------------------------------------------------------------------------
 */
exports.uploadImageToS3Bucket = function(file, folder, callback) {
    console.log("s3 1");

    if(typeof file === 'undefined'){
        console.log("FILE IS UNDEFINED!");
        return callback(-1);
    }
    console.log("FILE IS DEFINED");


    var fs = require('node-fs');
    var AWS = require('aws-sdk');

    console.log("s3 2");
    var filename = file.name; // actual filename of file
    var path = file.path; //will be put into a temp directory
    var mimeType = file.type;

    var accessKeyId = config.get('s3BucketCredentials.accessKeyId');
    var secretAccessKeyId = config.get('s3BucketCredentials.secretAccessKey');
    var bucketName = config.get('s3BucketCredentials.bucket');

    console.log("s3 3");

    fs.readFile(path, function(error, file_buffer) {
        if (error)
        {
            return callback(0);
        }

        filename = file.name;
        AWS.config.update({accessKeyId: accessKeyId, secretAccessKey: secretAccessKeyId, region: 'us-east-1' });
        var s3bucket = new AWS.S3();
        var params = {Bucket: bucketName, Key: folder + '/' + filename, Body: file_buffer, ACL: 'public-read', ContentType: mimeType};
        console.log("s3 4");
        s3bucket.putObject(params, function(err, data) {
            if (err)
            {
                console.log("s3 5");
                console.log(err);
                return callback(0);
            }
            else{
                console.log("s3 6");
                return callback(filename);
            }
        });
    });
};


exports.timeDifferenceInDays = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/86400000);
};


exports.generateRandomString = function()
{
    var text = "";
    var possible = "123456789";

    for (var i = 0; i < 4; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};


exports.convertTimeIntoLocal = function(date, timezone) {

    if (timezone==undefined || date == '0000-00-00 00:00:00'){
        return "N/A";
    }
    else{
        var newDate = new Date(date);

        var millies = timezone*60*1000;
        if (timezone < 0) {
            newDate.setTime(newDate.getTime()-millies)
        } else  {
            newDate.setTime(newDate.getTime()+millies)
        }

        var date = newDate.getDate();
        var month = newDate.getMonth()+1;
        var year = newDate.getFullYear();
        var sec = newDate.getSeconds();
        var hours = newDate.getHours();
        var mins = newDate.getMinutes();

        var datestring = date + "/" + month + "/" + year + " " + hours + ":" + mins+ ":" + sec;
        return datestring;
    }
};

function removeInvalidIds(allIds){
    // done to handle the case where array is passed after stringifying
    allIds = allIds.toString();
    allIds = allIds.split(',');

    var i = 0;
    var isInvalid = false;
    var regularExp = /@facebook.com/i;
    var index = allIds.length;
    while(index--){
        allIds[index] = allIds[index].trim();
        isInvalid = regularExp.test(allIds[index]);
        if(isInvalid === true){
            allIds.splice(index, 1);
        }
    }
    return allIds;
}

exports.sendPlainTextEmail = function(to, cc, bcc, subject, message, callback){

    var nodemailer = require("nodemailer");
    if(smtpTransport === undefined){
        smtpTransport = nodemailer.createTransport({
            service: config.get('emailCredentials.service'),
            auth: {
                user: config.get('emailCredentials.senderEmail'),
                pass: config.get('emailCredentials.senderPassword')
            }
        });
    }

    if(to){
        to = removeInvalidIds(to);
    }
    if(cc){
        cc = removeInvalidIds(cc);
    }
    if(bcc){
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

    if(cc){
        mailOptions.cc = cc;
    }
    if(bcc){
        mailOptions.bcc = bcc;
    }

    // send mail with defined transport object
    if(to.length > 0 || cc.length > 0 || bcc.length > 0) {
        smtpTransport.sendMail(mailOptions, function (error, response) {
            console.log("Sending Mail Error: " + JSON.stringify(error));
            console.log("Sending Mail Response: " + JSON.stringify(response));
            return process.nextTick(callback.bind(null, error, response));
        });
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
};


exports.sendHtmlEmail = function(to, cc, bcc, subject, htmlContent, callback){
    if(smtpTransport === undefined){
        smtpTransport = nodemailer.createTransport({
            service: config.get('emailCredentials.service'),
            auth: {
                user: config.get('emailCredentials.senderEmail'),
                pass: config.get('emailCredentials.senderPassword')
            }
        });
    }

    if(to){
        to = removeInvalidIds(to);
    }
    if(cc){
        cc = removeInvalidIds(cc);
    }
    if(bcc){
        bcc = removeInvalidIds(bcc);
    }

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from    : config.get('emailCredentials.From'),
        to      : to,
        subject : subject,
        html    : htmlContent
    };

    if(cc){
        mailOptions.cc = cc;
    }
    if(bcc){
        mailOptions.bcc = bcc;
    }

    // send mail with defined transport object
    if(to.length > 0 || cc.length > 0 || bcc.length > 0) {
        smtpTransport.sendMail(mailOptions, function (error, response) {
            console.log("Sending Mail Error: " + JSON.stringify(error));
            console.log("Sending Mail Response: " + JSON.stringify(response));
            return process.nextTick(callback.bind(null, error, response));
        });
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
};


exports.sendEmailForPassword = function(receiverMailId, message, subject, callback) {
    if(smtpTransport === undefined){
        smtpTransport = nodemailer.createTransport({
            service: config.get('emailCredentials.service'),
            debug: true,
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
    if(receiverMailId.length > 0) {
        smtpTransport.sendMail(mailOptions, function (error, response) {
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

exports.sendHtmlContent = function(receiverMailId, html, subject, callback) {
    console.log(receiverMailId + html+ subject);
    if(smtpTransport === undefined){
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
    if(receiverMailId.length > 0) {

        smtpTransport.sendMail(mailOptions, function (error, response) {
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


exports.sendHtmlContent_UseBCC = function(receiverMailId, html, subject, callback) {
    if(smtpTransport === undefined){
        smtpTransport = nodemailer.createTransport({
            service: config.get('emailCredentials.service'),
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
    if(receiverMailId.length > 0){
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



exports.sendMessage = function(contact_number, message){
    var accountSid = config.get('twillioCredentials.accountSid');
    var authToken = config.get('twillioCredentials.authToken');

    var client = require('twilio')(accountSid, authToken);
    client.messages.create({
        to: contact_number, // Any number Twilio can deliver to
        from: config.get('twillioCredentials.fromNumber'),
        body: message// body of the SMS message
    }, function(err, response) {
        if(err){
            console.log("Sms service: Error: " + err );
            console.log("Sms service: Response: " + response );
        }
    });
};


exports.encrypt = function(text) {
    var crypto = require('crypto');
    var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};


exports.authenticateUser = function(userAccessToken, callback)
{
    var sql = "SELECT * FROM `user` WHERE `access_token`=? LIMIT 1";
    connection.query(sql, [userAccessToken], function(err, result) {
        // console.log(err)
        if (result.length > 0) {
            return callback(result);
        } else {
            return callback(0);
        }
    });
};


exports.getUserInformation = function(userId, callback){
    var getInformation =
        'SELECT `user_id`, `user_name`, `phone_no`, `user_email`, `is_blocked` ' +
        'FROM `tb_users` ' +
        'WHERE `user_id` = ?';
    connection.query(getInformation, [userId], function(err, user){
        if(err){
            return process.nextTick(callback.bind(null, err, user));
        }

        if(user.length == 0){
            return process.nextTick(callback.bind(null, err, null));
        }

        return process.nextTick(callback.bind(null, err, user[0]));
    });
};


exports.calculateDistance=function(lat1, long1, lat2, long2)
{
    var dist = require('geo-distance-js');
    var from = {lat: lat1, lng: long1};
    var to = [{lat: lat2, lng: long2}];

    var result = dist.getDistance(from, to, 'asc', 'metres', 2);
    return result[0].distance;
};

exports.sortByKeyAsc = function(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
};
function sortAsc(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}


// Format the raw address obtained using google API
exports.formatLocationAddress = function(raw_address)
{
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


// Get the address of the location using the location's latitude and longitude
exports.getLocationAddress = function(latitude, longitude, callback)
{
    request('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude, function (error, response, body)
    {
        var pickup_address = 'Unnamed';
        if (!error && response.statusCode == 200)
        {
            body = JSON.parse(body);
            if (body.results.length > 0)
            {
                var raw_address = body.results[0].formatted_address;
                pickup_address = module.exports.formatLocationAddress(raw_address);
            }
        }
        callback(pickup_address);
    });
};


//sendIosPushNotificationToDriver

exports.sendIosPushNotificationToDriver = function(iosDeviceToken, message, flag, payload)
{
    console.log("===================================================")
    console.log("To driver")
    console.log("iosDeviceToken")
    console.log(iosDeviceToken)

    console.log(config.get('iOSPushSettings.iosApnCertificateForDriver'))
    console.log(config.get('iOSPushSettings.gateway'))

    if(payload.address){
        payload.address='';
    }
    console.log(iosDeviceToken)
    console.log(message)
    console.log(flag)
    console.log("payload")
    console.log(payload)
    var status = 1;
    var msg = message;
    var snd = 'ping.aiff';
    if (flag == 4 || flag == 6)
    {
        status = 0;
        msg = '';
        snd = '';
    }

    var apns = require('apn');
    var deviceToken = new apns.Device(iosDeviceToken);

    // for development

    var options = {
        cert        : config.get('iOSPushSettings.iosApnCertificateForDriver'),
        certData    : null,
        key         : config.get('iOSPushSettings.iosApnCertificateForDriver'),
        keyData     : null,
        passphrase  : 'click',
        ca          : null,
        pfx         : null,
        pfxData     : null,
        gateway     : config.get('iOSPushSettings.gateway'),
        port        : 2195,
        rejectUnauthorized: true,
        enhanced    : true,
        cacheLength : 100,
        autoAdjustCache: true,
        connectionTimeout: 0,
        ssl         : true
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
            if(debugging_enabled)
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


// Send the notification to the iOS device for customer
exports.sendIosPushNotification = function(iosDeviceToken, message, flag, payload)
{
    console.log("To customer")
    console.log("payload")
    console.log(payload)

    console.log(config.get('iOSPushSettings.iosApnCertificateForCustomer'))
    console.log(config.get('iOSPushSettings.gateway'))

    if(payload.address){
        payload.address='';
    }
    var status = 1;
    var msg = message;
    var snd = 'ping.aiff';
    if (flag == 4 || flag == 6)
    {
        status = 0;
        msg = '';
        snd = '';
    }

    var apns = require('apn');

    var options = {
        cert        : config.get('iOSPushSettings.iosApnCertificateForCustomer'),
        certData    : null,
        key         : config.get('iOSPushSettings.iosApnCertificateForCustomer'),
        keyData     : null,
        passphrase  : 'click',
        ca          : null,
        pfx         : null,
        pfxData     : null,
        gateway     : config.get('iOSPushSettings.gateway'),
        port        : 2195,
        rejectUnauthorized: true,
        enhanced    : true,
        cacheLength : 100,
        autoAdjustCache: true,
        connectionTimeout: 0,
        ssl         : true
    };


    var deviceToken = new apns.Device(iosDeviceToken);
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
            if(debugging_enabled)
                console.log("iOS PUSH NOTIFICATION RESULT: " + type);
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


// Send the notification to the android device
exports.sendAndroidPushNotification = function(deviceToken, message)
{

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

    sender.send(message, registrationIds, 4, function(err, result) {
        if(debugging_enabled) {
            console.log("ANDROID NOTIFICATION RESULT: " + JSON.stringify(result));
            console.log("ANDROID NOTIFICATION ERROR: " + JSON.stringify(err));
        }
    });
};


// Send notification to the user with the given user ID
// ASSUMPTION: The payload is same for both the devices
exports.sendNotification = function(user_id, message, flag, payload)
{
    console.log("SENDING NOTIFICATION: " + message + " TO: " + user_id);
    var get_user_device_info = "SELECT `user_id`,`current_user_status`,`device_type`,`user_device_token` FROM `tb_users` WHERE `user_id`=?";
    connection.query(get_user_device_info, [user_id], function (err, result_user)
    {
        //logging.logDatabaseQueryError("Get device information for the driver", err, result_user, null);
        module.exports.sendNotificationToDevice(result_user[0].device_type, result_user[0].user_device_token, message, flag, payload,result_user[0].current_user_status);
    });
};

exports.sendNotificationToDevice = function(deviceType, userDeviceToken, message, flag, payload,current_user_status)
{
    // The user device token can be empty in case of scheduled pickups, hence, the check
    if (deviceType == constants.deviceType.ANDROID && userDeviceToken != '')
    {
        module.exports.sendAndroidPushNotification(userDeviceToken, payload);
    }
    else if (deviceType == constants.deviceType.iOS && userDeviceToken != '')
    {
        if(current_user_status == 1){       // 1- driver
            module.exports.sendIosPushNotificationToDriver(userDeviceToken, message, flag, payload);
        }
        else if(current_user_status == 2){                               // 2-customer
            module.exports.sendIosPushNotification(userDeviceToken, message, flag, payload);
        }
    }
};

exports.engagementStatusToString = function(status){
    var result_string = "";

    switch (status){
        case constants.engagementStatus.REQUESTED :
            result_string = "request has been sent";
            break;
        case constants.engagementStatus.ACCEPTED :
            result_string = "request has been accepted by the driver";
            break;
        case constants.engagementStatus.STARTED :
            result_string = "ride has started";
            break;
        case constants.engagementStatus.ENDED :
            result_string = "ride has ended";
            break;
        case constants.engagementStatus.REJECTED_BY_DRIVER :
            result_string = "request rejected by driver";
            break;
        case constants.engagementStatus.CANCELLED_BY_CUSTOMER :
            result_string = "request cancelled by customer";
            break;
        case constants.engagementStatus.TIMEOUT :
            result_string = "request timed out";
            break;
        case constants.engagementStatus.ACCEPTED_BY_OTHER_DRIVER :
            result_string = "request was accepted by another driver";
            break;
        case constants.engagementStatus.ACCEPTED_THEN_REJECTED :
            result_string = "request was accepted and then rejected";
            break;
        case constants.engagementStatus.CLOSED :
            result_string = "request was closed when the driver accepted other request";
            break;
        case constants.engagementStatus.CANCELLED_ACCEPTED_REQUEST :
            result_string = "request was cancelled by the customer after it was accepted by a driver";
            break;
    }
    return result_string;
};


exports.registrationStatusToString = function(status){
    var result_string = "";

    switch (status){
        case constants.userRegistrationStatus.CUSTOMER :
            result_string = "Customer";
            break;
        case constants.userRegistrationStatus.DRIVER :
            result_string = "Ad-hoc driver";
            break;
        case constants.userRegistrationStatus.DEDICATED_DRIVER :
            result_string = "Dedicated driver";
            break;
    }
    return result_string;
};


exports.driverStatusToString = function(status){
    var result_string = "";

    switch (status){
        case constants.userFreeStatus.FREE :
            result_string = "Free";
            break;
        case constants.userFreeStatus.BUSY :
            result_string = "Busy";
            break;
    }
    return result_string;
};


exports.jugnooStatusToString = function(availability){
    var result_string = "";

    switch (availability){
        case 0 :
            result_string = config.get('projectName')+"OFF";
            break;
        case 1 :
            result_string = config.get('projectName')+" ON";
            break;
    }
    return result_string;
};


function isCodeAlreadyUsed(referral_code, callback){
    var get_code = "SELECT `user_id` FROM `tb_users` WHERE `referral_code` = ?";
    connection.query(get_code, [referral_code], function(err, users){
        //logging.logDatabaseQueryError("Checking for duplicacy", err, users);
        if(users.length > 0){
            callback(true);
        }
        else{
            callback(false);
        }
    });
};

exports.generateUniqueReferralCode = function(user_name, callback){
    var max_code = 999;
    var min_code = 100;
    var referral_code = user_name.split(' ')[0].toUpperCase() + Math.floor(Math.random() * (max_code - min_code + 1) + min_code).toString();

    isCodeAlreadyUsed(referral_code, function(isUsed){
        if(isUsed === true){
            module.exports.generateUniqueReferralCode(user_name, callback);
        }
        else{
            callback(referral_code);
        }
    });
};


exports.generateUniqueCode = function (callback){
    var validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var code = config.get('startPromoCodeWith');
    var i = 0;
    for(i = 0; i < 6; i++){
        code += validChars[Math.round(Math.random() * (36 - 1))];
    }
    var check_existing = "SELECT * FROM `tb_promotions` WHERE `promotion_code`=?";
    connection.query(check_existing, [code], function(err, result){
        if(err){
            logging.logDatabaseQueryError("Getting any existing promotional code", err, result);
            callback(err);
        }
        if(result.length > 0){
            generateUniqueCode(callback);
        }
        else{
            callback(err, code);
        }
    });
};


exports.timeDifferenceInDays = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/86400000);
};

exports.timeDifferenceInHours = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/3600000);
};

exports.timeDifferenceInMinutes = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/60000);
};

exports.timeDifferenceInSeconds = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/1000);
};

exports.changeTimezoneFromIstToUtc = function(date){
    var temp = new Date(date);
    return new Date(temp.getTime() - (3600000 * -4.5)).toISOString();
};

exports.changeTimezoneFromUtcToIst = function(date){
    var temp = new Date(date);
    return new Date(temp.getTime() + (3600000 * -4.5)).toISOString();
};

exports.getMysqlStyleDateString = function(jsDate){
    var year = jsDate.getFullYear().toString();
    var month = (jsDate.getMonth() + 1).toString();
    month = month.length == 1 ? '0' + month : month;
    var date = jsDate.getDate().toString();
    date = date.length == 1 ? '0' + date : date;
    return year + '-' + month + '-' + date;
}


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
        if (error)
        {
            return callback(0);
        }
        else
        {
            AWS.config.update({accessKeyId: config.get('s3BucketCredentials.accessKeyId'), secretAccessKey: config.get('s3BucketCredentials.secretAccessKey'), region: 'us-east-1'});
            var s3bucket = new AWS.S3();
            var params = {Bucket: config.get('s3BucketCredentials.bucket'), Key: folder + '/' + filename, Body: file_buffer, ACL: 'public-read', ContentType: mimeType};

            s3bucket.putObject(params, function(err, data) {
                logging.logDatabaseQueryError("Uploading image...........................", err, data, null);
                if (err)
                {
                    return callback(0);
                }
                else{
                    return callback(filename);
                }
            });
        }
    });
};


exports.generateSplitFareKey = generateSplitFareKey;


function generateSplitFareKey(callback){

    var validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var split_fare_key = "";
    var i = 0;
    for(i = 0; i < 6; i++){
        split_fare_key += validChars[Math.round(Math.random() * (36 - 1))];
    }
    var check_existing = "SELECT `split_fare_key` FROM `tb_engagements` WHERE `split_fare_key`=? LIMIT 1";
    connection.query(check_existing, [split_fare_key], function(err, result){
        if(err){
            logging.logDatabaseQueryError("Getting any existing split fare key", err, result);
            callback(err);
        }
        if(result.length > 0){
            generateSplitFareKey(callback);
        }
        else{
            callback(err, split_fare_key);
        }
    });
}


// exports.convertTimeIntoLocal = function(date, timezone) {

//     if (timezone==undefined || date == '0000-00-00 00:00:00'){
//         return "N/A";
//     }
//     else{
//     var newDate = new Date(date);
//     timezone = timezone + "";
//     var operator = timezone[0];
//     var hour = 0;
//     var min = 0;
//     if (timezone[3] == ":" || timezone[3] == ".") {
//         hour = timezone[1] + "" + timezone[2];
//         min = timezone[4] + "" + timezone[5];
//     } else {
//         hour = timezone[1];
//         min = timezone[3] + "" + timezone[4];
//     }
//     hour = parseInt(hour);
//     min = parseInt(min);
//     var millies = (hour * 60 * 60 * 1000) + (min * 60 * 1000);
//     if (operator == "$$$") {
//         newDate.setTime(newDate.getTime()-millies)
//     } else   if (operator == "-") {
//         newDate.setTime(newDate.getTime()+millies)
//     }

//         var date = newDate.getDate();
//         var month = newDate.getMonth()+1;
//         var year = newDate.getFullYear();
//         var sec = newDate.getSeconds();
//         var hours = newDate.getHours();
//         var mins = newDate.getMinutes();

//         var datestring = date + "/" + month + "/" + year + " " + hours + ":" + mins+ ":" + sec;
//     return datestring;
//     }
// }

/* Email Formatting */
exports.emailFormatting_block = function(senderID, message1, andriodAppLinkPath, iOSAppLinkPath,forgotlink, callback){
    var  msg ='<div style="width:700px !important;margin:auto;color:#424242;font-size:17px;background-color:whitesmoke;border: 1px solid #a1a1a1;padding: 10px 10px;border-radius: 4px;">'
    msg+='<p style="text-decoration:none;margin-top:35px"> Hi <b>' + senderID + ',</b></p>';
    msg +='<div><p style="text-decoration:none;margin-top:25px"> '+message1+' </p></div>';
    if(forgotlink!=''){
        msg +='<div><p style="text-decoration:none;margin-top:25px"></p></div>';}
    if(forgotlink!=''){
        msg +='<div><p style="text-decoration:none;margin-top:25px"></p></div>';
        msg +='<hr>';
        msg +='<div><p style="text-decoration:none;margin-top:25px"> </p></div>';}
    msg +='<hr>';
    msg +='<table align="center"><tbody>';
    msg +='<tr>';
    msg +='<td>';
    msg +='<a href="'+andriodAppLinkPath+'"><img style="width: 132px;height: 39px;" src="http://cabit.clicklabs.in/appstore.png"/></a>';
    msg +='</td>';
    msg +='<td>';
    msg +='<a href="'+iOSAppLinkPath+'"><img style="width: 132px;height: 43px;"  src="http://cabit.clicklabs.in/googleplay.jpeg"/></a>';
    msg +='</td>';
    msg +='</tr>';
    msg +='</tbody></table>';
    msg += config.get('emailCredentials.signature');
    msg +='</div></div>';
    return callback(msg);
}

/* Email Formatting */
exports.emailFormatting = function(senderID, message1, andriodAppLinkPath, iOSAppLinkPath,forgotlink, callback){
    var  msg ='<div style="width:700px !important;margin:auto;color:#424242;font-size:17px;background-color:whitesmoke;border: 1px solid #a1a1a1;padding: 10px 10px;border-radius: 4px;">'
    msg+='<p style="text-decoration:none;margin-top:35px"> Hi <b>' + senderID + ',</b></p>';
    msg +='<div><p style="text-decoration:none;margin-top:25px"> '+message1+' </p></div>';
    if(forgotlink!=''){
    msg +='<div><p style="text-decoration:none;margin-top:25px">Forgot your password, huh? No big deal.<br>To create a new password, just follow this link:</p></div>';}
    if(forgotlink!=''){
    msg +='<div><p style="text-decoration:none;margin-top:25px"> <a href=' + forgotlink + '>Click here to reset your password.</a></p></div>';
    msg +='<hr>';
    msg +='<div><p style="text-decoration:none;margin-top:25px"> You received this email, because it was requested by a '+config.get("projectName")+' admin. This is part of the procedure to create a new password on the system. If you DID NOT request a new password then please ignore this email and your password will remain the same.</p></div>';}
    msg +='<hr>';
    msg +='<table align="center"><tbody>';
    msg +='<tr>';
    msg +='<td>';
    msg +='<a href="'+andriodAppLinkPath+'"><img style="width: 132px;height: 39px;" src="http://cabit.clicklabs.in/appstore.png"/></a>';
    msg +='</td>';
    msg +='<td>';
    msg +='<a href="'+iOSAppLinkPath+'"><img style="width: 132px;height: 43px;"  src="http://cabit.clicklabs.in/googleplay.jpeg"/></a>';
    msg +='</td>';
    msg +='</tr>';
    msg +='</tbody></table>';
    msg += config.get('emailCredentials.signature');
    msg +='</div></div>';
    return callback(msg);
}
