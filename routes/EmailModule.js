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
var Mandrill = {
    "host" : config.get('nodeMailer.Mandrill.mandrill_host'),
    "port" : config.get('nodeMailer.Mandrill.mandrill_port'),
    "auth" : {
        "user":config.get('nodeMailer.Mandrill.mandrill_auth.mandrill_user'),
        "pass":config.get('nodeMailer.Mandrill.mandrill_auth.mandrill_pass')

    }
}
var SendGrid = {
    "host" : config.get('nodeMailer.SendGrid.SendGrid_host'),
    //"port" : config.get('nodeMailer.SendGrid.SendGrid_port'),
    "auth" : {
        "user":config.get('nodeMailer.SendGrid.SendGrid_auth.SendGrid_user'),
        "pass":config.get('nodeMailer.SendGrid.SendGrid_auth.SendGrid_pass')

    }
}

var transporter = nodeMailerModule.createTransport(smtpTransport(SendGrid));


/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ Default Response Object, Can be configured as required
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

var errorResponseObject = {
    status: 500,
    message: 'Something Went Wrong'
};
var successResponseObject = {
    status: 200,
    message: 'Success'
};


/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ sendEmail Function which is exported to be called from anywhere in the application
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

function sendEmailViaTemplate(templateName, receiverDetails, variableDetails, externalCB) {
    /*
     Steps To Follow:
     1) Get Email Template From Database.
     2) Render HTMl Message and Email Subject with the help of variableInfo
     3) Build the mailOptions Variable With Above informations
     4) Finally call the sendMailViaTransporter function
     */

    var templateName = templateName || null; //Example : 'PB_SIGN_UP_TEMPLATE'
    var variableDetails = variableDetails || {}; //Example : 'PB_NAME: Shahab', 'PB_EMAIL:shahab@clicklabs.co'

    var mailOptions = {
        from: null,
        to: null,
        subject: null,
        html: null
    };

    if(typeof receiverDetails.attachments !== 'undefined')
    {
        mailOptions.attachments = receiverDetails.attachments;
    }

    if (receiverDetails.name) {
        mailOptions.to = receiverDetails.name + ' <' + receiverDetails.email + '>';
    } else {
        mailOptions.to = receiverDetails.email;
    }

    async.series([
        function(internalCallback) {
            getEmailTemplateDataFromSQL(templateName, function(err, templateData, headerFooter) {
                console.log('email template', err, templateData);

                mailOptions.from = templateData.email_from; // Example: Iggbo Team <support@iggbo.com>
                mailOptions.subject = renderMessageFromTemplateAndVariables(templateData.email_template_subject, variableDetails); // Example: Welcome To Iggbo
                mailOptions.html = renderMessageFromTemplateAndVariables(templateData.email_template_html, variableDetails); // Example: Please click on email confirmation link

                var innerHtml = mailOptions.html;

                var finalHtml = headerFooter.email_template_html.replace("{{HTML_CONTENT}}", innerHtml);
                finalHtml = finalHtml.replace("{{PROJECT_NAME}}",config.get('projectName'));

                if (variableDetails.isAttachHeaderFooter != 0) {

                    var tempVars = {

                        SUBJECT: mailOptions.subject,


                    };


                    mailOptions.html = renderMessageFromTemplateAndVariables(finalHtml, tempVars);
                }
                internalCallback(err, null);
            });
        },
        function(internalCallback) {
            sendMailViaTransporter(mailOptions, function(err, res) {
                internalCallback(err, res);
            })
        }
    ], function(err, responses) {
        if (err) {
            externalCB(errorResponseObject);
        } else {
            externalCB(null, successResponseObject);
        }
    });
}

/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ getEmailTemplateDataFromSQL Function
 @ This function will fetch the email template details
 @ Requires following parameters
 @ templateName // example : 'PB_Registration_Email'
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
function getEmailTemplateDataFromSQL(templateName, cb) {
    var sql = "SELECT `email_from`, `email_template_subject`, `email_template_html` , email_template_name FROM `tb_email_templates` WHERE `email_template_name`=? or email_template_name = 'HEADER_FOOTER' LIMIT 2";
    connection.query(sql, [templateName], function(err, emailTemplateData) {


        var emailTemplate = "";
        var HeaderFooter = "";
        emailTemplateData.forEach(function(template) {

            if (template.email_template_name == 'HEADER_FOOTER') {
                HeaderFooter = template;
            } else {
                emailTemplate = template;
            }

        });

        cb(err, emailTemplate, HeaderFooter);
    });
}

/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ sendMailViaTransporter Function
 @ This function will initiate sending email as per the mailOptions are set
 @ Requires following parameters in mailOptions
 @ from:  // sender address
 @ to:  // list of receivers
 @ subject:  // Subject line
 @ html: html body
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
function sendMailViaTransporter(mailOptions, cb) {

    console.log(JSON.stringify(mailOptions));
    transporter.sendMail(mailOptions, function(error, info) {
        console.log('Mail Sent Callback Error:', error);
        console.log('Mail Sent Callback Ifo:', info);
    });
    cb(null, null) // Callback is outside as mail sending confirmation can get delayed by a lot of time
}

/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 @ renderMessageFromTemplateAndVariables Helper Function
 @ This function will compile the email template stored in the DB with the data provided and return the output.
 @ Requires following parameters in mailOptions
 @ templateData:  // template data or text to render which will be having variables
 @ variablesData:  // variables values in key-value pair which will replace the variables in templateData
 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
function renderMessageFromTemplateAndVariables(templateData, variablesData) {
    return Handlebars.compile(templateData)(variablesData);
}

module.exports = {
    sendEmailViaTemplate: sendEmailViaTemplate
};
