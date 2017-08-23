/**
 * Created by Ashu on 10/15/15.
 */
var express = require('express');
var router = express.Router();
var md5 = require('MD5');
var async = require('async');
var utils = require('./commonfunction');
var logging = require('./logging');
var responses = require('./responses');
var constants = require('./constants');
/*
 * --------------------------------------------------------------------------
 * get user addresss from map
 * INPUT : address , accesstoken
 * OUTPUT : error, userResult
 * ---------------------------------------------------------------------------
 */
router.post('/add_region', function(req, res) {
    logging.startSection('adding address');
    logging.logRequest(req);
    res.header("Access-Control-Allow-Origin", "*");
    var accessToken = req.body.access_token;
    var country = req.body.country;
    var regionName = req.body.region_name;
    var regionPathString = req.body.region_path; //comma seperated lat longs
    if(typeof req.body.country == 'undefined'){
        country='Rwanda';
    }
    var manValues = [accessToken, regionName, regionPathString,country];
    var data = {};
    data.accessToken = accessToken;
    data.regionName = regionName;
    data.regionPathString = regionPathString;
    data.country = country;
    var waterfallArray = [];
    waterfallArray.push(utils.checkBlankAsync.bind(null, res, manValues));
    waterfallArray.push(authenticationHandler.bind(null, data, res));
    waterfallArray.push(checkIfPolygonOverlap);
    waterfallArray.push(addRegion);
    waterfallArray.push(addDefaultFare);
    waterfallArray.push(addDefaultSurgeFare);
    async.waterfall(waterfallArray, responseHandler);

    function responseHandler(err, response) {
        console.log("err , response=============>");
        console.log(err, response);
        if (err && err != -1) {


            res.send(JSON.stringify(err));
            return;
        }
        if (response) {

            res.send(JSON.stringify(response));
            logging.logResponse(response);
            return;

        }
    }
});

/*
 * --------------------------------------------------------------------------
 * get user addresss from map
 * INPUT : address , accesstoken
 * OUTPUT : error, userResult
 * ---------------------------------------------------------------------------
 */
router.post('/get_all_regions', function(req, res) {
    logging.startSection('adding address');
    logging.logRequest(req);
    res.header("Access-Control-Allow-Origin", "*");
    var accessToken = req.body.access_token;
    var manValues = [accessToken]
    var data = {};
    data.accessToken = accessToken;
    var waterfallArray = [];
    waterfallArray.push(utils.checkBlankAsync.bind(null, res, manValues));
    waterfallArray.push(authenticationHandler.bind(null, data, res));
    waterfallArray.push(viewRegions);

    async.waterfall(waterfallArray, responseHandler);

    function responseHandler(err, response) {
        console.log("err , response=============>");
        console.log(err, response);
        if (err && err != -1) {


            res.send(JSON.stringify(err));
            return;
        }
        if (response) {

            res.send(JSON.stringify(response));
            logging.logResponse(response);
            return;

        }
    }
});

/*
 * --------------------------------------------------------------------------
 * get user addresss from map
 * INPUT : address , accesstoken
 * OUTPUT : error, userResult
 * ---------------------------------------------------------------------------
 */
router.post('/delete_a_region', function(req, res) {
    logging.startSection('Deleting region');
    logging.logRequest(req);
    res.header("Access-Control-Allow-Origin", "*");
    var accessToken = req.body.access_token;
    var regionId = req.body.region_id;
    var manValues = [accessToken,regionId]
    var data = {};
    data.accessToken = accessToken;
    data.regionId = regionId;
    var waterfallArray = [];
    waterfallArray.push(utils.checkBlankAsync.bind(null, res, manValues));
    waterfallArray.push(authenticationHandler.bind(null, data, res));
    waterfallArray.push(deleteRegion);

    async.waterfall(waterfallArray, responseHandler);

    function responseHandler(err, response) {
        console.log("err , response=============>");
        console.log(err, response);
        if (err && err != -1) {


            res.send(JSON.stringify(err));
            return;
        }
        if (response) {

            res.send(JSON.stringify(response));
            logging.logResponse(response);
            return;

        }
    }
});

