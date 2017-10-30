app.controller('ecom_product', ['$scope','httpService','API_URL','$window','$rootScope', function ($scope, httpService, API_URL, $window, $rootScope) {

	var user = localStorage.getItem("user");
	var userData = JSON.parse(user);
	var access_token = userData.access_token;
	var numberFormat = /^(?:[1-9]\d*|\d)$/;

	// $scope.master_category_name_error = false;
	// $scope.master_sort_order_error = false;
	// $scope.success_msg = false;
	// $scope.error_msg = false;

	// $scope.edit_master_category_name_error = false;
	// $scope.edit_master_sort_order_error = false;
	// $scope.edit_success_msg = false;
	// $scope.edit_error_msg = false;

	// $scope.init = function() {
	// 	params = {access_token: access_token};
	// 	console.log(params);
	// 	httpService.post( API_URL + '/get_product_list', params).then(function(response){
	// 		var response = response.response.data;
	// 		console.log(response);
	// 		if(response.status == 200){
	// 			var responseData = response.response;
	// 			for (var i = 0; i < responseData.length; i++) {
	// 				responseData[i].number = i+1;
	// 			}
	// 			$scope.productList = responseData;
	// 			console.log($scope.productList);
	// 			angular.element(document).ready( function () {

	// 				$('#product').dataTable({
	// 					// 	"bDestroy":true,
	// 					'paging': true,
	// 					'ordering': true,
	// 					'info': true,
	// 					oLanguage: {
	// 						sSearch: 'Search all columns:',
	// 						sLengthMenu: '_MENU_ records per page',
	// 						info: 'Showing page _PAGE_ of _PAGES_',
	// 						zeroRecords: 'Nothing found - sorry',
	// 						infoEmpty: 'No records available',
	// 						infoFiltered: '(filtered from _MAX_ total records)'
	// 					},
	// 					"aoColumnDefs": [
	// 						{ 'bSortable': false, 'aTargets': [3] }
	// 					]
	// 				});
	// 			});
	// 		}
	// 	}, function myError(response) {
	// 		alert(response.data.message);
	// 	});
	// }
	// $scope.init();
}]);

