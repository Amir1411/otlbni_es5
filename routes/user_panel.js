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

exports.social_login = function(req, res) {
	var social_type = req.body.social_type;
	var social_id = req.body.social_id;
	var device_token = req.body.device_token;

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

				var update_otp = "UPDATE `user` SET `verification_code`="+otp+", `access_token`='"+access_token+"' WHERE `user_id`=?";
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
				var update_otp = "UPDATE `user` SET `access_token`='"+access_token+"', `device_token`='"+device_token+"' WHERE `user_id`=?";
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
			console.log(otp);
			if ( social_type == "facebook" ) {
 				var social_type_text = "fb_id";
			} else if ( social_type == "google" ) {
				var social_type_text = "g_id";
			} else if ( social_type == "twitter" ) {
				var social_type_text = "twitter_id";
			}
			console.log(social_type);
			console.log(social_type_text);
			var sql = "INSERT INTO `user`(`user_id`,`mobile_number`, `social_type`, `access_token`, `"+social_type_text+"`, `verification_code`, `device_type`, `device_token`, `lattitude`, `longitude`) VALUES (?,?,?,?,?,?,?,?,?,?)";
			var value = [user_unique_id, mobile_number, social_type, access_token, social_id, otp, device_type, device_token, lattitude, longitude];
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
				user[0]["password"] = "";
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
	var update_otp = "UPDATE `user` SET `access_token`= '' WHERE `access_token`=?";
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
			// var hash = md5(password);
			
			var sql = "INSERT INTO `user`(`user_id`,`mobile_number`, `social_type`, `access_token`, `verification_code`, `device_type`, `device_token`, `lattitude`, `longitude`) VALUES (?,?,?,?,?,?,?,?,?)";
			var value = [user_unique_id, mobile_number, social_type, access_token, otp, device_type, device_token, lattitude, longitude];
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
	console.log(device_token);
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
			console.log(err);
			console.log(result_check);
			console.log(result_check.length);
			if (err) {
				responses.sendError(res);
				return;
			} else {
				if (result_check.length == 0) {
					var response = {
						"flag": 1,
						"response": {},
						"message": "This mobile number is not register with us. Please signup"			
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

							var update_otp = "UPDATE `user` SET `verification_code`="+otp+", `access_token`='"+access_token+"', `device_token`='"+device_token+"' WHERE `user_id`=?";
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
			if ( user[0]["profile_url"] != "" ) {
				user[0]["profile_url"] = "user/"+user[0]["profile_url"];
			}
			var response = {
				flag: 1,
				response: user[0],
				message: "Successfully verified"
			};
			res.status(constants.responseFlags.ACTION_COMPLETE).json(response);

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
								user[0]["password"] = "";
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
						user[0]["password"] = "";
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
	        			result[0]["password"] = "";
	        			var response = {
	        				flag: 1,
	        				response: {
	        					"user_details": result[0],
	        					"account_balance": 0,
	        					"rating": 0,
	        					"delivery_revenue": 0,
	        					"bill_paid": 0,
	        					"order_count": 0
	        				},
	        				message: "Successfully data fetched"
	        			}
	        			res.status(constants.responseFlags.ACTION_COMPLETE).json(response);
	        		}
	        	});
	        }
	    });
	}
}

// exports.save_address = function(req, res) {
// 	var access_token = req.body.access_token;
// 	var lattitude = req.body.lattitude;
// 	var longitude = req.body.longitude;
// 	var address = req.body.address;
// 	var manvalues = [access_token,lattitude,longitude,address]; 
// 	var checkblank = commonFunc.checkBlank(manvalues);
// 	if (checkblank == 1) {
// 		responses.parameterMissingResponse(res);
// 		return;
// 	} else {
// 		utils.authenticateUser(access_token, function(result) {
// 	        if (result == 0) {
// 	             var response = {
// 					status: constants.responseFlags.INVALID_ACCESS_TOKEN,
// 					flag: 1,
// 					response: {},
// 					message: "Invalid access token."	
// 				};
// 				res.send(JSON.stringify(response));
// 				return;
// 	        } else {
// 	        	var user_id = result[0].user_id;
// 	        	var address_unique_id = utils.generateRandomString();
//                 var address_id = md5(address_unique_id);
//                 var currentTime = new Date();
//                 var created_on = Math.round(currentTime.getTime() / 1000);

// 	        	var sql = "INSERT INTO `address`(`address_id`,`user_id`,`lattitude`, `longitude`, `address`, `created_on`) VALUES (?,?,?,?,?,?)";
// 				var value = [address_id, user_id, lattitude, longitude, address, created_on];
// 				connection.query(sql, value, function (err, result) {
// 					if (err) {
// 						responses.sendError(res);
// 						return;
// 					} else {
// 						var response = {
// 			                status: constants.responseFlags.ACTION_COMPLETE,
// 			                flag: 1,
// 			                response: "Address created successfully.",
// 			                message: "Address created successfully."
// 			            };
// 			            res.send(JSON.stringify(response)); 
// 					}
// 				});
// 	        }
// 	    });
// 	}
// }

// exports.get_user_address = function(req, res) {
// 	var access_token = req.body.access_token;
// 	var manvalues = [access_token];
// 	var checkblank = commonFunc.checkBlank(manvalues);
// 	if (checkblank == 1) {
// 		responses.parameterMissingResponse(res);
// 		return;
// 	} else {
// 		utils.authenticateUser(access_token, function(result) {
// 	        if (result == 0) {
// 	             var response = {
// 					status: constants.responseFlags.INVALID_ACCESS_TOKEN,
// 					flag: 1,
// 					response: {},
// 					message: "Invalid access token."	
// 				};
// 				res.send(JSON.stringify(response));
// 				return;
// 	        } else {
// 	        }
// 	    });
// 	}
// }

exports.send_notification = function(req, res) {
	var FCM = require('fcm-node');
    var serverKey = 'AIzaSyCu8GfZf6kUv5EH0tSFoEwG_EZCy6ETCkI'; //put your server key here 
    var fcm = new FCM(serverKey);
 
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
        to: 'fV07R8qu_bo:APA91bHq8eEFt_LgOVs8p6RpWdmJGrjTt8bjZ23M85Cq47yEtoaE3PJwX-emSaMpXyTWTF6uYSiW83fxS-BSy87Y4', 
        collapse_key: 'amir',
        
        notification: {
            title: 'Title of your push notification', 
            body: 'Body of your push notification' 
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