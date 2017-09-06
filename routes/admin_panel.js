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
	console.log(req.body);
	console.log(req.file);
	var access_token = req.body.access_token;
	console.log(access_token);
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
						// result[0].password = '';
						// if ( result[0]["profile_url"] != "" ) {
						// 	result[0]["profile_url"] = "admin/"+result[0]["profile_url"];
						// }
						for (var i = 0; i < result.length; i++) {
							result[i]["password"] = '';
							result[i]["count"] = i+1;
							if ( result[i]["profile_url"] != "" ) {
								result[i]["profile_url"] = "user/"+result[i]["profile_url"];
							}
						}
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: result,
							message: "Get user Details"
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
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