/**
 * The node-module to hold the constants for the server
 */

var myContext = this;

function define(obj, name, value) {
    Object.defineProperty(obj, name, {
        value: value,
        enumerable: true,
        writable: false,
        configurable: true
    });
}

var debugging = false;


exports.responseFlags = {};
exports.responseMessages = {};

//RESPONSE MESSAGES AND FLAGS
exports.refreshMessageAPI = function (req, res) {
    myContext.refreshMessageKeyAndFlag(function (results) {
        res.send(JSON.stringify(results));
    });
};
exports.refreshMessageKeyAndFlag = function (callback) {
    localMessagesAndFlag();
    var sql = "SELECT `message_key`,`message`,`message_flag` FROM `tb_admin_panel_messages`";
    connection.query(sql, [], function (err, result) {
        if (err) {
        } else {
            var messageCount = result.length;
            for (var i = 0; i < messageCount; i++) {
                define(exports.responseFlags, [result[i].message_key], result[i].message_flag);
                define(exports.responseMessages, [result[i].message_key], result[i].message);
            }
            var response = {'log': 'Messages refreshed successfully'};
            return callback(response);
        }
    });


}


function localMessagesAndFlag() {
    //FOR MESSAGES
    define(exports.responseMessages, 'PARAMETER_MISSING',                     'Some parameter missing.');
    define(exports.responseMessages, 'INVALID_ACCESS_TOKEN',                  'Invalid access token.');
    define(exports.responseMessages, 'INVALID_MOBILE_NUMBER',                 'Invalid mobile number.');
    define(exports.responseMessages, 'INCORRECT_PASSWORD',                    'Incorrect Password.');
    define(exports.responseMessages, 'ACTION_COMPLETE',                       'Action complete.');
    define(exports.responseMessages, 'LOGIN_SUCCESSFULLY',                    'Logged in successfully.');
    define(exports.responseMessages, 'SHOW_ERROR_MESSAGE',                    'Show error message.');
    define(exports.responseMessages, 'ERROR_IN_EXECUTION',                    'Error in execution.');
    define(exports.responseMessages, 'EXPIRED_TOKEN',                         'This link has been expired.');


    //FOR FLAGS
    define(exports.responseFlags, 'ALREADY_EXIST',                       422);
    define(exports.responseFlags, 'PARAMETER_MISSING',                   422);
    define(exports.responseFlags, 'INVALID_ACCESS_TOKEN',                401);
    define(exports.responseFlags, 'INVALID_MOBILE_NUMBER',               401);
    define(exports.responseFlags, 'WRONG_PASSWORD',                      401);
    define(exports.responseFlags, 'ACTION_COMPLETE',                     200);
    define(exports.responseFlags, 'LOGIN_SUCCESSFULLY',                  200);
    define(exports.responseFlags, 'SHOW_ERROR_MESSAGE',                  201);
    define(exports.responseFlags, 'IMAGE_FILE_MISSING',                  422);
    define(exports.responseFlags, 'ERROR_IN_EXECUTION',                  404);
    define(exports.responseFlags, 'BAD_REQUEST',                         500);
    return 1;
}
