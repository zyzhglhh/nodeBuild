angular.module('yiyangbao.controllers.backend', [])

// 后台组控制器
// 医药机构操作组控制器
    // .controller('mediTabsBottom', ['$scope', '$timeout', '$state', '$cordovaBarcodeScanner', function ($scope, $timeout, $state, $cordovaBarcodeScanner) {
    .controller('mediTabsBottom', ['$scope', '$timeout', '$state', function ($scope, $timeout, $state) {
        $scope.newConsNum = 1;
        $scope.actions = {
            clearConsBadge: function () {
                $timeout(function() {
                    $scope.newConsNum = 0;
                }, 500);
            }
        };
    
    }])
    // 该页面是动态业务页面, 数据需要每次变化, 因此不能缓存, 要在app.js的$state中设置cache: false; 还有一个很重要的原因是$scope.payBill是继承自父$scope(mediTabsBottom), 子$scope中对$scope.payBill的任何修改都会创建一个新的内存变量, 导致父$scope中的$scope.payBill不再影响子$scope, 因此需要不缓存, 退出或reload当前$scope再进入的时候会重新初始化(reinstantiated)$scope, 并继承父$scope中的变量(该变量在初始化时不能设置, 否则就覆盖父$scope的同名变量; 同时该变量必须是对象, 而不是简单变量)
    .controller('mediBarcode', ['$scope', '$state', 'PageFunc', 'Insurance', 'Consumption', 'User', 'Socket', 'Storage', function ($scope, $state, PageFunc, Insurance, Consumption, User, Socket, Storage) {
        // console.log($scope.payBill);  // 父$scope(mediTabsBottom)的值可以传递到子$scope(mediBarcode), 如果是对象的话, 还可以影响回父$scope, 因为对象是内存地址的引用, 改变的是同一个内存存储区域.
        $scope.error = {};
        var payingPopup, inceInfo;

        $scope.actions = {
            scan: function (event) {
                // console.log(event);

                // 增加扫码过程~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                // $cordovaBarcodeScanner.scan().then(function (result) {  // ng-cordova
                window.cordova && window.cordova.plugins && window.cordova.plugins.barcodeScanner && cordova.plugins.barcodeScanner.scan(function (result) {  // 直接用cordova插件
                    if (result.cancelled) {
                        return console.log('用户取消');
                    }

                    // console.log(result);
                    
                    var barcode = result.text;
                    $scope.payBill = {
                        mediId: JSON.parse(Storage.get('info'))._id,
                        userSocketId: barcode.split(')|(')[0],
                        available: barcode.split(')|(')[1]
                    };

                    inceInfo = null;
                    if ($scope.payBill.available === undefined) {
                        var barcode = $scope.payBill.userSocketId;
                        Insurance.getInceInfo({seriesNum: barcode}).then(function (data) {
                            inceInfo = data.results;
                            $scope.payBill.available = data.results.ince.available;
                            $scope.dealPwd = data.results.user.dealPwd;
                        }, function (err) {
                            $scope.error.checkError = err.data;
                        });
                    }
                }, function (err) {
                    console.log(err);
                });
            },
            check: function () {
                if (inceInfo) {
                    if ($scope.dealPwd === true) {
                        PageFunc.prompt('支付密码', '请输入支付密码').then(function (res) {
                            if (res) {
                                // console.log(res);
                                // here goes the HTTP.request
                                var ince = inceInfo.ince;
                                var cons = {
                                    userId: inceInfo.user._id,
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
                                    $scope.error.checkError = '用户支付' + data.results.cons.money + '元';  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                    $scope.payBill.money = null;
                                    // $scope.payBill.available -= (data.results.cons.money || 0);  // 还可以继续支付
                                    $scope.payBill.available = undefined;
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
                else {
                    // console.log($scope.payBill);
                    Socket.emit('pay bill', $scope.payBill, 'check');
                    payingPopup = PageFunc.message('用户支付中...');
                    // payingPopup.then(function (res) {  // 不需要, 直接在pay bill的paid动作中给界面元素赋值, 而且用户可能中途关闭窗口
                    //     if (res && res !== true) {
                    //         $scope.error.checkError = res; 
                    //     }
                    // });

                    Socket.on('pay bill', function (data, actions, options, cb) {
                        if (actions === 'paid' || actions === 'payError' || actions === 'cancelPay') {
                            payingPopup.close(data);  // 可以不传递data
                            $scope.error.checkError = data || '用户取消支付';  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                            if (actions === 'paid') {
                                $scope.payBill.money = null;
                                // $scope.payBill.available -= (data.money || 0);  // 还可以继续支付
                                $scope.payBill.available = undefined;
                                // $scope.payBill.available = 0;    // 不能继续支付, 需要重新扫码(点击tabs的扫描tab按钮, scan函数中$state.go('medi.barcode', {}, {reload: true}), 再次输入支付金额, 支付; 注意$state.go的reload选项, 因为如果在扫码tab页面点击下面的tab按钮(到自己), 需要重载当前页面, 否则不会刷新$scope.payBill, 在其他页面转过来时必然会重载, 因为当前页面在app.js的$state中设置为不缓存)
                                // $state.go('medi.ConsList', {}, {reload: true});
                            }
                        }
                    });
                }
            }
        };
    }])
    .controller('mediConsList', ['$scope', 'Consumption', function ($scope, Consumption) {
        var batch = null;
        var lastTime = null;  // 不需要存到localStorage, 如果lastTime不存在了, 说明程序内存已经被iOS回收, 程序会重启, $scope会重建; 如果lastTime存在, 则超过1小时刷新一下(最好配合下拉刷新一起使用).
        // var moreData = false;
        // $scope.items = [];

        var init = function () {
            Consumption.getList(null, {skip: 0, limit: batch}).then(function (data) {
                $scope.items = data.results;
                lastTime = Date.now();  // 时间戳(毫秒), 不需要存到localStorage
            }, function (err) {
                console.log(err.data);
            });
        };

        init();  // '$ionicView.beforeEnter' 事件在第一次载入$scope的时候都还没有监听, 所以不会执行, 必须init()一下;

        $scope.$on('$ionicView.beforeEnter', function() {  // 第一次进入不会执行, 因为都还没监听事件
            var thisMoment = Date.now();
            if ((thisMoment - lastTime)/3600000 > 1) {
              // moreData = false;
              init();
            }
        });
    }])
    // .controller('mediConsDetail', ['$scope', '$state', '$stateParams', '$cordovaCamera', '$cordovaFileTransfer', '$timeout', 'PageFunc', 'Consumption', 'CONFIG', 'Storage', function ($scope, $state, $stateParams, $cordovaCamera, $cordovaFileTransfer, $timeout, PageFunc, Consumption, CONFIG, Storage) {
    .controller('mediConsDetail', ['$scope', '$state', '$stateParams', '$timeout', 'PageFunc', 'Consumption', 'CONFIG', 'Storage', function ($scope, $state, $stateParams, $timeout, PageFunc, Consumption, CONFIG, Storage) {
        // console.log($stateParams.consId);
        $scope.error = {};

        var cameraOptions = CONFIG.cameraOptions;
        // var uploadOptions = CONFIG.uploadOptions;
        // uploadOptions.fileName = $stateParams.consId + CONFIG.uploadOptions.fileName;
        // uploadOptions.params = {_id: $stateParams.consId};
        // uploadOptions.headers = {Authorization: 'Bearer ' + Storage.get('token')};

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
                        Consumption.updateOne({_id: $stateParams.consId, pull: item.receiptImg[$index]}).then(function (data) {
                            // $scope.item = data.results;
                        }, function (err) {
                            $scope.error.receiptError = err.data;
                            console.log(err.data);
                        });
                        item.receiptImg.splice($index, 1);
                    }
                });
            },
            takePic: function () {
                // $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
                window.navigator && window.navigator.camera && navigator.camera.getPicture(function (imageURI) {
                    $timeout(function () {
                        var options = window.FileUploadOptions && new FileUploadOptions();
                        options.httpMethod = CONFIG.uploadOptions.httpMethod;
                        options.mimeType = CONFIG.uploadOptions.mimeType;
                        options.fileName = $stateParams.consId + CONFIG.uploadOptions.fileName;
                        options.params = {_id: $stateParams.consId};
                        options.headers = {Authorization: 'Bearer ' + Storage.get('token')};
                        // console.log(options);
                        var fileTransfer = window.FileTransfer && new FileTransfer();
                        var serverUrl = encodeURI(CONFIG.baseUrl + CONFIG.consReceiptUploadPath);

                        PageFunc.confirm('是否上传?', '上传图片').then(function (res) {
                            if (res) {
                                // $scope.pageHandler.showProgressBar = true;
                                fileTransfer.onprogress = function (progress) {
                                    // console.log(progress);
                                    if (progress.lengthComputable) {
                                        $scope.$apply(function () {  // 外部js代码返回事件, 需要加$apply(), 因为没有其他的$digest(), 只能手动$apply()
                                            $scope.pageHandler.progress = progress.loaded / progress.total * 100;
                                        });
                                        // console.log($scope.pageHandler.progress);
                                    } else {
                                        $scope.$apply(function () {
                                            $scope.pageHandler.progress++;
                                        });
                                    }
                                };
                                // return $cordovaFileTransfer.upload(serverUrl, imageURI, uploadOptions, true).then(function (result) {
                                return fileTransfer.upload(imageURI, serverUrl, function (result) {
                                    // Success!
                                    // console.log(result.response.results.receiptImg);
                                    $scope.pageHandler.progress = 0;  // 外部js返回, 这里progress bar不会马上消失, 要等下面init()运行完才会消失(因为init()中有angular内部代码会执行$digest())
                                    $scope.error.receiptError = '上传成功!';  // 外部js返回, 这里不会马上显示上传成功, 要等下面init()运行完才会消失(因为init()中有angular内部代码会执行$digest())

                                    // $scope.$apply(function () {
                                        // $scope.item.receiptImg = result.response.results.receiptImg;
                                    // });
                                    
                                    init();

                                    try {
                                        // $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                        navigator.camera.cleanup(function () {
                                            console.log("Camera cleanup success.");
                                            // $state.go('.', {}, {reload: true});
                                        }, function (err) {
                                            $scope.error.receiptError = err;
                                            console.log(err);
                                        });
                                    }
                                    catch (e) {
                                        console.log(e);
                                    }
                                }, function (err) {
                                    // Error
                                    console.log(err);
                                    $scope.error.receiptError = err;
                                    $scope.pageHandler.progress = 0;

                                    try {
                                        // $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                        navigator.camera.cleanup(function () {
                                            console.log("Camera cleanup success.");
                                            // $state.go('.', {}, {reload: true});
                                        }, function (err) {
                                            $scope.error.receiptError = err;
                                            console.log(err);
                                        });
                                    }
                                    catch (e) {
                                        console.log(e);
                                    }
                                // }, function (progress) {
                                //     // constant progress updates
                                //     // console.log(progress);
                                //     $scope.pageHandler.progress = progress.loaded / progress.total * 100;
                                }, options);
                            }
                            
                            $scope.pageHandler.progress = 0;
                            try {
                                // $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                navigator.camera.cleanup(function () {
                                    $scope.error.receiptError = '取消上传!';
                                    console.log("Camera cleanup success.");
                                }, function (err) {
                                    $scope.error.receiptError = err;
                                    console.log(err);
                                });
                            }
                            catch (e) {
                                console.log(e);
                            }
                        });
                    }, 0);
                    // var img = {title: '', Url: imageURI};
                    // $scope.item.receiptImg.push(img);
                }, function (err) {
                    $scope.error.receiptError = err;
                    console.log(err);
                // });
                }, cameraOptions);
            }
        };

        var init = function () {
            Consumption.getOne({_id: $stateParams.consId}).then(function (data) {
                $scope.item = data.results;
                // uploadOptions.fileName = data.results._id + '.' + CONFIG.uploadImageType;
                // uploadOptions.params = data.results._id;
                // console.log($scope.item);
            }, function (err) {
                console.log(err.data);
            });
        };

        init();

    }])
    .controller('mediReceipt', ['$scope', function ($scope) {
    }])
    .controller('mediHome', ['$scope', 'Storage', 'User', function ($scope, Storage, User) {
        // $scope.$on('$ionicView.beforeEnter', function () {  // '$ionicView.beforeEnter' 事件在第一次载入$scope的时候都还没有监听, 所以不会执行
            $scope.info = {};
            User.getInfo().then(function (data) {
                $scope.info.head = data.results.head;
                $scope.info.name = data.results.personalInfo.name;
                $scope.info.mobile = data.results.mobile;

                Storage.set('info', JSON.stringify(data.results));
            }, function (err) {
                console.log(err);
            });
        // });
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
