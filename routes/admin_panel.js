var commonFunc = require('./commonfunction'); 
var utils = require('./../utils/commonfunction');
var md5 = require('MD5');
var responses = require('./responses');
var logging = require('./logging');
var math = require('mathjs');
var phantom = require('phantom');
var fs = require('fs');
var constants = require('./constants');
var Handlebars = require('handlebars');
var time = require('./time');
var lookup = require('country-data');
var messenger = require('./messenger');
var path = require('path');
var multer = require('multer');
var EmailModule = require('./EmailModule');
var async = require('async');
var FCM = require('fcm-node');

exports.logout = function(req, res) {
	var access_token = req.body.access_token;
	var update_otp = "UPDATE `user` SET `access_token`= '' WHERE `access_token`=?";
	connection.query(update_otp, access_token, function(err, result){
		if (err) {
			console.log(err);
		} else {
			var response = {
				status: constants.responseFlags.ACTION_COMPLETE,
				flag: 2,
				response: {},
				message: "Logout Successfully"
			};
			res.send(JSON.stringify(response));
		}
	});
}

exports.login = function(req, res) {
	
	var email = req.body.email;
	var password = req.body.password;

	var manvalues = [email, password];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		var encrypted_pass = md5(password);
		var sql = "SELECT * FROM `admin` WHERE `email`=? LIMIT 1";
		connection.query(sql, [email], function(err, result_check) {
			if (err) {
				responses.sendError(res);
				return;
			} else {
				if (result_check.length == 0) {
					var response = {
						"status": constants.responseFlags.INVALID_EMAIL_ID,
						"flag": 1,
						"response": {},
						"message": constants.responseMessages.INVALID_EMAIL_ID              
					};
					res.send(JSON.stringify(response));
					return;
				} else {
					if (result_check[0].password != encrypted_pass) {
						var response = {
							"status": constants.responseFlags.WRONG_PASSWORD,
							"flag": 1,
							"response": {},
							"message": constants.responseMessages.INCORRECT_PASSWORD
						};
						res.send(JSON.stringify(response));
						return;
					} else {

						var access_token = md5(utils.generateRandomString());
						var update_otp = "UPDATE `admin` SET `access_token`='"+access_token+"' WHERE `admin_id`=?";

						connection.query(update_otp, result_check[0].admin_id, function(err, result){
							if (err) {
								responses.sendError(res);
								return;
							} else {
								result_check[0]["password"] = "";
								result_check[0]["access_token"] = access_token;
								if ( result_check[0]["profile_url"] != "" ) {
									result_check[0]["profile_url"] = "admin/"+result_check[0]["profile_url"];
								}
								var response = {
									"status": constants.responseFlags.LOGIN_SUCCESSFULLY,
									"flag": 1,
									"message": constants.responseMessages.LOGIN_SUCCESSFULLY,
									"response": result_check[0]
								};
								res.send(JSON.stringify(response));
								return;
							}
						});
					}
				}
			}
		});
	}
}

