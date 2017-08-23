var commonFunc = require('./commonfunction');
var logging = require('./logging');
var responses = require('./responses');
var fs = require('fs');
var geofencing = require("./geofencing");


exports.read_info = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var id = req.body.id;
    var manvalues = [access_token];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
               var sql = "select data , link from tb_info where id = ? limit 1";
                var values = [id];
                connection.query(sql , values , function(err , result){

                    console.log(err , result)


                    if(result && result.length)
                    {
                          result[0].link == ""?"0":result[0].link;

                         var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": result[0]


                };
                        res.send(JSON.stringify(response));
                    }else {
                        console.log("Error when reading the file: " + JSON.stringify(err));
                res.send(JSON.stringify({error: "Error reading the data"}));
                    }



                });
               
                return;
            }
        });
    }
};


exports.update_info = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var id = req.body.id;
    var data =  req.body.data;
        var link =  req.body.link;
    var manvalues = [access_token];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
               var sql = "update tb_info set data = ? , link = ? where id = ? limit 1";
                var values = [data,link,id];
                connection.query(sql , values , function(err , result){


                    if(result )
                    {

                         var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {

                        "data":data , 
                        "link":link,
                        "id":id

                    }


                };
                        res.send(JSON.stringify(response));
                    }else {
                        console.log("Error when reading the file: " + JSON.stringify(err));
                res.send(JSON.stringify({error: "Error reading the data"}));
                    }

                });
                return;
            }
        });
    }
};


/*
 * -----------------------------------------------
 * READ ABOUT US HTML FILE
 * -----------------------------------------------
 */

exports.read_about_us = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var manvalues = [access_token];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                var data = fs.readFileSync(config.get('filePath.about'), "utf8");
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {"aboutus": data}
                };
                res.send(JSON.stringify(response));
                return;
            }
    });
    }
};

/*
 * -----------------------------------------------
 * WRITE ABOUT US HTML FILE
 * -----------------------------------------------
 */

exports.write_about_us = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var data = req.body.data;
    var manvalues = [access_token,data];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                fs.writeFile(config.get('filePath.about'), data, function (err) {
                    if (err) return console.log(err);
                    var response = {
                        "message": constants.responseMessages.ACTION_COMPLETE,
                        "status": constants.responseFlags.ACTION_COMPLETE,
                        "data": {}
                    };
                    res.send(JSON.stringify(response));
                    return;
                });
            }
        });
    }
};

/*
 * -----------------------------------------------
 * READ FAQ HTML FILE
 * -----------------------------------------------
 */

exports.read_faq = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var manvalues = [access_token];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                var data = fs.readFileSync(config.get('filePath.faq'), "utf8");
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {"aboutus": data}
                };
                res.send(JSON.stringify(response));
                return;
            }
        });
    }
};

/*
 * -----------------------------------------------
 * WRITE FAQ HTML FILE
 * -----------------------------------------------
 */

exports.write_faq = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var data = req.body.data;
    var manvalues = [access_token,data];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                fs.writeFile(config.get('filePath.faq'), data, function (err) {
                    if (err) return console.log(err);
                    var response = {
                        "message": constants.responseMessages.ACTION_COMPLETE,
                        "status": constants.responseFlags.ACTION_COMPLETE,
                        "data": {}
                    };
                    res.send(JSON.stringify(response));
                    return;
                });
            }
        });
    }
};

/*
 * -----------------------------------------------
 * READ PRIVACY POLICY HTML FILE
 * -----------------------------------------------
 */

exports.read_privacy_policy = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var manvalues = [access_token];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                var data = fs.readFileSync(config.get('filePath.privacy_policy'), "utf8");
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {"aboutus": data}
                };
                res.send(JSON.stringify(response));
                return;
            }
        });
    }
};

/*
 * -----------------------------------------------
 * WRITE PRIVACY POLICY HTML FILE
 * -----------------------------------------------
 */

exports.write_privacy_policy = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var data = req.body.data;
    var manvalues = [access_token,data];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                fs.writeFile(config.get('filePath.privacy_policy'), data, function (err) {
                    if (err) return console.log(err);
                    var response = {
                        "message": constants.responseMessages.ACTION_COMPLETE,
                        "status": constants.responseFlags.ACTION_COMPLETE,
                        "data": {}
                    };
                    res.send(JSON.stringify(response));
                    return;
                });
            }
        });
    }
};

