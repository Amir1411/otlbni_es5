app.controller("profile", ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {
	
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;

	var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	var numberFormat = /^(?:[1-9]\d*|\d)$/;

	$scope.name = "John Doe";
	$scope.email = "John@Doe.com";
	$scope.phone_number = "+123456789";
	$scope.address = "123 xyz street";

	$scope.old_password_error = false;
	$scope.new_password_error = false;
	$scope.confirm_password_error = false;
	$scope.profile_img = "assets/img/0180441436.jpg";

	$scope.edit_name_error = false;
	$scope.edit_email_error = false;
	$scope.edit_phone_number_error = false;
	$scope.edit_address_error = false;

	$scope.success_msg = false;

	$scope.init = function() {
		params = {access_token: access_token};
		console.log(params);
		httpService.post( API_URL + '/get_details', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				$scope.name = response.response.name;
				$scope.email = response.response.email;
				$scope.address = response.response.address;
				$scope.phone_number = response.response.phone_number;
				$scope.profile_img = API_URL+'/'+response.response.profile_url;

				// For Edit Profile
				$scope.edit_name = response.response.name;
				$scope.edit_email = response.response.email;
				$scope.edit_address = response.response.address;
				$scope.edit_phone_number = response.response.phone_number;
			}
		}, function myError(response) {
			alert(response.data.message);
		});
	}
	$scope.init();

	$scope.changePassword = function() {

		if ($scope.old_password == undefined || $scope.old_password == '' || $scope.old_password == null ) {
			$scope.old_password_msg = "Please enter the old password";
			$scope.old_password_error = true;
		} else {
			$scope.old_password_error = false;
		}

		if($scope.new_password == undefined || $scope.new_password == null || $scope.new_password == ""){
			$scope.new_password_msg = "Please enter the new password";
			$scope.new_password_error = true;
		} else {
			if($scope.new_password.length < 6){
				$scope.new_password_msg = "The password must be at least 8 characters long.";
				$scope.new_password_error = true;
			} else {
				$scope.new_password_error = false;
			}
		}

		if($scope.confirm_password == undefined || $scope.confirm_password == null || $scope.confirm_password == ""){
			$scope.confirm_password_msg = "Please enter the confirm password";
			$scope.confirm_password_error = true;
		} else {
			if ( $scope.confirm_password != $scope.new_password ) {
				$scope.confirm_password_msg = "The password didn't matched.";
				$scope.confirm_password_error = true;
			} else {
				$scope.confirm_password_error = false;
			}
		}

		if($scope.old_password_error == true || $scope.new_password_error == true || $scope.confirm_password_error == true){
            return false;
        } else {
			params = {
				access_token: access_token,
				old_password: $scope.old_password,
				new_password: $scope.new_password
			};
            httpService.post( API_URL + '/change_password', params).then(function(response){
            	var response = response.response.data;
            	console.log(response);
            	if ( response.status == 201 ) {
            		$scope.old_password_msg = response.message;
					$scope.old_password_error = true;
            	} else if ( response.status == 200 ) {
            		$scope.success_msg = true;
            		$scope.success_msg_text = response.message;
            		$scope.old_password = '';
            		$scope.new_password = '';
            		$scope.confirm_password = '';
            		setTimeout(function () {
						$scope.success_msg_text = "";
						$('#changePasswordPopup').modal("hide");
						$scope.success_msg = false;
						$scope.$apply();
					}, 10000);
            	}
            }, function myError(response) {
                alert(response.data.message);
            });
        }
	}

	$scope.getFile = function(value, path) {

		$scope.profile_img = URL.createObjectURL(value[0]);
		var formData = new FormData();
		formData.append("image", value[0]);
		formData.append("access_token", access_token);
		// params = {access_token: access_token, image: value[0]}
		httpService.postWithFile( API_URL + '/update_thumbnail', formData).then(function(response){
			// var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				$scope.profile_img = API_URL+'/'+response.data.response.profile_url;	
				$rootScope.userDetails.profile_url = API_URL+'/'+response.data.response.profile_url;
				localStorage.setItem('user', JSON.stringify($rootScope.userDetails));
			}
		}, function myError(response) {
			alert(response.data);
		});
	}

	$scope.openChangePasswordPopup =  function() {
		$scope.old_password_error = false;
		$scope.new_password_error = false;
		$scope.confirm_password_error = false;	
	}

	$scope.updateProfile = function () {
		if ($scope.edit_name == undefined || $scope.edit_name == '' || $scope.edit_name == null ) {
			$scope.edit_name_msg = "Please enter the name";
			$scope.edit_name_error = true;
		} else {
			$scope.edit_name_error = false;
		}

		if($scope.edit_email == undefined || $scope.edit_email == null || $scope.edit_email == ""){
			$scope.edit_email_msg = "Please enter the email";
			$scope.edit_email_error = true;
		} else {
			if(!$scope.edit_email.match(mailformat)){
				$scope.edit_email_msg = "Please enter valid email.";
				$scope.edit_email_error = true;
			} else {
				$scope.edit_email_error = false;
			}
		}

		if($scope.edit_phone_number == undefined || $scope.edit_phone_number == null || $scope.edit_phone_number == ""){
			$scope.edit_phone_number_msg = "Please enter the phone number";
			$scope.edit_phone_number_error = true;
		} else {
			if (!$scope.edit_phone_number.match(numberFormat)) {
				$scope.edit_phone_number_msg = "Please enter valid number.";
				$scope.edit_phone_number_error = true;
			} else {
				$scope.edit_phone_number_error = false;
			}
		}

		if($scope.edit_address == undefined || $scope.edit_address == null || $scope.edit_address == ""){
			$scope.edit_address_msg = "Please enter address";
			$scope.edit_address_error = true;
		} else {
			$scope.edit_address_error = false;
		}

		if($scope.edit_name_error == true || $scope.edit_email_error == true || $scope.edit_phone_number_error == true || $scope.edit_address_error == true){
            return false;
        } else {
			params = {
				access_token: access_token,
				name: $scope.edit_name,
				email: $scope.edit_email,
				phone_number: $scope.edit_phone_number,
				address: $scope.edit_address
			};
            httpService.post( API_URL + '/update_profile', params).then(function(response){
            	var response = response.response.data;
            	console.log(response);
            	if ( response.status == 201 ) {
            	} else if ( response.status == 200 ) {
            		$scope.update_success_msg = true;
            		$scope.update_success_msg_text = response.message;
            		$rootScope.userDetails.name = $scope.edit_name;
            		setTimeout(function () {
						$scope.update_success_msg_text = "";
						$('#editProfilePopup').modal("hide");
						$scope.update_success_msg = false;
						$scope.$apply();
						$scope.init();
					}, 10000);
            	}
            }, function myError(response) {
                alert(response.data.message);
            });
        }
	}
}]);