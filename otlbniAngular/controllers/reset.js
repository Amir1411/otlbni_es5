app.controller("reset", ['$scope','httpService','API_URL','$window', '$location', '$rootScope', function ($scope, httpService, API_URL, $window, $location, $rootScope) {
	
	$scope.show_reset=0;
    $scope.show_err=0;
	var type = $location.search().type;
    var token = $location.search().token;
    var email = $location.search().email;
    $scope.show_reset=1;
    email = email.replace(' ', '+');
    $scope.reset_password_error = false;
	$scope.reset_confirm_password_error = false;

	$scope.init = function() {
		var params = {
			email: email,
			token: token
		}
		httpService.post( API_URL + '/check_verification_token', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				$scope.show_reset=1;
			} else {
				$scope.show_err=1;
			}
			// $scope.$apply();
		}, function myError(response) {
			alert(response.data.message);
		});
	}
	$scope.init();

	$scope.reset = function() {
		if ($scope.reset_password == undefined || $scope.reset_password == '' || $scope.reset_password == null ) {
			$scope.reset_password_msg = "This field is required";
			$scope.reset_password_error = true;
		} else {
			if($scope.reset_password.length < 6){
				$scope.reset_password_msg = "The password must be at least 8 characters long.";
				$scope.reset_password_error = true;
			} else {
				$scope.reset_password_error = false;
			}
		}

		if($scope.reset_confirm_password == undefined || $scope.reset_confirm_password == null || $scope.reset_confirm_password == ""){
			$scope.reset_confirm_password_msg = "This field is required";
			$scope.reset_confirm_password_error = true;
		} else {
			if ( $scope.reset_confirm_password != $scope.reset_password ) {
				$scope.reset_confirm_password_msg = "The password didn't matched.";
				$scope.reset_confirm_password_error = true;
			} else {
				$scope.reset_confirm_password_error = false;
			}
		}

		if( $scope.reset_password == true || $scope.reset_confirm_password == true ){
            return false;
        } else {
			var params =  {
                email: email,
                token: token,
                password: $scope.reset_password
            };
            httpService.post( API_URL + '/change_forgot_password', params).then(function(response){
            	var response = response.response.data;
            	console.log(response);
            	if ( response.status == 201 ) {
            		$scope.error_msg_text = response.message;
					$scope.error_msg = true;
            	} else if ( response.status == 200 ) {
            		$scope.success_msg = true;
            		$scope.success_msg_text = response.message;
            		$scope.reset_password = '';
            		$scope.reset_confirm_password = '';
            		setTimeout(function () {
						$scope.success_msg_text = "";	
						$scope.success_msg = false;
						$window.location.href = "/";
					}, 10000);
            	}
            }, function myError(response) {
                alert(response.data.message);
            });
        }
	}	
}]);