/*
 * -----------------------------------------------
 * READ TERMS AND CONDITIONS HTML FILE
 * -----------------------------------------------
 */

exports.read_tnc = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var manvalues = [access_token];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                var data = fs.readFileSync(config.get('filePath.t&c'), "utf8");
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {"aboutus": data}
                };
                res.send(JSON.stringify(response));
                return;
            }
        });
    }
};

/*
 * -----------------------------------------------
 * WRITE TERMS AND CONDITIONS HTML FILE
 * -----------------------------------------------
 */

exports.write_tnc = function(req,res) {
    res.header("Access-Control-Allow-Origin", "*");
    var access_token = req.body.access_token;
    var data = req.body.data;
    var manvalues = [access_token,data];
    var checkblank = commonFunc.checkBlank(manvalues);
    if (checkblank == 1) {
        responses.parameterMissingResponse(res);
        return;
    } else {
        commonFunc.authenticateAdminAccessToken(access_token, function (result) {
            if (result == 0) {
                responses.authenticationErrorResponse(res);
                return;
            } else {
                fs.writeFile(config.get('filePath.t&c'), data, function (err) {
                    if (err) return console.log(err);
                    var response = {
                        "message": constants.responseMessages.ACTION_COMPLETE,
                        "status": constants.responseFlags.ACTION_COMPLETE,
                        "data": {}
                    };
                    res.send(JSON.stringify(response));
                    return;
                });
            }
        });
    }
};


exports.list_all_cars_html = function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");

    var sql = "SELECT Distinct  car_type , car_name, `fare_fixed`,`fare_per_km`,`fare_per_min` , fare_threshold_distance  ,fare_threshold_time  , wait_time_fare_per_min ,car_seats FROM `tb_fare` WHERE car_type<4 LIMIT 3";
    connection.query(sql, [], function(err, getAllCars) {
        if (err) {
            logging.logDatabaseQueryError("Error in fetching all cars : ", err, getAllCars);
            responses.sendError(res);
            return;
        } else {
            if (getAllCars.length > 0) {
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {
                        "car_list": getAllCars
                    }
                };

                console.log(response);
            } else {
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {
                        "car_list": []
                    }
                };
            }
            res.send(JSON.stringify(response));
            return;
        }
    });

};

exports.list_all_regions = function(req,res){
    res.header("Access-Control-Allow-Origin", "*");

    var sql = "SELECT * FROM `tb_region` WHERE is_deleted=0";
    connection.query(sql, [], function(err, getRegions) {
        if (err) {
            logging.logDatabaseQuery("Getting all regions", err, getRegions);
            responses.sendError(res);
            return;
        } else {
            if (getRegions.length > 0) {
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {
                        "region_list": getRegions
                    }
                };

                console.log(response);
            } else {
                var response = {
                    "message": constants.responseMessages.ACTION_COMPLETE,
                    "status": constants.responseFlags.ACTION_COMPLETE,
                    "data": {
                        "region_list": []
                    }
                };
            }
            res.send(JSON.stringify(response));
            return;
        }
    });
}

exports.get_fare_by_region = function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    var regionId = req.body.region_id || 0;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var data = {};
    data.point = latitude + " " + longitude;
    geofencing.getRegion(data,function(err,result){
        console.log("ressullltt>>>",result);
        if(result && !regionId){
            regionId = result.regions[0].region_id;
            console.log("Customer is in region>>>>>>>>>>",result.regions[0].region_id,result.regions[0].region_name);
        }
        var sql = "SELECT * FROM `tb_fare` WHERE region_id = ?";
        connection.query(sql, [regionId], function(err, getFare) {
            if (err) {
                logging.logDatabaseQuery("Getting fare for region", err, getFare);
                responses.sendError(res);
                return;
            } else {
                if (getFare.length > 0) {
                    var response = {
                        "message": constants.responseMessages.ACTION_COMPLETE,
                        "status": constants.responseFlags.ACTION_COMPLETE,
                        "fare_details": getFare
                    };

                    console.log(response);
                } else {
                    var response = {
                        "message": constants.responseMessages.ACTION_COMPLETE,
                        "status": constants.responseFlags.ACTION_COMPLETE,
                        "fare_details": []
                    };
                }
                res.send(JSON.stringify(response));
                return;
            }
        });
    })
}