router.post("/edit_a_region",function(req,res){
    logging.startSection('Updating region');
    logging.logRequest(req);
    res.header("Access-Control-Allow-Origin", "*");
    var accessToken = req.body.access_token;
    var regionId = req.body.region_id;
    var country = req.body.country;
    var regionPathString = req.body.region_path;
    var regionName = req.body.region_name;
    if (typeof country === 'undefined') {
        country = "Rwanda";
    }
    var manValues = [accessToken,regionId,regionPathString,regionName,country]
    var data = {};
    data.accessToken = accessToken;
    data.regionId = regionId;
    data.regionPathString = regionPathString;
    data.regionName = regionName;
    data.country = country;
    var waterfallArray = [];
    waterfallArray.push(utils.checkBlankAsync.bind(null, res, manValues));
    waterfallArray.push(authenticationHandler.bind(null, data, res));
    waterfallArray.push(checkIfPolygonOverlap);
    waterfallArray.push(updateRegion);

    async.waterfall(waterfallArray, responseHandler);

    function responseHandler(err, response) {
        console.log("err , response=============>");
        console.log(err, response);
        if (err && err != -1) {


            res.send(JSON.stringify(err));
            return;
        }
        if (response) {

            res.send(JSON.stringify(response));
            logging.logResponse(response);
            return;

        }
    }
});


//router.post('/get_its_region', function(req, res) {
//    logging.startSection('adding address');
//    logging.logRequest(req);
//    res.header("Access-Control-Allow-Origin", "*");
//    var accessToken = req.body.access_token;
//    var latitude = req.body.latitude;
//    var longitude = req.body.longitude;
//
//    var manValues = [accessToken, latitude, latitude];
//    var data = {};
//    data.accessToken = accessToken;
//    data.point = latitude + " " + longitude;
//    var waterfallArray = [];
//    waterfallArray.push(utils.checkBlankAsync.bind(null, res, manValues));
//    waterfallArray.push(authenticationHandler.bind(null, data, res));
//    waterfallArray.push(getPointsRegion);
//
//
//    async.waterfall(waterfallArray, responseHandler);
//
//    function responseHandler(err, response) {
//        console.log("err , response=============>");
//        console.log(err, response);
//        if (err && err != -1) {
//
//
//            res.send(JSON.stringify(err));
//            return;
//        }
//        if (response) {
//
//            res.send(JSON.stringify(response));
//            logging.logResponse(response);
//            return;
//
//        }
//    }
//});

