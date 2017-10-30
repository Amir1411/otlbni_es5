app.controller("completed_order", ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {
	
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;

	// For list of user
	$scope.init = function() {
		params = {access_token: access_token, status: 3};
		console.log(params);
		httpService.post( API_URL + '/getAdminOrder', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var responseData = response.response;
				for (var i = 0; i < responseData.length; i++) {
					responseData[i].number = i+1;
					if ( responseData[i].order_image != '' ) {
						responseData[i].order_image = API_URL+'/order/'+responseData[i].order_image;
					} else {
						responseData[i].order_image = API_URL+'/assets/user_placeholder.jpeg';
					}

					// if (responseData[i].status == "0") {
					// 	responseData[i].status = "<div class='status offline'>Pending</div>";
					// } else if (responseData[i].status == "1") {
					// 	responseData[i].status = "<div class='status ontheway'>On the way</div>";
					// } else if (responseData[i].status == "2") {
					// 	responseData[i].status = "<div class='status reject'>Rejected</div>";
					// } else if (responseData[i].status == "3") {
					// 	responseData[i].status = "<div class='status active'>Completed</div>";
					// } else if (responseData[i].status == "5") {
					// 	responseData[i].status = "<div class='status cancelled'>Cancelled</div>";
					// }
				}
				$scope.completedOrderlist = responseData;
				angular.element(document).ready( function () {
					$('#completedOrder').dataTable({
						'paging': true,
						'ordering': true,
						'info': true,
						"bDestroy": true,
						oLanguage: {
							sSearch: 'Search all columns:',
							sLengthMenu: '_MENU_ records per page',
							info: 'Showing page _PAGE_ of _PAGES_',
							zeroRecords: 'Nothing found - sorry',
							infoEmpty: 'No records available',
							infoFiltered: '(filtered from _MAX_ total records)'
						},
						"aoColumnDefs": [
							{ 'bSortable': false, 'aTargets': [3] }
						]
					});
				});
			}
		}, function myError(response) {
			// alert(response.data.message);
		});
	}
	$scope.init();

	// // For block and unblock user
	// $scope.getCourierDetails = function(user_id, key) {
	// 	params = {access_token: access_token, user_id: user_id};
	// 	httpService.post( API_URL + '/getCourierPlaceDetails', params).then(function(response){
	// 		var response = response.response.data;
	// 		// console.log(response);
	// 		if(response.status == 200){
	// 			var responseData = response.response.courier_place_list;
	// 			console.log(responseData);
	// 			$scope.courierPlaceList = responseData;
	// 		}
	// 	});
	// }
}]);