exports.get_details = function(req, res) {
	var access_token =  req.body.access_token;
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
				var sql = "SELECT * FROM `admin` WHERE `admin_id`=?";
				connection.query(sql, [admin_id], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						result[0].password = '';
						if ( result[0]["profile_url"] != "" ) {
							result[0]["profile_url"] = "admin/"+result[0]["profile_url"];
						}
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: result[0],
							message: "Get Admin Details"
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

exports.change_password = function(req, res) {
	var access_token =  req.body.access_token;
	var old_password =  req.body.old_password;
	var new_password =  req.body.new_password;

	var manvalues = [access_token,old_password,new_password,];
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
				var encrypted_pass = md5(old_password);
				var sql = "SELECT * FROM `admin` WHERE `password`=? AND `admin_id`=?";
				connection.query(sql, [encrypted_pass,admin_id], function(err,response){
					if (err) {
						responses.sendError(res);
						return;
					} else if (response.length > 0 ) {
						var hash = md5(new_password);
						var update_password = "UPDATE `admin` SET `password`='"+hash+"' WHERE `admin_id`=?";
						console.log(update_password);
						connection.query(update_password,[admin_id], function(err, result){
							console.log(err);
							if (err) {
								responses.sendError(res);
								return;
							} else {
								var response = {
									status: constants.responseFlags.ACTION_COMPLETE,
									flag: 1,
									response: "Password changed successfully.",
									message: "Password changed successfully."
								}
								res.send(JSON.stringify(response));
							}
						});
					} else {
						var response = {
							status: constants.responseFlags.SHOW_ERROR_MESSAGE,
							flag: 1,
							response: {},
							message: "Password didn't matched"
						}  
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

exports.update_thumbnail = function(req, res) {
	var access_token = req.body.access_token;
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
        	var update_user = "UPDATE `admin` SET `profile_url`='"+req.file.filename+"' WHERE `admin_id`=?";
			connection.query(update_user, [admin_id], function(err, result){
				if (err) {
					responses.sendError(res);
					return;
				} else {

					var get_user = "SELECT * FROM `admin` WHERE `admin_id`=?";
					connection.query(get_user, [admin_id], function(err, user){
						if (err) {
							responses.sendError(res);
							return;
						} else {
							user[0]["password"] = "";
							if ( user[0]["profile_url"] != "" ) {
								user[0]["profile_url"] = "admin/"+req.file.filename;
							} 
							
							var response = {
								status: constants.responseFlags.ACTION_COMPLETE,
								flag: 1,
								response: user[0],
								message: "Profile updated successfully"
							};
							res.send(JSON.stringify(response));
						}
					});
				}
			});
        }
    });
}

exports.userlist = function(req, res) {
	var access_token =  req.body.access_token;
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
				var sql = "SELECT * FROM `user`";
				connection.query(sql, [], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						var orderArray = [];
						var length = result.length;
						for (var i in result) {
							result[i]["password"] = '';
							result[i]["count"] = i+1;
							if ( result[i]["profile_url"] != "" ) {
								result[i]["profile_url"] = "user/"+result[i]["profile_url"];
							}
							if ( result[i]["account_balance"] == "" ) {
								result[i]["account_balance"] = "0";
							}
							getOrderCount(result[i], function(results){
								// console.log(results);
								if( 0 === --length ) {
									getResponse(result, res);
								}
							});
						}

					}
				});
			}
		});
	}
}

function getOrderCount(result, callback){
	var order_sql = "SELECT * FROM `order_details` WHERE `created_by_id`=?";
	connection.query(order_sql, [result.user_id], function(err, count){
		if (err){

		} else {
			var offer_by_sql = "SELECT * FROM `offer` WHERE `offer_created_by_id`=?";
			connection.query(offer_by_sql, [result.user_id], function(err, offerByCount){
				if (err){

				} else {

					var offer_to_sql = "SELECT * FROM `offer` WHERE `offer_created_to_id`=?";
					connection.query(offer_to_sql, [result.user_id], function(err, offerToCount){
						if (err){

						} else {

							var user_rating_sql = "SELECT * FROM `user_rating` WHERE `user_rating_to_id`=?";
							connection.query(user_rating_sql, [result.user_id], function(err, userRatingResult){
								if (err){

								} else {

									var user_rating_text = 0;
		        					for (var i = 0; i < userRatingResult.length; i++) {
		        						user_rating_text = user_rating_text + parseInt(userRatingResult[i].rating_count);
		        					}
		        					var user_rating_length = userRatingResult.length;
		        					var user_rating_count  = user_rating_text / user_rating_length;

		        					if ( userRatingResult.length == 0 ) {
		        						result.average_rating = 0;
		        					} else {
		        						result.average_rating = user_rating_count;
		        					}

									if ( offerToCount.length > 0 ) {
										var offer_to_amount = 0;
										for (var i = 0; i < offerToCount.length; i++) {
											if (offerToCount[i].status == 3) {
												if (offerToCount[i].offer_created_to_id == result.user_id) {
													offer_to_amount = offer_to_amount+parseInt(offerToCount[i].amount); 
												} 
											}
										}
										result.total_paid = offer_to_amount;
									} else {
										result.total_paid = 0;
									}
									if ( offerByCount.length > 0 ) {
										var offer_amount = 0;
										for (var i = 0; i < offerByCount.length; i++) {
											if (offerByCount[i].status == 3) {
												if (offerByCount[i].offer_created_by_id == result.user_id) {
													offer_amount = offer_amount+parseInt(offerByCount[i].amount); 
												}
											}
										}
										result.total_revenue = offer_amount;
									} else {
										result.total_revenue = 0;
									}
									result.total_order_created_count = count.length;
									result.total_offer_created_count = offerByCount.length;
									callback(result);
								}
							});
						}
					});
				}
			});
		}
	});
}

