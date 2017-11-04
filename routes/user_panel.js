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
var notification = require('./notification');

exports.social_login = function(req, res) {
	var social_type = req.body.social_type;
	var social_id = req.body.social_id;
	var device_token = req.body.device_token;
	var device_type = req.body.device_type;

	var sql = "SELECT * FROM `user` WHERE fb_id=? OR g_id=? OR twitter_id=? LIMIT 1";
	connection.query(sql, [social_id, social_id, social_id], function(err, response) {
		// console.log(response);
		if (err) {
			responses.sendError(res);
			return;
		} else if ( response.length > 0 ) {
			// console.log(response[0]);
			if ( response[0].is_verified == 0 ) {
				var otp = utils.generateRandomString();
				var access_token = md5(utils.generateRandomString());
				var mobile_number = response[0].mobile_number;

				var update_otp = "UPDATE `user` SET `verification_code`="+otp+", `access_token`='"+access_token+"', `device_token`='"+device_token+"', `device_type`='"+device_type+"' WHERE `user_id`=?";
				connection.query(update_otp, [response[0].user_id], function(err, result){
					// var username = response[0].user_name;
					console.log(mobile_number);
					messenger.sendOTP("Customer", mobile_number, otp);
					if (err) {
						responses.sendError(res);
						return;
					}
				});
				var response = {
					flag: 2,
					response: {"access_token": access_token},
					message: "Please enter OTP."
				};
				res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
			} else {
				var access_token = md5(utils.generateRandomString());
				var update_otp = "UPDATE `user` SET `access_token`='"+access_token+"', `device_token`='"+device_token+"', `device_type`='"+device_type+"' WHERE `user_id`=?";
				connection.query(update_otp, response[0].user_id, function(err, result){
					if(err) {
						responses.sendError(res);
						return;
					} 
				}); 
				response[0].access_token = access_token;
				if ( response[0]["profile_url"] != "" ) {
					response[0]["profile_url"] = "user/"+response[0]["profile_url"];
				}
				var response = {
					flag: 1,
					response: response[0],
					message: "Successfully login"
				};
				res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
			}       
		} else {	
			var response = {
				flag: 3,
				response: {},
				message: "Please enter mobile number."
			};
			res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
		}
	});	
}

exports.insert_mobile_number = function(req, res) {

	var social_type = req.body.social_type;
	var social_id = req.body.social_id;
	var mobile_number = req.body.mobile_number;
	var lattitude = req.body.lattitude;
	var longitude = req.body.longitude;
	var device_token = req.body.device_token;
	var device_type = req.body.device_type;
	console.log(social_type);

	var sql = "SELECT * FROM `user` WHERE mobile_number=? LIMIT 1";
	connection.query(sql, [mobile_number], function(err, response) {
		// console.log(response.length);
		if (err) {
			responses.sendError(res);
			return;
		}  else if ( response.length > 0 ) {
			
			var response = {
				flag: 4,
				response: {},
				message: "Mobile number is already register with "+response[0].social_type+" Account. Please login for register mobile number"
			};
			res.status(constants.responseFlags.ALREADY_EXIST).json(response);  
					
		} else {
			var user_id = utils.generateRandomString();
			var user_unique_id = md5(user_id);
			var access_token = md5(utils.generateRandomString());
			var otp = utils.generateRandomString();
			
			if ( social_type == "facebook" ) {
 				var social_type_text = "fb_id";
			} else if ( social_type == "google" ) {
				var social_type_text = "g_id";
			} else if ( social_type == "twitter" ) {
				var social_type_text = "twitter_id";
			}

			var currentTime = new Date();
            var created_on = Math.round(currentTime.getTime() / 1000);

			var sql = "INSERT INTO `user`(`user_id`,`mobile_number`, `social_type`, `access_token`, `"+social_type_text+"`, `verification_code`, `device_type`, `device_token`, `lattitude`, `longitude`, `created_on`) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
			var value = [user_unique_id, mobile_number, social_type, access_token, social_id, otp, device_type, device_token, lattitude, longitude, created_on];
			connection.query(sql, value, function (err, result) {
				if (err) {
					responses.sendError(res);
					return;
				} else {
					messenger.sendOTP("Customer", mobile_number, otp);
					// var user_details = {
					// 	"user_id": user_unique_id,
					// 	"user_name": user_name,
					// 	"user_email": user_email,
					// 	"mobile_number": mobile_number,
					// 	"access_token": access_token
					// };
					var response = {
						flag: 2,
						response: {"access_token": access_token},
						message: "Please enter OTP."
					};
					res.status(constants.responseFlags.ACTION_COMPLETE).json(response); 
				}
			});
		}
	});
}

exports.verify_user = function(req, res) {

    var access_token = req.body.access_token;
    var otp = req.body.otp;

	var get_otp = "SELECT * FROM `user` WHERE `access_token`=? AND `verification_code`=? LIMIT 1";
	connection.query(get_otp, [access_token, otp], function(err, user) {

		if (user.length > 0) {
			var is_verified = 1;
			var update_otp = "UPDATE `user` SET `is_verified`=? WHERE `access_token`=?";
			connection.query(update_otp, [is_verified, access_token], function(err, result){
				if ( user[0]["profile_url"] != "" ) {
					user[0]["profile_url"] = "user/"+user[0]["profile_url"];
				}
				// user[0]["password"] = "";
				var response = {
					flag: 1,
					response: user[0],
					message: "Successfully verified"
				};
				res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
			});
		} else {
			var response = {
				flag: 1,
				response: {},
				message: "OTP not verified"
			};
			res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
		}
	});
};

