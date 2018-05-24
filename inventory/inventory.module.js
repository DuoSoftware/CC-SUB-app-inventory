////////////////////////////////
// App : Inventory
// Owner  : Gihan Herath
// Last changed date : 2018/05/22
// Version : 6.1.0.6
// Modified By : Gihan
/////////////////////////////////

(function ()
{
	'use strict';

	angular
		.module('app.inventory', [])
		.config(config)
		.filter('parseDate',parseDateFilter);

	/** @ngInject */
	function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider, mesentitlementProvider)
	{
		// State
		$stateProvider
			.state('app.inventory', {
				url    : '/inventory',
				views  : {
					'inventory@app': {
						templateUrl: 'app/main/inventory/inventory.html',
						controller : 'InventoryController as vm'
					}
				},
				resolve: {
					security: ['$q','mesentitlement','$timeout','$rootScope','$state','$location', function($q,mesentitlement,$timeout,$rootScope,$state, $location){
						return $q(function(resolve, reject) {
							$timeout(function() {
								if ($rootScope.isBaseSet2) {
									resolve(function () {
										var entitledStatesReturn = mesentitlement.stateDepResolver('inventory');

										mesentitlementProvider.setStateCheck("inventory");

										if(entitledStatesReturn !== true){
											return $q.reject("unauthorized");
										}
									});
								} else {
									return $location.path('/guide');
								}
							});
						});
					}]
				},
				bodyClass: 'inventory'
			});

		//Api
		msApiProvider.register('cc_invoice.invoices', ['app/data/cc_invoice/invoices.json']);

		// Navigation

		msNavigationServiceProvider.saveItem('inventory', {
			title    : 'inventory',
			icon     : 'icon-leaf',
			state    : 'app.inventory',
			/*stateParams: {
			 'param1': 'page'
			 },*/
			weight   : 6
		});
	}

	function parseDateFilter(){
		return function(input){
			return new Date(input);
		};
	}
})();