function getResponse (result, res) {
	var response = {
		status: constants.responseFlags.ACTION_COMPLETE,
		flag: 1,
		response: result,
		message: "Get user Details"
	}
	res.send(JSON.stringify(response));
}

exports.block_unblock_user = function(req, res) {
	var access_token =  req.body.access_token;
	var is_blocked =  req.body.is_blocked;
	var user_id =  req.body.user_id;

	var manvalues = [access_token,user_id];
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
				var sql = "UPDATE `user` SET `is_blocked`='"+is_blocked+"' WHERE `user_id`=?";
				connection.query(sql, [user_id], function(err, result) {
					if (err) {
						response.sendError(res);
						return;
					} else {
						if ( is_blocked == 0 ) {
							var msg = "User is unblocked successfully.";
						} else if ( is_blocked == 1 ){
							var msg = "User is blocked successfully.";
						}
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: {"is_blocked": is_blocked},
							message: msg 
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}

}

exports.courierlist = function(req, res) {
	var access_token =  req.body.access_token;
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
				var sql = "SELECT * FROM `courier`";
				connection.query(sql, [], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						var arrayId = [];
						for (var i = 0; i < result.length; i++) {
							var user_id = result[i].user_id;
							arrayId.push(user_id);
						}
						console.log(arrayId);
						var query = "SELECT * FROM `user` WHERE `user_id` IN (?)";
						connection.query(query, [arrayId], function(err, resultuser) {
							if (err) {
								responses.sendError(res);
								return;
							} else {
								for (var i = 0; i < resultuser.length; i++) {
									resultuser[i]["password"] = '';
									if ( resultuser[i]["profile_url"] != "" ) {
										resultuser[i]["profile_url"] = "user/"+resultuser[i]["profile_url"];
									}
								}

								var response = {
									status: constants.responseFlags.ACTION_COMPLETE,
									flag: 1,
									response: resultuser,
									message: "Get user Details"
								}
								res.send(JSON.stringify(response));
							}
						});
					}
				});
			}
		});
	}
}

exports.getCourierPlaceDetails = function(req, res) {
	var access_token =  req.body.access_token;
	var user_id =  req.body.user_id;
	var manvalues = [access_token, user_id];
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
				var sql = "SELECT * FROM `courier` WHERE `user_id`=?";
				connection.query(sql, [user_id], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else if ( result.length > 0 ) {
						get_place_detail(result, function(places){
							var response = {
								status: constants.responseFlags.ACTION_COMPLETE,
								flag: 1,
								response: {"courier_place_list": places},
								message: "Courier place list details"
							}
							res.send(response);
						});
						// for (var i = 0; i < result.length; i++) {
						// 	var place_id = result[i].place_id;

						// 	var https = require('https');
						//     var url = "https://maps.googleapis.com/maps/api/place/details/json?placeid="+place_id+"&key="+key;
						//     console.log(url);
						//     https.get(url, function(response) {
						//         var body ='';
						//         response.on('data', function(chunk) {
						//         body += chunk;
						//     });

						//     response.on('end', function() {
						//         var places = JSON.parse(body);
						//         var locations = places.result;
						//         responseArray.push(locations); 
						//         console.log(places);
						//         console.log(locations);
						//     });
						//     }).on('error', function(e) {
						//         console.log("Got error: " + e.message);
						//         // var response = {
						//         //     status: constants.responseFlags.NO_RESULT_FOUND,
						//         //     flag: 1,
						//         //     response: {},
						//         //     message: "No details found"
						//         // };
						//         // res.send(JSON.stringify(response));
						//     });
						//     console.log(responseArray);
						// }
					} else {
						var response = {
							status: constants.responseFlags.NO_RESULT_FOUND,
							flag: 1,
							response: {},
							message: "No details found."
						};
						res.send(JSON.stringify(response));
					}
				});	
			}
		});
	}
}

function get_place_detail (resultItem, callback) {
    
    var key = config.get("mapKey");
    // var place_id = resultItem.place_id;
    // console.log(place_id);
    var place_details = [];
    var place_length = resultItem.length;

    for (var i in resultItem) {

        var https = require('https');
        var url = "https://maps.googleapis.com/maps/api/place/details/json?placeid="+resultItem[i].place_id+"&key="+key;
        console.log(url);
        https.get(url, function(response) {
            var body ='';
            response.on('data', function(chunk) {
            body += chunk;
        });

        response.on('end', function() {

            var places = JSON.parse(body);
            var locations = places.result;
            place_details.push(locations);
            if( 0 === --place_length ) {
                callback(place_details); //callback if all queries are processed
            }
        });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
            var response = {
                status: constants.responseFlags.NO_RESULT_FOUND,
                flag: 1,
                response: {},
                message: "No details found"
            };
            callback(0);
        });
    }
}