exports.logout = function(req, res) {
	var access_token = req.body.access_token;
	var update_otp = "UPDATE `user` SET `access_token`= '', `device_token`= '' WHERE `access_token`=?";
	connection.query(update_otp, access_token, function(err, result){
		if (err) {
			console.log(err);
		} else {
			var response = {
				flag: 1,
				response: {},
				message: "Logout Successfully"
			};
			res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
		}
	});
}

exports.create_account = function(req, res) {

	var social_type = req.body.social_type;
	var mobile_number = req.body.mobile_number;
	var lattitude = req.body.lattitude;
	var longitude = req.body.longitude;
	var device_token = req.body.device_token;
	var device_type = req.body.device_type;
	// var password = req.body.password;

	var sql = "SELECT * FROM `user` WHERE mobile_number=? LIMIT 1";
	connection.query(sql, [mobile_number], function(err, response) {
		// console.log(response.length);
		if (err) {
			responses.sendError(res);
			return;
		}  else if ( response.length > 0 ) {
			
			var message_response = "Mobile number is already register with "+response[0].social_type+" Account. Please login for register mobile number";
			var response = {
				flag: 4,
				response: {},
				message: message_response
			};
			res.status(constants.responseFlags.ALREADY_EXIST).json(response);  
					
		} else {
			var user_id = utils.generateRandomString();
			var user_unique_id = md5(user_id);
			var access_token = md5(utils.generateRandomString());
			var otp = utils.generateRandomString();
			var currentTime = new Date();
            var created_on = Math.round(currentTime.getTime() / 1000);
			
			var sql = "INSERT INTO `user`(`user_id`,`mobile_number`, `social_type`, `access_token`, `verification_code`, `device_type`, `device_token`, `lattitude`, `longitude`, `created_on`) VALUES (?,?,?,?,?,?,?,?,?,?)";
			var value = [user_unique_id, mobile_number, social_type, access_token, otp, device_type, device_token, lattitude, longitude, created_on];
			connection.query(sql, value, function (err, result) {
				if (err) {
					responses.sendError(res);
					return;
				} else {
					messenger.sendOTP("Customer", mobile_number, otp);
					// var user_details = {
					// 	"user_id": user_unique_id,
					// 	"user_name": user_name,
					// 	"user_email": user_email,
					// 	"mobile_number": mobile_number,
					// 	"access_token": access_token
					// };
					var response = {
						flag: 2,
						response: {"access_token": access_token},
						message: "Please enter OTP."
					};
					res.status(constants.responseFlags.ACTION_COMPLETE).json(response); 
				}
			});
		}
	});	
}

exports.login = function(req, res) {
	var mobile_number = req.body.mobile_number;
	// var password = req.body.password;
	var device_token = req.body.device_token;
	var device_type = req.body.device_type;
	var manvalues = [mobile_number];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		// var encrypted_pass = md5(password);
		// console.log(encrypted_pass);
		var sql = "SELECT * FROM `user` WHERE `mobile_number`=? LIMIT 1";
		connection.query(sql, [mobile_number], function(err, result_check) {
			if (err) {
				responses.sendError(res);
				return;
			} else {
				if (result_check.length == 0) {
					var response = {
						"flag": 1,
						"response": {},
						"message": "Your number is not register yet, so we are forwarding you for signup."			
					};
					res.status(constants.responseFlags.INVALID_MOBILE_NUMBER).json(response);
					return;
				} else {
					// if (result_check[0].password != encrypted_pass) {
					// 	var response = {
					// 		"status": constants.responseFlags.WRONG_PASSWORD,
					// 		"flag": 1,
					// 		"response": {},

					// 		"message": constants.responseMessages.INCORRECT_PASSWORD
					// 	};
					// 	res.send(JSON.stringify(response));
					// 	return;
					// } else {

						// if ( result_check[0].is_verified == 0 ) {
							var otp = utils.generateRandomString();
							var access_token = md5(utils.generateRandomString());
							var mobile_number = result_check[0].mobile_number;

							var update_otp = "UPDATE `user` SET `verification_code`="+otp+", `access_token`='"+access_token+"', `device_token`='"+device_token+"', `device_type`='"+device_type+"' WHERE `user_id`=?";
							connection.query(update_otp, [result_check[0].user_id], function(err, result){
								// var username = response[0].user_name;
								messenger.sendOTP("Customer", mobile_number, otp);
								if (err) {
									responses.sendError(res);
									return;
								}
							});
							var response = {
								flag: 2,
								response: {"access_token": access_token},
								message: "Please enter OTP."
							};
							res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
							// console.log("Please enter OTP");
						// } else {
						// 	var otp = utils.generateRandomString();
						// 	var access_token = md5(utils.generateRandomString());
						// 	console.log(access_token);
						// 	var update_otp = "UPDATE `user` SET `verification_code`="+otp+", `access_token`='"+access_token+"', `device_token`='"+device_token+"' WHERE `user_id`=?";

						// 	connection.query(update_otp, result_check[0].user_id, function(err, result){
						// 		messenger.sendOTP("Customer", result_check[0].mobile_number, otp);
						// 		if (err) {
						// 			responses.sendError(res);
						// 			return;
						// 		} else {
						// 			result_check[0]["access_token"] = access_token;
						// 			// result_check[0]["password"] = "";
						// 			result_check[0]["device_token"] = device_token;
						// 			if ( result_check[0]["profile_url"] != "" ) {
						// 				result_check[0]["profile_url"] = "user/"+result_check[0]["profile_url"];
						// 			}
						// 			var response = {
						// 				"status": constants.responseFlags.LOGIN_SUCCESSFULLY,
						// 				"flag": 1,
						// 				"message": constants.responseMessages.LOGIN_SUCCESSFULLY,
						// 				"response": result_check[0]
						// 			};
						// 			res.send(JSON.stringify(response));
						// 			return;
						// 		}
						// 	});
						// }
					// }
				}
			}
		});
	}
}

