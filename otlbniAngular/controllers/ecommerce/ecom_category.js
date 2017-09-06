app.controller('ecom_category', ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {

	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
	var numberFormat = /^(?:[1-9]\d*|\d)$/;

	$scope.master_category_name_error = false;
	$scope.master_sort_order_error = false;
	$scope.success_msg = false;
	$scope.error_msg = false;

	$scope.init = function() {
		params = {access_token: access_token};
		console.log(params);
		httpService.post( API_URL + '/get_master_category_details', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var responseData = response.response;
				for (var i = 0; i < responseData.length; i++) {
					responseData[i].number = i+1;
					// if ( responseData[i].is_active == 1 ) {
					// 	responseData[i].is_active = "<div class='status active'>Active</div>";
					// } else {
					// 	responseData[i].is_active = "<div class='status offline'>Offline</div>";
					// }
				}
				console.log(responseData);
				$scope.masterCategoryList = responseData;
				angular.element(document).ready( function () {

					$('#example').dataTable({
						"bDestroy":true,
						'paging': true,
						'ordering': true,
						'info': true,
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
			alert(response.data.message);
		});
	}
	$scope.init();

	$scope.add_master_category = function() {
		
		if ( $scope.master_category_name == '' || $scope.master_category_name == undefined || $scope.master_category_name == null ) {
			$scope.master_category_name_error = true;
			$scope.master_category_name_msg = "This field is required."
		} else {
			$scope.master_category_name_error = false;
		}

		// if ( $scope.master_sort_order == '' || $scope.master_sort_order == undefined || $scope.master_sort_order == null ) {
		// 	$scope.master_sort_order_error = true;
		// 	$scope.master_sort_order_msg = "This field is required.";
		// } else {
		// 	if ( !$scope.master_sort_order.match(numberFormat) ) {
		// 		$scope.master_sort_order_error = true;
		// 		$scope.master_sort_order_msg = "This field is only required number."
		// 	} else {
		// 		$scope.master_sort_order_error = false;
		// 	}
		// }

		if ( $scope.master_category_description == undefined || $scope.master_category_description == null ) {
			$scope.master_category_description = "";
		} 

		if ( $scope.master_category_name_error == true || $scope.master_sort_order_error == true ) {
			return false;
		} else {
			var params = {
				access_token: access_token,
				master_category_name: $scope.master_category_name,
				sort_order: "",
				master_category_description: $scope.master_category_description
			}
			httpService.post( API_URL + '/add_master_category', params).then(function(response){
				var response = response.response.data;
				console.log(response);
				if( response.status == 200 ){

					$scope.success_msg = true;
            		$scope.success_msg_text = response.message;
            		$scope.master_category_name = '';
            		$scope.master_sort_order = '';
            		$scope.master_category_description = '';
            		// $scope.init();
            		setTimeout(function () {
						$scope.success_msg_text = "";
						$('#addCategoryPopup').modal("hide");
						$scope.success_msg = false;
						// $scope.init(); 
						$window.location.reload();
					}, 10000); 

				} else if ( response.status == 422 ) {
					$scope.error_msg = true;
					$scope.error_msg_text = response.message;
					$scope.master_category_name = ''; 
					$scope.master_sort_order = '';
					$scope.master_category_description = '';
				} else {
					$scope.error_msg = true;
					$scope.error_msg_text = response.message;
					$scope.master_category_name = ''; 
					$scope.master_sort_order = '';
					$scope.master_category_description = '';
				}
			});
		}
	}
}]);