exports.update_profile = function(req, res) {
	var access_token = req.body.access_token;
	var name = req.body.name;
	var email = req.body.email;
	var phone_number = req.body.phone_number;
	var address = req.body.address;

	var manvalues = [access_token,name,email,phone_number,address];
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
	        	var update_user = "UPDATE `admin` SET `name`='"+name+"', `email`='"+email+"', `phone_number`='"+phone_number+"', `address`='"+address+"' WHERE `admin_id`=?";
				connection.query(update_user, [admin_id], function(err, result){
					if (err) {
						responses.sendError(res);
						return;
					} else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							message: "Profile updated successfully",
							response: {}
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

exports.forgot_password = function(req, res) {
	var user_email = req.body.user_email;
	var manvalues = [user_email];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {			        
    	var sql = "SELECT `email` from `admin` WHERE `email`=?";
    	connection.query(sql, [user_email], function(err, checkUser) {
    		if (err) {
    			responses.sendError(res);
    			return;
    		} else if ( checkUser.length > 0 ) {
    			var md5 = require('MD5');
				var token = md5(user_email);
				var sql = "UPDATE `admin` set `verification_token`=? WHERE `email`=? LIMIT 1";
				connection.query(sql, [token, user_email], function(err, response) {
					EmailModule.sendResetPasswordLink(user_email, token, function(err, res) {});
					var response = {
						message: constants.responseMessages.ACTION_COMPLETE,
						status: constants.responseFlags.ACTION_COMPLETE,
						response: {}
					};
					res.send(JSON.stringify(response));
					return;
				});
    		} else {
    			var response = {
    				status: constants.responseFlags.INVALID_EMAIL_ID,
    				flag: 1,
    				response: {},
    				message: constants.responseMessages.INVALID_EMAIL_ID
    			}
    			res.send(JSON.stringify(response));
    		}
    	});
	}
}

exports.check_verification_token =  function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
    var token = req.body.token;
    var email = req.body.email;
    var sql = "select verification_token from admin where email = ? and verification_token = ? limit 1"
    connection.query(sql, [email, token], function(err, result) {
        var response = {
            "message": constants.responseMessages.EXPIRED_TOKEN,
            "status": constants.responseFlags.SHOW_ERROR_MESSAGE,
            "data": {}
        };

        if (result && result.length) {
            response = {
                "message": constants.responseMessages.ACTION_COMPLETE,
                "status": constants.responseFlags.ACTION_COMPLETE,
                "data": {}
            };
        }
        res.send(JSON.stringify(response));
        return;
    })
}

exports.getAdminOrder = function(req, res) {
	var access_token =  req.body.access_token;
	var status =  req.body.status;
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
				var sql = "SELECT * FROM `order_details` WHERE `status`=?";
				connection.query(sql, [status], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else if ( result.length > 0 ) {
						get_place_detail(result, function(places){
							var response = {
								status: constants.responseFlags.ACTION_COMPLETE,
								flag: 1,
								response: result,
								message: "Order list details"
							}
							res.send(response);
						});
					} else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: {},
							message: "No details found."
						};
						res.send(response);
					}
				});	
			}
		});
	}
}

exports.getAllAdminOrder = function(req, res) {
	var access_token =  req.body.access_token;
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
				var sql = "SELECT * FROM `order_details`";
				connection.query(sql, [], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else if ( result.length > 0 ) {
						get_place_detail(result, function(places){
							var response = {
								status: constants.responseFlags.ACTION_COMPLETE,
								flag: 1,
								response: result,
								message: "Order list details"
							}
							res.send(response);
						});
					} else {
						var response = {
							status: constants.responseFlags.NO_RESULT_FOUND,
							flag: 1,
							response: {},
							message: "No details found."
						};
						res.send(JSON.stringify(response));
					}
				});	
			}
		});
	}
}