exports.get_otp_using_mobilenumber = function(req, res) {

    var data_key = req.body.data_key;
    var is_data = req.body.is_data;
    var isBlank = utils.checkBlank([data_key]);
    if (isBlank == 1) {
        var response = {
            "error": "some parameter missing",
            "flag": constants.responseFlags.PARAMETER_MISSING
        };
        res.status(constants.responseFlags.PARAMETER_MISSING).json(response);
    } else {
        var get_otp = "SELECT * FROM `user` WHERE `"+is_data+"`=?  LIMIT 1";
        connection.query(get_otp, [data_key], function(err, user) {
            if (user.length > 0) {
                var otp = utils.generateRandomString();

               	var update_otp = "UPDATE `user` SET `verification_code`="+otp+" WHERE `"+is_data+"`=?";
		       	connection.query(update_otp, [data_key], function(err, result){
		       		console.log(user);
                    messenger.sendOTP("Customer", user[0].mobile_number, otp);
		       	});

		    	var response = {
					flag: 2,
					response: {"access_token": user[0].access_token},
					message: "OTP send successfully."
				};
				res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                
            } else {
                var response = {
					flag: 1,
					response: {},
					message: "User not found"	
                };
                res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
            }
        });
    }
};

exports.verify_otp = function(req, res) {

    var access_token = req.body.access_token;
    var otp = req.body.otp;

	var get_otp = "SELECT * FROM `user` WHERE `access_token`=? AND `verification_code`=? LIMIT 1";
	connection.query(get_otp, [access_token, otp], function(err, user) {

		if (user.length > 0) {
			// if ( user[0]["profile_url"] != "" ) {
			// 	user[0]["profile_url"] = "user/"+user[0]["profile_url"];
			// }
			// var response = {
			// 	flag: 1,
			// 	response: user[0],
			// 	message: "Successfully verified"
			// };
			// res.status(constants.responseFlags.ACTION_COMPLETE).json(response);

			var is_verified = 1;
			var update_otp = "UPDATE `user` SET `is_verified`=? WHERE `access_token`=?";
			connection.query(update_otp, [is_verified, access_token], function(err, result){
				if ( user[0]["profile_url"] != "" ) {
					user[0]["profile_url"] = "user/"+user[0]["profile_url"];
				}
				// user[0]["password"] = "";
				user[0]["is_verified"] = is_verified;
				var response = {
					flag: 1,
					response: user[0],
					message: "Successfully verified"
				};
				res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
			});

		} else {
			var response = {
				flag: 1,
				response: {},
				message: "Incorrect OTP"
			};
			res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
		}
	});
};

exports.reset_password = function(req, res) {

    var access_token = req.body.access_token;
    var password = req.body.new_password;

	var get_user = "SELECT * FROM `user` WHERE `access_token`=? LIMIT 1";
	connection.query(get_user, [access_token], function(err, user) {

		if (user.length > 0) {
			console.log(user);
			var hash = md5(password);
			console.log(hash);
			var update_otp = "UPDATE `user` SET `password`='"+hash+"' WHERE `access_token`=?";
	       	connection.query(update_otp, [access_token], function(err, result){
	       		if (err) {
	       			responses.sendError(res);
					return;
	       		} else {
	       			var response = {
						flag: 1,
						response: {},
						message: "Password changed successfully"
					};
					res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
	       		}
	       	});

		} else {
			var response = {
				flag: 1,
				response: {},
				message: "Something went wrong"
			};
			res.status(constants.responseFlags.SHOW_ERROR_MESSAGE).json(response);
		}
	});
};
 
exports.edit_profile = function(req, res) {
	var access_token = req.body.access_token;
	var is_thumbnail = req.body.is_thumbnail;
	var user_name = req.body.user_name;
	var user_email = req.body.user_email;
	var check_email = req.body.check_email;
	
	utils.authenticateUser(access_token, function(result) {
        if (result == 0) {
             var response = {
				flag: 1,
				response: {},
				message: "Invalid access token."	
			};
			res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
			return;
        } else {
        	var user_id = result[0].user_id;
        	if ( req.file != undefined ) {
				update_user_profile(access_token,is_thumbnail,req.file.filename,user_name,user_email,user_id,result[0].social_type,check_email,req,res);
        	} else {
        		var user_profile_url = "";
        		update_user_profile(access_token,is_thumbnail,user_profile_url,user_name,user_email,user_id,result[0].social_type,check_email,req,res);
        	}
        }
    });
}

