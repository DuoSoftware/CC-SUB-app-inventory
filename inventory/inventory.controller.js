////////////////////////////////
// App : Inventory
// File : Inventory Controller
// Owner  : GihanHerath
// Last changed date : 2017/01/06
// Version : 6.0.0.18
/////////////////////////////////

(function ()
{
    'use strict';

    angular
        .module('app.inventory')
        .controller('InventoryController', InventoryController);

    /** @ngInject */ //$productHandler,
    function InventoryController($scope, $document, $timeout, notifications, $mdToast, $mdDialog, $mdMedia, $mdSidenav, $charge, $productHandler, $filter, $rootScope)
    {
        var vm = this;

        vm.appInnerState = "default";
        vm.pageTitle="Create New";
        vm.checked = [];
        vm.colors = ['blue-bg', 'blue-grey-bg', 'orange-bg', 'pink-bg', 'purple-bg'];

        vm.selectedInventory = {};
        vm.toggleSidenav = toggleSidenav;

        vm.responsiveReadPane = undefined;
        vm.activeInvoicePaneIndex = 0;
        vm.dynamicHeight = false;

        vm.scrollPos = 0;
        vm.scrollEl = angular.element('#content');

        //vm.invoices = Invoice.data;
        //console.log(vm.invoices);
        //invoice data getter !
        //vm.selectedInvoice = vm.invoices[0];
        vm.selectedMailShowDetails = false;

        // Methods
        vm.checkAll = checkAll;
        vm.closeReadPane = closeReadPane;
        vm.addInvoice = toggleinnerView;
        vm.isChecked = isChecked;
        vm.selectInventory = selectInventory;
        vm.toggleStarred = toggleStarred;
        vm.toggleCheck = toggleCheck;
        $scope.switchInfoPane = switchInfoPane;
        vm.searchMoreInit = true;

        $scope.showFilers=true;
        //////////

        // Watch screen size to activate responsive read pane
        $scope.$watch(function ()
        {
            return $mdMedia('gt-md');
        }, function (current)
        {
            vm.responsiveReadPane = !current;
        });

        // Watch screen size to activate dynamic height on tabs
        $scope.$watch(function ()
        {
            return $mdMedia('xs');
        }, function (current)
        {
            vm.dynamicHeight = current;
        });

        /**
         * Select product
         *
         * @param product
         */
        function selectInventory(inventory)
        {

            var rowproducts=[];
            $scope.readLoading = true;

            if(inventory.inventory_type=='Receipt')
            {
                var grnid=inventory.guGRNID;//guGRNID grnNo
				$scope.activeInventory = grnid;
                $charge.inventory().getHeaderByID(grnid).success(function(data)
                {
                    console.log(data);
                    for(var i=0;i<data.length;i++)
                    {
                        rowproducts.push({
                            guProductID: data[i].guProductID,
                            productCode: data[i].productCode,
                            productPrice: data[i].productPrice,
                            quantity: data[i].quantity
                        });
                    }
                    inventory.rowproducts=rowproducts;
                    inventory.note=data[0].note;

                    if(data[0].profile_type=='Individual')
                    {
                        inventory.UserName=data[0].first_name+" "+data[0].last_name;
                        inventory.UserAddress=data[0].bill_addr;
                        inventory.UserContact=data[0].phone;
                        inventory.UserEmail=data[0].email_addr;
                    }
                    else if(data[0].profile_type=='Business')
                    {
                        inventory.UserName=data[0].business_contact_name; ////business_name,business_contact_name
                        inventory.UserAddress=data[0].bill_addr;
                        inventory.UserContact=data[0].business_contact_no;
                        inventory.UserEmail=data[0].email_addr;
                    }
                    vm.selectedInventory = inventory;
					$scope.readLoading = false;

				}).error(function(data)
                {
                    console.log(data);
					$scope.readLoading = false;
				})
            }
            else if(inventory.inventory_type=='Issue')
            {
                var aodid=inventory.guAODID;//guAODID aodNo
				$scope.activeInventory = aodid;
				$charge.aod().getHeaderByID(aodid).success(function(data)
                {
                    console.log(data);
                    for(var i=0;i<data.length;i++)
                    {
                        rowproducts.push({
                            guProductID: data[i].guProductID,
                            productCode: data[i].productCode,
                            productPrice: data[i].productPrice,
                            quantity: data[i].quantity
                        });
                    }
                    inventory.rowproducts=rowproducts;
                    inventory.note=data[0].note;

                    if(data[0].profile_type=='Individual')
                    {
                        inventory.UserName=data[0].first_name+" "+data[0].last_name;
                        inventory.UserAddress=data[0].bill_addr;
                        inventory.UserContact=data[0].phone;
                        inventory.UserEmail=data[0].email_addr;
                    }
                    else if(data[0].profile_type=='Business')
                    {
                        inventory.UserName=data[0].business_contact_name; //business_name,business_contact_name
                        inventory.UserAddress=data[0].bill_addr;
                        inventory.UserContact=data[0].business_contact_no;
                        inventory.UserEmail=data[0].email_addr;
                    }
                    vm.selectedInventory = inventory;
					$scope.readLoading = false;
				}).error(function(data)
                {
                    console.log(data);
					$scope.readLoading = false;
				})
            }

            //vm.selectedInventory = inventory;

            $scope.showFilers=false;

            // $timeout(function ()
            // {
            //     vm.activeInvoicePaneIndex = 1;
			//
            //     // Store the current scrollPos
            //     vm.scrollPos = vm.scrollEl.scrollTop();
			//
            //     // Scroll to the top
            //     vm.scrollEl.scrollTop(0);
            // });
        }

        /**
         * Toggle starred
         *
         * @param mail
         * @param event
         */
        function toggleStarred(mail, event)
        {
            event.stopPropagation();
            mail.starred = !mail.starred;
        }

        /**
         * Toggle checked status of the mail
         *
         * @param invoice
         * @param event
         */
        function toggleCheck(invoice, event)
        {
            if ( event )
            {
                event.stopPropagation();
            }

            var idx = vm.checked.indexOf(invoice);

            if ( idx > -1 )
            {
                vm.checked.splice(idx, 1);
            }
            else
            {
                vm.checked.push(invoice);
            }
        }

        /**
         * Return checked status of the invoice
         *
         * @param invoice
         * @returns {boolean}
         */
        function isChecked(invoice)
        {
            return vm.checked.indexOf(invoice) > -1;
        }

        /**
         * Check all
         */
        function checkAll()
        {
            if ( vm.allChecked )
            {
                vm.checked = [];
                vm.allChecked = false;
            }
            else
            {
                angular.forEach(vm.invoices, function (invoice)
                {
                    if ( !isChecked(invoice) )
                    {
                        toggleCheck(invoice);
                    }
                });

                vm.allChecked = true;
            }
        }

        /**
         * Open compose dialog
         *
         * @param ev
         */
        function addProductDialog(ev)
        {
            $mdDialog.show({
                controller         : 'AddProductController2',
                controllerAs       : 'vm',
                locals             : {
                    selectedMail: undefined
                },
                templateUrl        : 'app/main/product/dialogs/compose/compose-dialog.html',
                parent             : angular.element($document.body),
                targetEvent        : ev,
                clickOutsideToClose: true
            });
        }

        /**
         * Toggle sidenav
         *
         * @param sidenavId
         */
        function toggleSidenav(sidenavId)
        {
            $mdSidenav(sidenavId).toggle();
        }

        /**
         * Toggle innerview
         *
         */
        function toggleinnerView(state){
            if(vm.activeInvoicePaneIndex == 0){
                vm.activeInvoicePaneIndex = 1;
                $scope.showInpageReadpane = false;
            }else{
                if(vm.editForm != undefined && vm.editForm.$dirty && state != 'submitTrigger' ){
                    var confirm = $mdDialog.confirm()
                        .title('Are you sure?')
                        .textContent('Fields have changed and you might have unsaved data. Are you sure you want to leave this page?')
                        .ariaLabel('Are you sure?')
                        .targetEvent()
                        .ok('Yes')
                        .cancel('Stay');

                    $mdDialog.show(confirm).then(function() {
                        vm.editForm.$pristine = false;
                        vm.editForm.$dirty = false;
                        $scope.clearform();
						vm.activeInvoicePaneIndex = 1;
					}, function() {
                    });
                }else if(vm.editForm2 != undefined && vm.editForm2.$dirty && state != 'submitTrigger' ){
                    var confirm = $mdDialog.confirm()
                        .title('Are you sure?')
                        .textContent('Fields have changed and you might have unsaved data. Are you sure you want to leave this page?')
                        .ariaLabel('Are you sure?')
                        .targetEvent()
                        .ok('Yes')
                        .cancel('Stay');

                    $mdDialog.show(confirm).then(function() {
                        vm.editForm2.$pristine = false;
                        vm.editForm2.$dirty = false;
                        $scope.clearform();
						vm.activeInvoicePaneIndex = 1;
					}, function() {
                    });
                }else {
                   vm.activeInvoicePaneIndex = 0;
                }
            }
        }

        /**
         * Switch in-page read
         *
         */
		$scope.showInpageReadpane = false;
		function switchInfoPane(state, inventory){
			if(state=='show'){
				$scope.showInpageReadpane = true;
				$scope.showEmbedForm=false;
				vm.selectInventory(inventory);
			}else if(state=='close'){
				if($scope.inpageReadPaneEdit){
					$scope.cancelEdit();
					vm.selectedPlan = $scope.tempEditPlan;
				}else{
					$scope.showInpageReadpane = false;
					$scope.inpageReadPaneEdit=false;
				}
			}
        }

		function closeReadPane()
		{
			if(vm.editForm != undefined){
				if(vm.editForm.$pristine && vm.editForm.$dirty ){
					var confirm = $mdDialog.confirm()
						.title('Are you sure?')
						.textContent('Fields have changed and you might have unsaved data. Are you sure you want to leave this page?')
						.ariaLabel('Are you sure?')
						.targetEvent()
						.ok('Yes')
						.cancel('Stay');

					$mdDialog.show(confirm).then(function() {
						vm.editForm.$setPristine;
						vm.editForm.$setDirty;
						$scope.editOff = false;
						vm.pageTitle = "Create Plan";
					}, function() {
					});
				}else {
					$scope.editOff = false;
					vm.activeInvoicePaneIndex = 0;
				}
			}else if(vm.editForm2 != undefined){
				if(vm.editForm2.$pristine && vm.editForm2.$dirty ){
					var confirm = $mdDialog.confirm()
						.title('Are you sure?')
						.textContent('Fields have changed and you might have unsaved data. Are you sure you want to leave this page?')
						.ariaLabel('Are you sure?')
						.targetEvent()
						.ok('Yes')
						.cancel('Stay');

					$mdDialog.show(confirm).then(function() {
						vm.editForm2.$setPristine;
						vm.editForm2.$setDirty;
						$scope.editOff = false;
						vm.pageTitle = "Create Plan";
					}, function() {
					});
				}else {
					$scope.editOff = false;
					vm.activeInvoicePaneIndex = 0;
				}
			}

			$timeout(function ()
			{
				vm.scrollEl.scrollTop(vm.scrollPos);
			}, 650);
			$scope.showFilers=true;
		}




        $scope.a={};
        $scope.customer_supplier={};
        $scope.store_details={};

        $scope.items = [];
        $scope.profilelist = [];
        $scope.productlist = [];
        $scope.storeslist = [];

        $charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_InventoryAttributes","Store").success(function(data)
        {
            console.log(data);
            $rootScope.isStoreLoaded = true;

            for(var i=0;i<data.length;i++) {
                var obj = data[i];

                $scope.storeslist.push({
                    storename: obj.RecordFieldData,
                    storeId: obj.RowID
                });
            }
        }).error(function(data) {
            console.log(data);
            $rootScope.isStoreLoaded = false;
        })

		$charge.settingsapp().getDuobaseValuesByTableName("CTS_CompanyAttributes").success(function(data) {
            $scope.CompanyProfile=data;
            $scope.companyName=data[0].RecordFieldData;
            $scope.companyAddress=data[1].RecordFieldData;
            $scope.companyPhone=data[2].RecordFieldData;
            $scope.companyEmail=data[3].RecordFieldData;
            $scope.companyLogo=data[4].RecordFieldData;

        }).error(function(data) {
            console.log(data);
        })

        $charge.commondata().getDuobaseValuesByTableName("CTS_FooterAttributes").success(function(data) {

            $scope.FooterData=data;
            $scope.FooterGreeting=data[0].RecordFieldData;
            $scope.FooterDisclaimer=data[1].RecordFieldData!=""?atob(data[1].RecordFieldData):"";
        }).error(function(data) {
        })

        $charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_GeneralAttributes","DecimalPointLength").success(function(data) {
            $scope.decimalPoint=parseInt(data[0].RecordFieldData);
            //
            //
        }).error(function(data) {
            console.log(data);
        });

        $scope.isLoading = true;
        $scope.isdataavailable=true;
        var grnDataEnds=false;
        var aodDataEnds=false;
        var editfalse = true;
        $scope.editOff = editfalse;

        $scope.items=[];
        var skip1=0;
        var skip2=0;
        var take=50;
        $scope.loading1 = true;
        $scope.loading2 = true;
        $scope.hideSearchMore=false;

        $scope.more = function(){

            $charge.inventory().allheaders(skip1,take,'desc').success(function(data)
            {
                console.log(data);

                if($scope.loading1==true)
                {
                    skip1 += take;
                    for (var i = 0; i < data.length; i++) {
                        var obj=data[i];

                        $scope.items.push({
                            guGRNID : obj.guGRNID,
                            grnNo : obj.grnNo,
                            guAODID : "1234",
                            aodNo : "1234",
                            supplier : obj.supplier,
                            customer : "abcd",
                            receivedDate : obj.receivedDate,
                            receivedStore : obj.receivedStore,
                            issuedDate : "12/12/16",
                            issuedStore : "abcd",
                            createdDate : obj.createdDate,
                            guTranID : obj.guTranID,
                            status : obj.status,
                            inventory_type : "Receipt"
                        });
                    }

                    vm.inventories = $scope.items;

                    $scope.listLoaded = true;
                    $scope.loading1 = false;
                    $scope.isdataavailable=true;
                    vm.searchMoreInit = false;

                    grnDataEnds=false;
                    if(data.length<take){
                        grnDataEnds=true;
                        if(aodDataEnds){
                            $scope.isdataavailable=false;
                            $scope.hideSearchMore=true;
                        }
                    }
                }

            }).error(function(data)
            {
                $scope.listLoaded = true;
				$scope.loading1 = false;
				console.log(data);
                $scope.isSpinnerShown=false;
                grnDataEnds=true;
                if(aodDataEnds){
                    $scope.isdataavailable=false;
                    $scope.hideSearchMore=true;
                }
            });

            $charge.aod().allheaders(skip2,take,'desc').success(function(data)
            {
                console.log(data);

                if($scope.loading2==true)
                {
                    skip2 += take;
                    for (var i = 0; i < data.length; i++) {
                        var obj=data[i];

                        $scope.items.push({
                            guAODID : obj.guAODID,
                            aodNo : obj.aodNo,
                            guGRNID : "1234",
                            grnNo : "1234",
                            supplier : "abcd",
                            customer : obj.customer,
                            receivedDate : "12/12/16",
                            receivedStore : "abcd",
                            issuedDate : obj.issuedDate,
                            issuedStore : obj.issuedStore,
                            createdDate : obj.createdDate,
                            guTranID : obj.guTranID,
                            status : obj.status,
                            inventory_type : "Issue"
                        });
                    }

                    vm.inventories = $scope.items;

                    $scope.loading2 = false;
                    $scope.isLoading = false;
                    $scope.isdataavailable=true;
                    vm.searchMoreInit = false;

                    aodDataEnds=false;
                    if(data.length<take){
                        aodDataEnds=true;
                        if(grnDataEnds){
                            $scope.isdataavailable=false;
                            $scope.hideSearchMore=true;
                        }
                    }
                }

            }).error(function(data)
            {
                console.log(data);
                $scope.isSpinnerShown=false;
                aodDataEnds=true;
                if(grnDataEnds){
                    $scope.isdataavailable=false;
                    $scope.hideSearchMore=true;
                }
				$scope.loading2 = false;
				$scope.isLoading = false;
            })

        };
        // we call the function twice to populate the list
        $scope.more();

        $scope.searchmorebuttonclick = function (){
            $scope.loading1 = true;
            $scope.loading2 = true;
            $scope.more();
        }

        var skipGRNSearch, takeGRNSearch, skipAODSearch, takeAODSearch;
        var tempListInventory;
        $scope.loadByKeywordInventory= function (keyword,length) {
            if($scope.items.length>50) {

                if(length==undefined)
                {
                    keyword="undefined";
                    length=0;
                }
                var searchLength=length;

                if (keyword.length == searchLength) {
                    console.log(keyword);
                    //
                    skipGRNSearch = 0;
                    takeGRNSearch = 50;
                    skipAODSearch = 0;
                    takeAODSearch = 50;
                    tempListInventory = [];
                    $charge.inventory().filterByKey(keyword, skipGRNSearch, takeGRNSearch,'desc').success(function (data) {
                        for (var i = 0; i < data.length; i++) {
                            tempListInventory.push({
                                guGRNID : data[i].guGRNID,
                                grnNo : data[i].grnNo,
                                guAODID : "1234",
                                aodNo : "1234",
                                supplier : data[i].supplier,
                                customer : "abcd",
                                receivedDate : data[i].receivedDate,
                                receivedStore : data[i].receivedStore,
                                issuedDate : "12/12/16",
                                issuedStore : "abcd",
                                createdDate : data[i].createdDate,
                                guTranID : data[i].guTranID,
                                status : data[i].status,
                                inventory_type : "Receipt"
                            });
                        }
                        vm.inventories = tempListInventory;
                        //skipGRNSearch += takeGRNSearch;
                        //$scope.loadPagingGRN(keyword, skipGRNSearch, takeGRNSearch);
                    }).error(function (data) {
                        if(tempListInventory.length>0) {
                            vm.inventories = tempListInventory;
                            //$scope.openProduct(vm.products[0]);
                        }
                        else
                        {
                            vm.inventories=[];
                            vm.selectedInventory=null;
                        }
                    });

                    $charge.aod().filterByKey(keyword, skipAODSearch, takeAODSearch,'desc').success(function (data) {
                        for (var i = 0; i < data.length; i++) {
                            tempListInventory.push({
                                guAODID : data[i].guAODID,
                                aodNo : data[i].aodNo,
                                guGRNID : "1234",
                                grnNo : "1234",
                                supplier : "abcd",
                                customer : data[i].customer,
                                receivedDate : "12/12/16",
                                receivedStore : "abcd",
                                issuedDate : data[i].issuedDate,
                                issuedStore : data[i].issuedStore,
                                createdDate : data[i].createdDate,
                                guTranID : data[i].guTranID,
                                status : data[i].status,
                                inventory_type : "Issue"
                            });
                        }
                        vm.inventories = tempListInventory;
                        //skipAODSearch += takeAODSearch;
                        //$scope.loadPagingAOD(keyword, skipAODSearch, takeAODSearch);
                    }).error(function (data) {
                        if(tempListInventory.length>0) {
                            vm.inventories = tempListInventory;
                            //$scope.openProduct(vm.products[0]);
                        }
                        else
                        {
                            vm.inventories=[];
                            vm.selectedInventory=null;
                        }
                    });
                }
                else if (keyword.length == 0 || keyword == null) {
                    vm.inventories = $scope.items;
                }

                if(searchLength==0||searchLength==undefined)
                {
                    $scope.loading1 = true;
                    $scope.loading2 = true;
                    $scope.more();
                }
            }
        }

        $scope.loadPagingGRN= function (keyword,skip, take) {
            $charge.inventory().filterByKey(keyword, skip, take, 'desc').success(function (data) {
                for(var i=0;i<data.length;i++)
                {
                    tempListInventory.push({
                        guGRNID : data[i].guGRNID,
                        grnNo : data[i].grnNo,
                        guAODID : "1234",
                        aodNo : "1234",
                        supplier : data[i].supplier,
                        customer : "abcd",
                        receivedDate : data[i].receivedDate,
                        receivedStore : data[i].receivedStore,
                        issuedDate : "12/12/16",
                        issuedStore : "abcd",
                        createdDate : data[i].createdDate,
                        guTranID : data[i].guTranID,
                        status : data[i].status,
                        inventory_type : "Receipt"
                    });
                }
                skip += take;
                $scope.loadPagingGRN(keyword,skip, take);
            }).error(function (data) {
                if(tempListInventory.length>0) {
                    vm.inventories = tempListInventory;
                    //$scope.openProduct(vm.products[0]);
                }
                else
                {
                    vm.inventories=[];
                    vm.selectedInventory=null;
                }
            });
        }

        $scope.loadPagingAOD= function (keyword,skip, take) {
            $charge.aod().filterByKey(keyword, skip, take, 'desc').success(function (data) {
                for(var i=0;i<data.length;i++)
                {
                    tempListInventory.push({
                        guAODID : data[i].guAODID,
                        aodNo : data[i].aodNo,
                        guGRNID : "1234",
                        grnNo : "1234",
                        supplier : "abcd",
                        customer : data[i].customer,
                        receivedDate : "12/12/16",
                        receivedStore : "abcd",
                        issuedDate : data[i].issuedDate,
                        issuedStore : data[i].issuedStore,
                        createdDate : data[i].createdDate,
                        guTranID : data[i].guTranID,
                        status : data[i].status,
                        inventory_type : "Issue"
                    });
                }
                skip += take;
                $scope.loadPagingAOD(keyword,skip, take);
            }).error(function (data) {
                if(tempListInventory.length>0) {
                    vm.inventories = tempListInventory;
                    //$scope.openProduct(vm.products[0]);
                }
                else
                {
                    vm.inventories=[];
                    vm.selectedInventory=null;
                }
            });
        }


        vm.type="";
        var filterList;
        $scope.filterMainList = function (filterBy,value){
            filterList = [];
            var skipFilterListGRN=0;
            var takeFilterListGRN=50;
            var skipFilterListAOD=0;
            var takeFilterListAOD=50;
            vm.type="";
            //
            if(filterBy=='type')
            {
                $scope.refreshlist();
                if(value=='GRN')
                {
                    vm.type="Receipt";
                    //$scope.loadFilterPagingGRN(filterBy, value, skipFilterListGRN, takeFilterListGRN);
                }
                else if(value=='AOD')
                {
                    vm.type="Issue";
                    //$scope.loadFilterPagingAOD(filterBy, value, skipFilterListAOD, takeFilterListAOD);
                }
            }
            else
            {
                $charge.inventory().filter(filterBy, value, skipFilterListGRN, takeFilterListGRN, 'desc').success(function (data) {
                    for(var i=0;i<data.length;i++)
                    {
                        filterList.push({
                            guGRNID : data[i].guGRNID,
                            grnNo : data[i].grnNo,
                            guAODID : "1234",
                            aodNo : "1234",
                            supplier : data[i].supplier,
                            customer : "abcd",
                            receivedDate : data[i].receivedDate,
                            receivedStore : data[i].receivedStore,
                            issuedDate : "12/12/16",
                            issuedStore : "abcd",
                            createdDate : data[i].createdDate,
                            guTranID : data[i].guTranID,
                            status : data[i].status,
                            inventory_type : "Receipt"
                        });
                    }
                    skipFilterListGRN += takeFilterListGRN;
                    $scope.loadFilterPagingGRN(filterBy, value, skipFilterListGRN, takeFilterListGRN);
                }).error(function (data) {
                    vm.inventories = [];
                    vm.selectedInventory = null;
                });

                $charge.aod().filter(filterBy, value, skipFilterListAOD, takeFilterListAOD, 'desc').success(function (data) {
                    for(var i=0;i<data.length;i++)
                    {
                        filterList.push({
                            guAODID : data[i].guAODID,
                            aodNo : data[i].aodNo,
                            guGRNID : "1234",
                            grnNo : "1234",
                            supplier : "abcd",
                            customer : data[i].customer,
                            receivedDate : "12/12/16",
                            receivedStore : "abcd",
                            issuedDate : data[i].issuedDate,
                            issuedStore : data[i].issuedStore,
                            createdDate : data[i].createdDate,
                            guTranID : data[i].guTranID,
                            status : data[i].status,
                            inventory_type : "Issue"
                        });
                    }
                    skipFilterListAOD += takeFilterListAOD;
                    $scope.loadFilterPagingAOD(filterBy, value, skipFilterListAOD, takeFilterListAOD);
                }).error(function (data) {
                    vm.inventories = [];
                    vm.selectedInventory = null;
                });
            }

        }

        $scope.loadFilterPagingGRN = function (filterBy, value, skip, take){
            $charge.inventory().filter(filterBy, value, skip, take, 'desc').success(function (data) {
                for(var i=0;i<data.length;i++)
                {
                    filterList.push({
                        guGRNID : data[i].guGRNID,
                        grnNo : data[i].grnNo,
                        guAODID : "1234",
                        aodNo : "1234",
                        supplier : data[i].supplier,
                        customer : "abcd",
                        receivedDate : data[i].receivedDate,
                        receivedStore : data[i].receivedStore,
                        issuedDate : "12/12/16",
                        issuedStore : "abcd",
                        createdDate : data[i].createdDate,
                        guTranID : data[i].guTranID,
                        status : data[i].status,
                        inventory_type : "Receipt"
                    });
                }
                skip += take;
                $scope.loadFilterPagingGRN(filterBy, value, skip, take);
            }).error(function (data) {
                if(filterList.length>0) {
                    vm.inventories = filterList;
                    //$scope.openProduct(vm.products[0]);
                }
                else
                {
                    vm.inventories=[];
                    vm.selectedInventory=null;
                }
            });
        }

        $scope.loadFilterPagingAOD = function (filterBy, value, skip, take){
            $charge.aod().filter(filterBy, value, skip, take, 'desc').success(function (data) {
                for(var i=0;i<data.length;i++)
                {
                    filterList.push({
                        guAODID : data[i].guAODID,
                        aodNo : data[i].aodNo,
                        guGRNID : "1234",
                        grnNo : "1234",
                        supplier : "abcd",
                        customer : data[i].customer,
                        receivedDate : "12/12/16",
                        receivedStore : "abcd",
                        issuedDate : data[i].issuedDate,
                        issuedStore : data[i].issuedStore,
                        createdDate : data[i].createdDate,
                        guTranID : data[i].guTranID,
                        status : data[i].status,
                        inventory_type : "Issue"
                    });
                }
                skip += take;
                $scope.loadFilterPagingAOD(filterBy, value, skip, take);
            }).error(function (data) {
                if(filterList.length>0) {
                    vm.inventories = filterList;
                    //$scope.openProduct(vm.products[0]);
                }
                else
                {
                    vm.inventories=[];
                    vm.selectedInventory=null;
                }
            });
        }


        var skipDropDown;
        var takeDropDown;
        var tempListDropDown;
        //$scope.searchMre=false;
        $scope.loadByKeywordDropDown= function (keyword,rows,index) {
            $scope.waitForSearchMoreKeyword=keyword;
            if(!rows[index].searchMre) {

                if ($scope.productlist.length==10) {
                    if (keyword != undefined) {
                        if (keyword.length == 3) {
                            rows[index].isAutoDisabled = true;
                            skipDropDown = 0;
                            takeDropDown = 10;
                            tempListDropDown = [];
                            rows[index].productlst = [];
                            $charge.product().filterByTrackInventoryKey(keyword, skipDropDown, takeDropDown).success(function (data) {
                                for (var i = 0; i < data.length; i++) {
                                    tempListDropDown.push(data[i]);
                                }
                                rows[index].productlst = tempListDropDown;
                                rows[index].isAutoDisabled = false;

                                if(rows==$scope.rows)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdRecp').focus();
                                        document.querySelector('#'+rows[index].acProductIdRecp).focus();
                                    },0);
                                }
                                else if(rows==$scope.rowsissue)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdIssu').focus();
                                        document.querySelector('#'+rows[index].acProductIdIssu).focus();
                                    },0);
                                }

                                if (data.length < takeDropDown)
                                    rows[index].searchMre = true;
                                $timeout.cancel($scope.waitForSearchMore);
                                //skip += take;
                                //$scope.loadPaging(keyword, rows, index, status, skip, take);
                            }).error(function (data) {
                                rows[index].isAutoDisabled = false;
                                //vm.products = [];
                                //vm.selectedProduct = null;
                                if(rows==$scope.rows)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdRecp').focus();
                                        document.querySelector('#'+rows[index].acProductIdRecp).focus();
                                    },0);
                                }
                                else if(rows==$scope.rowsissue)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdIssu').focus();
                                        document.querySelector('#'+rows[index].acProductIdIssu).focus();
                                    },0);
                                }
                            });
                        }
                        else if(keyword.length>3)
                        {

                            skipDropDown = 0;
                            takeDropDown = 10;
                            tempListDropDown = [];
                            rows[index].isAutoDisabled = true;
                            rows[index].productlst = [];
                            $charge.product().filterByTrackInventoryKey(keyword, skipDropDown, takeDropDown).success(function (data) {
                                for (var i = 0; i < data.length; i++) {
                                    tempListDropDown.push(data[i]);
                                }
                                rows[index].productlst = tempListDropDown;
                                rows[index].isAutoDisabled = false;

                                if(rows==$scope.rows)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdRecp').focus();
                                        document.querySelector('#'+rows[index].acProductIdRecp).focus();
                                    },0);
                                }
                                else if(rows==$scope.rowsissue)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdIssu').focus();
                                        document.querySelector('#'+rows[index].acProductIdIssu).focus();
                                    },0);
                                }

                                if (data.length < takeDropDown)
                                    rows[index].searchMre = true;
                                $timeout.cancel($scope.waitForSearchMore);
                            }).error(function (data) {
                                rows[index].isAutoDisabled = false;

                                if(rows==$scope.rows)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdRecp').focus();
                                        document.querySelector('#'+rows[index].acProductIdRecp).focus();
                                    },0);
                                }
                                else if(rows==$scope.rowsissue)
                                {
                                    setTimeout(function(){
                                        //document.querySelector('#acProductIdIssu').focus();
                                        document.querySelector('#'+rows[index].acProductIdIssu).focus();
                                    },0);
                                }
                            });
                        }
                        else if (keyword.length == 0 || keyword == null) {
                            rows[index].productlst = $scope.productlist;
                            rows[index].searchMre = false;
                        }
                    }
                    else if (keyword == undefined) {
                        rows[index].productlst = $scope.productlist;
                        rows[index].searchMre = false;
                    }
                }
            }
            else if (keyword == undefined || keyword.length == 0) {
                rows[index].productlst = $scope.productlist;
                rows[index].searchMre = false;
            }
            //else if(keyword.length>3)
            //{
            //
            //  if(!$scope.searchMre)
            //  {
            //    $scope.loadByKeyword(keyword,rows,index,status);
            //  }
            //}
        }

        $scope.toggleProductSearchMre= function (ev,rowname,index) {
            //
            if (ev.keyCode === 8) {
                $timeout.cancel($scope.waitForSearchMore);
                $scope.waitForSearchMore = $timeout(function myFunction() {
                    // do something
                    if(rowname[index].searchMre)
                    {
                        rowname[index].searchMre = false;
                        $scope.loadByKeywordDropDown($scope.waitForSearchMoreKeyword,rowname,index);
                    }
                },1000);
                //rowname[index].searchMre = false;
            }
        }


        var skip,take;
        var tempProfileListSupp;
        $scope.filteredUsersSupp = [];
        vm.isAutoDisabledSupp = false;
        //var autoElem = angular.element('#invoice-auto');
        $scope.searchMreSupp=false;
        $scope.loadProfileByKeywordSupp= function (keyword,category) {
            //
            $scope.waitForSearchMoreKeywordSupp=keyword;
            if(!$scope.searchMreSupp) {
                //
                if ($scope.profilelistsupplier.length >= 100) {
                    if (keyword != undefined) {
                        if (keyword.length == 3) {
                            vm.isAutoDisabledSupp = true;
                            skip = 0;
                            take = 10;
                            var tempProfileListSupp = [];
                            $scope.filteredUsersSupp = [];
                            $charge.profile().filterByCatKey(skip,take,category,keyword).success(function (data) {
                                for (var i = 0; i < data.length; i++) {
                                    var obj = data[i];
                                    if(obj.profile_type=='Individual')
                                    {
                                        tempProfileListSupp.push({
                                            profilename : obj.first_name,
                                            profileId : obj.profileId,
                                            othername : obj.last_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr
                                        });
                                    }
                                    else if(obj.profile_type=='Business') {
                                        tempProfileListSupp.push({
                                            profilename : obj.business_name,
                                            profileId : obj.profileId,
                                            othername : obj.business_contact_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr

                                        });
                                    }

                                }
                                $scope.filteredUsersSupp = tempProfileListSupp;
                                vm.isAutoDisabledSupp = false;
                                //autoElem.focus();
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdSupp').focus();
                                },0);
                                if (data.length < take)
                                    $scope.searchMreSupp = true;
                                $timeout.cancel($scope.waitForSearchMoreSupp);
                                //skip += take;
                                //$scope.loadPaging(keyword, rows, index, status, skip, take);
                            }).error(function (data) {
                                vm.isAutoDisabledSupp = false;
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdSupp').focus();
                                },0);
                                //autoElem.empty();
                                //
                                //vm.products = [];
                                //vm.selectedProduct = null;
                            });
                        }
                        else if(keyword.length>3)
                        {
                            //
                            skip = 0;
                            take = 10;
                            tempProfileListSupp = [];
                            vm.isAutoDisabledSupp = true;
                            $scope.filteredUsersSupp = [];
                            $charge.profile().filterByCatKey(skip,take,category,keyword).success(function (data) {
                                for (var i = 0; i < data.length; i++) {
                                    var obj = data[i];
                                    if(obj.profile_type=='Individual')
                                    {
                                        tempProfileListSupp.push({
                                            profilename : obj.first_name,
                                            profileId : obj.profileId,
                                            othername : obj.last_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr
                                        });
                                    }
                                    else if(obj.profile_type=='Business') {
                                        tempProfileListSupp.push({
                                            profilename : obj.business_name,
                                            profileId : obj.profileId,
                                            othername : obj.business_contact_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr

                                        });
                                    }

                                }
                                $scope.filteredUsersSupp = tempProfileListSupp;
                                vm.isAutoDisabledSupp = false;
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdSupp').focus();
                                },0);

                                if (data.length < take)
                                    $scope.searchMreSupp = true;
                                $timeout.cancel($scope.waitForSearchMoreSupp);
                            }).error(function (data) {
                                vm.isAutoDisabledSupp = false;
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdSupp').focus();
                                },0);
                                //autoElem.empty();
                            });
                        }
                        else if (keyword.length == 0 || keyword == null) {
                            $scope.filteredUsersSupp = $scope.profilelistsupplier;
                            $scope.searchMreSupp = false;
                        }
                    }
                    else if (keyword == undefined) {
                        $scope.filteredUsersSupp = $scope.profilelistsupplier;
                        $scope.searchMreSupp = false;
                    }
                }
            }
            else if (keyword == undefined || keyword.length == 0) {
                $scope.filteredUsersSupp = $scope.profilelistsupplier;
                $scope.searchMreSupp = false;
            }
        }


        $scope.toggleProfileSearchMreSupp= function (ev) {
            //
            if (ev.keyCode === 8) {
                $timeout.cancel($scope.waitForSearchMoreSupp);
                $scope.waitForSearchMoreSupp = $timeout(function myFunction() {
                    // do something
                    if($scope.searchMreSupp)
                    {
                        $scope.searchMreSupp = false;
                        $scope.loadProfileByKeywordSupp($scope.waitForSearchMoreKeywordSupp,'Supplier');
                    }
                },1000);
                //$scope.searchMreSupp = false;
            }
        }

        var skip,take;
        var tempProfileListDeal;
        $scope.filteredUsersDeal = [];
        vm.isAutoDisabledDeal = false;
        //var autoElem = angular.element('#invoice-auto');
        $scope.searchMreDeal=false;
        $scope.loadProfileByKeywordDeal= function (keyword,category) {
            //
            $scope.waitForSearchMoreKeywordDeal=keyword;
            if(!$scope.searchMreDeal) {
                //
                if ($scope.profilelistcustomer.length >= 100) {
                    if (keyword != undefined) {
                        if (keyword.length == 3) {
                            vm.isAutoDisabledDeal = true;
                            skip = 0;
                            take = 10;
                            var tempProfileListDeal = [];
                            $scope.filteredUsersDeal = [];
                            $charge.profile().filterByCatKey(skip,take,category,keyword).success(function (data) {
                                for (var i = 0; i < data.length; i++) {
                                    var obj = data[i];
                                    if(obj.profile_type=='Individual')
                                    {
                                        tempProfileListDeal.push({
                                            profilename : obj.first_name,
                                            profileId : obj.profileId,
                                            othername : obj.last_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr
                                        });
                                    }
                                    else if(obj.profile_type=='Business') {
                                        tempProfileListDeal.push({
                                            profilename : obj.business_name,
                                            profileId : obj.profileId,
                                            othername : obj.business_contact_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr

                                        });
                                    }

                                }
                                $scope.filteredUsersDeal = tempProfileListDeal;
                                vm.isAutoDisabledDeal = false;
                                //autoElem.focus();
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdDeal').focus();
                                },0);
                                if (data.length < take)
                                    $scope.searchMreDeal = true;
                                $timeout.cancel($scope.waitForSearchMoreDeal);
                                //skip += take;
                                //$scope.loadPaging(keyword, rows, index, status, skip, take);
                            }).error(function (data) {
                                vm.isAutoDisabledDeal = false;
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdDeal').focus();
                                },0);
                                //autoElem.empty();
                                //
                                //vm.products = [];
                                //vm.selectedProduct = null;
                            });
                        }
                        else if(keyword.length>3)
                        {
                            //
                            skip = 0;
                            take = 10;
                            tempProfileListDeal = [];
                            vm.isAutoDisabledDeal = true;
                            $scope.filteredUsersDeal = [];
                            $charge.profile().filterByCatKey(skip,take,category,keyword).success(function (data) {
                                for (var i = 0; i < data.length; i++) {
                                    var obj = data[i];
                                    if(obj.profile_type=='Individual')
                                    {
                                        tempProfileListDeal.push({
                                            profilename : obj.first_name,
                                            profileId : obj.profileId,
                                            othername : obj.last_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr
                                        });
                                    }
                                    else if(obj.profile_type=='Business') {
                                        tempProfileListDeal.push({
                                            profilename : obj.business_name,
                                            profileId : obj.profileId,
                                            othername : obj.business_contact_name,
                                            profile_type : obj.profile_type,
                                            bill_addr:obj.bill_addr,
                                            category:obj.category,
                                            email:obj.email_addr

                                        });
                                    }

                                }
                                $scope.filteredUsersDeal = tempProfileListDeal;
                                vm.isAutoDisabledDeal = false;
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdDeal').focus();
                                },0);

                                if (data.length < take)
                                    $scope.searchMreDeal = true;
                                $timeout.cancel($scope.waitForSearchMoreDeal);
                            }).error(function (data) {
                                vm.isAutoDisabledDeal = false;
                                setTimeout(function(){
                                    document.querySelector('#acProfileIdDeal').focus();
                                },0);
                                //autoElem.empty();
                            });
                        }
                        else if (keyword.length == 0 || keyword == null) {
                            $scope.filteredUsersDeal = $scope.profilelistcustomer;
                            $scope.searchMreDeal = false;
                        }
                    }
                    else if (keyword == undefined) {
                        $scope.filteredUsersDeal = $scope.profilelistcustomer;
                        $scope.searchMreDeal = false;
                    }
                }
            }
            else if (keyword == undefined || keyword.length == 0) {
                $scope.filteredUsersDeal = $scope.profilelistcustomer;
                $scope.searchMreDeal = false;
            }
        }


        $scope.toggleProfileSearchMreDeal= function (ev) {
            //
            if (ev.keyCode === 8) {
                $timeout.cancel($scope.waitForSearchMoreDeal);
                $scope.waitForSearchMoreDeal = $timeout(function myFunction() {
                    // do something
                    if($scope.searchMreDeal)
                    {
                        $scope.searchMreDeal = false;
                        $scope.loadProfileByKeywordDeal($scope.waitForSearchMoreKeywordDeal,'Dealer');
                    }
                },1000);
                //$scope.searchMreDeal = false;
            }
        }


        $scope.editOff = true;

        $scope.editlistitem = function (item) {

            $scope.editOff = true;
            //
            //console.log(item.gUGRNID+","+item.gUAODID);
            $scope.DivClassName = 'flex-40';

            for (var i = 0; i < $scope.items.length; i++) {
                $scope.items[i].select = false;
            }

            $scope.viewCount = 1;
            item.select = true;
            //$scope.items[i].select = true;

            if ($scope.viewCount == 0) {
                $("#ajdDetails").removeClass('selected-row');

            } else {
                document.getElementById("ajdDetails").classList.add("selected-row");
            }

            var rowproducts=[];

            if(item.inventory_type=='Receipt')
            {
                var grnid=item.grnNo;
                $charge.inventory().getHeaderByID(grnid).success(function(data)
                {
                    console.log(data);
                    for(var i=0;i<data.length;i++)
                    {
                        rowproducts.push({
                            guProductID: data[i].guProductID,
                            productCode: data[i].productCode,
                            productPrice: data[i].productPrice,
                            quantity: data[i].quantity
                        });
                    }
                    item.rowproducts=rowproducts;

                }).error(function(data)
                {
                    console.log(data);
                })
            }
            else if(item.inventory_type=='Issue')
            {
                var aodid=item.aodNo;
                $charge.aod().getHeaderByID(aodid).success(function(data)
                {
                    console.log(data);
                    for(var i=0;i<data.length;i++)
                    {
                        rowproducts.push({
                            guProductID: data[i].guProductID,
                            productCode: data[i].productCode,
                            productPrice: data[i].productPrice,
                            quantity: data[i].quantity
                        });
                    }
                    item.rowproducts=rowproducts;
                }).error(function(data)
                {
                    console.log(data);
                })
            }
            $scope.selectedprofile = item;

            //angular.element('#viewAllWhiteframe').css('margin', '0');
            //angular.element('#viewAllWhiteframe').css('max-width', '750px');

        }

        $scope.toggleEdit = function () {
            if($scope.editOff==true)
            {
                $scope.editOff = false;
            }
            else
            {
                $scope.editOff = true;
            }

        }

        $scope.cancelorder = function (editedprofile) {
            $scope.editOff = true;

            if(editedprofile.inventory_type == "Receipt")
            {
                //var updatedinventoryobject = editedprofile;
                $charge.inventory().cancel(editedprofile.grnNo).success(function(data){
                    console.log(data);

                    $mdToast.show({
                        template: '<md-toast class="md-toast-success" >Order has been cancelled!</md-toast>',
                        hideDelay: 2000,
                        position: 'bottom right'
                    });

                    //$scope.reloadpage();
                    $scope.refreshlist();
                    closeReadPane();

                }).error(function(data){
                    console.log(data);
                    $mdToast.show({
                        template: '<md-toast class="md-toast-success" >Order cancel failed!</md-toast>',
                        hideDelay: 2000,
                        position: 'bottom right'
                    });
                })
            }
            else if(editedprofile.inventory_type == "Issue")
            {
                //var updatedaodobject = editedprofile;
                $charge.aod().cancel(editedprofile.aodNo).success(function(data){
                    console.log(data);

                    $mdToast.show({
                        template: '<md-toast class="md-toast-success" >Order has been cancelled!</md-toast>',
                        hideDelay: 2000,
                        position: 'bottom right'
                    });

                    //$scope.reloadpage();
                    $scope.refreshlist();
                    closeReadPane();

                }).error(function(data){
                    console.log(data);
                    $mdToast.show({
                        template: '<md-toast class="md-toast-success" >Order cancel failed!</md-toast>',
                        hideDelay: 2000,
                        position: 'bottom right'
                    });
                })
            }

        }

        $scope.refreshlist = function() {
            $scope.isLoading = true;
            $scope.selectedprofile="";

            $scope.isdataavailable=true;
            grnDataEnds=false;
            aodDataEnds=false;
            $scope.hideSearchMore=false;
            vm.searchMoreInit = false;

            vm.type="";
            vm.inventories=[];
            $scope.items=[];
            skip1=0;
            skip2=0;
            $scope.loading1 = true;
            $scope.loading2 = true;

            $scope.more();
        }


        //----------------------add.js---------------------------

        var self = this;
        // list of `state` value/display objects
        //self.tenants        = loadAll();
        self.selectedItem  = null;
        self.searchText1   = null;
        self.searchText2   = null;
        self.querySearch   = querySearch;

        $scope.rows=[];
        $scope.rowsissue=[];

        function querySearch (query,category) {

            //Custom Filter
            //
            var results=[];
            var len=0;
            if(category=='Supplier')
            {
                if($scope.filteredUsersSupp!=""&&$scope.filteredUsersSupp!=undefined)
                {
                    for (var i = 0, len = $scope.filteredUsersSupp.length; i<len; ++i){
                        //console.log($scope.allBanks[i].value.value);

                        if($scope.filteredUsersSupp[i].profilename!=""&&$scope.filteredUsersSupp[i].profilename!=undefined)
                        {
                            if($scope.filteredUsersSupp[i].profilename.toLowerCase().indexOf(query.toLowerCase()) !=-1)
                            {
                                results.push($scope.filteredUsersSupp[i]);
                            }
                        }
                    }
                }
            }
            else if(category=='Customer')
            {
                if($scope.filteredUsersDeal!=""&&$scope.filteredUsersDeal!=undefined)
                {
                    for (var i = 0, len = $scope.filteredUsersDeal.length; i<len; ++i){
                        //console.log($scope.allBanks[i].value.value);

                        if($scope.filteredUsersDeal[i].profilename!=""&&$scope.filteredUsersDeal[i].profilename!=undefined)
                        {
                            if($scope.filteredUsersDeal[i].profilename.toLowerCase().indexOf(query.toLowerCase()) !=-1)
                            {
                                results.push($scope.filteredUsersDeal[i]);
                            }
                        }
                    }
                }
            }
            return results;
        }

        var self1 = this;
        // list of `state` value/display objects
        //self.tenants        = loadAll();
        self1.selectedItem  = null;
        self1.searchText3   = [];
        self1.searchText4   = [];
        //self1.querySearchProduct   = querySearchProduct;

        //
        $scope.querySearchProduct = function (query,index,rowname) {
            //Custom Filter
            var results=[];
            var len=0;
            for (var i = 0, len = rowname[index].productlst.length; i<len; ++i){
                //console.log($scope.allBanks[i].value.value);

                if(rowname[index].productlst[i].code==""||rowname[index].productlst[i].code==undefined)
                {

                }
                else if(rowname[index].productlst[i].code.toLowerCase().indexOf(query.toLowerCase()) !=-1)
                {
                    results.push(rowname[index].productlst[i]);
                    //if($scope.rows[index].productlst[i].product_name.startsWith(query.toLowerCase()))
                    //{
                    //    results.push($scope.rows[index].productlst[i]);
                    //}
                }
            }
            return results;
        }

        var skipproductsearch,takeproductsearch;
        $scope.tempList=[];
        $scope.loadByKeyword= function (keyword,index,rows) {
            //
            //if($scope.tempList==undefined)
            //{
            //  $scope.tempList=$scope.tempListcopy;
            //}
            if($scope.productlist.length==10) {
                var existingsearch = $filter('filter')($scope.tempList, { code: keyword })[0];
                if(existingsearch==null||existingsearch==undefined)
                {
                    if (keyword.length == 3) {
                        skipproductsearch = 0;
                        takeproductsearch = 10;
                        $scope.tempList = [];
                        $charge.product().filterByKey(keyword, skipproductsearch, takeproductsearch).success(function (data) {
                            for (var i = 0; i < data.length; i++) {
                                $scope.tempList.push(data[i]);
                            }
                            skipproductsearch += takeproductsearch;
                            $scope.tempList=$scope.loadPaging(keyword, skipproductsearch, takeproductsearch,rows,index);
                        }).error(function (data) {
                            //vm.products = [];
                            //vm.selectedProduct = null;
                        });
                    }
                    else if (keyword.length == 0 || keyword == null) {

                        $scope.tempList = $scope.productlist;
                    }
                    //else if(keyword.length < 3)
                    //{
                    //  var results=[];
                    //  var len=0;
                    //  for (var i = 0, len = rows[index].productlst.length; i<len; ++i){
                    //    //console.log($scope.allBanks[i].value.value);
                    //
                    //    if(rows[index].productlst[i].code.toLowerCase().indexOf(keyword.toLowerCase()) !=-1)
                    //    {
                    //      results.push(rows[index].productlst[i]);
                    //      //if($scope.rows[index].productlst[i].product_name.startsWith(query.toLowerCase()))
                    //      //{
                    //      //    results.push($scope.rows[index].productlst[i]);
                    //      //}
                    //    }
                    //  }
                    //  $scope.tempList=results;
                    //}
                }
                else
                {
                    $scope.tempList = $scope.productlist;
                }

            }
            else
            {
                //tempList = $scope.productlist;

                var results=[];
                var len=0;
                for (var i = 0, len = rows[index].productlst.length; i<len; ++i){
                    //console.log($scope.allBanks[i].value.value);

                    if(rows[index].productlst[i].code.toLowerCase().indexOf(keyword.toLowerCase()) !=-1)
                    {
                        results.push(rows[index].productlst[i]);
                        //if($scope.rows[index].productlst[i].product_name.startsWith(query.toLowerCase()))
                        //{
                        //    results.push($scope.rows[index].productlst[i]);
                        //}
                    }
                }
                $scope.tempList=results;
            }

            $scope.tempListcopy=$scope.tempList;
            return $scope.tempList;
            $scope.tempList=[];
        }

        $scope.loadPaging= function (keyword,skip, take ,rows,index) {
            $charge.product().filterByKey(keyword, skip, take).success(function (data) {
                for(var i=0;i<data.length;i++)
                {
                    $scope.tempList.push(data[i]);
                }

                skip+=take;
                $scope.loadPaging(keyword,skip, take ,rows,index);

            }).error(function (data) {
                if($scope.tempList.length>0) {
                    //vm.products = tempList;
                    //$scope.openProduct(vm.products[0]);
                    var results=[];
                    var len=0;
                    for (var i = 0, len = rows[index].productlst.length; i<len; ++i){
                        //console.log($scope.allBanks[i].value.value);

                        if(rows[index].productlst[i].code.toLowerCase().indexOf(keyword.toLowerCase()) !=-1)
                        {
                            results.push(rows[index].productlst[i]);
                            //if($scope.rows[index].productlst[i].product_name.startsWith(query.toLowerCase()))
                            //{
                            //    results.push($scope.rows[index].productlst[i]);
                            //}
                        }
                    }
                    $scope.tempList=results;
                    return $scope.tempList;
                }
                else
                {
                    //vm.products=[];
                    //vm.selectedProduct=null;
                }
            });
        }


        $scope.profilelist = [];
        $scope.profilelistsupplier = [];
        $scope.profilelistcustomer = [];

        var skipprofiles=0;
        var takeprofiles=100;
        var skipprofilessuppliers=0;
        var takeprofilessuppliers=100;
        var skipprofilescustomers=0;
        var takeprofilescustomers=100;

        function loadAll() {

            $charge.profile().all(skipprofiles,takeprofiles,'asc').success(function(data){
                //console.log(data);
                skipprofiles+=takeprofiles;
                for (var i = 0; i < data.length; i++) {
                    var obj=data[i];

                    if(obj.profile_type=='Business')
                    {
                        $scope.profilelist.push({
                            profilename : obj.business_name,
                            profileId : obj.profileId,
                            othername : obj.business_contact_name,
                            profile_type : obj.profile_type
                        });
                    }
                    else if(obj.profile_type=='Individual')
                    {
                        $scope.profilelist.push({
                            profilename : obj.first_name,
                            profileId : obj.profileId,
                            othername : obj.last_name,
                            profile_type : obj.profile_type
                        });
                    }

                }
                loadAll();

                //for (i = 0, len = data.length; i<len; ++i){
                //    $scope.allBanks.push ({display: data[i].BankName, value:{TenantID:data[i].TenantID, value:data[i].BankName.toLowerCase()}});
                //}

            }).error(function(data){
                //alert ("Error getting all banks");
            });

        }
        //loadAll();

        function loadAllSuppliers() {
            //
            //$charge.profile().getprofilesbycategory('Supplier',skipprofilessuppliers,takeprofilessuppliers,'asc').success(function(data){
            //    //console.log(data);
            //    //
            //    skipprofilessuppliers+=takeprofilessuppliers;
            //    for (var i = 0; i < data.length; i++) {
            //        var obj=data[i];
            //
            //        if(obj.profile_type=='Business')
            //        {
            //            $scope.profilelistsupplier.push({
            //                profilename : obj.business_name,
            //                profileId : obj.profileId,
            //                othername : obj.business_contact_name,
            //                profile_type : obj.profile_type
            //            });
            //        }
            //        else if(obj.profile_type=='Individual')
            //        {
            //            $scope.profilelistsupplier.push({
            //                profilename : obj.first_name,
            //                profileId : obj.profileId,
            //                othername : obj.last_name,
            //                profile_type : obj.profile_type
            //            });
            //        }
            //
            //    }
            //
            //    $scope.filteredUsersSupp=$scope.profilelistsupplier;
            //    //loadAllSuppliers();
            //
            //    //for (i = 0, len = data.length; i<len; ++i){
            //    //    $scope.allBanks.push ({display: data[i].BankName, value:{TenantID:data[i].TenantID, value:data[i].BankName.toLowerCase()}});
            //    //}
            //
            //}).error(function(data){
            //    //alert ("Error getting all banks");
            //});

          var data={
            "url": "https://cloudcharge.search.windows.net/indexes/profiles/docs/search?api-version=2016-09-01",
            "searchBy": "*",
            "searchFields": "",
            "take":takeprofilessuppliers,
            "skip":skipprofilessuppliers,
            "orderby" : "createddate desc"
          }

          var loading=true;

          $charge.searchhelper().searchRequest(data).success(function(data)
          {
            //console.log(data);
            if(loading)
            {
              //
              skipprofilessuppliers+=takeprofilessuppliers;
              for (var i = 0; i < data.value.length; i++) {
                var obj=data.value[i];

                $scope.profilelistsupplier.push({
                  profilename : obj.first_name,
                  profileId : obj.profileId,
                  othername : obj.last_name,
                  profile_type : obj.profile_type
                });

              }

              $scope.filteredUsersSupp=$scope.profilelistsupplier;

              $scope.profilelistcustomer=$scope.profilelistsupplier;
              $scope.filteredUsersDeal=$scope.profilelistcustomer;

            }
          }).error(function(data)
          {
            loading = false;
          })
        }
        loadAllSuppliers();

        function loadAllCustomers() {
            //
            //$charge.profile().getprofilesbycategory('Dealer',skipprofilescustomers,takeprofilescustomers,'asc').success(function(data){
            //    //console.log(data);
            //    //
            //    skipprofilescustomers+=takeprofilescustomers;
            //    for (var i = 0; i < data.length; i++) {
            //        var obj=data[i];
            //
            //        if(obj.profile_type=='Business')
            //        {
            //            $scope.profilelistcustomer.push({
            //                profilename : obj.business_name,
            //                profileId : obj.profileId,
            //                othername : obj.business_contact_name,
            //                profile_type : obj.profile_type
            //            });
            //        }
            //        else if(obj.profile_type=='Individual')
            //        {
            //            $scope.profilelistcustomer.push({
            //                profilename : obj.first_name,
            //                profileId : obj.profileId,
            //                othername : obj.last_name,
            //                profile_type : obj.profile_type
            //            });
            //        }
            //
            //    }
            //
            //    $scope.filteredUsersDeal=$scope.profilelistcustomer;
            //    //loadAllCustomers();
            //
            //    //for (i = 0, len = data.length; i<len; ++i){
            //    //    $scope.allBanks.push ({display: data[i].BankName, value:{TenantID:data[i].TenantID, value:data[i].BankName.toLowerCase()}});
            //    //}
            //
            //}).error(function(data){
            //    //alert ("Error getting all banks");
            //});

          var data={
            "url": "https://cloudchargesearch.search.windows.net/indexes/profiles/docs/search?api-version=2016-09-01",
            "searchBy": "*",
            "searchFields": "",
            "take":takeprofilescustomers,
            "skip":skipprofilescustomers,
            "orderby" : "createddate desc"
          }

          var loading=true;

          $charge.searchhelper().searchRequest(data).success(function(data)
          {
            //console.log(data);
            if(loading)
            {
              //
              skipprofilescustomers+=takeprofilescustomers;
              for (var i = 0; i < data.value.length; i++) {
                var obj=data.value[i];

                $scope.profilelistcustomer.push({
                  profilename : obj.first_name,
                  profileId : obj.profileId,
                  othername : obj.last_name,
                  profile_type : obj.profile_type
                });

              }

              $scope.filteredUsersDeal=$scope.profilelistcustomer;

              $scope.profilelistsupplier=$scope.profilelistcustomer;
              $scope.filteredUsersSupp=$scope.profilelistsupplier;

            }
          }).error(function(data)
          {
            loading = false;
          })
        }
        //loadAllCustomers();


        $productHandler.getClient().TrackInventoryProductScroll(0,10).onComplete(function(data)
        {
            $scope.productlist=data;
            $scope.addNewRow("firstTimeLoading");
        });

        var setdatepicker=moment(new Date().toISOString()).format('YYYY-MM-DD HH:MM:SS');
        //var setdatepicker=new Date('2011-04-11T11:51:00');

        //var setdatepicker=new Date();
        $scope.content={};
        $scope.aodcontent={};

        $scope.maxDateAvailable=new Date();
        $scope.content.receivedDate=new Date();
        $scope.aodcontent.issuedDate=setdatepicker;
        $scope.inventory_type = 'Receipt';

        $scope.changeType = function (val) {
            $scope.inventory_type = val;
        };

        $scope.clearform = function (state){
            if(state == 'form1'){
                vm.editForm.$setPristine();
                vm.editForm.$setUntouched();
            }

            if(state == 'form2'){
                vm.editForm2.$setPristine();
                vm.editForm2.$setUntouched();
            }
            $scope.customer_supplier.supplier="";
            $scope.content.receivedDate=new Date();
            $scope.store_details.receivedStore="";
            $scope.content.note="";
            self.searchText1   = null;
            $scope.rows=[];
            self1.searchText3   = [];
            $scope.customer_supplier.customer="";
            $scope.aodcontent.issuedDate=setdatepicker;
            $scope.store_details.issuedStore="";
            $scope.aodcontent.note="";
            self.searchText2   = null;
            $scope.rowsissue=[];
            self1.searchText4   = [];
            $scope.inventory_type = 'Receipt';
            receiptRowCount=1;
            issueRowCount=1;
            $scope.waitingtoInitIssueRow=false;
            $scope.addNewRow("firstTimeLoading");
            $scope.searchMre=false;
            $scope.submitted=false;
            $scope.tempProductReceipt=[];
            $scope.tempProductIssue=[];
            $scope.searchMreSupp=false;
            $scope.searchMreDeal=false;
            vm.isAutoDisabledSupp = false;
            vm.isAutoDisabledDeal = false;
            //$state.go($state.current, {}, {reload: true});
        }

        $scope.submitted=false;
        //GRN:Receipt(supplier)
        $scope.submit = function () {
            //if ($scope.editForm.$valid == true) {
            //
            $scope.submitted=true;
            $scope.productsAddedSuccess=true;
            //console.log("form validated");
            var productitems=[];

            var currentdate=new Date;
            currentdate=currentdate.toDateString();
            //currentdate=currentdate.toLocaleDateString();

            if($scope.store_details.receivedStore==null||$scope.store_details.receivedStore=="")
            {
                //$mdToast.show({
                //  template: '<md-toast class="md-toast-error" >"Store" is not selected!</md-toast>',
                //  hideDelay: 2000,
                //  position: 'top right'
                //});
                $scope.submitted=false;
            }
            else if($scope.customer_supplier.supplier==null||$scope.customer_supplier.supplier=="")
            {
                //$mdToast.show({
                //  template: '<md-toast class="md-toast-error" >Select a valid Supplier!</md-toast>',
                //  hideDelay: 2000,
                //  position: 'top right'
                //});
                vm.searchText1="";
                $scope.submitted=false;
            }
            else if($scope.rows.length==0)
            {
                $mdToast.show({
                    template: '<md-toast class="md-toast-error" >Please add products using add new button to create GRN/AOD</md-toast>',
                    hideDelay: 2000,
                    position: 'top right'
                });
                $scope.submitted=false;
            }

            if(!vm.editForm.$valid){
                angular.element(document.querySelector('#editForm')).find('.ng-invalid:visible:first').focus();
                $scope.submitted=false;
            }
            else
            {
                for (var i = 0; i < $scope.rows.length; i++) {
                    //
                    var productObj = $scope.rows[i].product;
                    var qty = $scope.rows[i].qty;
                    if(productObj==""||productObj==null||productObj==undefined)
                    {
                        vm.searchText3[i]="";
                        $scope.submitted=false;
                        $scope.productsAddedSuccess=false;
                        break;
                    }
                    else
                    {
                        productitems.push({
                            productCode : productObj.code,
                            guProductID : productObj.guproductID,
                            productRefID : productObj.guproductID,
                            quantity : qty,
                            productPrice : productObj.price_of_unit
                        });
                    }

                }

                if(!$scope.productsAddedSuccess)
                {

                }
                else
                {
                    var selecteduser=$scope.customer_supplier.supplier;
                    //console.log("supplier: "+selecteduser.profilename);

                    var selectedstore=$scope.store_details.receivedStore;

                    $scope.content.supplier=selecteduser.profilename;
                    $scope.content.supplierID=selecteduser.profileId;
                    //$scope.content.receivedStore=selectedstore.storename;
                    //$scope.content.receivedStoreID=selectedstore.storeId;
                    $scope.content.receivedStore=selectedstore;
                    $scope.content.receivedStoreID="Default001";
                    $scope.content.receivedDate=moment($scope.content.receivedDate).format('YYYY-MM-DD HH:MM:SS');
                    $scope.content.guTranID="11";
                    //$scope.content.issuedStore="";
                    //$scope.content.issuedStoreID="12345";
                    $scope.content.createdUser="admin";
                    $scope.content.createdDate = currentdate;

                    //angular.forEach($scope.receiplist, function(value, key){
                    //
                    //    productitems.push({
                    //        productCode : $scope.a[value.modelname].product_name,
                    //        guProductID : $scope.a[value.modelname].productId,
                    //        quantity : $scope.a[value.quantityname],
                    //        productPrice : $scope.a[value.modelname].price_of_unit
                    //    });
                    //});
                    //console.log(productitems);

                    $scope.content.invGoodsReceivedDetail=productitems;

                    var inventoryobject = $scope.content;
                    //console.log(inventoryobject);
                    $charge.inventory().store(inventoryobject).success(function(data){
                        //console.log(data);
						debugger;
                        $scope.submitted=false;
                        notifications.toast("Successfully added to Inventory with ID: "+data.id,"success");
                        //$mdToast.show({
                        //	template: '<md-toast class="md-toast-success" >Successfully added to Inventory!</md-toast>',
                        //	hideDelay: 2000,
                        //	position: 'bottom right'
                        //});
                        //var millisecondsToWait = 1000;
                        //setTimeout(function() {
                        //    $window.location.reload();
                        //}, millisecondsToWait);
                        $scope.clearform('form1');
                        $scope.refreshlist();
                        toggleinnerView('submitTrigger');
                        //href='#/inventorylist';

                    }).error(function(data){
                        //console.log(data);
                        $scope.submitted=false;
                    })
                }

            }

            //} else//This is done because the HTML simple validation might work and enter the submit, however the form can still be invalid
            /*{
             $mdToast.show({
             template: '<md-toast class="md-toast-error" >Please fill all the details</md-toast>',
             hideDelay: 2000,
             position: 'bottom right'
             });
             //$state.go($state.current, {}, {reload: true});
             }*/


        }

        //AOD:Issue(customer)
        $scope.submit2 = function () {
            //if ($scope.editForm2.$valid == true) {
            //
            $scope.submitted=true;
            //console.log("form validated");
            $scope.productsAddedSuccess=true;
            var aoditems=[];

            var currentdate=new Date;
            currentdate=currentdate.toDateString();

            if($scope.store_details.issuedStore==null||$scope.store_details.issuedStore=="")
            {
                //$mdToast.show({
                //  template: '<md-toast class="md-toast-error" >"Store" is not selected!</md-toast>',
                //  hideDelay: 2000,
                //  position: 'top right'
                //});
                $scope.submitted=false;
            }
            else if($scope.customer_supplier.customer==null||$scope.customer_supplier.customer=="")
            {
                //$mdToast.show({
                //  template: '<md-toast class="md-toast-error" >Select a valid Dealer!</md-toast>',
                //  hideDelay: 2000,
                //  position: 'top right'
                //});
                vm.searchText2="";
                $scope.submitted=false;
            }
            else if($scope.rowsissue.length==0)
            {
                $mdToast.show({
                    template: '<md-toast class="md-toast-error" >Please add products by add new button to create GRN/AOD</md-toast>',
                    hideDelay: 2000,
                    position: 'top right'
                });
                $scope.submitted=false;
            }

            if(!vm.editForm2.$valid){
                angular.element(document.querySelector('#editForm2')).find('.ng-invalid:visible:first').focus();
                $scope.submitted=false;
            }
            else
            {
                for (var i = 0; i < $scope.rowsissue.length; i++) {
                    //
                    var productObj = $scope.rowsissue[i].product;
                    var qty = $scope.rowsissue[i].qty;
                    if(productObj==""||productObj==null||productObj==undefined)
                    {
                        vm.searchText4[i]="";
                        $scope.submitted=false;
                        $scope.productsAddedSuccess=false;
                        break;
                    }
                    else
                    {
                        aoditems.push({
                            productCode : productObj.code,
                            guProductID : productObj.productId,
                            productRefID : productObj.guproductid,
                            quantity : qty,
                            productPrice : productObj.price_of_unit
                        });
                    }

                }

                if(!$scope.productsAddedSuccess)
                {

                }
                else
                {
                    var selecteduser=$scope.customer_supplier.customer;

                    var selectedstore=$scope.store_details.issuedStore;

                    $scope.aodcontent.customer=selecteduser.profilename;
                    $scope.aodcontent.guCustomerID=selecteduser.profileId;
                    $scope.aodcontent.issuedStore=selectedstore;
                    $scope.aodcontent.issuedStoreID="Default001";
                    $scope.aodcontent.createdUser="admin";
                    $scope.aodcontent.createdDate=currentdate;
                    $scope.aodcontent.guTranID="11";

                    //angular.forEach($scope.issuelist, function(value, key){
                    //
                    //    aoditems.push({
                    //        productCode : $scope.a[value.modelname].product_name,
                    //        guProductID : $scope.a[value.modelname].productId,
                    //        quantity : $scope.a[value.quantityname],
                    //        productPrice : $scope.a[value.modelname].price_of_unit
                    //    });
                    //});
                    $scope.aodcontent.invGoodsIssuedDetail=aoditems;

                    var aodobject = $scope.aodcontent;
                    //console.log(aodobject);
                    $charge.aod().store(aodobject).success(function(data){
                        //console.log(data);
                        $scope.submitted=false;
                        notifications.toast("Successfully added to Inventory with ID: "+data.id,"success");

                        //$mdToast.show({
                        //    template: '<md-toast class="md-toast-success" >Successfully added to Inventory!</md-toast>',
                        //    hideDelay: 2000,
                        //    position: 'bottom right'
                        //});
                        //var millisecondsToWait = 1000;
                        //setTimeout(function() {
                        //    $window.location.reload();
                        //}, millisecondsToWait);
                        $scope.clearform('form2');
                        $scope.refreshlist();
                        toggleinnerView('submitTrigger');
                        //$window.location.href='#/inventorylist';

                    }).error(function(data){
                        //console.log(data);
                        $scope.submitted=false;
                    })
                }

            }

            //} else//This is done because the HTML simple validation might work and enter the submit, however the form can still be invalid
            /*{
             $mdToast.show({
             template: '<md-toast class="md-toast-error" >Please fill all the details</md-toast>',
             hideDelay: 2000,
             position: 'bottom right'
             });
             }*/

        }


        $scope.adddiv = function (element) {
            //angular.element('#productdiv').html("<div class=\"md-block\" flex=\"5\"><p>htujtjutjtyyj</p><!--space keeper--></div>");
            //angular.element('#'+element).append("<div layout-gt-sm=\"row\" class=\"layout-gt-sm-row\"><md-input-container class=\"md-block flex-gt-sm\" flex-gt-sm=\"\"><label for=\"input_7\">Product</label><input class=\"ng-pristine md-input ng-empty ng-valid-pattern ng-valid-minlength ng-valid ng-valid-required ng-touched \" id=\"input_7\" aria-invalid=\"false\" ng-trim=\"false\" style='width=272px;' ng-required=\"false\" minlength=\"null\" md-maxlength=\"null\" type=\"\" name=\"productCode\" ng-pattern=\"\" ng-model=\"content.productCode\"><div class=\"md-errors-spacer\"></div></md-input-container>" +
            //    "<div class=\"md-block flex-5\" flex=\"5\"><!--space keeper--></div> " +
            //    "<md-input-container class=\"md-block\" flex-gt-sm><label for=\"input_8\">Quantity</label><input ng-required=\"false\" minlength=\"null\" md-maxlength=\"null\" type=\"number\" name=\"quantity\" ng-pattern=\"\" ng-model=\"content.quantity\" style='width: 272px;' class=\"ng-pristine ng-untouched md-input ng-empty ng-valid-pattern ng-valid-minlength ng-valid ng-valid-required\" id=\"input_8\" aria-invalid=\"false\" ng-trim=\"false\"><div class=\"md-errors-spacer\"></div></md-input-container>" +
            //    "<div class=\"md-block flex-5\" flex=\"5\"><!--space keeper--></div>" +
            //    "<button class=\"md-fab md-button md-ink-ripple\" type=\"button\" ng-transclude=\"\" aria-label=\"menu\" style=\"background-color:#c9c9c9;\" ng-click=\"adddiv();\"><md-icon md-svg-src=\"../img/ic_remove_24px.svg\" style=\"color:#e64a19;\" class=\"ng-scope ng-isolate-scope\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\" viewBox=\"0 0 24 24\" fit=\"\" preserveAspectRatio=\"xMidYMid meet\"><path d=\"M19 13H5v-2h14v2z\"></path></svg></md-icon><div class=\"md-ripple-container\"></div></md-button> </div>");
        }

        $scope.removediv = function () {

        }

        var receiptRowCount=1;
        var issueRowCount=1;

        $scope.checkEmptyQty = function () {
            if($scope.inventory_type == 'Receipt'){
                if(angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('#invProdQty input')[0].value != ""){
                    angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('#invProdQty').removeClass('md-input-invalid');
                }
            }else if($scope.inventory_type == 'Issue'){
                if(angular.element(document.querySelector('.prod-row-wrap2')).find('.add-item-row:last').find('#invProdQty input')[0].value != ""){
                    angular.element(document.querySelector('.prod-row-wrap2')).find('.add-item-row:last').find('#invProdQty').removeClass('md-input-invalid');
                }
            }

        }

        $scope.addNewRow=function(rowname)
        {

            var product={};
            product.productlst=angular.copy($scope.productlist);
            //product.qty=0;
            product.product_name='';
            product.newProduct=true;
            product.searchMre=false;
            product.acProductIdRecp='acProductIdRecp'+receiptRowCount;
            product.acProductIdIssu='acProductIdIssu'+issueRowCount;
            product.isAutoDisabled = false;

            if(rowname == $scope.rows)
            {
                if($scope.rows[receiptRowCount-2].product == null) {
                    angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('md-autocomplete md-input-container').addClass('md-input-invalid');
                    angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('md-autocomplete md-input-container input').focus();
                }else if($scope.rows[receiptRowCount-2].qty == null){
                    angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('#invProdQty').addClass('md-input-invalid');
                    angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('#invProdQty input').focus();
                }else{
                    $scope.rows.push(product);
                    receiptRowCount++;
                }
            }
            else if(rowname == $scope.rowsissue)
            {
                if($scope.rowsissue[issueRowCount-2].product == null) {
                    angular.element(document.querySelector('.prod-row-wrap2')).find('.add-item-row:last').find('md-autocomplete md-input-container').addClass('md-input-invalid');
                    angular.element(document.querySelector('.prod-row-wrap2')).find('.add-item-row:last').find('md-autocomplete md-input-container input').focus();
                }else if($scope.rowsissue[issueRowCount-2].qty == null){
                    angular.element(document.querySelector('.prod-row-wrap2')).find('.add-item-row:last').find('#invProdQty').addClass('md-input-invalid');
                    angular.element(document.querySelector('.prod-row-wrap2')).find('.add-item-row:last').find('#invProdQty input').focus();
                }else{
                    $scope.rowsissue.push(product);
                    issueRowCount++;
                }
            }
            else if(rowname=="firstTimeLoading")
            {
                if($scope.waitingtoInitIssueRow)
                {
                    $scope.rowsissue.push(product);
                    issueRowCount++;
                    $scope.waitingtoInitIssueRow=false;
                }
                else
                {
                    $scope.rows.push(product);
                    //$scope.rowsissue.push(product);
                    receiptRowCount++;
                    //issueRowCount++;
                    $scope.waitingtoInitIssueRow=true;
                    $scope.addNewRow("firstTimeLoading");
                }

            }

        };

        $scope.addrow = function (rowname) {
            //row.newProduct=false;
            $scope.addNewRow(rowname);
        }

        $scope.removerow = function (index,rowname) {
            if(rowname == $scope.rows)
            {
                if($scope.rows.length!=1)
                {
                    $scope.rows.splice(index, 1);
                    self1.searchText3.splice(index,1);

                    $scope.tempProductReceipt.splice(index,1);
                    receiptRowCount--;
                }
            }
            else if(rowname == $scope.rowsissue)
            {
                if($scope.rowsissue.length!=1)
                {
                    $scope.rowsissue.splice(index, 1);
                    self1.searchText4.splice(index,1);

                    $scope.tempProductIssue.splice(index,1);
                    issueRowCount--;
                }
            }
            //rowname.splice(index, 1);
            //self1.searchText.splice(index,1);

        }

        $scope.waitingtoInitIssueRow=false;

        $scope.checkType = function(inventoryType)
        {
            if(inventoryType=='Receipt')
            {
                //notifications.toast("Receipt", "success");
                //$scope.rows=[];
                //self1.searchText3   = [];
                //$scope.tempProductReceipt=[];
                //receiptRowCount=1;
                //$scope.addNewRow($scope.rows);
            }
            else if(inventoryType=='Issue')
            {
                //notifications.toast("issue", "success");
                //$scope.rowsissue=[];
                //self1.searchText4   = [];
                //$scope.tempProductIssue=[];
                //issueRowCount=1;
                //$scope.addNewRow($scope.rowsissue);

                //if($scope.waitingtoInitIssueRow)
                //{
                //  $scope.addNewRow($scope.rowsissue);
                //  $scope.waitingtoInitIssueRow=false;
                //}
            }
        }

        $scope.tempProductReceipt=[];
        $scope.tempProductIssue=[];

        $scope.validateProduct= function (rowname,row,index) {

            if(rowname==$scope.rows)
            {
                if (row != null) {
                    var existingProduct = $filter('filter')($scope.tempProductReceipt, {productId: row.productId})[0];
                    //
                    if (existingProduct != null) {
                        notifications.toast("Product has been already taken.", "error");
                        self1.searchText3.splice(index, 1);
                    }
                    else
                    {
                        //
                        $scope.tempProductReceipt.push({
                            productId: row.productId
                        });
                    }
                }
                else
                {
                    $scope.tempProductReceipt.splice(index, 1);
                }
            }
            else if(rowname==$scope.rowsissue)
            {
                if (row != null) {
                    var existingProduct = $filter('filter')($scope.tempProductIssue, {productId: row.productId})[0];
                    //
                    if (existingProduct != null) {
                        notifications.toast("Product has been already taken.", "error");
                        self1.searchText4.splice(index, 1);
                    }
                    else
                    {
                        //
                        $scope.tempProductIssue.push({
                            productId: row.productId
                        });
                    }
                }
                else
                {
                    $scope.tempProductIssue.splice(index, 1);
                }
            }

        }

        $scope.checkstock = function(product,qty,rowname,index)
        {

            if(product!=null&&product!="")
            {
                $scope.submitted=true;
                $charge.stock().getStock(product.productId).success(function (data) {

                    var prodqty=parseInt(data.qty);
                    var selectedqty=parseInt(qty);

                    if(prodqty<selectedqty)
                    {
                        $mdToast.show({
                            template: '<md-toast class="md-toast-error" >Stock Quantity is less than the entered Quantity!</md-toast>',
                            hideDelay: 2000,
                            position: 'bottom right'
                        });
                        //qty='';
                        rowname[index].qty='';
                    }
                    $scope.submitted=false;
                }).error(function (data) {
                    notifications.toast("Stock checking error!", "error");
                    $scope.submitted=false;
                })
            }
            else
            {
                vm.searchText4[index]="";
                //notifications.toast("Select a valid Product!", "error");
                rowname[index].qty='';
            }

        }

        $scope.addNewUser = function(ev, userCategory)
        {
            //console.log("yes");
            //$scope.content.user = "";
            $mdDialog.show({
                controller: 'AddInventoryController',
                templateUrl: 'app/main/inventory/dialogs/compose/compose-dialog.html',
                controllerAs       : 'vm',
                locals             : {
                    selectedMail: undefined,
                    category: userCategory
                },
                parent: angular.element($document.body),
                targetEvent: ev,
                clickOutsideToClose:true
            })
                .then(function(user) {

                    //$scope.profilelist.push(user);
                    if(user.category=='Supplier')
                    {
                        if(user.profile_type=='Business')
                        {
                            $scope.profilelistsupplier.push({
                                profilename : user.business_name,
                                profileId : user.profileId,
                                othername : user.business_contact_name,
                                profile_type : user.profile_type
                            });
                            self.searchText1=user.business_name;
                        }
                        else if(user.profile_type=='Individual')
                        {
                            $scope.profilelistsupplier.push({
                                profilename : user.first_name,
                                profileId : user.profileId,
                                othername : user.first_name,
                                profile_type : user.profile_type
                            });
                            self.searchText1=user.first_name;
                        }
                        $scope.filteredUsersSupp=$scope.profilelistsupplier;
                    }
                    else if(user.category=='Dealer')
                    {
                        if(user.profile_type=='Business')
                        {
                            $scope.profilelistcustomer.push({
                                profilename : user.business_name,
                                profileId : user.profileId,
                                othername : user.business_contact_name,
                                profile_type : user.profile_type
                            });
                            self.searchText2=user.business_name;
                        }
                        else if(user.profile_type=='Individual')
                        {
                            $scope.profilelistcustomer.push({
                                profilename : user.first_name,
                                profileId : user.profileId,
                                othername : user.first_name,
                                profile_type : user.profile_type
                            });
                            self.searchText2=user.first_name;
                        }
                        $scope.filteredUsersDeal=$scope.profilelistcustomer;
                    }
                })

        }

        $scope.addNewProduct = function(ev)
        {
            //console.log("yes");
            //$scope.content.user = "";
            $mdDialog.show({
                controller: 'AddProductController',
                templateUrl: 'app/main/inventory/dialogs/compose/compose-dialog-addproduct.html',
                controllerAs       : 'vm',
                locals             : {
                    selectedMail: undefined,
                    decimalPoint: $scope.decimalPoint
                },
                parent: angular.element($document.body),
                targetEvent: ev,
                clickOutsideToClose:true
            })
                .then(function(product) {
                    //
                    //$scope.profilelist.push(user);
                    //$scope.productlist.push(product);

                    if(product!=undefined)
                    {
                        for(var j=0;j<$scope.rows.length;j++) {
                            //for (var i = 0; i < $scope.rows[j].productlst.length; i++) {
                            $scope.rows[j].productlst.push(product);
                            //}
                        }

                        for(var j=0;j<$scope.rowsissue.length;j++) {
                            //for (var i = 0; i < $scope.rows[j].productlst.length; i++) {
                            $scope.rowsissue[j].productlst.push(product);
                            //}
                        }

                        if($scope.productlist.length<10)
                        {
                            $scope.productlist.push(product);
                        }
                        //$scope.tempProduct.push({
                        //  productId:obj.productId
                        //});
                    }
                })

        }

        $scope.promptInput = "";
        $scope.promptInputSetup = function(form, updateMethod){
            if(form.$valid){
                updateMethod($scope.promptInput);
            }else{
                angular.element(document.querySelector('#promptForm')).find('.ng-invalid:visible:first').focus();
            }
        }

        $scope.addStore = function(ev)
        {
            //
            $scope.store_details.receivedStore = "";
            //$scope.content.newBrandVal= "";
            $scope.newStore=true;
            //$scope.requireBrand=true;

            //var confirm = $mdDialog.prompt()
            //  .title('Enter Store Name')
            //  .placeholder('Store Name')
            //  .ariaLabel('Store Name')
            //  .targetEvent(ev)
            //  .ok('Add')
            //  .cancel('Cancel');

            $mdDialog.show({
                controller: InventoryController,
                templateUrl: 'app/main/inventory/dialogs/prompt-dialog-store.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:false
            })
                .then(function(result, rowid) {
                    $scope.storeslist.push({
                        storename:result,
                        storeId:rowid
                    });
                }, function() {
                    $scope.newStore=false;
                });


            //$mdDialog.show(confirm).then(function(result) {
            //  $scope.saveNewStore(result);
            //}, function() {
            //  //$scope.newBrandVal= "";
            //  $scope.newStore=false;
            //});
        }

        $scope.cancelStore= function () {
            //$scope.newBrandVal= "";
            $scope.newStore=false;
            //$scope.requireBrand=false;

            //storeId:"40442835-9D64-D2EF-60CF-737BA80D640A"
            //storename:"asdasdsdss"
        }

        $scope.closeDialog = function () {
            $scope.prompInput = "";
            $scope.newStore=false;
            $mdDialog.hide();
        }

        $scope.isAddStoreClicked = false;
        $scope.saveNewStore = function(storeval)
        {
            if(storeval!=undefined) {
                $scope.isAddStoreClicked = true;
                var isDuplicateStore = false;
                if ($scope.storeslist.length != 0) {
                    for (var i = 0; i < $scope.storeslist.length; i++) {
                        if ($scope.storeslist[i].storename == storeval) {
                            isDuplicateStore = true;
                            $scope.isAddStoreClicked = false;
                            notifications.toast("Store already exists", "error");
                            break;
                        }
                    }
                    if (!isDuplicateStore) {
                        if ($rootScope.isStoreLoaded) {
                            var req = {
                                "RecordName": "CTS_InventoryAttributes",
                                "FieldName": "Store",
                                "RecordFieldData": storeval
                            }

                            $charge.commondata().insertDuoBaseValuesAddition(req).success(function (data) {
                                //console.log(data);
                                if (data.error == "00000") {
                                    //$scope.storeslist.push({
                                    //    storename:storeval,
                                    //    storeId:data.RowID
                                    //});
                                    $scope.newStore = false;
                                    notifications.toast("Store inserted!" , "success");
                                    $scope.isAddStoreClicked = false;
                                    $mdDialog.hide(storeval, data.RowID);
                                }
                            }).error(function (data) {
                                console.log(data);
                                $scope.newStore = false;
                                $scope.isAddStoreClicked = false;
                                $mdDialog.hide();
                            })
                        }
                        else {
                            var req = {
                                "GURecID": "123",
                                "RecordType": "CTS_InventoryAttributes",
                                "OperationalStatus": "Active",
                                "RecordStatus": "Active",
                                "Cache": "CTS_InventoryAttributes",
                                "Separate": "Test",
                                "RecordName": "CTS_InventoryAttributes",
                                "GuTranID": "12345",
                                "RecordCultureName": "CTS_InventoryAttributes",
                                "RecordCode": "CTS_InventoryAttributes",
                                "commonDatafieldDetails": [
                                    {
                                        "FieldCultureName": "Store",
                                        "FieldID": "124",
                                        "FieldName": "Store",
                                        "FieldType": "StoreType",
                                        "ColumnIndex": "0"
                                    },
                                    {
                                        "FieldCultureName": "DefaultStockLevel",
                                        "FieldID": "124",
                                        "FieldName": "DefaultStockLevel",
                                        "FieldType": "DefaultStockLevelType",
                                        "ColumnIndex": "1"
                                    }
                                ],
                                "commonDataValueDetails": [
                                    {
                                        "RowID": "1452",
                                        "RecordFieldData": storeval,
                                        "ColumnIndex": "0"
                                    },
                                    {
                                        "RowID": "1452",
                                        "RecordFieldData": "",
                                        "ColumnIndex": "1"
                                    }
                                ]
                            }

                            $charge.commondata().store(req).success(function (data) {
                                $rootScope.isStoreLoaded = true;
                                if (data[0].error == "00000") {
                                    //$scope.storeslist.push({
                                    //    storename:storeval,
                                    //    storeId:data.RowID
                                    //});
                                    $scope.newStore = false;
                                    notifications.toast("Store inserted!" , "success");
                                    $scope.isAddStoreClicked = false;
                                    $mdDialog.hide(storeval, data.RowID);
                                }
                            }).error(function (data) {
                                console.log(data);
                                $scope.newStore = false;
                                $scope.isAddStoreClicked = false;
                                $mdDialog.hide();
                            })
                        }
                    }
                }

                else {
                    var req = {
                        "GURecID": "123",
                        "RecordType": "CTS_InventoryAttributes",
                        "OperationalStatus": "Active",
                        "RecordStatus": "Active",
                        "Cache": "CTS_InventoryAttributes",
                        "Separate": "Test",
                        "RecordName": "CTS_InventoryAttributes",
                        "GuTranID": "12345",
                        "RecordCultureName": "CTS_InventoryAttributes",
                        "RecordCode": "CTS_InventoryAttributes",
                        "commonDatafieldDetails": [
                            {
                                "FieldCultureName": "Store",
                                "FieldID": "124",
                                "FieldName": "Store",
                                "FieldType": "StoreType",
                                "ColumnIndex": "0"
                            },
                            {
                                "FieldCultureName": "DefaultStockLevel",
                                "FieldID": "124",
                                "FieldName": "DefaultStockLevel",
                                "FieldType": "DefaultStockLevelType",
                                "ColumnIndex": "1"
                            }
                        ],
                        "commonDataValueDetails": [
                            {
                                "RowID": "1452",
                                "RecordFieldData": storeval,
                                "ColumnIndex": "0"
                            },
                            {
                                "RowID": "1452",
                                "RecordFieldData": "",
                                "ColumnIndex": "1"
                            }
                        ]
                    }

                    $charge.commondata().store(req).success(function (data) {
                        $rootScope.isStoreLoaded = true;
                        if (data[0].error == "00000") {
                            //$scope.storeslist.push({
                            //    storename:storeval,
                            //    storeId:data.FieldID
                            //});
                            $scope.newStore = false;
                            notifications.toast("Store inserted!" , "success");
                            $scope.isAddStoreClicked = false;
                            $mdDialog.hide(storeval, data.RowID);
                        }
                    }).error(function (data) {
                        console.log(data);
                        $scope.newStore = false;
                        $scope.isAddStoreClicked = false;
                        $mdDialog.hide();
                    })
                }
            }
            else
            {
                //notifications.toast("Store cannot be empty.", "error");
            }
        }

        $scope.sortBy = function(propertyName,status,property) {

            vm.inventories=$filter('orderBy')(vm.inventories, propertyName, $scope.reverse)
            $scope.reverse =!$scope.reverse;
            if(status!=null) {
                if(property=='ID')
                {
                    $scope.showId = status;
                    $scope.showStore = false;
                    $scope.showDate=false;
                    $scope.showStat = false;
                }
                if(property=='Store')
                {
                    $scope.showStore = status;
                    $scope.showId = false;
                    $scope.showDate=false;
                    $scope.showStat = false;
                }
                if(property=='Date')
                {
                    $scope.showDate=status;
                    $scope.showId = false;
                    $scope.showStore = false;
                    $scope.showStat = false;
                }
                if(property=='Status')
                {
                    $scope.showStat = status;
                    $scope.showId = false;
                    $scope.showStore = false;
                    $scope.showDate=false;
                }
            }
        };



        //search new method commented

        //var skipproductsearch,takeproductsearch;
        //$scope.tempList=[];
        //$scope.loadByKeyword= function (keyword,index,rows) {
        //  //
        //  if($scope.productlist.length>10) {
        //    var existingsearch = $filter('filter')($scope.tempList, { code: keyword })[0];
        //    if(existingsearch==null||existingsearch==undefined)
        //    {
        //      if (keyword.length == 3) {
        //        skipproductsearch = 0;
        //        takeproductsearch = 10;
        //        $scope.tempList = [];
        //        $charge.product().filterByKey(keyword, skipproductsearch, takeproductsearch).success(function (data) {
        //          for (var i = 0; i < data.length; i++) {
        //            $scope.tempList.push(data[i]);
        //          }
        //          skipproductsearch += takeproductsearch;
        //          $scope.tempList=$scope.loadPaging(keyword, skipproductsearch, takeproductsearch,rows,index);
        //        }).error(function (data) {
        //          //vm.products = [];
        //          //vm.selectedProduct = null;
        //        });
        //      }
        //      else if (keyword.length == 0 || keyword == null) {
        //        $scope.tempList = $scope.productlist;
        //      }
        //    }
        //    else
        //    {
        //      $scope.tempList = $scope.productlist;
        //    }
        //
        //  }
        //  else
        //  {
        //    //tempList = $scope.productlist;
        //
        //    var results=[];
        //    var len=0;
        //    for (var i = 0, len = rows[index].productlst.length; i<len; ++i){
        //      //console.log($scope.allBanks[i].value.value);
        //
        //      if(rows[index].productlst[i].code.toLowerCase().indexOf(keyword.toLowerCase()) !=-1)
        //      {
        //        results.push(rows[index].productlst[i]);
        //        //if($scope.rows[index].productlst[i].product_name.startsWith(query.toLowerCase()))
        //        //{
        //        //    results.push($scope.rows[index].productlst[i]);
        //        //}
        //      }
        //    }
        //    $scope.tempList=results;
        //  }
        //  return $scope.tempList;
        //}
        //
        //$scope.loadPaging= function (keyword,skip, take ,rows,index) {
        //  $charge.product().filterByKey(keyword, skip, take).success(function (data) {
        //    for(var i=0;i<data.length;i++)
        //    {
        //      $scope.tempList.push(data[i]);
        //    }
        //  }).error(function (data) {
        //    if($scope.tempList.length>0) {
        //      //vm.products = tempList;
        //      //$scope.openProduct(vm.products[0]);
        //      var results=[];
        //      var len=0;
        //      for (var i = 0, len = rows[index].productlst.length; i<len; ++i){
        //        //console.log($scope.allBanks[i].value.value);
        //
        //        if(rows[index].productlst[i].code.toLowerCase().indexOf(keyword.toLowerCase()) !=-1)
        //        {
        //          results.push(rows[index].productlst[i]);
        //          //if($scope.rows[index].productlst[i].product_name.startsWith(query.toLowerCase()))
        //          //{
        //          //    results.push($scope.rows[index].productlst[i]);
        //          //}
        //        }
        //      }
        //      $scope.tempList=results;
        //      return $scope.tempList;
        //    }
        //    else
        //    {
        //      //vm.products=[];
        //      //vm.selectedProduct=null;
        //    }
        //  });
        //}



        //invoice list ctrl functions

        //var skip=0;
        //var take=1000;
        //var invoicePrefix="";
        //var prefixLength=0;
        //$scope.invoices=[];
        //$scope.users=[];
        //
        ////this function fetches a random text and adds it to array
        //$scope.more = function(){
        //  //
        //  //$scope.spinnerInvoice=true;
        //  $charge.invoice().all(skip,take,"desc").success(function(data) {
        //    //
        //    if(data.length<=take)
        //      $scope.lastSet=true;
        //      data.forEach(function(inv){
        //        //
        //        var accountID=inv.guAccountID;
        //        var invoiceDate=moment(inv.invoiceDate).format('LL');
        //        //
        //
        //        var user = $scope.getUserByID(accountID);
        //        //
        //        //while(user != undefined)
        //        //{
        //        //
        //        var invoice={};
        //        //
        //        if(user!=null) {
        //          invoice.person_name = user.profilename;
        //          invoice.othername=user.othername;
        //          invoice.email=user.email;
        //        }
        //        //
        //        invoice.invoice_type = inv.invoiceType;
        //
        //        invoice.code=inv.invoiceNo;
        //        invoice.invoiceAmount=inv.invoiceAmount;
        //        invoice.currency=inv.currency;
        //        invoice.invoiceDate=invoiceDate;
        //        if(inv.paidAmount==0)
        //          invoice.status='Not paid';
        //        else if(inv.paidAmount>0 && inv.paidAmount<inv.invoiceAmount)
        //          invoice.status='Partial Paid';
        //        else if(inv.paidAmount==inv.invoiceAmount)
        //          invoice.status='Paid';
        //        //invoice.status='Paid';
        //        invoice.select=false;
        //        $scope.invoices.push(invoice);
        //        // break;
        //        // }
        //
        //      });
        //
        //      //
        //      for (var i = 0; i < $scope.invoices.length; i++) {
        //        //
        //        if ($scope.invoices[i].status == "Paid") {
        //          $scope.invoices[i].StatusColor = "green";
        //        } else if ($scope.invoices[i].status == "Partial Paid") {
        //          $scope.invoices[i].StatusColor = "skyblue";
        //        }
        //        else if ($scope.invoices[i].status == "Not paid") {
        //          $scope.invoices[i].StatusColor = "orange";
        //        }
        //        else if ($scope.invoices[i].status == "Void") {
        //          $scope.invoices[i].StatusColor = "red";
        //        }
        //
        //      }
        //    vm.invoices=$scope.invoices;
        //    vm.selectedInvoice = vm.invoices[0];
        //      //
        //      //skip += take;
        //  }).error(function(data) {
        //    //
        //    $scope.lastSet=true;
        //  })
        //};
        //
        //
        //$charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_InvoiceAttributes","InvoicePrefix").success(function(data) {
        //  invoicePrefix=data[0];
        //  //
        //}).error(function(data) {
        //  console.log(data);
        //})
        //
        //$charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_InvoiceAttributes","PrefixLength").success(function(data) {
        //  prefixLength=data[0];
        //}).error(function(data) {
        //  console.log(data);
        //})
        //
        //
        //
        //
        //$scope.loadmore = function(take){
        //
        //  $scope.spinnerInvoice=true;
        //  $charge.invoice().all(skip,take,"desc").success(function(data) {
        //    //
        //    if(data.length<take)
        //      $scope.lastSet=true;
        //    data.forEach(function(inv){
        //      //
        //      var accountID=inv.guAccountID;
        //      var invoiceDate=moment(inv.invoiceDate).format('LL');
        //      //
        //
        //      var user = $scope.getUserByID(accountID);
        //      var invoice={};
        //      if(user!=null) {
        //        invoice.person_name = user.profilename;
        //        invoice.othername=user.othername;
        //      }
        //      invoice.invoice_type = inv.invoiceType;
        //
        //      invoice.code=inv.invoiceNo;
        //      invoice.invoiceDate=invoiceDate;
        //      if(inv.paidAmount==0)
        //        invoice.status='Not paid';
        //      else if(inv.paidAmount>0 && inv.paidAmount<inv.invoiceAmount)
        //        invoice.status='Partial Paid';
        //      else if(inv.paidAmount==inv.invoiceAmount)
        //        invoice.status='Paid';
        //      //invoice.status='Paid';
        //      $scope.invoices.push(invoice);
        //
        //    });
        //    for (var i = 0; i < $scope.invoices.length; ++i) {
        //      if ($scope.invoices[i].status == "Paid") {
        //        $scope.invoices[i].StatusColor = "green";
        //      } else if ($scope.invoices[i].status == "Partial Paid") {
        //        $scope.invoices[i].StatusColor = "skyblue";
        //      }
        //      else if ($scope.invoices[i].status == "Not paid") {
        //        $scope.invoices[i].StatusColor = "orange";
        //      }
        //      else if ($scope.invoices[i].status == "Void") {
        //        $scope.invoices[i].StatusColor = "red";
        //      }
        //
        //    }
        //    $scope.spinnerInvoice=false;
        //    skip += take;
        //
        //  }).error(function(data) {
        //    //response=data;
        //    //
        //    var da=$scope.invoices;
        //    $scope.lastSet=true;
        //    $scope.spinnerInvoice=false;
        //  })
        //};
        //var skipUsr= 0,takeUsr=1000;
        //$scope.loadingUsers = true;
        //$scope.loadUsers = function(){
        //
        //  $charge.profile().all(skipUsr,takeUsr,'asc').success(function(data)
        //  {
        //    console.log(data);
        //    if($scope.loadingUsers)
        //    {
        //      for (var i = 0; i < data.length; i++) {
        //        var obj = data[i];
        //        if(obj.profile_type=='Individual')
        //        {
        //          $scope.users.push({
        //            profilename : obj.first_name,
        //            profileId : obj.profileId,
        //            othername : obj.last_name,
        //            profile_type : obj.profile_type,
        //            bill_addr:obj.bill_addr,
        //            category:obj.category,
        //            email:obj.email_addr
        //          });
        //        }
        //        else if(obj.profile_type=='Business') {
        //          $scope.users.push({
        //            profilename : obj.business_name,
        //            profileId : obj.profileId,
        //            othername : obj.business_contact_name,
        //            profile_type : obj.profile_type,
        //            bill_addr:obj.bill_addr,
        //            category:obj.category,
        //            email:obj.email_addr
        //
        //          });
        //        }
        //
        //      }
        //
        //      skipUsr += takeUsr;
        //      $scope.loadUsers();
        //    }
        //
        //  }).error(function(data)
        //  {
        //    //console.log(data);
        //    $scope.isSpinnerShown=false;
        //    $scope.more();
        //  })
        //
        //};
        //$scope.loadUsers();
        ////$scope.more();
        //
        //$scope.editOff = true;
        //$scope.openInvoiceLst = function(invoice)
        //{
        //  //
        //  //all event false
        //  $scope.spinnerInvoice=true;
        //
        //  $charge.invoice().getByID(invoice.code).success(function(data) {
        //
        //    //
        //    console.log(data);
        //    $scope.invProducts=[];
        //    var invoiceDetails=data[0].invoiceDetails;
        //    var count=invoiceDetails.length;
        //    var productName;
        //    var status=false;
        //
        //    //var address = $scope.GetAddress(invoice.person_name);
        //    var address = $filter('filter')($scope.users, { profilename: invoice.person_name })[0];
        //    //$scope.prefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
        //    var prefixInvoice=invoicePrefix!=""?invoicePrefix.RecordFieldData:"";
        //
        //    var exchangeRate=parseFloat(data[0].rate);
        //    $scope.selectedInvoice={};
        //    $scope.selectedInvoice = invoice;
        //    $scope.selectedInvoice.prefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
        //    $scope.selectedInvoice.bill_addr = address.bill_addr;
        //    $scope.selectedInvoice.subTotal=angular.copy(data[0].subTotal*exchangeRate);
        //    $scope.selectedInvoice.discAmt=data[0].discAmt*exchangeRate;
        //    $scope.selectedInvoice.invoiceNo=prefixInvoice;
        //    //$scope.selectedInvoice.code=parseFloat($scope.selectedInvoice.code);
        //    //
        //    $scope.selectedInvoice.additionalcharge=data[0].additionalcharge*exchangeRate;
        //    $scope.selectedInvoice.invoiceAmount=data[0].invoiceAmount*exchangeRate;
        //    $scope.selectedInvoice.tax=data[0].tax*exchangeRate;
        //    $scope.selectedInvoice.dueDate=moment(data[0].dueDate.toString()).format('LL');
        //    $scope.selectedInvoice.logo=$rootScope.companyLogo;
        //    $scope.selectedInvoice.currency=data[0].currency;
        //    $scope.selectedInvoice.rate=exchangeRate;
        //
        //    //
        //    invoiceDetails.forEach(function(inv){
        //      //
        //      //productName=$scope.getProductByID(inv.guItemID);
        //      var currentProduct = $filter('filter')($scope.invProductList, { productId: inv.guItemID })[0];
        //      $scope.invProducts.push({
        //        product_name: currentProduct.product_name,
        //        unitprice: inv.unitPrice*exchangeRate,
        //        qty: inv.gty,
        //        amount: inv.totalPrice*exchangeRate
        //      });
        //    });
        //    //
        //
        //
        //    $scope.viewCount=1;
        //    //console.log($scope.selectedInvoice);
        //    $scope.spinnerInvoice=false;
        //
        //  }).error(function(data)
        //  {
        //    console.log(data);
        //    $scope.spinnerInvoice=false;
        //
        //  });
        //}
        //
        //$scope.toggleEdit = function () {
        //  if($scope.editOff==true)
        //  {
        //    $scope.editOff = false;
        //  }
        //  else
        //  {
        //    $scope.editOff = true;
        //  }
        //
        //}
        //
        //$scope.loadAllProducts=function()
        //{
        //  //
        //  $scope.spinnerInvoice=true;
        //  var product=$productHandler.getClient().LoadProduct().onComplete(function(data)
        //  {
        //    $scope.invProductList=data;
        //    //$scope.spinnerInvoice=false;
        //  });
        //
        //}
        //
        //$scope.loadAllProducts();
        //
        //$scope.getUserByID=function(id)
        //{
        //  //
        //  var users=$scope.users;
        //  var profileID=id;
        //  var currentUser={};
        //  var mapUservar = $filter('filter')(users, { profileId: profileID })[0];
        //  return mapUservar;
        //}
        //
        //
        //$scope.getProductByID=function(id)
        //{
        //  //
        //  var count=0;
        //  var isAvailable=false;
        //  var products=$scope.invProductList;
        //  var productID=id;
        //  var productName;
        //  var currentUser={};
        //  //for (var i = 0; i < products.length; i++) {
        //  //    var obj = products[i];
        //  //    if(obj.productId==productID) {
        //  //        productName=obj.product_name;
        //  //    }
        //  //}
        //  //products.forEach(function(product){
        //  //    if(product.productId==productID) {
        //  //        productName=product.product_name;
        //  //    }
        //  //});
        //  var productName = products.map(function(product){
        //    if(product.productId==productID) {
        //      isAvailable=true;
        //      //
        //      return product;
        //    }
        //    if(!isAvailable)
        //      count++;
        //
        //  });
        //  //
        //  return productName[count].product_name;
        //}
        //
        //$scope.GetAddress=function(name)
        //{
        //  //
        //  var users=$scope.users;
        //  var addr;
        //  var selectedName=name;
        //  for (var i = 0; i < users.length; i++) {
        //    var obj = users[i];
        //    if(obj.profilename==selectedName) {
        //      addr=obj.bill_addr;
        //    }
        //  }
        //  return addr;
        //}
        //
        //$scope.getPromotionByID=function(id)
        //{
        //  for (i = 0; i < $scope.promotions.length; i++) {
        //    if ($scope.promotions[i].promotioncode == promocode) {
        //      isValid = true;
        //      $scope.content.gupromotionid = $scope.promotions[i].gupromotionid;
        //      break;
        //    }
        //  }
        //}
    }
})();