function authenticationHandler(data, res, callback) {
    utils.authenticateAdminAccessToken(data.accessToken, function(result) {
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



function getPointsRegion(data, callback) {

    var point = "GeomFromText('POINT(" + data.point + ")')";

    //SELECT region_id,AsText(polygon) FROM `tb_region` WHERE ST_Intersects(`polygon`, GEOMFROMTEXT('POLYGON((0 0,0 1,-0.5 -0.5,0 0))', 0 ) )
    var sql = "SELECT region_id,region_name FROM `tb_region` WHERE contains(`polygon`," + point + " ) AND is_deleted=0";

    connection.query(sql, [], function(err, result) {

        if (err) {
            var response = {
                "error": 'Please Select a valid point',
                "status": 401,
                "data": {}
            };
            return callback(response);
        }

        if (result.length) {
            var response = {
                "error": 'This point is in existing region',
                "status": 200,
                "regions": result
            };
            return callback(null, response);
        } else {

            var response = {
                "error": 'No region found',
                "status": 200,
                "regions": [{
                    region_id: 0,
                    region_name: "outside world"
                }]
            };
            return callback(null, response);
        }
    });
}

function checkIfPolygonOverlap(data, callback) {

    var polygon = "GeomFromText('POLYGON((" + data.regionPathString + "))')";

    //SELECT region_id,AsText(polygon) FROM `tb_region` WHERE ST_Intersects(`polygon`, GEOMFROMTEXT('POLYGON((0 0,0 1,-0.5 -0.5,0 0))', 0 ) )
    var sql = "SELECT region_id,AsText(polygon) FROM `tb_region` WHERE Intersects(`polygon`," + polygon + " ) AND is_deleted = ?";
    var values = [0];
    if(data.regionId){
        sql = "SELECT region_id,AsText(polygon) FROM `tb_region` WHERE (Intersects(`polygon`," + polygon + " ) AND is_deleted = ?) AND region_id <> ?";
        values = [0,data.regionId]
    }

    connection.query(sql, values, function(err, result) {
        logging.logDatabaseQuery("Checking polygon:",err,result);
        if (err) {
            var response = {
                "error": 'Please Select a valid polygon',
                "status": 401,
                "data": {}
            };
            return callback(response, result);
        }

        if (result.length) {
            var response = {
                "error": 'This region is over lapping existing region',
                "status": 401,
                "data": {}
            };
            return callback(response, result);
        }

        return callback(null, data);

    });


}


function addRegion(data, callback) {


    var polygon = "GeomFromText('POLYGON((" + data.regionPathString + "))')";
    var sql = "insert into tb_region (region_name,country,polygon) values(?,?," + polygon + ")";
    console.log(JSON.stringify(sql));
    connection.query(sql, [data.regionName,data.country], function(err, result) {
        logging.logDatabaseQuery('adding region', err, result);

        if (err) {

            if (err.code == "ER_DUP_ENTRY") {
                var response = {
                    "error": 'Region with same name already exists',
                    "status": 401,
                    "data": {}
                };
                return callback(response, result);
            } else {
                var response = {
                    "error": 'Something went wrong',
                    "status": 401,
                    "data": {}
                };
                return callback(response, result);
            }

        }
        var response = {
            "message": 'Added successfully',
            "status": 200,
            "data": {
                regionId : result.insertId
            }
        };
        return callback(err, response);
    });
}

function viewRegions(data, callback) {

    var sql = "SELECT region_id,region_name, AsText(polygon) as region_path_string FROM `tb_region` WHERE is_deleted = 0";
    connection.query(sql, [], function(err, result) {
        logging.logDatabaseQuery('Getting all regions', err, result);

        if (err) {
            var response = {
                "error": 'Something went wrong',
                "status": 401,
                "data": {}
            };
            return callback(response, result);
        }
        var regions = [];
        if(result.length){
            result.forEach(function(element){
                var region = element.region_path_string.toString();
                console.log("Region is>>>>>>>>",region);
                var regionPathString = region.slice(region.lastIndexOf('(')+1,region.indexOf(')'));
                regions.push({
                    region_id : element.region_id,
                    region_name : element.region_name,
                    region_path_string : regionPathString
                });
            })
        }
        var response = {
            "message": 'All region details',
            "status": 200,
            "regions": regions
        };


        return callback(err, response);
    });
}

//function deleteRegion(data, callback){
//
//    var sql = "DELETE FROM `tb_region` WHERE region_id = ?";
//    connection.query(sql, [data.regionId], function(err, result) {
//        logging.logDatabaseQuery('Deleting region', err, result);
//
//        if (err) {
//            var response = {
//                "error": 'Something went wrong',
//                "status": 401,
//                "data": {}
//            };
//            return callback(response, result);
//        }
//        if(!result.affectedRows){
//            var response = {
//                "message": 'Region not found',
//                "status": 400
//            };
//            return callback(response, result);
//        } else {
//            var response = {
//                "message": 'Region deleted',
//                "status": 200
//            };
//            return callback(response, result);
//        }
//    });
//}

function addDefaultFare(data,callback){
    var values = [];
    var valuesArray1 = ['1.00','1.95','0.00','0.38','0.00','0','Standard','4','','1','7.00','1.00','0','0','0','0.00',data.data.regionId,'0.00','0.00','2.00'];
    var valuesArray2 = ['1.00','1.95','0.00','0.38','0.00','1','SUV','4','','0','7.00','1.00','0','0','0','0.00',data.data.regionId,'0.00','0.00','2.00'];
    var valuesArray3 = ['1.00','1.95','0.00','0.38','0.00','2','Limo','6','','0','7.00','1.00','0','0','0','0.00',data.data.regionId,'0.00','0.00','2.00'];
    var valuesArray4 = ['1.00','1.95','0.00','0.38','0.00','3','Bike','2','','0','7.00','1.00','0','0','0','0.00',data.data.regionId,'0.00','0.00','2.00'];
    var valuesArray5 = ['1.00','1.95','0.00','0.38','0.00','4','3 Wheels','2','','0','7.00','1.00','0','0','0','0.00',data.data.regionId,'0.00','0.00','2.00'];
    values.push(valuesArray1);
    values.push(valuesArray2);
    values.push(valuesArray3);
    values.push(valuesArray4);
    values.push(valuesArray5);
    var sql = "INSERT INTO `tb_fare` (" +
        "`fare_fixed` ," +
        "`fare_per_km` ," +
        "`fare_threshold_distance`," +
        "`fare_per_min` ," +
        "`fare_threshold_time` ," +
        "`car_type` ," +
        "`car_name` ," +
        "`car_seats` ," +
        "`car_type_image` ," +
        "`default_flag` ," +
        "`wait_time_fare_per_min` ," +
        "`cancellation_fee` ," +
        "`vat` ," +
        "`service_tax` ," +
        "`minimum_speed` ," +
        "`arrival_time_fare_per_min` ," +
        "`region_id` ," +
        "`wait_threshold_time` ," +
        "`arrival_threshold_time` ,"+
        "`cancellation_time`"+
        ") VALUES ?";
    console.log("query is >>>>>>>>>>>>>>",sql);
    connection.query(sql,[values],function(err,result) {
        logging.logDatabaseQuery("Adding to fare table", err, result);
        if (err) {
            var response = {
                "error": 'Something went wrong',
                "status": 401,
                "data": {}
            };
            return callback(response, result);
        } else {
            var response = {
                "message": 'Fare details added',
                "status": 200,
                "data" : {
                    regionId : data.data.regionId
                }
            };
            return callback(err, response);
        }
    });
    }

function addDefaultSurgeFare(data,callback){
    var valuesArray = [];
    for(var i =0;i < 5; i++){
        for(var j=0; j<48 ; j++ ){
            var values = [];
            values.push("1.00");
            values.push(i);
            values.push(j+1);
            values.push(j);
            values.push(data.data.regionId);
            valuesArray.push(values);
        }
    }
    var sql = "INSERT INTO `tb_fare_multiplier` (" +
        "`fare_fixed` ," +
        "`car_type` ," +
        "`end_slot`," +
        "`start_slot`,"+
        "`region_id`" +
        ") VALUES ?";
    console.log("query is >>>>>>>>>>>>>>",sql);
    connection.query(sql,[valuesArray],function(err,result) {
        logging.logDatabaseQuery("Adding to fare table", err, result);
        if (err) {
            var response = {
                "error": 'Something went wrong',
                "status": 401,
                "data": {}
            };
            return callback(response, result);
        } else {
            var response = {
                "message": "New Region has been added with Default Fare Values. You will be now redirected to the Fare Details Page.",
                "status": 200,
                "data" : {
                    "regionId" : data.data.regionId
                }
            };
            return callback(err, response);
        }
    });
}

function deleteRegion(data, callback){

    var sql = "UPDATE `tb_region` SET `is_deleted`= ?,`region_name` = CONCAT(region_name,substring('abcdefghijklmnopqrstuvwxyz',(rand() + 1)*10,(rand() + 1)*10)) WHERE region_id = ? AND `is_deleted` = ?";
    connection.query(sql, [1,data.regionId,0], function(err, result) {
        logging.logDatabaseQuery('Deleting region', err, result);

        if (err) {
            var response = {
                "error": 'Something went wrong',
                "status": 401,
                "data": {}
            };
            return callback(response, result);
        }
        if(!result.affectedRows){
            var response = {
                "message": 'Region not found',
                "status": 400
            };
            return callback(response, result);
        } else {
            var response = {
                "message": 'Region deleted',
                "status": 200
            };
            return callback(err, response);
        }
    });
}

function updateRegion(data,callback){
    var polygon = "GeomFromText('POLYGON((" + data.regionPathString + "))')";
    var sql = "UPDATE `tb_region` SET `region_name`= ?, country=?,`polygon` = " + polygon + " WHERE region_id = ?";
    console.log(sql);
    connection.query(sql,[data.regionName,data.country,data.regionId],function(err,result){
        logging.logDatabaseQuery("Updating the region details",err,result);
        if (err) {
            var response = {
                "error": 'Something went wrong',
                "status": 401,
                "data": {}
            };
            return callback(response, result);
        } else {
            var response = {
                "message": 'Region updated successfully',
                "status": 200
            };
            return callback(err, response);
        }
    })
}


exports.router = router;
exports.getRegion = getPointsRegion;
