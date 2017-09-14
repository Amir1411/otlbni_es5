/*
  |------------------------------------------------------------------
  |                     Creating Global application Module      |
  |------------------------------------------------------------------
 */
var app = angular.module('otlbni', ['ngRoute']);
// alert('fdgdg');
//Path to APIs used throught the application
var base_url = "http://52.30.101.158:3002/#!";
app.constant('API_URL', "http://52.30.101.158:3002");
app.constant('base_url', "http://52.30.101.158:3002/#!");

app.config(["$routeProvider", function ($routeProvider) {
    $routeProvider
    .when("/dashboard", {
        templateUrl: "views/dashboard.html",
        controller: "dashboard"
    })
    .when("/forgot", {
        templateUrl: "views/forgot.html",
        controller: "forgot"
    })
    .when("/profile", {
        templateUrl: "views/profile.html",
        controller: "profile"
    })
    .when("/userlist", {
        templateUrl: "views/userlist.html",
        controller: "userlist"
    })
    .when("/courierlist", {
        templateUrl: "views/courierlist.html",
        controller: "courierlist"
    })
    .when("/ecommerce/brand", {
        templateUrl: "views/ecommerce/ecom_brand.html",
        controller: "ecom_brand"
    })
    .when("/ecommerce/mastercategory", {
        templateUrl: "views/ecommerce/ecom_category.html",
        controller: "ecom_category"
    })
    .when("/ecommerce/category/:id", {
        templateUrl: "views/ecommerce/category.html",
        controller: "category"
    })
    .when("/ecommerce/subcategory/:id/:idd", {
        templateUrl: "views/ecommerce/sub_category.html",
        controller: "sub_category"
    })
    .when("/reset", {
        templateUrl: "views/reset.html",
        controller: "reset"
    })
    .when("/", {
        templateUrl: "views/login.html",
        controller: "login"
    });
}]);

app.run(['$rootScope', '$window', function($rootScope, $window) {  
	$rootScope.$on('$routeChangeSuccess', function (e, current, pre) {
		$rootScope.headerShow = true;
		$rootScope.footerShow = true;
	    var user = JSON.parse(localStorage.getItem('user'));
	    // console.log(user);
	    if(user == null){
	        $rootScope.headerShow = false;
	        $rootScope.footerShow = false;
	        var fullRoute = current.$$route.originalPath;
            $rootScope.currentRoute = fullRoute;
			if(fullRoute != '/' && fullRoute != '/forgot' && fullRoute != '/reset' && fullRoute != ''){
				console.log('something is wrong in app.js');
				$window.location.href = base_url+'/';
			}
	    } else {
	    	var fullRoute = current.$$route.originalPath;
	    	$rootScope.currentRoute = fullRoute;
	    	if(fullRoute == '/' || fullRoute == ''){
				// console.log('something is wrong in app.js');
				$window.location.href = base_url+'/dashboard';
			}
	    }
	});
}]);

app.directive('fileModel', ['$parse', function ($parse) {
    'use strict';
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            // var modelSetter = model.assign;
            element.bind("change", function (changeEvent) {
                // console.log(changeEvent);
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    
                    scope.$apply(function () {
                        scope.fileModel = [];
                        var path = [];
                        var extension = "";
                        var errorfilecount = 0;
                        for(var i=0 ; i<changeEvent.target.files.length ; i++){
                            extension = changeEvent.target.files[i].name.split('.').pop();
                            if(extension != "jpeg" && extension != "jpg" && extension != "png"){
                                errorfilecount = errorfilecount + 1;
                            }
                            scope.fileModel[i] = {
                                lastModified: changeEvent.target.files[i].lastModified,
                                lastModifiedDate: changeEvent.target.files[i].lastModifiedDate,
                                name: changeEvent.target.files[i].name,
                                size: changeEvent.target.files[i].size,
                                type: changeEvent.target.files[i].type,
                                data: loadEvent.target.result
                            };
                            path[i] = loadEvent.target.result;
                        }
                        if(errorfilecount == 0){
                            scope.getFile(changeEvent.target.files,path);    
                        } else {
                            scope.fileError(errorfilecount);
                        }
                        
                    });
                }
                // console.log(changeEvent.target.files[0]);
                reader.readAsDataURL(changeEvent.target.files[0]);

            });

        }
    };
}]);