/*** For Dashboard***/ 
exports.dashboard_report = function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	var access_token = req.body.access_token;
	var start_time = req.body.start_time;
	var end_time = req.body.end_time;

	var manvalues = [access_token];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function (result) {
			if (result == 0) {
				responses.sendError(res);
				return;
			} else {
				async.parallel([
					// calling total earning and rides function
					function(callback) {
						total_order(req,res,function(total_order_result){
							callback(null,total_order_result)
						});
					},
					// calling total earning and rides function
					function(callback) {
						total_today_order(start_time,end_time,req,res,function(total_today_order_result){
							callback(null,total_today_order_result)
						});
					},
					//calling total users function
					function(callback) {
						total_users(req,res,function(total_users_result){
							callback(null,total_users_result)
						});
					},
					//calling total users for today function
					function(callback) {
						total_users_registered_today(start_time,end_time,req,res,function(total_users_today_result){
							callback(null,total_users_today_result)
						});
					},
					//calling total users function
					function(callback) {
						total_offers(req,res,function(total_offers_result){
							callback(null,total_offers_result)
						});
					},
					//calling total users for today function
					function(callback) {
						total_offers_today(start_time,end_time,req,res,function(total_offers_today_result){
							callback(null,total_offers_today_result)
						});
					},
					//calling total users for today function
					function(callback) {
						total_earnings(req,res,function(total_earnings_today_result){
							callback(null,total_earnings_today_result)
						});
					},
					function(callback) {
						total_reports(req,res,function(total_reports_result){
							callback(null,total_reports_result)
						});
					},
					// calling total users for today function
					function(callback) {
						total_unresolved_reports(req,res,function(total_unresolved_reports_result){
							callback(null,total_unresolved_reports_result)
						});
					},
					//calling total users for today function
					function(callback) {
						total_resolved_reports(req,res,function(total_resolved_reports_result){
							callback(null,total_resolved_reports_result)
						});
					}
				],
				function(err, results) {
					console.log(err);
					console.log(results);
					var response = {
						"message": constants.responseMessages.ACTION_COMPLETE,
						"status": constants.responseFlags.ACTION_COMPLETE,
						"data": {
							"total_orders": results[0],
							"total_today_orders": results[1],
							"total_users":results[2],
							"total_users_registered_today":results[3],
							"total_offers":results[4],
							"total_today_offers":results[5],
							"total_earnings":results[6],
							"total_reports":results[7],
							"total_unresolved_reports":results[8],
							"total_resolved_reports":results[9]
						}
					};
					res.send(JSON.stringify(response));
				});
			}
		});
	}
};

