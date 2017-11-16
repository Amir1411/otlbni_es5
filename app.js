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

var admin_panel = require('./routes/admin_panel');
var user_panel = require('./routes/user_panel');
var places_panel = require('./routes/places');
var order_panel = require('./routes/order');
var notification = require('./routes/notification');
var ecommerce_panel = require('./routes/ecommerce/add_category');
var ecommerce_panel_brand = require('./routes/ecommerce/brand');
var ecommerce_panel_product = require('./routes/ecommerce/product');
var user_message = require('./routes/message');

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

var storageAdmin = multer.diskStorage({
    destination: function(req, file, callback) {
        // console.log(file);
        callback(null, './uploads/admin');
    },
    filename: function(req, file, callback) {
        // console.log(file);
        var fileUniqueName = md5(Date.now());
        callback(null,  fileUniqueName + path.extname(file.originalname));
    }
});

var storageAdminBrand = multer.diskStorage({
    destination: function(req, file, callback) {
        // console.log(file);
        callback(null, './uploads/admin/brand');
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

var storageReport = multer.diskStorage({
    destination: function(req, file, callback) {
        // console.log(file);
        callback(null, './uploads/report');
    },
    filename: function(req, file, callback) {
        // console.log(file);
        var fileUniqueName = md5(Date.now());
        callback(null,  fileUniqueName + path.extname(file.originalname));
    }
});

var storageMsg = multer.diskStorage({
    destination: function(req, file, callback) {
        // console.log(file);
        callback(null, './uploads/message');
    },
    filename: function(req, file, callback) {
        // console.log(file);
        var fileUniqueName = md5(Date.now());
        callback(null,  fileUniqueName + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage });
var uploadOrder = multer({ storage: storageOrder });
var uploadAdmin = multer({ storage: storageAdmin });
var uploadAdminBrand = multer({ storage: storageAdminBrand });
var uploadReport = multer({ storage: storageReport });
var uploadMsg = multer({ storage: storageMsg });

// all environments=
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.set('port', process.env.PORT || config.get('PORT'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/views/favicon.ico'));
app.use(logger('dev'));
app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'otlbniAngular')));


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
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    // res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.header("Access-Control-Allow-Headers", "Content-Type, authorization");
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
app.post('/report_user', uploadReport.array('report_images', 5), user_panel.report_user);
app.post('/delivered', user_panel.delivered);
app.post('/user_feedback', user_panel.user_feedback);
app.post('/user_feedback_list', user_panel.user_feedback_list);
app.post('/create_bill', user_panel.create_bill);
app.post('/get_other_user_details', user_panel.get_other_user_details);
app.post('/update_location', user_panel.update_location);
app.post('/notification_on_off', user_panel.notification_on_off);
app.post('/change_mobile_number', user_panel.change_mobile_number);

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
app.post('/my_delivered_order', order_panel.my_delivered_order);
app.post('/cancel_order', order_panel.cancel_order);

app.post('/getNotificationDetails', order_panel.getNotificationDetails);
app.post('/create_offer', order_panel.create_offer);
app.post('/accept_reject_offer', order_panel.accept_reject_offer);
app.post('/get_offer_list', order_panel.get_offer_list);

//.......................NOTIFICATION PANEL API's.............................

app.post('/get_user_notification_list', notification.get_user_notification_list);

// ....................... Send Message API ..........................

app.post('/send_message', uploadMsg.single('image'), user_message.send_message);
app.post('/get_message', user_message.get_message);

// ....................... Admin Panel API ..........................

app.post('/admin_login', admin_panel.login);
app.post('/forgot_password', admin_panel.forgot_password);
app.post('/get_details', admin_panel.get_details);
app.post('/change_password', admin_panel.change_password);
app.post('/update_thumbnail', uploadAdmin.single('image'), admin_panel.update_thumbnail);
app.post('/userlist', admin_panel.userlist);
app.post('/courierlist', admin_panel.courierlist);
app.post('/block_unblock_user', admin_panel.block_unblock_user);
app.post('/getCourierPlaceDetails', admin_panel.getCourierPlaceDetails);
app.post('/update_profile', admin_panel.update_profile);
app.post('/check_verification_token', admin_panel.check_verification_token);
app.post('/getAdminOrder', admin_panel.getAdminOrder);
app.post('/getAllAdminOrder', admin_panel.getAllAdminOrder);
app.post('/dashboard_report', admin_panel.dashboard_report);
app.post('/get_total_user_graph_data', admin_panel.get_total_user_graph_data);
app.post('/send_push_notification_to_user', admin_panel.send_push_notification_to_user);

// ....................... Ecommerce Admin Panel API ..........................

app.post('/add_master_category', ecommerce_panel.add_master_category);
app.post('/update_master_category', ecommerce_panel.update_master_category);
app.post('/get_master_category_details', ecommerce_panel.get_master_category_details);
app.post('/get_master_category_list_details', ecommerce_panel.get_master_category_list_details);
app.post('/active_offline_master_category', ecommerce_panel.active_offline_master_category);

app.post('/add_category', ecommerce_panel.add_category);
app.post('/update_category', ecommerce_panel.update_category);
app.post('/get_category_details', ecommerce_panel.get_category_details);
app.post('/get_category_list_details', ecommerce_panel.get_category_list_details);
app.post('/active_offline_category', ecommerce_panel.active_offline_category);

app.post('/add_sub_category', ecommerce_panel.add_sub_category);
app.post('/update_sub_category', ecommerce_panel.update_sub_category);
app.post('/get_sub_category_details', ecommerce_panel.get_sub_category_details);
app.post('/get_sub_category_list_details', ecommerce_panel.get_sub_category_list_details);
app.post('/active_offline_sub_category', ecommerce_panel.active_offline_sub_category);

app.post('/get_brand_list', ecommerce_panel_brand.get_brand_list);
app.post('/get_brand_details', ecommerce_panel_brand.get_brand_details);
app.post('/active_inactive_brand', ecommerce_panel_brand.active_inactive_brand);
app.post('/update_brand', ecommerce_panel_brand.update_brand);
app.post('/add_brand', uploadAdminBrand.single('brand_image'), ecommerce_panel_brand.add_brand);

app.post('/get_product_list', ecommerce_panel_product.get_product_list);

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
