app.controller("courierlist", ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {
	
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;

	// For list of user
	$scope.init = function() {
		params = {access_token: access_token};
		console.log(params);
		httpService.post( API_URL + '/courierlist', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var responseData = response.response;
				for (var i = 0; i < responseData.length; i++) {
					responseData[i].number = i+1;
					if ( responseData[i].profile_url != '' ) {
						responseData[i].profile_url = API_URL+'/'+responseData[i].profile_url;
					} else {
						responseData[i].profile_url = API_URL+'/assets/user_placeholder.jpeg';
					}
				}
				$scope.userlist = responseData;
				angular.element(document).ready( function () {
					$('#demo-datatables-5').dataTable({
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

	// For block and unblock user
	$scope.getCourierDetails = function(user_id, key) {
		params = {access_token: access_token, user_id: user_id};
		httpService.post( API_URL + '/getCourierPlaceDetails', params).then(function(response){
			var response = response.response.data;
			// console.log(response);
			if(response.status == 200){
				var responseData = response.response.courier_place_list;
				console.log(responseData);
				$scope.courierPlaceList = responseData;
			}
		});
	}
}]);