function update_user_profile(access_token,is_thumbnail,user_profile_url,user_name,user_email,user_id,social_type,check_email,req,res) {
	if ( is_thumbnail = "1" ) {
		var profile_url = user_profile_url;
	} else {
		var profile_url = "";
	}

	if ( check_email == 1 ) {
		var sql = "SELECT * FROM `user` WHERE user_email=? LIMIT 1";
		connection.query(sql, [user_email], function(err, response) {
			// console.log(response.length);
			if (err) {
				responses.sendError(res);
				return;
			}  else if ( response.length > 0 ) {
				var message_response = "This email already exist with "+social_type+" Account.";
				var response = {
					flag: 1,
					response: {},
					message: message_response
				};
				res.status(constants.responseFlags.ALREADY_EXIST).json(response);  
						
			} else {

				var update_user = "UPDATE `user` SET `user_name`='"+user_name+"', `user_email`='"+user_email+"', `profile_url`='"+profile_url+"' WHERE `user_id`=?";
				connection.query(update_user, [user_id], function(err, result){
					if (err) {
						responses.sendError(res);
						return;
					} else {

						var get_user = "SELECT * FROM `user` WHERE `user_id`=?";
						connection.query(get_user, [user_id], function(err, user){
							if (err) {
								responses.sendError(res);
								return;
							} else {
								// user[0]["password"] = "";
								if ( user[0]["profile_url"] != "" ) {
									user[0]["profile_url"] = "user/"+profile_url;
								} 
								
								var response = {
									flag: 1,
									response: user[0],
									message: "Profile updated successfully"
								};
								res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
							}
						});
					}
				});
			}
		});
	} else {
		var update_user = "UPDATE `user` SET `user_name`='"+user_name+"', `user_email`='"+user_email+"', `profile_url`='"+profile_url+"' WHERE `user_id`=?";
		connection.query(update_user, [user_id], function(err, result){
			if (err) {
				responses.sendError(res);
				return;
			} else {

				var get_user = "SELECT * FROM `user` WHERE `user_id`=?";
				connection.query(get_user, [user_id], function(err, user){
					if (err) {
						responses.sendError(res);
						return;
					} else {
						// user[0]["password"] = "";
						if ( user[0]["profile_url"] != "" ) {
							user[0]["profile_url"] = "user/"+profile_url;
						} 
						
						var response = {
							flag: 1,
							response: user[0],
							message: "Profile updated successfully"
						};
						res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
					}
				});
			}
		});
	}
}

exports.get_user_details = function(req, res) {
	var access_token = req.body.access_token;
	var manvalues = [access_token];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	             var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {
	        	var user_id = result[0].user_id;
	        	var sql = "SELECT * FROM `user` where `user_id`=? LIMIT 1";
	        	connection.query(sql, [user_id], function(err, result) {
	        		if (err) {
	        			console.log(err);
	        		} else {

	        			for (var i = 0; i < result.length; i++) {
        					if( result[i].profile_url != '' ) {
        						result[i].profile_url = 'user/'+result[i].profile_url;
        					}
    					}

	        			var revenue_sql = "SELECT * FROM `delivery` WHERE `delivered_by_id`=?";
	        			connection.query(revenue_sql, [user_id], function(err, revenueResult){
	        				if (err){
	        					responses.sendError(res);
	        					return;
	        				} else {
	        					var total_revenue = 0;
	        					for (var i = 0; i < revenueResult.length; i++) {
	        						console.log(revenueResult[i].delivered_amount);
	        						total_revenue = total_revenue + parseInt(revenueResult[i].delivered_amount);
	        					}
	        					console.log(total_revenue);
	        					var order_count = revenueResult.length;

	        					var bill_sql = "SELECT * FROM `delivery` WHERE `delivered_to_id`=?";
			        			connection.query(bill_sql, [user_id], function(err, billResult){
			        				if (err){
			        					responses.sendError(res);
			        					return;
			        				} else {
			        					var order_cost = 0;
			        					var delivered_amount = 0;
			        					for (var i = 0; i < billResult.length; i++) {
			        						order_cost = order_cost + parseInt(billResult[i].order_cost);
			        						delivered_amount = delivered_amount + parseInt(billResult[i].delivered_amount);
			        					}
			        					var total_bill_paid = order_cost + delivered_amount;

			        					var user_rating_sql = "SELECT * FROM `user_rating` WHERE `user_rating_to_id`=?";
					        			connection.query(user_rating_sql, [user_id], function(err, userRatingResult){
					        				if (err){
					        					responses.sendError(res);
					        					return;
					        				} else {
					        					var user_rating_text = 0;
					        					for (var i = 0; i < userRatingResult.length; i++) {
					        						user_rating_text = user_rating_text + parseInt(userRatingResult[i].rating_count);
					        					}
					        					var user_rating_length = userRatingResult.length;
					        					var user_rating_count  = user_rating_text / user_rating_length;

					        					if ( userRatingResult.length == 0 ) {
					        						user_rating_count = 0;
					        					}

					        					// result[0]["password"] = "";
					        					console.log(result[0]);
							        			var response = {
							        				flag: 1,
							        				response: {
							        					"user_details": result[0],
							        					"account_balance": result[0].account_balance,
							        					"rating": user_rating_count,
							        					"delivery_revenue": total_revenue,
							        					"bill_paid": total_bill_paid,
							        					"order_count": order_count,
							        					"rating_count": user_rating_length
							        				},
							        				message: "Successfully data fetched"
							        			}
							        			res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
					        				}
					        			});
			        				}
			        			});
	        				}
	        			});
	        		}
	        	});
	        }
	    });
	}
}

