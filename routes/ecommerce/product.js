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

exports.get_product_list = function(req, res) {

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
				var sql = "SELECT * FROM `ecom_product_details`";
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