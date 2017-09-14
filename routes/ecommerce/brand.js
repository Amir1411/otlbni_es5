var commonFunc = require('./../commonfunction'); 
var utils = require('./../../utils/commonfunction');
var commonFunc = require('./../commonfunction'); 
var utils = require('./../../utils/commonfunction');
var md5 = require('MD5');
var responses = require('./../responses');
var logging = require('./../logging');
var math = require('mathjs');
var phantom = require('phantom');
var fs = require('fs');
var constants = require('./../constants');
var Handlebars = require('handlebars');
var time = require('./../time');
var lookup = require('country-data');
var messenger = require('./../messenger');
var path = require('path');
var multer = require('multer');
var EmailModule = require('./../EmailModule');

exports.get_brand_list = function(req, res) {

	var access_token = req.body.access_token;
	var manvalues = [access_token];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function(result) {
			if (result == 0) {
				var response = {
					status: constants.responseFlags.INVALID_ACCESS_TOKEN,
					flag: 1,
					response: {},
					message: "Invalid access token."    
				};
				res.send(JSON.stringify(response));
				return; 
			} else {
				var sql = "SELECT * FROM `brand`";
				connection.query(sql, [], function(err, result){
					if ( err ) {
						// response.sendError(res);
						return;
					} else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: result,
							message: "Data fetched successfully"
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

exports.add_brand = function(req, res) {
	var access_token = req.body.access_token;
	var brand_name = req.body.brand_name;
	var brand_description = req.body.brand_description;

	var manvalues = [access_token, ];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function(result) {
			if (result == 0) {
				var response = {
					status: constants.responseFlags.INVALID_ACCESS_TOKEN,
					flag: 1,
					response: {},
					message: "Invalid access token."    
				};
				res.send(JSON.stringify(response));
				return; 
			} else {

                var brand_unique_id = utils.generateRandomString();
                var brand_id = md5(brand_unique_id);
                var currentTime = new Date();
                var created_on = Math.round(currentTime.getTime() / 1000);
                console.log(req.file);
				var sql = "INSERT INTO `brand`(`brand_id`, `brand_name`, `brand_description`, `brand_image`, `created_on`) VALUES (?,?,?,?,?)";
			    var value = [brand_id, brand_name, brand_description, req.file.filename, created_on];
			    connection.query(sql, value, function (err, result) {
			        if (err) {
			            responses.sendError(res);
			            return;
			        } else {
			        	var response = {
			        		status: constants.responseFlags.ACTION_COMPLETE,
			        		flag: 1,
			        		response: {},
			        		message: "Brand created successfully"
			        	}
			        	res.send(JSON.stringify(response));
			        }
			    });
			}
		});
	}
}

exports.get_brand_details = function(req, res) {
	var access_token = req.body.access_token;
	var brand_id = req.body.brand_id;
	var manvalues = [access_token, brand_id];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function(result) {
			if (result == 0) {
				var response = {
					status: constants.responseFlags.INVALID_ACCESS_TOKEN,
					flag: 1,
					response: {},
					message: "Invalid access token."    
				};
				res.send(JSON.stringify(response));
				return; 
			} else {
				var admin_id = result[0].admin_id;
				var sql = "SELECT * FROM `brand` WHERE `is_deleted`=? AND `brand_id`=?";
				connection.query(sql, [0, brand_id], function(err, brandResult) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						console.log(brandResult);
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: brandResult[0],
							message: "Data fetched successfully."
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

exports.active_inactive_brand = function (req, res) {

	var access_token =  req.body.access_token;
	var is_active =  req.body.is_active;
	var brand_id =  req.body.brand_id;

	var manvalues = [access_token,brand_id];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function(result) {
			if (result == 0) {
				var response = {
					status: constants.responseFlags.INVALID_ACCESS_TOKEN,
					flag: 1,
					response: {},
					message: "Invalid access token."    
				};
				res.send(JSON.stringify(response));
				return; 
			} else {
				var admin_id = result[0].admin_id;
				var sql = "UPDATE `brand` SET `is_active`='"+is_active+"' WHERE `brand_id`=?";
				connection.query(sql, [brand_id], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						if ( is_active == 0 ) {
							var msg = "Brand is inactive successfully.";
						} else if ( is_active == 1 ){
							var msg = "Brand is active successfully.";
						}
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: {"is_active": is_active},
							message: msg 
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

// update master category
exports.update_brand = function (req, res) {

	var access_token = req.body.access_token;
	var brand_name = req.body.brand_name;
	var brand_description = req.body.brand_description;
	var brand_id = req.body.brand_id;

	var manvalues = [access_token, brand_name, brand_id];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function(result) {
			if (result == 0) {
				var response = {
					status: constants.responseFlags.INVALID_ACCESS_TOKEN,
					flag: 1,
					response: {},
					message: "Invalid access token."    
				};
				res.send(JSON.stringify(response));
				return; 
			} else {
				// var admin_id = result[0].admin_id;
				var sql = "SELECT * FROM `brand` WHERE `brand_id`=?";
				connection.query(sql, [brand_id], function(err, check_order) {
					if (err) {
						console.log(err);
						responses.sendError(res);
						return;
					} 
					else if ( check_order.length > 0 ){
						var sql = "UPDATE `brand` SET `brand_name`='"+brand_name+"', `brand_description`='"+brand_description+"' WHERE `brand_id`=?";
						connection.query(sql, [brand_id], function(err, result) {
							if (err) {
								responses.sendError(res);
								return;
							} else {
								var response = {
									status: constants.responseFlags.ACTION_COMPLETE,
									flag: 1,
									response: {},
									message: "Brand updated successfully."    
								};
								res.send(JSON.stringify(response));
							}
						});
					}
					else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
			                response: {},
			                message: "There is no brand."
						}
						res.send(JSON.stringify(response));						
					}
				});
			}
		});
	}
}