/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ Dependencies
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
var nodeMailerModule = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var Handlebars = require('handlebars');
var async = require('async');

/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ Configurations
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
var SendGrid = {
    "host" : config.get('nodeMailer.host'),
    "port" : config.get('nodeMailer.port'),
    "secure": false,
    "auth" : {
        "user":config.get('nodeMailer.senderEmail'),
        "pass":config.get('nodeMailer.senderPassword')

    }
}

var transporter = nodeMailerModule.createTransport(SendGrid);

exports.sendResetPasswordLink = function(user_email, token) {

    var link = config.get('forgotpasswordUrl');
    link += "?token=" + token + "&email=" + user_email + "&type=0";

    var mailOptions = {
        from: config.get('nodeMailer.From'),
        to: user_email,
        subject: "Reset Password",
        html: '<!DOCTYPE html>\
            <html>\
            <head lang="en">\
                <meta charset="UTF-8">\
                <title></title>\
            </head>\
            <body>\
            <table style="margin:auto;width:600px!important;color:#4C4949;border: 1px solid #bbb;" cellspacing="0">\
                <tr>\
                    <td style="text-align:center">\
                      <img src ="http://52.30.101.158:3002/img/logo.png" width="auto" height="150px" style="width: 80px;height: 80px;padding: 30px;">\
                    </td>\
                </tr>\
                <tr style="background-color:#2c3e50">\
                    <td style="padding:20px;width:100%;">\
                        <h4 style="width:100%; text-align:center; border-bottom: 2px solid #fff; line-height:0.25em;   margin: -1px 0 10px; ">\
                            <span style="padding:0 2px;background-color: #2c3e50 ;color:#fff;font-size: 25px;"> OTLBNI </span></h4>\
                    </td>\
                </tr>\
                </tr>\
                <tr>\
                    <td style="padding:30px;font-size:18px;">\
                        <p>Please click on the below link to reset your password</p>\
                        <a href="'+link+'" type="button" style="-webkit-box-shadow: none;box-shadow: none;outline: 0;position: relative;text-decoration: none;text-transform: none;-webkit-transition: all .3s;-o-transition: all .3s;transition: all .3s;background-color: #2c3e50;border-color: #2c3e50;color: #fff;padding: 10px;margin-top: 5px;">RESET PASSWORD</a>\
                    </td>\
                </tr>\
            </table>\
            </body>\
        </html>'
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        }
    });
}


/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ Default Response Object, Can be configured as required
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

