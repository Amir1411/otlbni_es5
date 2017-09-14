app.controller('ecom_category', ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {

	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
	var numberFormat = /^(?:[1-9]\d*|\d)$/;

	$scope.master_category_name_error = false;
	$scope.master_sort_order_error = false;
	$scope.success_msg = false;
	$scope.error_msg = false;

	$scope.edit_master_category_name_error = false;
	$scope.edit_master_sort_order_error = false;
	$scope.edit_success_msg = false;
	$scope.edit_error_msg = false;

	$scope.init = function() {
		params = {access_token: access_token};
		console.log(params);
		httpService.post( API_URL + '/get_master_category_list_details', params).then(function(response){
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
					}, 3000); 

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

	$scope.activeOfflineMasterCategory = function(key, master_category_id, value) {
		params = {access_token: access_token, is_active: value, master_category_id: master_category_id};
		httpService.post( API_URL + '/active_offline_master_category', params).then(function(response){
			var response = response.response.data;
			// console.log(response);
			if(response.status == 200){
				// if (response.response.is_blocked == 1 ) {
				// 	$scope.successText = "User Blocked Successfully.";
				// } else if ( response.response.is_blocked == 0 ) {
				// 	$scope.successText = "User Unblocked Successfully.";
				// }
				console.log(response.message);
				$scope.successText = response.message;
			
				$scope.masterCategoryList[key].is_active = value;
				$('#successPopup').modal('show');
			}
		});
	}

	$scope.editMasterCategory = function(key, master_category_id) {
		params = {access_token: access_token, master_category_id: master_category_id};
		httpService.post( API_URL + '/get_master_category_details', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var responseData = response.response;
				$scope.edit_master_category_name = responseData.master_category_name;
				$scope.edit_master_category_description = responseData.master_category_description;
				$scope.edit_master_category_id = responseData.master_category_id;
				$('#editCategoryPopup').modal('show');
			}
		}, function myError(response) {
			alert(response.data.message);
		});
	}

	$scope.update_master_category = function() {
		
		if ( $scope.edit_master_category_name == '' || $scope.edit_master_category_name == undefined || $scope.edit_master_category_name == null ) {
			$scope.edit_master_category_name_error = true;
			$scope.edit_master_category_name_msg = "This field is required."
		} else {
			$scope.edit_master_category_name_error = false;
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

		if ( $scope.edit_master_category_description == undefined || $scope.edit_master_category_description == null ) {
			$scope.edit_master_category_description = "";
		} 

		if ( $scope.edit_master_category_name_error == true ) {
			return false;
		} else {
			var params = {
				access_token: access_token,
				edit_master_category_name: $scope.edit_master_category_name,
				edit_master_category_description: $scope.edit_master_category_description,
				edit_master_category_id: $scope.edit_master_category_id
			}
			httpService.post( API_URL + '/update_master_category', params).then(function(response){
				var response = response.response.data;
				console.log(response);
				if( response.status == 200 ){

					$scope.edit_success_msg = true;
            		$scope.edit_success_msg_text = response.message;
            		$scope.edit_master_category_name = '';
            		$scope.edit_master_category_description = '';
            		// $scope.init();
            		setTimeout(function () {
						$scope.edit_success_msg_text = "";
						$('#editCategoryPopup').modal("hide");
						$scope.edit_success_msg = false;
						// $scope.init(); 
						$window.location.reload();
					}, 3000); 

				} else if ( response.status == 422 ) {
					$scope.edit_error_msg = true;
					$scope.edit_error_msg_text = response.message;
					$scope.edit_master_category_name = '';
					$scope.edit_master_category_description = '';
				} else {
					$scope.edit_error_msg = true;
					$scope.edit_error_msg_text = response.message;
					$scope.edit_master_category_name = '';
					$scope.edit_master_category_description = '';
				}
			});
		}
	}
}]);