exports.get_other_user_details = function(req, res) {
	var user_id = req.body.user_id;
	var manvalues = [user_id];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
    	// var user_id = result[0].user_id;
    	var sql = "SELECT * FROM `user` where `user_id`=? LIMIT 1";
    	connection.query(sql, [user_id], function(err, result) {
    		if (err) {
    			console.log(err);
    		} else {
    			for (var i = 0; i < result.length; i++) {
					if( result[i].profile_url != '' ) {
						result[i].profile_url = 'user/'+result[i].profile_url;
					}
				}
    			var revenue_sql = "SELECT * FROM `delivery` WHERE `delivered_by_id`=?";
    			connection.query(revenue_sql, [user_id], function(err, revenueResult){
    				if (err){
    					responses.sendError(res);
    					return;
    				} else {
    					var total_revenue = 0;
    					for (var i = 0; i < revenueResult.length; i++) {
    						total_revenue = total_revenue + parseInt(revenueResult[i].delivered_amount);
    					}
    					var order_count = revenueResult.length;

    					var bill_sql = "SELECT * FROM `delivery` WHERE `delivered_to_id`=?";
	        			connection.query(bill_sql, [user_id], function(err, billResult){
	        				if (err){
	        					responses.sendError(res);
	        					return;
	        				} else {
	        					var order_cost = 0;
	        					var delivered_amount = 0;
	        					for (var i = 0; i < billResult.length; i++) {
	        						order_cost = order_cost + parseInt(billResult[i].order_cost);
	        						delivered_amount = delivered_amount + parseInt(billResult[i].delivered_amount);
	        					}
	        					var total_bill_paid = order_cost + delivered_amount;

	        					var user_rating_sql = "SELECT * FROM `user_rating` WHERE `user_rating_to_id`=?";
			        			connection.query(user_rating_sql, [user_id], function(err, userRatingResult){
			        				if (err){
			        					responses.sendError(res);
			        					return;
			        				} else {
			        					var user_rating_text = 0;
			        					for (var i = 0; i < userRatingResult.length; i++) {
			        						user_rating_text = user_rating_text + parseInt(userRatingResult[i].rating_count);
			        					}
			        					var user_rating_length = userRatingResult.length;
			        					var user_rating_count  = user_rating_text / user_rating_length;

			        					if ( userRatingResult.length == 0 ) {
			        						user_rating_count = 0;
			        					}
					        					
			        					// result[0]["password"] = "";
					        			var response = {
					        				flag: 1,
					        				response: {
					        					"user_details": result[0],
					        					"account_balance": result[0].account_balance,
					        					"rating": user_rating_count,
					        					"delivery_revenue": total_revenue,
					        					"bill_paid": total_bill_paid,
					        					"order_count": order_count,
					        					"rating_count": user_rating_length
					        				},
					        				message: "Successfully data fetched"
					        			}
					        			res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
			        				}
			        			});
	        				}
	        			});
    				}
    			});
    		}
    	});
	}
}

exports.send_notification = function(req, res) {
	var FCM = require('fcm-node');
    var serverKey = 'AAAAmiznu3M:APA91bHRQ7h0VbuTPBxf0JGguj-pxmBiCZKCyq0EOJBDa-PR-o16BpBJsCu-SbxzLrj26UNZ5n6LrMXo_AaCpHCyZ3xCAsXyxvsqN4MLy0FcIpEei6Siph0mSrvaVFLgHW_ckdrkcnMV'; //put your server key here 
    var fcm = new FCM(serverKey);
 
    // var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
    //     to: 'eH75FLufVRI:APA91bGJQ0bS4qI978GV-LxOc4obyr5f0ceWZBUlGqfAfoZSSWnD0RnoBHZoCjs5gj4BlWlHzZ3L40QJbaattmtj_9tXc54Kcua01JZ62V7ADqx3L_IJJRhIn_dBow06N9Mbj0dgH5oH', 
    //     collapse_key: 'otlbni',
        
    //     notification: {
    //         title: 'Title of your push notification', 
    //         body: 'Body of your push notification' 
    //     }
    // };


    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
        to: 'eH75FLufVRI:APA91bGJQ0bS4qI978GV-LxOc4obyr5f0ceWZBUlGqfAfoZSSWnD0RnoBHZoCjs5gj4BlWlHzZ3L40QJbaattmtj_9tXc54Kcua01JZ62V7ADqx3L_IJJRhIn_dBow06N9Mbj0dgH5oH', 
        collapse_key: 'otlbni',
        // aps: {
        // 	"title": 'OTLBNI',
        // 	"alert": {
	       //      notification_type: "1",
	       //      notification_type_id: "1",
	       //      access_token: "access_token"
	       //  },
        // 	"badge": 1,
        // 	"sound":"default"
        // }
        notification: {
        	"title" : "Game Request",
            "body" : "Bob wants to play poker",
		    "aps" : {
		        "alert" : {
		            "data" : {
                        "notification_type": "1",
                        "notification_type_id": "order_id"
                    }
		        },
		        "badge" : 5
		    }
		}
    };
    
    fcm.send(message, function(err, response){
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}

exports.report_user = function(req, res) {
	console.log(req.files);
	var access_token = req.body.access_token;
	var report_to_id = req.body.report_to_id;
	var report_type = req.body.report_type;
	var report_description = req.body.report_description;

	var manvalues = [access_token];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	             var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {
	        	var report_by_id = result[0].user_id;

	        	var report_unique_id = utils.generateRandomString();
                var report_id = md5(report_unique_id);
                var currentTime = new Date();
                var created_on = Math.round(currentTime.getTime() / 1000);

                var sql = "INSERT INTO `report`(`report_id`, `report_by_id`, `report_to_id`, `report_type`, `report_description`, `created_on`) VALUES (?,?,?,?,?,?)";
                var value = [report_id, report_by_id, report_to_id, report_type, report_description, created_on];
                connection.query(sql, value, function (err, result) {
                    if (err) {
                        responses.sendError(res);
                        return;
                    } else {

                    	var file = req.files;
                    	for (var i = 0; i < file.length; i++) {
                    		console.log(file);
                    		var report_gallery_unique_id = utils.generateRandomString();
			                var report_gallery_id = md5(report_gallery_unique_id);
			                var currentTime = new Date();
			                var created_on = Math.round(currentTime.getTime() / 1000);

			                if ( file[i] != undefined ) {
			                	var file_image = file[i].filename;
			                } else {
			                	var file_image = "";
			                }
			                if ( file[i] != undefined ) {
		                    	var sql = "INSERT INTO `report_gallery`(`report_gallery_id`, `report_id`, `report_image_url`, `created_on`) VALUES (?,?,?,?)";
				                var value = [report_gallery_id, report_id, file_image, created_on];
				                connection.query(sql, value, function (err, galleryResult) {
				                	console.log(err);
				                    if (err) {
				                        responses.sendError(res);
				                        return;
				                    } else {
				                    }
				                });	
				            }
                    	}
                    	var response = {
                    		flag: 1,
                    		response: {},
                    		message: "Successfully report user."
                    	}
                    	res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
                    }
                });
	        }
	    });
	}
}

