/******** App JS ********/

var environment = require('./routes/environment');
var path = require('path');
console.log( environment.configuration);
process.env.NODE_ENV = environment.configuration;
configPath = path.join(__dirname, 'config');
console.log(configPath);
process.env.NODE_CONFIG_DIR = configPath;

config = require('config');

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var errorhandler = require('errorhandler');
var logger = require('morgan');
var methodOverride = require('method-override');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var md5 = require('MD5');
QueryBuilder = require('datatable');
var csv = require('express-csv');
var multer = require('multer');
var connection_sql = require('./routes/connection');

var user_panel = require('./routes/user_panel');
var places_panel = require('./routes/places');
var order_panel = require('./routes/order');
var notification = require('./routes/notification');

console.log(user_panel);
if (process.env.NODE_ENV != 'localhost') {
    mysqlLib = require('./routes/mysqlLib');
} else {
    mysqlLib = require('./routes/mysqlLocalLib');
}

constants = require('./routes/constants');

var app = express();

var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        // console.log(file);
        callback(null, './uploads/user');
    },
    filename: function(req, file, callback) {
        // console.log(file);
        var fileUniqueName = md5(Date.now());
        callback(null,  fileUniqueName + path.extname(file.originalname));
    }
});

var storageOrder = multer.diskStorage({
    destination: function(req, file, callback) {
        // console.log(file);
        callback(null, './uploads/order');
    },
    filename: function(req, file, callback) {
        // console.log(file);
        var fileUniqueName = md5(Date.now());
        callback(null,  fileUniqueName + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });
var uploadOrder = multer({ storage: storageOrder });

// all environments=
app.use(express.static(path.join(__dirname, 'uploads')));

app.set('port', process.env.PORT || config.get('PORT'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/views/favicon.ico'));
app.use(logger('dev'));
app.use(methodOverride());

// development only
if ('development' == app.get('env')) {
    app.use(errorhandler());
}

app.get('/test', function(req, res) {
    res.render('test');
});

function log(data) {
    console.log("=============*****************" + data + "*****************=============");
    console.log(data);
}

logs = log;

app.use(function(req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    log("Api Hit");

    var time = new Date();
    time.setMilliseconds(time.getMilliseconds() + 5.5 * 60 * 60 * 1000);
    console.log('Time:', time.toString());
    console.log(req.body);
    log("request end");

    next();
});


//.......................USER PANEL API's.............................

app.post('/social_login', user_panel.social_login);
app.post('/insert_mobile_number', user_panel.insert_mobile_number);
app.post('/verify_user', user_panel.verify_user);
app.post('/logout', user_panel.logout);
app.post('/create_account', user_panel.create_account);
app.post('/login', user_panel.login);
app.post('/get_otp_using_mobilenumber', user_panel.get_otp_using_mobilenumber);
app.post('/verify_otp', user_panel.verify_otp);
app.post('/reset_password', user_panel.reset_password);
app.post('/edit_profile', upload.single('profile_url'), user_panel.edit_profile);
app.post('/get_user_details', user_panel.get_user_details);
app.post('/send_notification', user_panel.send_notification);

//.......................PLACES PANEL API's.............................

app.post('/get_near_by_restaurant_list', places_panel.get_near_by_restaurant_list);
app.post('/get_place_details', places_panel.get_place_details);
app.post('/set_checkin_place', places_panel.set_checkin_place);
app.post('/my_checkin_list', places_panel.my_checkin_list);
app.post('/get_search_list', places_panel.get_search_list);

//.......................ORDER PANEL API's.............................

app.post('/create_order', uploadOrder.single('order_image'), order_panel.create_order);
app.post('/pending_order', order_panel.pending_order);
app.post('/my_order', order_panel.my_order);
app.post('/getCreateOrderDetails', order_panel.getCreateOrderDetails);

//.......................NOTIFICATION PANEL API's.............................

app.post('/get_user_notification_list', notification.get_user_notification_list)

// app.post('/my_order', order_panel.my_order);

app.get('/restart', function(req, res) {

    var sys = require('sys');
    var exec = require('child_process').exec;

    restart(puts);
    function puts(error, stdout, stderr) {
        if (error) {
            return res.send(error.toString());
        } else if (stdout) {
            return res.send(stdout.toString());
        } else {
            return res.send(stderr.toString());
        }

        console.log(error);
        console.log(stderr);
        console.log(stdout);
    }
    function restart(callback) {
        exec(" whoami; pm2 restart 12 ; ", callback);
    }

});

http.createServer(app).listen(app.get('port'), function() {
    constants.refreshMessageKeyAndFlag(function(response) {
        console.log(response);
    });
    console.log('Express server listening on port ' + app.get('port'));
});
