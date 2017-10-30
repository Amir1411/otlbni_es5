app.controller('add_product', ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope){
	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
    var numberFormat = /^(?:[1-9]\d*|\d)$/;
    $scope.master_product_name_error = false;
	$scope.master_product_pic_error = false;
	$scope.brand_sort_order_error = false;
	$scope.success_msg = false;
	$scope.error_msg = false;

	 $scope.tinymceModel = 'Initial content';

  $scope.getContent = function() {
    console.log('Editor content:', $scope.tinymceModel);
  };

  $scope.setContent = function() {
    $scope.tinymceModel = 'Time: ' + (new Date());
  };

  $scope.tinymceOptions = {
    plugins: 'link image code',
    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | code'
  };

	$scope.add_product_tab = function(tab_id) {
		$('.nav-tabs li').removeClass("active");
		$('.'+tab_id).addClass("active");
        $('.tab-pane').removeClass("active");
        $('#'+tab_id).addClass("active");
        $('.tab-pane').removeClass("in");
        $('#'+tab_id).addClass("in");
	}

	$scope.init = function() {
        params = {access_token: access_token};
		// console.log(params);
		// httpService.post( API_URL + '/get_brand_category_details', params).then(function(response){
		// 	var response = response.response.data;
		// 	console.log(response);
		// 	if(response.status == 200){
		// 		var responseData = response.response;
		// 		for (var i = 0; i < responseData.length; i++) {
		// 			responseData[i].number = i+1;
		// 			// if ( responseData[i].is_active == 1 ) {
		// 			// 	responseData[i].is_active = "<div class='status active'>Active</div>";
		// 			// } else {
		// 			// 	responseData[i].is_active = "<div class='status offline'>Offline</div>";
		// 			// }
		// 		}
		// 		console.log(responseData);
		// 		$scope.brandCategoryList = responseData;
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
		// 	}
		// }, function myError(response) {
		// 	alert(response.data.message);
		// });
	}
    $scope.init();
    $scope.master_category = [
        {'id': 10, 'label': 'Electronics'},
        {'id': 27, 'label': 'Clothes'},
        {'id': 39, 'label': 'Watches'},
    ]

    $scope.category = [
        {'id': 10, 'label': 'Mobile'},
        {'id': 27, 'label': 'Westen Wear'},
        {'id': 39, 'label': 'Aldo'},
    ]

    $scope.sub_category = [
        {'id': 10, 'label': 'Samsung'},
        {'id': 27, 'label': 'Zara'},
        {'id': 39, 'label': 'Apple'},
    ]
    $scope.stepsModel = [];
    $scope.imageUpload = function(event){
         var files = event.target.files; //FileList object
         for (var i = 0; i < files.length; i++) {
             var file = files[i];
                 var reader = new FileReader();
                 reader.onload = $scope.imageIsLoaded; 
                 reader.readAsDataURL(file);
         }
    }
    $scope.imageIsLoaded = function(e){
        $scope.$apply(function() {
           $scope.stepsModel.push(e.target.result);
        });
    }
    $scope.add_product = function() {
        if ( $scope.master_product_name == '' || $scope.master_product_name == undefined || $scope.master_product_name == null ) {
			$scope.master_product_name_error = true;
			$scope.master_product_name_msg = "This field is required."
		} else {
			$scope.master_product_name_error = false;
		}
         

         if ( $scope.master_product_pic == '' || $scope.master_product_pic == undefined || $scope.master_product_pic == null ) {
			$scope.master_product_pic_error = true;
			$scope.master_product_pic_msg = "This field is required."
		} else {
			$scope.master_product_pic_error = false;
		}

         if ( $scope.master_product_description == undefined || $scope.master_product_description == null ) {
			$scope.master_product_description = "";
        } 
        if ( $scope.master_product_name_error == true || $scope.brand_sort_order_error == true ) {
			return false;
		} else {
			var params = {
				access_token: access_token,
				master_product_name: $scope.master_product_name,
				sort_order: "",
				product_description: $scope.master_product_description
			}
			httpService.post( API_URL + '/add_product', params).then(function(response){
				var response = response.response.data;
				console.log(response);
				if( response.status == 200 ){

					$scope.success_msg = true;
            		$scope.success_msg_text = response.message;
            		$scope.product_name = '';
            		$scope.brand_sort_order = '';
            		$scope.product_description = '';
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
					$scope.master_product_name = ''; 
					$scope.brand_sort_order = '';
					$scope.master_product_description = '';
				} else {
					$scope.error_msg = true;
					$scope.error_msg_text = response.message;
					$scope.master_product_name = ''; 
					$scope.brand_sort_order = '';
					$scope.master_product_description = '';
				}
			});
		}
	}
}]);