exports.delivered = function(req, res) {
	
	var access_token = req.body.access_token;
	var delivered_to_id = req.body.	delivered_to_id;
	var delivered_type = req.body.delivered_type;
	var order_id = req.body.order_id;
	var delivered_amount = req.body.delivered_amount;
	var order_cost = req.body.order_cost;
	var offer_id = req.body.offer_id;

	var manvalues = [access_token];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	             var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {

	        	var order_check = "SELECT * FROM `order_details` WHERE `order_id`=?";
	        	connection.query(order_check, [order_id], function(err, billCheckResult){
	        		console.log(billCheckResult);
	        		if (err) {
	        			responses.sendError(res);
	        			return;
	        		} else {
	        			if ( billCheckResult[0].is_bill == 1 ) {

	        				var delivered_by_id = result[0].user_id;
				        	var delivered_unique_id = utils.generateRandomString();
			                var delivered_id = md5(delivered_unique_id);
			                var currentTime = new Date();
			                var created_on = Math.round(currentTime.getTime() / 1000);

			                var sql = "INSERT INTO `delivery`(`delivered_id`, `delivered_by_id`, `delivered_to_id`, `delivered_type`, `delivered_amount`, `order_cost`, `created_on`) VALUES (?,?,?,?,?,?,?)";
			                var value = [delivered_id, delivered_by_id, delivered_to_id, delivered_type, delivered_amount, order_cost, created_on];
			                connection.query(sql, value, function (err, result) {
			                	console.log(err);
			                    if (err) {
			                        responses.sendError(res);
			                        return;
			                    } else {
			                    	var sql = "UPDATE `offer` SET `status`='2' WHERE `offer_id`=?";
			                        connection.query(sql, [offer_id], function(err, result) {
			                            // console.log(err);
			                            if (err) {
			                                responses.sendError(res);
			                                return;
			                            } else {
					                    	var sql = "UPDATE `order_details` SET `status`='3' WHERE `order_id`=?";
					                        connection.query(sql, [order_id], function(err, result) {
					                            // console.log(err);
					                            if (err) {
					                                responses.sendError(res);
					                                return;
					                            } else {
					                            	var user_sql = "SELECT * FROM `user` WHERE `user_id`=?";
					                            	connection.query(user_sql, [delivered_by_id], function(err, userResult){
					                            		if (err) {
					                            			responses.sendError(res);
					                            			return;
					                            		} else {
						                            		var account_balance = (delivered_amount * 20 ) / 100;
						                            		if ( userResult[0].account_balance == '' ) {
						                            			var acc = 0;
						                            		} else {
						                            			var acc = parseInt(userResult[0].account_balance);
						                            		}
						                            		var total_account_balance = parseInt(account_balance) + acc;
							                            	var sql = "UPDATE `user` SET `account_balance`='"+total_account_balance+"' WHERE `user_id`=?";
									                        connection.query(sql, [delivered_by_id], function(err, result) {
									                            console.log(result);
									                            if (err) {
									                                responses.sendError(res);
									                                return;
									                            } else {

									                            	var notification_unique_id = utils.generateRandomString();
									                                var notification_id = md5(notification_unique_id);
									                                var currentTime = new Date();
									                                var created_on = Math.round(currentTime.getTime() / 1000);
									                                var notification_type = "4";
									                                var notification_text = "Your order is completed";
									                                
									                                var sql = "INSERT INTO `notification`(`notification_id`,`sender_id`, `receiver_id`, `notification_type`, `notification_text`, `notification_type_id`, `created_on`) VALUES (?,?,?,?,?,?,?)";
									                                var value = [notification_id, delivered_by_id, delivered_to_id, notification_type, notification_text , order_id, created_on];
									                                connection.query(sql, value, function (err, result) {
									                                    console.log(err);
									                                    if (err) {
									                                        responses.sendError(res);
									                                        return;
									                                    } else {
									                                    	var FCM = require('fcm-node');
									                                        var serverKey = config.get('serverFCMKey'); //put your server key here 
									                                        console.log(userResult[0].device_token);
									                                        var fcm = new FCM(serverKey);
									                                     
									                                     	if ( userResult[0].device_type == 1 ) {
								                                            	var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
								                                                    to: userResult[0].device_token, 
								                                                    collapse_key: 'otlbni',
								                                                    notification: {
																			        	"title" : "OTLBNI",
																			            "body" : notification_text,
																					    "aps" : {
																					        "alert" : {
																					            "data" : {
																			                        "notification_type": notification_type,
									                                                                "notification_type_id": order_id,
									                                                                "access_token": access_token,
                                                                        							"notification_id": notification_id
																			                    }
																					        },
																					        "badge" : 5
																					    }
																					}
								                                                };
								                                            } else {
										                                        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
										                                            "to": userResult[0].device_token, 
										                                            "collapse_key": 'otlbni',
										                                            "data": {
										                                                "notification_type": notification_type,
										                                                "notification_type_id": order_id,
										                                                "access_token": access_token,
                                                                        				"notification_id": notification_id,
                                                                        				"title": 'OTLBNI', 
										                                                "body":  notification_text
										                                            }
										                                        };
										                                    }
									                                        
									                                        fcm.send(message, function(err, response){
									                                            if (err) {
									                                                // return callback(0);
									                                                console.log(err);
									                                            } else {
									                                                // return callback(1);
									                                                console.log("jhj"+response);
									                                            }
									                                        });

									                                        var response = {
													                    		flag: 1,
													                    		response: {},
													                    		message: "Successfully delivered."
													                    	}
													                    	res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
									                                    }
									                                });
									                            }
									                        });
									                    }
					                            	});
							                    }
							                });
										}
									});
			                    }
			                });
	        			} else {
	        				var response = {
	        					flag: 6,
	        					response: {},
	        					message: "Please create bill first"
	        				}
	        				res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
	        			}
	        		}
	        	});
	        }
	    });
	}
}

