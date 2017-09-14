app.controller("header", ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {
	
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
	$rootScope.userDetails = userData;
	console.log($rootScope.userDetails);
	console.log($rootScope.currentRoute);

	$scope.subnavshowdiv = [];
	$scope.subnavshowdiv['account'] = false;
	$scope.subnavshowdiv['ecommerce'] = false;

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
}]);