function total_users(req, res,callback) {
	
	var sql = "SELECT count(`user_id`) as `total_users` FROM `user` WHERE `is_verified`=?";
	connection.query(sql, [1], function (err, total_user_result) {
		console.log(err);
		if (err) {
			responses.sendError(res);
			return;
		}
		if (total_user_result.length > 0) {
			var response = total_user_result[0].total_users;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_users_registered_today(start_date,end_date,req, res,callback) {
	var sql = "SELECT count(`user_id`) as `total_users_for_today` FROM `user` ";
	sql += "WHERE `is_verified`=? AND `created_on`>=? AND `created_on`<=? ";
	connection.query(sql, [1,start_date,end_date], function (err, totatuserstoday_result) {
		if (err) {
			responses.sendError(res);
			return;
		}
		if (totatuserstoday_result.length > 0) {
			var response = totatuserstoday_result[0].total_users_for_today;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_order(req, res,callback) {
	
	var sql = "SELECT count(`order_id`) as `total_orders` FROM `order_details`";
	connection.query(sql, [], function (err, total_order_result) {
		console.log(err);
		if (err) {
			responses.sendError(res);
			return;
		}
		if (total_order_result.length > 0) {
			var response = total_order_result[0].total_orders;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_today_order(start_date,end_date,req, res,callback) {
	var sql = "SELECT count(`order_id`) as `total_orders_for_today` FROM `order_details` ";
	sql += "WHERE `created_on`>=? AND `created_on`<=? ";
	connection.query(sql, [start_date,end_date], function (err, totatorderstoday_result) {
		if (err) {
			responses.sendError(res);
			return;
		}
		if (totatorderstoday_result.length > 0) {
			var response = totatorderstoday_result[0].total_orders_for_today;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_offers(req, res,callback) {
	
	var sql = "SELECT count(`offer_id`) as `total_offers` FROM `offer`";
	connection.query(sql, [], function (err, total_offer_result) {
		console.log(err);
		if (err) {
			responses.sendError(res);
			return;
		}
		if (total_offer_result.length > 0) {
			var response = total_offer_result[0].total_offers;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_offers_today(start_date,end_date,req, res,callback) {
	var sql = "SELECT count(`offer_id`) as `total_offers_for_today` FROM `offer` ";
	sql += "WHERE `created_on`>=? AND `created_on`<=? ";
	connection.query(sql, [start_date,end_date], function (err, totatofferstoday_result) {
		if (err) {
			responses.sendError(res);
			return;
		}
		if (totatofferstoday_result.length > 0) {
			var response = totatofferstoday_result[0].total_offers_for_today;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_earnings(req, res,callback) {
	
	var sql = "SELECT *  FROM `offer` WHERE `status`=?";
	connection.query(sql, [3], function (err, total_earning_result) {
		// console.log(err);
		if (err) {
			responses.sendError(res);
			return;
		}
		if (total_earning_result.length > 0) {
			// console.log(total_earning_result);
			var sum = 0;
			for (var i = 0; i < total_earning_result.length; i++) {
				sum = sum + parseInt(total_earning_result[i].amount);
			}
			var response = sum;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_reports(req, res, callback) {
	var sql = "SELECT count(`report_id`) as `total_reports`  FROM `report`";
	connection.query(sql, [], function (err, total_reports_result) {
		// console.log(err);
		if (err) {
			responses.sendError(res);
			return;
		}
		if (total_reports_result.length > 0) {
			var response = total_reports_result[0].total_reports;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_unresolved_reports(req, res, callback) {
	var sql = "SELECT count(`report_id`) as `total_reports`  FROM `report` WHERE `is_resolved`=?";
	connection.query(sql, [0], function (err, total_unresolved_reports_result) {
		console.log(err);
		if (err) {
			responses.sendError(res);
			return;
		}
		if (total_unresolved_reports_result.length > 0) {
			var response = total_unresolved_reports_result[0].total_reports;
		} else {
			var response = '';
		}
		callback(response)
	});
}

function total_resolved_reports(req, res, callback) {
	var sql = "SELECT count(`report_id`) as `total_reports`  FROM `report` WHERE `is_resolved`=?";
	connection.query(sql, [1], function (err, total_resolved_reports_result) {
		// console.log(err);
		if (err) {
			responses.sendError(res);
			return;
		}
		if (total_resolved_reports_result.length > 0) {
			var response = total_resolved_reports_result[0].total_reports;
		} else {
			var response = '';
		}
		callback(response)
	});
}

exports.get_total_user_graph_data = function(req,res){
	var access_token = req.body.access_token;
	var start_time = req.body.start_time;
	var end_time = req.body.end_time;

	var manvalues = [access_token];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function (result) {
			if (result == 0) {
				responses.sendError(res);
				return;
			} else {
				console.log(result);
				var sql = "SELECT * FROM `user` WHERE `created_on` >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)";
				connection.query(sql, [], function(err, results){
					console.log("aa");
					console.log(err);
					console.log(results);
				});
			}
		});
	}
}

exports.send_push_notification_to_user = function(req, res) {
	var access_token = req.body.access_token;
	var push_user = req.body.push_user;
	var push_msg = req.body.push_msg;

	var manvalues = [access_token, push_msg];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateAdminAccessToken(access_token, function (result) {
			if (result == 0) {
				responses.sendError(res);
				return;
			} else {
				if ( push_user == 1 ) {
					// Ios push notification
					var sql = "SELECT * FROM `user` WHERE `device_type`=?";
					connection.query(sql, [1], function(err, userResult){
						if ( err ) {
							responses.sendError(res);
							return;
						} else {
							if ( userResult.length > 0 ) {
								for (var i = 0; i < userResult.length; i++) {
									userResult[i]["password"] = "";
									userResult[i]["push_msg"] = push_msg;
								}
								async.eachSeries(userResult, send_notification_to_ios_user, function (err, results) {
	                                var response = {
	                                	status: constants.responseFlags.ACTION_COMPLETE,
	                                    flag: 1,
	                                    response: "Notification sent successfully.",
	                                    message: "Notification sent successfully."
	                                };
	                                res.json(response);
	                                return;
	                            });
							} else {
								var response = {
                                	status: constants.responseFlags.SHOW_ERROR_MESSAGE,
                                    flag: 1,
                                    response: "No user found to send notification.",
                                    message: "No user found to send notification."
                                };
                                res.json(response);
                                return;
							}
						}
					});
				} else if ( push_user == 2 ) {
					// Android push notification
					var sql = "SELECT * FROM `user` WHERE `device_type`=?";
					connection.query(sql, [2], function(err, userResult){
						if ( err ) {
							responses.sendError(res);
							return;
						} else {
							if ( userResult.length > 0 ) {
								for (var i = 0; i < userResult.length; i++) {
									userResult[i]["password"] = "";
									userResult[i]["push_msg"] = push_msg;
								}
								async.eachSeries(userResult, send_notification_to_android_user, function (err, results) {
	                                var response = {
	                                	status: constants.responseFlags.ACTION_COMPLETE,
	                                    flag: 1,
	                                    response: "Notification sent successfully.",
	                                    message: "Notification sent successfully."
	                                };
	                                res.json(response);
	                                return;
	                            });
                            } else {
								var response = {
                                	status: constants.responseFlags.SHOW_ERROR_MESSAGE,
                                    flag: 1,
                                    response: "No user found to send notification.",
                                    message: "No user found to send notification."
                                };
                                res.json(response);
                                return;
							}
						}
					});
				} else {
					// Both push notification
					var sql = "SELECT * FROM `user`";
					connection.query(sql, [], function(err, userResult){
						if ( err ) {
							responses.sendError(res);
							return;
						} else {
							if ( userResult.length > 0 ) {
								for (var i = 0; i < userResult.length; i++) {
									userResult[i]["password"] = "";
									userResult[i]["push_msg"] = push_msg;
								}
								async.eachSeries(userResult, send_notification_to_user, function (err, results) {
	                                var response = {
	                                	status: constants.responseFlags.ACTION_COMPLETE,
	                                    flag: 1,
	                                    response: "Notification sent successfully.",
	                                    message: "Notification sent successfully."
	                                };
	                                res.json(response);
	                                return;
	                            });

                            } else {
								var response = {
                                	status: constants.responseFlags.SHOW_ERROR_MESSAGE,
                                    flag: 1,
                                    response: "No user found to send notification.",
                                    message: "No user found to send notification."
                                };
                                res.json(response);
                                return;
							}
						}
					});
				}
			}
		});
	}
}

function send_notification_to_user(userResult, callback) {
	if ( userResult.device_token != "" ) {
        var serverKey = config.get('serverFCMKey');
        var fcm = new FCM(serverKey);

        if ( userResult.device_type == 1 ) {
            var message = { 
                to: userResult.device_token, 
                collapse_key: 'otlbni',
                notification: {
                	"title" : "OTLBNI",
                    "body" : userResult.push_msg
                }
            };
            fcm.send(message, function(err, response){
                if (err) {
                	console.log(err);
                    callback();
                } else {
                	console.log(response);
                    callback();
                }
            });
        } else if (userResult.device_type == 2) {
            var message = {
                to: userResult.device_token, 
                collapse_key: 'otlbni',
                notification: {
                    title: 'OTLBNI', 
                    body:  userResult.push_msg
                }
            };
            fcm.send(message, function(err, response){
                if (err) {
                	console.log(err);
                    callback();
                } else {
                	console.log(response);
                    callback();
                }
            });
        } else {
        	callback();
        }
    } else {
        callback();
    }
}

function send_notification_to_ios_user(userResult, callback) {
	if ( userResult.device_token != "" ) {
        var serverKey = config.get('serverFCMKey');
        var fcm = new FCM(serverKey);

        var message = { 
            to: userResult.device_token, 
            collapse_key: 'otlbni',
            notification: {
            	"title" : "OTLBNI",
                "body" : userResult.push_msg
            }
        };
        fcm.send(message, function(err, response){
            if (err) {
            	console.log(err);
                callback();
            } else {
            	console.log(response);
                callback();
            }
        });
    } else {
        callback();
    }
}

function send_notification_to_android_user(userResult, callback) {
	if ( userResult.device_token != "" ) {
        var serverKey = config.get('serverFCMKey');
        var fcm = new FCM(serverKey);

        var message = {
            to: userResult.device_token, 
            collapse_key: 'otlbni',
            notification: {
                title: 'OTLBNI', 
                body:  userResult.push_msg
            }
        };
        fcm.send(message, function(err, response){
            if (err) {
            	console.log(err);
                callback();
            } else {
            	console.log(response);
                callback();
            }
        });
    } else {
        callback();
    }
}