exports.user_feedback = function(req, res) {
	var access_token = req.body.access_token;
	var rating_to_id = req.body.rating_to_id;
	var rating_count = req.body.rating_count;
	var rating_comment = req.body.rating_comment;
	var order_id = req.body.order_id;

	var manvalues = [access_token, rating_to_id, rating_count];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	             var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {
	        	
	        	var rating_by_id = result[0].user_id;
	        	var check_user = "SELECT * FROM `user_rating` WHERE `user_rating_by_id`=? AND `user_rating_to_id`=? AND `order_id`=? LIMIT 1";
	        	connection.query(check_user, [rating_by_id, rating_to_id, order_id], function(err, checkResult){
	        		if (err) {
	        			responses.sendError(res);
	        			return;
	        		} else {

	        			if ( checkResult.length > 0 ) {
	        				var response = {
	        					flag: 5,
	        					response: {},
	        					message: "You have already rated to this person"
	        				}
	        				res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
	        			} else {
		        			var rating_unique_id = utils.generateRandomString();
			                var rating_id = md5(rating_unique_id);
			                var currentTime = new Date();
			                var created_on = Math.round(currentTime.getTime() / 1000);

			                var sql = "INSERT INTO `user_rating`(`rating_id`, `user_rating_by_id`, `user_rating_to_id`, `rating_count`, `rating_comment`, `order_id`, `created_on`) VALUES (?,?,?,?,?,?,?)";
			                var value = [rating_id, rating_by_id, rating_to_id, rating_count, rating_comment, order_id, created_on];
			                connection.query(sql, value, function (err, result) {
			                	console.log(err);
			                    if (err) {
			                        responses.sendError(res);
			                        return;
			                    } else {
			                    	var response = {
			                    		flag: 1,
			                    		response: {},
			                    		message: "Successfully send feedback."
			                    	}
			                    	res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
			                    }
			                });
			            }
	        		}
	        	});
	        }
	    });
	}
}

