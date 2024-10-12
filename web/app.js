	
	var app = angular.module('myApp', ['ngSanitize']);
	app.controller('myCtrl', function($scope,$q,$http, $timeout) {
		  
		$scope.apiurl = "http://localhost:3000/generate";
		
		$scope.colcos = ['#00008B','#800080','#000000','#008000','#800000','#808000','#2B547E','#045F5F','#EE9A4D','#551606','#872657','#2E1A47','#5E5A80','#B93B8F','#E3319D'];
		
		$scope.extensionArray = ['jpg','jpeg','png','pdf','doc','html','txt','csv']; 
		
		$scope.randomNumber = function(min, max) {
		  return Math.floor(Math.random() * (max - min + 1)) + min;
		} 
		
		$scope.extension ="";
		
		$scope.msgflag = false;
		$scope.msgdisplay="";
		
		$scope.qry = "";
		$scope.getgry	= function(qry){
			$scope.qry = qry
		}
		
		$scope.testfile = "";
		$scope.getFile	= function(tfile){
			$scope.testfile = tfile;
		} 
		
		$scope.binarystring = "";
		$scope.filedata 	= "";
		
		$scope.uploadFile	= function(event){ 
			$scope.msgflag = true;
			$scope.msgdisplay  = "Processing...";
			
			var file = document.querySelector('#inputfile').files[0]; 
		 
            if(file){
                var Reader = new FileReader();
                Reader.readAsDataURL(file, "UTF-8");
                Reader.onload = function (evt) { 
					 
					$timeout(function () {					
						$scope.extension = file.name.split('.').pop().toLowerCase();						
						if($scope.extensionArray.indexOf($scope.extension)==-1){						
							$scope.msgflag = true;						
							$scope.msgdisplay  = "File not supported !";												
						}						
						if($scope.extension=='jpg' || $scope.extension=='jpeg' || $scope.extension=='png'){
							$scope.binarystring = Reader.result; 
							$scope.filedata = Reader.result;
						}else{
							$scope.filedata = Reader.result;
						}	
							
						$scope.msgflag = false;
						$scope.msgdisplay  = "";	
						    
					}, 500); 
					
                } 
				Reader.onerror = function (evt) {
					$scope.msgflag = true;
					$scope.msgdisplay = "error";					
				}
			}else{			 
				$scope.msgdisplay = "Please upload a File first! (Supported extension are : "+$scope.extensionArray.join(", ")+")";
			}
		 
        } 		 
		
		$scope.query  = "";
		$scope.answer = "";
		
		$scope.msgflag =
		$scope.runQuery = function(){ 
			$scope.msgflag = true;
			$scope.msgdisplay  = "Processing..."; 
			
			if($scope.qry!=''){				
				return $http({
				method		: 	'POST', 
				url			: 	$scope.apiurl,				 
				crossDomain	: 	true,
				headers		:	{								 
									'Content-Type': "application/json; charset=UTF-8"
								},	
				data		: 	{			 
									phrase: $scope.qry,
									filedata: $scope.filedata,
									ftype: $scope.extension
								}			 	
						 								  
				}).then(function (result) { 
					$scope.bgcolor = $scope.randomNumber(0,15);	 
					$scope.query  = result.data.qsn;
					$scope.answer = result.data.response.replace(/\n/g, "<br />");					
					$scope.msgflag = false;
					$scope.msgdisplay  = "";	
					
				},function(error){ 
					$scope.msgdisplay  = error.xhrStatus;					 		
				});				
			
			}else{ 
				$scope.msgdisplay  = "Please add keyword/phrase to search !"; 
			}			 
		}	
	});