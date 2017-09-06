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

// add master category
exports.add_master_category = function (req, res) {
	console.log(req.body);
	var access_token = req.body.access_token;
	var master_category_name = req.body.master_category_name;
	var master_category_description = req.body.master_category_description;
	var sort_order = req.body.sort_order;

	var manvalues = [access_token, master_category_name];
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
				// var sql = "SELECT * FROM `master_category` WHERE `sort_order`=?";
				// connection.query(sql, [sort_order], function(err, check_order) {
				// 	if (err) {
				// 		console.log(err);
				// 		responses.sendError(res);
				// 		return;
				// 	} 
					// else if ( check_order.length > 0 ){
					// 	var response = {
					// 		status: constants.responseFlags.ALREADY_EXIST,
					// 		flag: 1,
					// 		response: {},
					// 		message: "Sort order already exist."    
					// 	};
					// 	res.send(JSON.stringify(response));
					// }
					// else {

						var user_id = result[0].user_id;
		                var master_category_id_unique_id = utils.generateRandomString();
		                var master_category_id = md5(master_category_id_unique_id);

		                var currentTime = new Date();
		                var created_on = Math.round(currentTime.getTime() / 1000);

						var sql = "INSERT INTO `master_category` (`master_category_id`,`master_category_name`,`master_category_description`, `sort_order`, `created_on`) VALUES (?,?,?,?,?)";
						console.log(sql);
						connection.query(sql, [master_category_id, master_category_name, master_category_description, sort_order, created_on], function (err, insertResult) {
							console.log(err);
							// console.log(insertResult);
							if (err) {
								responses.sendError(res);
								return;
							} else {
								var response = {
									status: constants.responseFlags.ACTION_COMPLETE,
									flag: 1,
					                response: {},
					                message: "Master category created successfully."
								}
								console.log(response);
								res.send(JSON.stringify(response));
							}
						});
				// 	}
				// });
			}
		});
	}
}

// get master category
exports.get_master_category_details = function (req, res) {
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
				var admin_id = result[0].admin_id;
				var sql = "SELECT * FROM `master_category` WHERE `is_blocked`=? AND `is_deleted`=?";
				connection.query(sql, [0, 0], function(err, categoryResult) {
					if (err) {
						response.sendError(res);
						return;
					} else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: categoryResult,
							message: "Data fetched successfully."
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}