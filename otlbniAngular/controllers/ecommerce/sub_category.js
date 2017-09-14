app.controller('sub_category', ['$scope', '$route', 'httpService','API_URL','$window','$rootScope', function ($scope, $route, httpService, API_URL, $window, $rootScope) {
	console.log("amir");
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
	var numberFormat = /^(?:[1-9]\d*|\d)$/;

	var master_category_id = $route.current.params.idd;
	var category_id = $route.current.params.id;

	$scope.category_name_error = false;
	$scope.sort_order_error = false;
	$scope.success_msg = false;
	$scope.error_msg = false;

	$scope.edit_category_name_error = false;
	$scope.edit_sort_order_error = false;
	$scope.edit_success_msg = false;
	$scope.edit_error_msg = false;

	$scope.init = function() {
		params = {access_token: access_token, master_category_id: master_category_id, category_id: category_id};
		console.log(params);
		httpService.post( API_URL + '/get_sub_category_list_details', params).then(function(response){
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
				$scope.subcategoryList = responseData;
				angular.element(document).ready( function () {

					$('#subcategory').dataTable({
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

	$scope.add_sub_category = function() {
		
		if ( $scope.sub_category_name == '' || $scope.sub_category_name == undefined || $scope.sub_category_name == null ) {
			$scope.sub_category_name_error = true;
			$scope.sub_category_name_msg = "This field is required."
		} else {
			$scope.sub_category_name_error = false;
		}

		// if ( $scope.sort_order == '' || $scope.sort_order == undefined || $scope.sort_order == null ) {
		// 	$scope.sort_order_error = true;
		// 	$scope.sort_order_msg = "This field is required.";
		// } else {
		// 	if ( !$scope.sort_order.match(numberFormat) ) {
		// 		$scope.sort_order_error = true;
		// 		$scope.sort_order_msg = "This field is only required number."
		// 	} else {
		// 		$scope.sort_order_error = false;
		// 	}
		// }

		if ( $scope.sub_category_description == undefined || $scope.sub_category_description == null ) {
			$scope.sub_category_description = "";
		} 

		if ( $scope.sub_category_name_error == true || $scope.sort_order_error == true ) {
			return false;
		} else {
			var params = {
				access_token: access_token,
				sub_category_name: $scope.sub_category_name,
				sort_order: "",
				sub_category_description: $scope.sub_category_description,
				master_category_id: master_category_id,
				category_id: category_id
			}
			httpService.post( API_URL + '/add_sub_category', params).then(function(response){
				var response = response.response.data;
				console.log(response);
				if( response.status == 200 ){

					$scope.success_msg = true;
            		$scope.success_msg_text = response.message;
            		$scope.sub_category_name = '';
            		$scope.sort_order = '';
            		$scope.sub_category_description = '';
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
					$scope.sub_category_name = ''; 
					$scope.sort_order = '';
					$scope.sub_category_description = '';
				} else {
					$scope.error_msg = true;
					$scope.error_msg_text = response.message;
					$scope.sub_category_name = ''; 
					$scope.sort_order = '';
					$scope.sub_category_description = '';
				}
			});
		}
	}

	$scope.activeOfflineSubCategory = function(key, sub_category_id, value) {
		params = {access_token: access_token, is_active: value, sub_category_id: sub_category_id};
		httpService.post( API_URL + '/active_offline_sub_category', params).then(function(response){
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
			
				$scope.subcategoryList[key].is_active = value;
				$('#successPopup').modal('show');
			}
		});
	}

	$scope.editSubCategory = function(key, sub_category_id) {
		params = {access_token: access_token, sub_category_id: sub_category_id};
		httpService.post( API_URL + '/get_sub_category_details', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var responseData = response.response;
				$scope.edit_sub_category_name = responseData.sub_category_name;
				$scope.edit_sub_category_description = responseData.sub_category_description;
				$scope.edit_sub_category_id = responseData.sub_category_id;
				$('#editCategoryPopup').modal('show');
			}
		}, function myError(response) {
			alert(response.data.message);
		});
	}

	$scope.update_sub_category = function() {
		
		if ( $scope.edit_sub_category_name == '' || $scope.edit_sub_category_name == undefined || $scope.edit_sub_category_name == null ) {
			$scope.edit_sub_category_name_error = true;
			$scope.edit_sub_category_name_msg = "This field is required."
		} else {
			$scope.edit_sub_category_name_error = false;
		}

		// if ( $scope.sort_order == '' || $scope.sort_order == undefined || $scope.sort_order == null ) {
		// 	$scope.sort_order_error = true;
		// 	$scope.sort_order_msg = "This field is required.";
		// } else {
		// 	if ( !$scope.sort_order.match(numberFormat) ) {
		// 		$scope.sort_order_error = true;
		// 		$scope.sort_order_msg = "This field is only required number."
		// 	} else {
		// 		$scope.sort_order_error = false;
		// 	}
		// }

		if ( $scope.edit_sub_category_description == undefined || $scope.edit_sub_category_description == null ) {
			$scope.edit_sub_category_description = "";
		} 

		if ( $scope.edit_sub_category_name_error == true ) {
			return false;
		} else {
			var params = {
				access_token: access_token,
				edit_sub_category_name: $scope.edit_sub_category_name,
				edit_sub_category_description: $scope.edit_sub_category_description,
				edit_sub_category_id: $scope.edit_sub_category_id
			}
			httpService.post( API_URL + '/update_sub_category', params).then(function(response){
				var response = response.response.data;
				console.log(response);
				if( response.status == 200 ){

					$scope.edit_success_msg = true;
            		$scope.edit_success_msg_text = response.message;
            		$scope.edit_sub_category_name = '';
            		$scope.edit_sub_category_description = '';
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
					$scope.edit_sub_category_name = '';
					$scope.edit_sub_category_description = '';
				} else {
					$scope.edit_error_msg = true;
					$scope.edit_error_msg_text = response.message;
					$scope.edit_sub_category_name = '';
					$scope.edit_sub_category_description = '';
				}
			});
		}
	}
}]);