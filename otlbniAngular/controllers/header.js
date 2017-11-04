app.controller("header", ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {
	
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
	$rootScope.userDetails = userData;

	$scope.subnavshowdiv = [];
	$scope.subnavshowdiv['account'] = false;
	$scope.subnavshowdiv['ecommerce'] = false;

	$scope.push_select_error = false;
	$scope.push_msg_error = false;
	$scope.success_msg = false;
	$scope.error_msg = false;

	$scope.subnavshow = function(key) {
		if ( $scope.subnavshowdiv[key] == true ) {
			$scope.subnavshowdiv[key] = false;
		} else {
			$scope.subnavshowdiv[key] = true;
		}
	}

	$scope.sidebarResToggle = function() {
		 document.getElementById('resSidebar-toggler').classList.toggle('collapsed');
		 document.getElementById('resSide-nav').classList.toggle('in');
	}

	$scope.logout = function() {
		localStorage.setItem('user', null);
		$scope.user_logged_in = false;
		$scope.logged_username = "";
		$window.location.href = API_URL;
	}

	$scope.sidebarToggle = function() {
		document.getElementById('sidenav-toggler').classList.toggle('collapsed');
		document.getElementById('layout-sidebar').classList.toggle('layout-sidebar-collapsed');
		document.getElementById('sidenav').classList.toggle('sidenav-collapsed');
		document.body.classList.toggle('layout-sidebar-collapsed');
	}

	$scope.sendNotification = function() {

		if ($scope.push_select == undefined || $scope.push_select == '' || $scope.push_select == null ) {
			$scope.push_select_error_msg = "Please select user";
			$scope.push_select_error = true;
		} else {
			$scope.push_select_error = false;
		}

		if ($scope.push_msg == undefined || $scope.push_msg == '' || $scope.push_msg == null ) {
			$scope.push_msg_error_msg = "Please enter message";
			$scope.push_msg_error = true;
		} else {
			$scope.push_msg_error = false;
		}

		if($scope.push_select_error == true || $scope.push_msg_error == true){
			return false;
		} else {
			params = {
				access_token: access_token,
				push_user: $scope.push_select,
				push_msg: $scope.push_msg
			};
			httpService.post( API_URL + '/send_push_notification_to_user', params).then(function(response){
				var response = response.response.data;
				console.log(response);
	        	if ( response.status == 200 ) {
	        		$scope.success_msg = true;
	        		$scope.error_msg = false;
	        		$scope.success_msg_text = response.message;
	        		$scope.push_select = '';
	        		$scope.push_msg = '';
	        		setTimeout(function () {
						$scope.success_msg_text = "";
						$('#sendNotificationPopup').modal("hide");
						$scope.success_msg = false;
						$scope.error_msg = false;
					}, 10000);
	        	} else {
	        		$scope.error_msg = true;
	        		$scope.success_msg = false;
	        		$scope.error_msg_text = response.message;
	        	}
			}, function myError(response) {
				alert(response.data.message);
			});
		}
	}
}]);