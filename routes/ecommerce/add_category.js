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

//=======================================
//---------- For Master Category ---------
//=========================================//

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
exports.get_master_category_list_details = function (req, res) {
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
						responses.sendError(res);
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

exports.active_offline_master_category = function (req, res) {
	var access_token =  req.body.access_token;
	var is_active =  req.body.is_active;
	var master_category_id =  req.body.master_category_id;

	var manvalues = [access_token,master_category_id];
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
				var sql = "UPDATE `master_category` SET `is_active`='"+is_active+"' WHERE `master_category_id`=?";
				connection.query(sql, [master_category_id], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						if ( is_active == 0 ) {
							var msg = "Category is offline successfully.";
						} else if ( is_active == 1 ){
							var msg = "Category is active successfully.";
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

exports.get_master_category_details = function(req, res) {
	var access_token = req.body.access_token;
	var master_category_id = req.body.master_category_id;
	var manvalues = [access_token, master_category_id];
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
				var sql = "SELECT * FROM `master_category` WHERE `is_blocked`=? AND `is_deleted`=? AND `master_category_id`=?";
				connection.query(sql, [0, 0, master_category_id], function(err, categoryResult) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: categoryResult[0],
							message: "Data fetched successfully."
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

// update master category
exports.update_master_category = function (req, res) {

	var access_token = req.body.access_token;
	var master_category_name = req.body.edit_master_category_name;
	var master_category_description = req.body.edit_master_category_description;
	var master_category_id = req.body.edit_master_category_id;

	var manvalues = [access_token, master_category_name, master_category_id];
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
				var sql = "SELECT * FROM `master_category` WHERE `master_category_id`=?";
				connection.query(sql, [master_category_id], function(err, check_order) {
					if (err) {
						console.log(err);
						responses.sendError(res);
						return;
					} 
					else if ( check_order.length > 0 ){
						var sql = "UPDATE `master_category` SET `master_category_name`='"+master_category_name+"', `master_category_description`='"+master_category_description+"' WHERE `master_category_id`=?";
						connection.query(sql, [master_category_id], function(err, result) {
							if (err) {
								responses.sendError(res);
								return;
							} else {
								var response = {
									status: constants.responseFlags.ACTION_COMPLETE,
									flag: 1,
									response: {},
									message: "Category updated successfully."    
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
			                message: "There is no category."
						}
						res.send(JSON.stringify(response));						
					}
				});
			}
		});
	}
}

//=======================================
//---------- For Category ---------
//=========================================//

// add category
exports.add_category = function (req, res) {
	console.log(req.body);
	var access_token = req.body.access_token;
	var category_name = req.body.category_name;
	var category_description = req.body.category_description;
	var sort_order = req.body.sort_order;
	var master_category_id = req.body.master_category_id; 

	var manvalues = [access_token, category_name];
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
		                var category_id_unique_id = utils.generateRandomString();
		                var category_id = md5(category_id_unique_id);

		                var currentTime = new Date();
		                var created_on = Math.round(currentTime.getTime() / 1000);

						var sql = "INSERT INTO `category` (`category_id`, `master_category_id`, `category_name`,`category_description`, `sort_order`, `created_on`) VALUES (?,?,?,?,?,?)";
						console.log(master_category_id);
						connection.query(sql, [category_id, master_category_id, category_name, category_description, sort_order, created_on], function (err, insertResult) {
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
					                message: "Category created successfully."
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

// get category
exports.get_category_list_details = function (req, res) {
	var access_token = req.body.access_token;
	var master_category_id = req.body.master_category_id;
	var manvalues = [access_token, master_category_id];
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
				var sql = "SELECT * FROM `category` WHERE `is_blocked`=? AND `is_deleted`=? AND `master_category_id`=?";
				connection.query(sql, [0, 0, master_category_id], function(err, categoryResult) {
					if (err) {
						responses.sendError(res);
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

exports.active_offline_category = function (req, res) {
	var access_token =  req.body.access_token;
	var is_active =  req.body.is_active;
	var category_id =  req.body.category_id;

	var manvalues = [access_token,category_id];
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
				var sql = "UPDATE `category` SET `is_active`='"+is_active+"' WHERE `category_id`=?";
				connection.query(sql, [category_id], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						if ( is_active == 0 ) {
							var msg = "Category is offline successfully.";
						} else if ( is_active == 1 ){
							var msg = "Category is active successfully.";
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

exports.get_category_details = function(req, res) {
	var access_token = req.body.access_token;
	var category_id = req.body.category_id;
	var manvalues = [access_token, category_id];
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
				var sql = "SELECT * FROM `category` WHERE `is_blocked`=? AND `is_deleted`=? AND `category_id`=?";
				connection.query(sql, [0, 0, category_id], function(err, categoryResult) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: categoryResult[0],
							message: "Data fetched successfully."
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

// update category
exports.update_category = function (req, res) {

	var access_token = req.body.access_token;
	var category_name = req.body.edit_category_name;
	var category_description = req.body.edit_category_description;
	var category_id = req.body.edit_category_id;

	var manvalues = [access_token, category_name, category_id];
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
				var sql = "SELECT * FROM `category` WHERE `category_id`=?";
				connection.query(sql, [category_id], function(err, check_order) {
					if (err) {
						console.log(err);
						responses.sendError(res);
						return;
					} 
					else if ( check_order.length > 0 ){
						var sql = "UPDATE `category` SET `category_name`='"+category_name+"', `category_description`='"+category_description+"' WHERE `category_id`=?";
						connection.query(sql, [category_id], function(err, result) {
							if (err) {
								responses.sendError(res);
								return;
							} else {
								var response = {
									status: constants.responseFlags.ACTION_COMPLETE,
									flag: 1,
									response: {},
									message: "Category updated successfully."    
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
			                message: "There is no category."
						}
						res.send(JSON.stringify(response));						
					}
				});
			}
		});
	}
}

//=======================================
//---------- For Category ---------
//=========================================//

// add category
exports.add_sub_category = function (req, res) {
	console.log(req.body);
	var access_token = req.body.access_token;
	var sub_category_name = req.body.sub_category_name;
	var sub_category_description = req.body.sub_category_description;
	var sort_order = req.body.sort_order;
	var master_category_id = req.body.master_category_id;
	var category_id = req.body.category_id; 

	var manvalues = [access_token, sub_category_name];
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
		                var sub_category_id_unique_id = utils.generateRandomString();
		                var sub_category_id = md5(sub_category_id_unique_id);

		                var currentTime = new Date();
		                var created_on = Math.round(currentTime.getTime() / 1000);

						var sql = "INSERT INTO `sub_category` (`sub_category_id`, `category_id`, `master_category_id`, `sub_category_name`,`sub_category_description`, `sort_order`, `created_on`) VALUES (?,?,?,?,?,?,?)";
						console.log(master_category_id);
						connection.query(sql, [sub_category_id, category_id, master_category_id, sub_category_name, sub_category_description, sort_order, created_on], function (err, insertResult) {
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
					                message: "Category created successfully."
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

// get category
exports.get_sub_category_list_details = function (req, res) {
	var access_token = req.body.access_token;
	var master_category_id = req.body.master_category_id;
	var category_id = req.body.category_id;
	var manvalues = [access_token, master_category_id, category_id];
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
				var sql = "SELECT * FROM `sub_category` WHERE `is_blocked`=? AND `is_deleted`=? AND `master_category_id`=? AND `category_id`=?";
				connection.query(sql, [0, 0, master_category_id, category_id], function(err, categoryResult) {
					if (err) {
						responses.sendError(res);
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

exports.active_offline_sub_category = function (req, res) {
	var access_token =  req.body.access_token;
	var is_active =  req.body.is_active;
	var sub_category_id =  req.body.sub_category_id;

	var manvalues = [access_token,sub_category_id];
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
				var sql = "UPDATE `sub_category` SET `is_active`='"+is_active+"' WHERE `sub_category_id`=?";
				connection.query(sql, [sub_category_id], function(err, result) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						if ( is_active == 0 ) {
							var msg = "Category is offline successfully.";
						} else if ( is_active == 1 ){
							var msg = "Category is active successfully.";
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

exports.get_sub_category_details = function(req, res) {
	var access_token = req.body.access_token;
	var sub_category_id = req.body.sub_category_id;
	var manvalues = [access_token, sub_category_id];
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
				var sql = "SELECT * FROM `sub_category` WHERE `is_blocked`=? AND `is_deleted`=? AND `sub_category_id`=?";
				connection.query(sql, [0, 0, sub_category_id], function(err, categoryResult) {
					if (err) {
						responses.sendError(res);
						return;
					} else {
						var response = {
							status: constants.responseFlags.ACTION_COMPLETE,
							flag: 1,
							response: categoryResult[0],
							message: "Data fetched successfully."
						}
						res.send(JSON.stringify(response));
					}
				});
			}
		});
	}
}

// update category
exports.update_sub_category = function (req, res) {

	var access_token = req.body.access_token;
	var sub_category_name = req.body.edit_sub_category_name;
	var sub_category_description = req.body.edit_sub_category_description;
	var sub_category_id = req.body.edit_sub_category_id;

	var manvalues = [access_token, sub_category_name, sub_category_id];
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
				var sql = "SELECT * FROM `sub_category` WHERE `sub_category_id`=?";
				connection.query(sql, [sub_category_id], function(err, check_order) {
					if (err) {
						console.log(err);
						responses.sendError(res);
						return;
					} 
					else if ( check_order.length > 0 ){
						var sql = "UPDATE `sub_category` SET `sub_category_name`='"+sub_category_name+"', `sub_category_description`='"+sub_category_description+"' WHERE `sub_category_id`=?";
						connection.query(sql, [sub_category_id], function(err, result) {
							if (err) {
								responses.sendError(res);
								return;
							} else {
								var response = {
									status: constants.responseFlags.ACTION_COMPLETE,
									flag: 1,
									response: {},
									message: "Sub Category updated successfully."    
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
			                message: "There is no category."
						}
						res.send(JSON.stringify(response));						
					}
				});
			}
		});
	}
}