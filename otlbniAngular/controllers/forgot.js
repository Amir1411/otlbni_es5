app.controller("forgot", ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {

	var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	$scope.success_msg = false; 
	$scope.showForm = true;

	$scope.forgotPassword = function() {
		if ($scope.forgotEmail == undefined || $scope.forgotEmail == '' || $scope.forgotEmail == null ) {
			$scope.forgotEmail_msg = "This field is required";
			$scope.forgotEmail_error = true;
		} else {
			if(!$scope.forgotEmail.match(mailformat)){
				$scope.forgotEmail_msg = "Please enter valid email.";
				$scope.forgotEmail_error = true;
			} else {
				$scope.forgotEmail_error = false;
			}

		if($scope.forgotEmail_error == true){
            return false;
        } else {
			params = {
				user_email: $scope.forgotEmail
			};
            httpService.post( API_URL + '/forgot_password', params).then(function(response){
            	var response = response.response.data;
            	console.log(response);
            	if ( response.status == 201 ) {
            		$scope.forgotEmail_msg = response.message;
					$scope.forgotEmail_error = true;
            	} else if ( response.status == 200 ) {
            		$scope.success_msg = true;
            		$scope.success_msg_text = response.message;
            		$scope.forgotEmail = '';
            		$scope.showForm = false;
            	}
            }, function myError(response) {
                alert(response.data.message);
            });
        }
		}
	}
}]);