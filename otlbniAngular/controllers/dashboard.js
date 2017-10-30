app.controller("dashboard", ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {

	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;

	var currentTime = new Date();

	var oneWeekAgo = new Date();
	var amir = oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	console.log(amir);

	var yesterday = Math.round(currentTime.getTime() / 1000);
	var now = Math.round(currentTime.getTime() / 1000);
	// var seven_day_before1 = currentTime.setDate(currentTime.getMonth()-1);
	// console.log(seven_day_before1);
	// var seven_day_before = Math.round(seven_day_before1.getTime() / 1000);
	// console.log(seven_day_before);

	$scope.init = function() {
		params = {
			access_token: access_token,
			start_time: yesterday,
			end_time: now
		};
		httpService.post( API_URL + '/dashboard_report', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var data = response.data;
				$scope.total_user_registration = data.total_users;
				$scope.total_today_user_registration = data.total_users_registered_today;
				$scope.total_orders = data.total_orders;
				$scope.total_today_orders = data.total_today_orders;
				$scope.total_offers = data.total_offers;
				$scope.total_today_offers = data.total_today_offers;
				$scope.total_revenue = data.total_earnings;

				$scope.total_reports = data.total_reports;
				$scope.total_unresolved_reports = data.total_unresolved_reports;
				$scope.total_resolved_reports = data.total_resolved_reports;

				var solved_percentage = (data.total_resolved_reports*100)/data.total_reports;
				var unsolved_percentage = (data.total_unresolved_reports*100)/data.total_reports;
				if ( isNaN(solved_percentage) ){
					solved_percentage = 100;
				}
				if ( isNaN(unsolved_percentage) ){
					unsolved_percentage = 100;
				} 
				$scope.solved_percentage = solved_percentage;
				$scope.unsolved_percentage = unsolved_percentage;
			}
		}, function myError(response) {
			// console.log("Something went wrong");
		});
	}
	$scope.get = function() {
		params = {
			access_token: access_token,
			start_time: yesterday,
			end_time: now
		};
		httpService.post( API_URL + '/get_total_user_graph_data', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
			}
		}, function myError(response) {
			// console.log("Something went wrong");
		});
	}
	$scope.init();
	// $scope.get();

	/*** For Graph ***/ 
	$scope.labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	$scope.colors = [
		{
			backgroundColor: "#d9230f",
			borderColor: "#d9230f",
		},"rgba(250,109,33,0.5)","#9a9a9a","rgb(233,177,69)"
	];
	$scope.colors1 = [
		{
			backgroundColor: "#0288d1",
			borderColor: "#0288d1",
		},"rgba(250,109,33,0.5)","#9a9a9a","rgb(233,177,69)"
	];
	$scope.type = 'StackedBar';
	$scope.series = ['2015', '2016'];
	$scope.options = {
		scales: {
			xAxes: [{
				stacked: true,
			}],
			yAxes: [{
				stacked: true
			}]
		}
	};

	$scope.data = [
		[65, 59, 90, 81, 56, 55, 40]
	];
}]);