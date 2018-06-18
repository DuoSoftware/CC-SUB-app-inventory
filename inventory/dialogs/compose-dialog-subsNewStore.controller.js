////////////////////////////////
// App : Inventory
// File : AddInventoryController
// Owner  : GihanHerath
// Last changed date : 2016/12/28
// Version : 6.0.0.15
/////////////////////////////////

(function ()
{
  'use strict';

  angular
    .module('app.inventory')
    .controller('AddNewInventoryStoreController', AddNewInventoryStoreController);

  /** @ngInject */
  function AddNewInventoryStoreController($mdDialog, selectedMail, selectedUser, type, StoreList, $scope, $mdToast, notifications, $charge)
  {
    var vm = this;


    vm.hiddenCC = true;
    vm.hiddenBCC = true;

    vm.submitted=false;

    vm.selectedUser={};
    $scope.inventory_type="";
    $scope.storeslist={};

    vm.selectedUser=selectedUser;
    $scope.inventory_type=type;
    $scope.storeslist=StoreList;

    // If replying
    if ( angular.isDefined(selectedMail) )
    {
      vm.form.to = selectedMail.from.email;
      vm.form.subject = 'RE: ' + selectedMail.subject;
      vm.form.message = '<blockquote>' + selectedMail.message + '</blockquote>';
    }

    // Methods

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    vm.closeDialog = function () {
      vm.promptInput = "";
      //$scope.newStore=false;
      $mdDialog.hide();
    }

    vm.isAddStoreClicked = false;
    vm.saveNewStore = function(storeval)
    {
      if(storeval!=undefined) {
        vm.isAddStoreClicked = true;
        var isDuplicateStore = false;

        for (var i = 0; i < $scope.storeslist.length; i++) {
          if ($scope.storeslist[i].storename == storeval) {
            isDuplicateStore = true;
            vm.isAddStoreClicked = false;
            notifications.toast("Store already exists", "error");
            break;
          }
        }
        if (!isDuplicateStore) {

          var profileId="";
          var profileName="";
          var type="";
          if($scope.inventory_type == 'Receipt')
          {
            profileId = vm.selectedUser.profileId;
            profileName = vm.selectedUser.profilename;
            type = "Company";
          }
          else if($scope.inventory_type == 'Issue')
          {
            profileId = vm.selectedUser.profileId;
            profileName = vm.selectedUser.profilename;
            type = "Dealer";
          }

          var req = {
            "guProfileID" : profileId,
            "profileName":profileName,
            "store":storeval,
            "type" : type
          };

          $charge.stock().addNewStore(req).success(function (data) {
            //console.log(data);
            if (data.response == "succeeded") {
              //$scope.newStore = false;
              notifications.toast("Store inserted!" , "success");
              vm.isAddStoreClicked = false;
              var storeObj = {
                createdDate:new Date(),
                createdUser:"abc",
                guProfileID:profileId,
                guStoreID:data.data.id,
                profileName:profileName,
                store:storeval,
                type:type
              };
              $mdDialog.hide(storeObj);
            }
          }).error(function (data) {
            //console.log(data);
            //$scope.newStore = false;
            vm.isAddStoreClicked = false;
            $mdDialog.hide("");
          })
        }
      }
      else
      {
        notifications.toast("Store cannot be empty.", "error");
      }
    }

    $scope.clearNewStoreDetails = function() {
      vm.isAddStoreClicked = false;

      vm.selectedUser={};
      $scope.inventory_type="";
      $scope.storeslist={};

      vm.selectedUser=selectedUser;
      $scope.inventory_type=type;
      $scope.storeslist=StoreList;
    }

  }
})();
