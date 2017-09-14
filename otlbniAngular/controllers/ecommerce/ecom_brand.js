app.controller('ecom_brand', ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope){
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
	var numberFormat = /^(?:[1-9]\d*|\d)$/;

	var src="";
	$scope.master_brand_pic = "";
	$scope.master_brand_pic_object = "";

	$scope.master_brand_name_error = false;
	$scope.master_brand_pic_error = false;
	$scope.success_msg = false;
	$scope.error_msg = false;

	$scope.edit_master_brand_pic = "";
	$scope.edit_master_brand_pic_object = "";

	$scope.edit_master_brand_name_error = false;
	$scope.edit_master_brand_pic_error = false;
	$scope.edit_success_msg = false;
	$scope.edit_error_msg = false;

	$scope.init = function() {
		params = {access_token: access_token};
		httpService.post( API_URL + '/get_brand_list', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var responseData = response.response;
				for (var i = 0; i < responseData.length; i++) {
					responseData[i].number = i+1;
					responseData[i].brand_image = API_URL+'/admin/brand/'+responseData[i].brand_image;
				}
				console.log(responseData);
				$scope.brandList = responseData;
				angular.element(document).ready( function () {

					$('#brand').dataTable({
					// 	"bDestroy":true,
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

	$scope.openAddBrandPopup = function () {
		$scope.master_brand_pic = "";
	}

	// For image show as read url
	$scope.imageUpload = function(event){
		var files = event.target.files; //FileList object
		$scope.master_brand_pic_object = files[0];
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var reader = new FileReader();
			reader.onload = $scope.imageIsLoaded; 
			reader.readAsDataURL(file);
		}
	}
	// Stroring image
	$scope.imageIsLoaded = function(e){
		$scope.$apply(function() {
			$scope.master_brand_pic = e.target.result;
		});
	}

	$scope.add_brand = function() {	

		// console.log("image",$scope.master_brand_pic_object);
		if ( $scope.master_brand_name == '' || $scope.master_brand_name == undefined || $scope.master_brand_name == null ) {
			$scope.master_brand_name_error = true;
			$scope.master_brand_name_msg = "This field is required."
		} else {
			$scope.master_brand_name_error = false;
		}
		 
		if ( $scope.master_brand_pic == '' || $scope.master_brand_pic == undefined || $scope.master_brand_pic == null ) {
			$scope.master_brand_pic_error = true;
			$scope.master_brand_pic_msg = "This field is required."
		} else {
			$scope.master_brand_pic_error = false;
		}
		 
		if ( $scope.master_brand_description == undefined || $scope.master_brand_description == null ) {
			$scope.master_brand_description = "";
		} 

		if ( $scope.master_brand_name_error == true || $scope.brand_sort_order_error == true ) {
			return false;
		} else {
			var formData = new FormData();
			formData.append("access_token", access_token);
			formData.append("brand_name", $scope.master_brand_name);
			formData.append("brand_description", $scope.master_brand_description);
			formData.append("brand_image", $scope.master_brand_pic_object);
	
			httpService.postWithFile( API_URL + '/add_brand', formData).then(function(response){
				// console.log(response);
				var response = response.data;
				if( response.status == 200 ){

					$scope.success_msg = true;
					$scope.success_msg_text = response.message;
					$scope.brand_category_name = '';
					$scope.brand_category_description = '';
					setTimeout(function () {
						$scope.success_msg_text = "";
						$('#addBrandPopup').modal("hide");
						$scope.success_msg = false;
						$window.location.reload();
					}, 3000); 

				} else if ( response.status == 422 ) {
					$scope.error_msg = true;
					$scope.error_msg_text = response.message;
					$scope.master_brand_name = '';
					$scope.master_brand_description = '';
				} else {
					$scope.error_msg = true;
					$scope.error_msg_text = response.message;
					$scope.master_brand_name = '';
					$scope.master_brand_description = '';
				}
			});
		}
	}

	$scope.editBrand = function(key, brand_id) {
		params = {access_token: access_token, brand_id: brand_id};
		httpService.post( API_URL + '/get_brand_details', params).then(function(response){
			var response = response.response.data;
			console.log(response);
			if(response.status == 200){
				var responseData = response.response;
				$scope.edit_master_brand_name = responseData.brand_name;
				$scope.edit_master_brand_description = responseData.brand_description;
				$scope.edit_master_brand_id = responseData.brand_id;
				$scope.edit_master_brand_pic = API_URL+'/admin/brand/'+responseData.brand_image;
				$('#editBrandPopup').modal('show');
			}
		}, function myError(response) {
			alert(response.data.message);
		});
	}

	$scope.activeOfflineBrand = function(key, brand_id, value) {
		params = {access_token: access_token, is_active: value, brand_id: brand_id};
		httpService.post( API_URL + '/active_inactive_brand', params).then(function(response){
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
			
				$scope.brandList[key].is_active = value;
				$('#successPopup').modal('show');
			}
		});
	}

	$scope.update_brand = function() {
		
		if ( $scope.edit_master_brand_name == '' || $scope.edit_master_brand_name == undefined || $scope.edit_master_brand_name == null ) {
			$scope.edit_master_brand_name_error = true;
			$scope.edit_master_brand_name_msg = "This field is required."
		} else {
			$scope.edit_master_brand_name_error = false;
		}

		if ( $scope.edit_master_brand_description == undefined || $scope.edit_master_brand_description == null ) {
			$scope.edit_master_brand_description = "";
		} 

		if ( $scope.edit_master_brand_name_error == true ) {
			return false;
		} else {
			var params = {
				access_token: access_token,
				brand_name: $scope.edit_master_brand_name,
				brand_description: $scope.edit_master_brand_description,
				brand_id: $scope.edit_master_brand_id
			}
			httpService.post( API_URL + '/update_brand', params).then(function(response){
				var response = response.response.data;
				console.log(response);
				if( response.status == 200 ){

					$scope.edit_success_msg = true;
            		$scope.edit_success_msg_text = response.message;
            		$scope.edit_master_brand_name = '';
            		$scope.edit_master_brand_description = '';
            		// $scope.init();
            		setTimeout(function () {
						$scope.edit_success_msg_text = "";
						$('#editBrandPopup').modal("hide");
						$scope.edit_success_msg = false;
						// $scope.init(); 
						$window.location.reload();
					}, 3000); 

				} else if ( response.status == 422 ) {
					$scope.edit_error_msg = true;
					$scope.edit_error_msg_text = response.message;
					$scope.edit_master_brand_name = '';
					$scope.edit_master_brand_description = '';
				} else {
					$scope.edit_error_msg = true;
					$scope.edit_error_msg_text = response.message;
					$scope.edit_master_brand_name = '';
					$scope.edit_master_brand_description = '';
				}
			});
		}
	}
}]);