exports.create_bill = function(req, res) {
	var access_token = req.body.access_token;
	var order_cost = req.body.order_cost;
	var order_id = req.body.order_id;
	var delivered_amount = req.body.delivered_amount;
	var order_created_by_id =  req.body.created_by_id;

	var manvalues = [access_token, order_cost, order_id, delivered_amount, order_created_by_id];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	            var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {
	        	var user_id = result[0].user_id;
	        	var update_cost = "UPDATE `order_details` SET `order_cost`= '"+order_cost+"', `is_bill`='1' WHERE `order_id`=?";
				connection.query(update_cost, [order_id], function(err, result){
					if (err) {
						console.log(err);
					} else {

						var update_offer_cost = "UPDATE `offer` SET `amount`= '"+delivered_amount+"' WHERE `offer_created_to_id`=? AND `offer_created_by_id`=? AND `order_id`=?";
						connection.query(update_offer_cost, [order_created_by_id, user_id, order_id], function(err, offerUpdateResult){
							if (err) {
								console.log(err);
							} else {

								var message_unique_id = order_id;
							    var message_to_id = order_created_by_id;
							    var message_type = "1";
							    var message_body = "You bill has been created :-"+
							    				   "\nDelivery Amount - "+delivered_amount+
							    				   "\nOrder Cost - "+order_cost+"";
							 
				                var sender_id = user_id;
				                var receiver_id = message_to_id;

				                var message_unique_idd = utils.generateRandomString();
				                var message_id = md5(message_unique_idd);
				                var currentTime = new Date();
				                var created_on = Math.round(currentTime.getTime() / 1000);
				                var user_type = "1";

				                if ( req.file != undefined ) { 
				                    message_body = req.file.filename;
				                }

				                var sql = "INSERT INTO `message`(`message_id`, `sender_id`, `receiver_id`, `message_type`, `message_body`, `created_on`, `user_type`, `message_unique_id`) VALUES (?,?,?,?,?,?,?,?)";
				                var value = [message_id, sender_id, receiver_id, message_type, message_body, created_on, user_type, message_unique_id];
				                connection.query(sql, value, function (err, result) {
				                    if (err) {
				                        responses.sendError(res);
				                        return;
				                    } else {
				                        // var response = {
				                        //     flag: 1,
				                        //     response: {},
				                        //     message: "Successfully send message."
				                        // }
				                        // res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
				                        var response = {
											flag: 1,
											response: {},
											message: "Bill created successfully."	
										};
										res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
				                    }
				                });
				            }
				        });
					}
				});
	        }
	    });
	}
}

exports.user_feedback_list = function(req, res) {
	var user_id = req.body.user_id;

	var manvalues = [user_id];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
  		var rating_sql = "SELECT * FROM `user_rating` WHERE `user_rating_to_id`=?"
		connection.query(rating_sql, [user_id], function (err, result) {
			console.log(result);
        	console.log(err);
            if (err) {
                responses.sendError(res);
                return;
            } else {

            	if (result.length == 0 ) {
            		var response = {
            			flag: 5,
            			response: {},
            			message: "No Data Found"
            		}
            		res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
            	} else {
	            	var user_rating_array = [];
	            	for (var i = 0; i < result.length; i++) {
	            		user_rating_array.push(result[i].user_rating_by_id);
	            	}

	        		var user_sql = "SELECT `user_name`, `profile_url` FROM `user` WHERE `user_id` IN (?)";
	        		connection.query(user_sql, [user_rating_array], function(err, userRatingResult){
	        			if (err){
	        				responses.sendError(res);
	        				return;
	        			} else {
	        				for (var j = 0; j < userRatingResult.length; j++) {
        						if (userRatingResult[j].profile_url != ''){
        							userRatingResult[j].profile_url = "/user/"+userRatingResult[j].profile_url;
        						}
        					}

	        				for (var i = 0; i < result.length; i++) {
	        					for (var j = 0; j < userRatingResult.length; j++) {
	        						result[i]["user_details"] = userRatingResult[j];
	        					}
	        				}
	        				var response = {
			            		flag: 1,
			            		response: result,
			            		message: "Successfully data fetched."
			            	}
			            	res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
	        			}
	        		});
	        	}
            }
        });
	}
}

exports.update_location = function(req, res) {
	var access_token = req.body.access_token;
	var lattitude = req.body.lattitude;
	var longitude = req.body.longitude;
	var manvalues = [access_token, lattitude, longitude];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	             var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {
	        	var user_id = result[0].user_id;
	        	var update_sql = "UPDATE `user` SET `lattitude`= '"+lattitude+"', `longitude`= '"+longitude+"' WHERE `access_token`=?";
				connection.query(update_sql, [access_token], function(err, result){
					if (err) {
						console.log(err);
					} else {
						var response = {
							flag: 1,
							response: {},
							message: "Location Update Successfully"
						};
						res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
					}
				});
	        }
	    });
	}
};

exports.notification_on_off = function(req, res) {
	var access_token = req.body.access_token;
	var is_notification_on = req.body.is_notification_on; // 0 = off, 1 = on 
	var manvalues = [access_token, is_notification_on];
	var checkblank = commonFunc.checkBlank(manvalues);
	if (checkblank == 1) {
		responses.parameterMissingResponse(res);
		return;
	} else {
		utils.authenticateUser(access_token, function(result) {
	        if (result == 0) {
	             var response = {
					flag: 1,
					response: {},
					message: "Invalid access token."	
				};
				res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
				return;
	        } else {
	        	var user_id = result[0].user_id;
	        	var update_sql = "UPDATE `user` SET `is_notification_on`= '"+is_notification_on+"' WHERE `access_token`=?";
				connection.query(update_sql, [access_token], function(err, result){
					if (err) {
						console.log(err);
					} else {

						if ( is_notification_on == 1 ) {
							var msg = "Notification on successfully";
						} else if ( is_notification_on == 0 ) {
							var msg = "Notification off successfully";
						}
						var response = {
							flag: 1,
							response: {"is_notification_on": is_notification_on},
							message: msg
						};
						res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
					}
				});
	        }
	    });
	}
}
