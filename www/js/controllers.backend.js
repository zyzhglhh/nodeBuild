angular.module('yiyangbao.controllers.backend', [])

// 后台组控制器
// 医药机构操作组控制器
    .controller('mediTabsBottom', ['$scope', '$timeout', '$state', '$cordovaBarcodeScanner', function ($scope, $timeout, $state, $cordovaBarcodeScanner) {
        $scope.newConsNum = 1;
        $scope.actions = {
            clearConsBadge: function () {
                $timeout(function() {
                    $scope.newConsNum = 0;
                }, 500);
            },
            scan: function (event) {
                // console.log(event);

                // 增加扫码过程~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                $cordovaBarcodeScanner.scan().then(function (result) {
                    if (result.cancelled) {
                        return console.log('用户取消');
                    }

                    console.log(result);
                    
                    var barcode = result.text;
                    $scope.payBill = {
                        userSocketId: barcode.split(')|(')[0],
                        available: barcode.split(')|(')[1]
                    };
                    $state.go('medi.barcode', {}, {reload: true});
                }, function (err) {
                    console.log(err);
                });

                // // var barcode = '9fPKr4Pxao13XaL5AAAB)|(100';  // 测试用, 动态二维码
                // var barcode = '123';  // 测试用, 静态二维码

                // $scope.payBill = {
                //     userSocketId: barcode.split(')|(')[0],
                //     available: barcode.split(')|(')[1]
                // };
                // $state.go('medi.barcode', {}, {reload: true});
            }
        };
    
    }])
    // 该页面是动态业务页面, 数据需要每次变化, 因此不能缓存, 要在app.js的$state中设置cache: false; 还有一个很重要的原因是$scope.payBill是继承自父$scope(mediTabsBottom), 子$scope中对$scope.payBill的任何修改都会创建一个新的内存变量, 导致父$scope中的$scope.payBill不再影响子$scope, 因此需要不缓存, 退出或reload当前$scope再进入的时候会重新初始化(reinstantiated)$scope, 并继承父$scope中的变量(该变量在初始化时不能设置, 否则就覆盖父$scope的同名变量; 同时该变量必须是对象, 而不是简单变量)
    .controller('mediBarcode', ['$scope', 'PageFunc', 'Insurance', 'Consumption', 'User', 'Socket', 'Storage', function ($scope, PageFunc, Insurance, Consumption, User, Socket, Storage) {
        // console.log($scope.payBill);  // 父$scope(mediTabsBottom)的值可以传递到子$scope(mediBarcode), 如果是对象的话, 还可以影响回父$scope, 因为对象是内存地址的引用, 改变的是同一个内存存储区域.
        $scope.error = {};
        var payingPopup;
        $scope.payBill.mediId = JSON.parse(Storage.get('info'))._id;

        // $scope.$on('$ionicView.beforeLeave', function () {
        //     $scope.error = {};
        //     payingPopup = null;
        //     delete $scope.payBill;
        // });

        if (!$scope.payBill.available) {
            var barcode = $scope.payBill.userSocketId;
            Insurance.getInceInfo({seriesNum: barcode}).then(function (data) {
                $scope.payBill.available = data.results.ince.available;
                $scope.dealPwd = data.results.user.dealPwd;

                $scope.actions = {
                    check: function () {
                        if ($scope.dealPwd === true) {
                            PageFunc.prompt('支付密码', '请输入支付密码').then(function (res) {
                                if (res) {
                                    // console.log(res);
                                    // here goes the HTTP.request
                                    var ince = data.results.ince;
                                    var cons = {
                                        userId: data.results.user._id,
                                        money: $scope.payBill.money,
                                        note: $scope.payBill.note,
                                        mediId: $scope.payBill.mediId,
                                        incePolicyId: ince._id,
                                        unitId: ince.unitId,
                                        inceId: ince.inceId,
                                        servId: ince.servId,
                                        password: res
                                    };
                                    // console.log(cons);

                                    Consumption.insertOne(cons).then(function (data) {
                                        $scope.error.checkError = data.results.cons;  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                        $scope.payBill.money = null;
                                        // $scope.payBill.available -= (data.results.cons.money || 0);  // 还可以继续支付
                                        $scope.payBill.available = null;
                                        // $scope.payBill.available = 0;  // 不能继续支付, 需要重新扫码(点击tabs的扫描tab按钮, scan函数中$state.go('medi.barcode', {}, {reload: true}), 再次输入支付金额, 支付; 注意$state.go的reload选项, 因为如果在扫码tab页面点击下面的tab按钮(到自己), 需要重载当前页面, 否则不会刷新$scope.payBill, 在其他页面转过来时必然会重载, 因为当前页面在app.js的$state中设置为不缓存)
                                    }, function (err) {
                                        // console.log(err);
                                        $scope.error.checkError = err.data;  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                    });
                                }
                                else {
                                    $scope.error.checkError = '未输入密码!';
                                }
                            });
                        }
                        else {
                            // $scope.error.checkError = '未设置支付密码, 不能继续操作!';  // 安全: 禁止继续操作, 但是不方便

                            User.dealPasswordModal($scope, null, true);  // 不是很安全: 但是方便
                            // $scope.$on('modal.removed', function () {
                            //     $scope.error.checkError = "移除";
                            // });
                            $scope.$on('modal.hidden', function () {
                                $scope.error.checkError = "取消输入";
                            });
                        }
                    }
                };  
            }, function (err) {
                $scope.error.checkError = err.data;
            });
        }
        else {
            $scope.actions = {
                check: function () {
                    // console.log($scope.payBill);
                    Socket.emit('pay bill', $scope.payBill, 'check');
                    payingPopup = PageFunc.message('用户支付中...');
                    // payingPopup.then(function (res) {  // 不需要, 直接在pay bill的paid动作中给界面元素赋值, 而且用户可能中途关闭窗口
                    //     if (res && res !== true) {
                    //         $scope.error.checkError = res; 
                    //     }
                    // });
                }
            };

            Socket.on('pay bill', function (data, actions, options, cb) {
                if (actions === 'paid' || actions === 'payError' || actions === 'cancelPay') {
                    payingPopup.close(data);  // 可以不传递data
                    $scope.error.checkError = data || '用户取消支付';  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    if (actions === 'paid') {
                        $scope.payBill.money = null;
                        // $scope.payBill.available -= (data.money || 0);  // 还可以继续支付
                        $scope.payBill.available = null;
                        // $scope.payBill.available = 0;    // 不能继续支付, 需要重新扫码(点击tabs的扫描tab按钮, scan函数中$state.go('medi.barcode', {}, {reload: true}), 再次输入支付金额, 支付; 注意$state.go的reload选项, 因为如果在扫码tab页面点击下面的tab按钮(到自己), 需要重载当前页面, 否则不会刷新$scope.payBill, 在其他页面转过来时必然会重载, 因为当前页面在app.js的$state中设置为不缓存)
                    }
                }
            });
        }            
    
    }])
    .controller('mediConsList', ['$scope', 'Consumption', function ($scope, Consumption) {
        var batch = null;
        Consumption.getList(null, {skip: 0, limit: batch}).then(function (data) {
            $scope.items = data.results;
        }, function (err) {
            console.log(err.data);
        });

    }])
    .controller('mediConsDetail', ['$scope', '$stateParams', '$cordovaCamera', '$cordovaFileTransfer', 'PageFunc', 'Consumption', 'CONFIG', 'Storage', function ($scope, $stateParams, $cordovaCamera, $cordovaFileTransfer, PageFunc, Consumption, CONFIG, Storage) {
        // console.log($stateParams.consId);
        var cameraOptions = {
            quality: CONFIG.cameraQuality,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            // allowEdit: true,  // 会导致照片被正方形框crop, 变成正方形的照片
            encodingType: Camera.EncodingType[CONFIG.cameraImageType],  // 编码方式: .PNG
            // targetWidth: 100,  // 单位是pix/px, 必须和下面的属性一起出现, 不会改变原图比例?
            // targetHeight: 100,
            // mediaType: Camera.MediaType.PICTURE,  // 可选媒体类型
            correctOrientation: true,
            saveToPhotoAlbum: false,
            popoverOptions: CameraPopoverOptions,
            cameraDirection: Camera.Direction.BACK
        };

        var uploadOptions = {
            // fileKey: '',  // The name of the form element. Defaults to file. (DOMString)
            fileName: $stateParams.consId + '.' + CONFIG.uploadImageType,  // 默认值, 在下面会变为cons._id
            httpMethod: 'POST',  // 'PUT'
            mimeType: 'image/' + CONFIG.uploadImageType,  // 'image/png'
            params: {_id: $stateParams.consId},
            // chunkedMode: true,
            headers: {Authorization: 'Bearer ' + Storage.get('token')}
        };

        $scope.pageHandler = {
            // canSwipe: true,
            progress: 0,
            showDelete: false
        };

        $scope.actions = {
            showDelete: function () {
                $scope.pageHandler.showDelete = !$scope.pageHandler.showDelete;
            },
            deleteImg: function (item, $index) {
                PageFunc.confirm('是否确认删除?', '删除图片').then(function (res) {
                    if (res) {
                        item.receiptImg.splice($index, 1);
                    }
                });
            },
            takePic: function () {
                $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
                    PageFunc.confirm('是否上传?', '上传图片').then(function (res) {
                        if (res) {
                            // $scope.pageHandler.showProgressBar = true;
                            return $cordovaFileTransfer.upload(CONFIG.baseUrl + CONFIG.consReceiptUploadPath, imageURI, uploadOptions, true)
                            .then(function (result) {
                                // Success!
                                console.log(result);
                                $scope.pageHandler.progress = 0;

                                $scope.item.receiptImg = result.response.results.receiptImg;

                                $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                    console.log("Camera cleanup success.")
                                }, function (err) {
                                    console.log(err)
                                });
                            }, function (err) {
                                // Error
                                console.log(err);
                                $scope.pageHandler.progress = 0;

                                $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                    console.log("Camera cleanup success.")
                                }, function (err) {
                                    console.log(err)
                                });
                            }, function (progress) {
                                // constant progress updates
                                // console.log(progress);
                                $scope.pageHandler.progress = progress.loaded / progress.total * 100;
                            });
                        }
                        
                        $scope.pageHandler.progress = 0;
                        $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                            console.log("Camera cleanup success.")
                        }, function (err) {
                            console.log(err)
                        });
                    });
                    // var img = {title: '', Url: imageURI};
                    // $scope.item.receiptImg.push(img);
                }, function (err) {
                    console.log(err);
                });
            }
        };

        Consumption.getOne({_id: $stateParams.consId}).then(function (data) {
            $scope.item = data.results;
            // uploadOptions.fileName = data.results._id + '.' + CONFIG.uploadImageType;
            // uploadOptions.params = data.results._id;
            // console.log($scope.item);
        }, function (err) {
            console.log(err.data);
        });

    }])
    .controller('mediReceipt', ['$scope', function ($scope) {
    }])
    .controller('mediHome', ['$scope', 'Storage', 'User', function ($scope, Storage, User) {
        $scope.$on('$ionicView.beforeEnter', function () {
            $scope.info = {};
            User.getInfo().then(function (data) {
                $scope.info.head = data.results.head;
                $scope.info.name = data.results.personalInfo.name;
                $scope.info.mobile = data.results.mobile;

                Storage.set('info', JSON.stringify(data.results));
            }, function (err) {
                console.log(err);
            });
        });
    
    }])
    .controller('mediMine', ['$scope', function ($scope) {
    }])
    .controller('mediHelper', ['$scope', function ($scope) {
    }])
    .controller('mediSettings', ['$scope', '$ionicPopup', 'Storage', 'User', function ($scope, $ionicPopup, Storage, User) {
        if (Storage.get('info')) {
            var info = JSON.parse(Storage.get('info'));
            $scope.info = {
                head: info.head,
                name: info.personalInfo.name
            };
        }
        else {
            User.getInfo().then(function (data) {
                $scope.accountInfo = {
                    head: data.results.head,
                    name: data.results.personalInfo.name
                };
                Storage.set('info', JSON.stringify(data.results));
            }, function (err) {
                console.log(err);
            });
        }

        $scope.actions = {
            clearCache: function () {
                var token = Storage.get('token') || '';
                var refreshToken = Storage.get('refreshToken') || '';
                var myAppVersionLocal = Storage.get('myAppVersion') || '';
                // var initState = Storage.get('initState') || '';
                Storage.clear();
                token ? Storage.set('token', token) : null;
                refreshToken ? Storage.set('refreshToken', refreshToken) : null;
                myAppVersionLocal ? Storage.set('myAppVersion', myAppVersionLocal) : null;
                // initState ? Storage.set('initState', initState) : null;
                // ImgCache.clearCache();
                $ionicPopup.alert({title: '缓存', template: '<h4><b>清理成功</b></h4>'});
                // navigator.app.clearCache();
            },
            logout: function () {
                User.logout($scope);
            }
        };
    
    }])
    .controller('mediFeedback', ['$scope', function ($scope) {
    }])
    .controller('mediSearch', ['$scope', function ($scope) {
    }])
;
