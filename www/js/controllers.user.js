angular.module('yiyangbao.controllers.user', [])

// 被保险人操作组控制器
.controller('userTabsBottom', ['$scope', '$timeout', function ($scope, $timeout) {
    $scope.newConsNum = 1;
    $scope.actions = {
        clearConsBadge: function () {
            $timeout(function() {
                $scope.newConsNum = 0;
            }, 500);
        }
    };

}])
.controller('userHome', ['$scope', '$q', '$timeout', 'PageFunc', 'Storage', 'User', 'Consumption', 'Socket', function ($scope, $q, $timeout, PageFunc, Storage, User, Consumption, Socket) {
    var init = function () {
        var deferred = $q.defer();
    // $scope.$on('$ionicView.beforeEnter', function () {  // 第一次不会执行, 所以没有值
        // Socket.connect();  // 下面断开后需要重新连接
        // Socket.on('connect', function () {  // connect事件表示已连接上(如果没有Socket.disconnect(), 则事件只发生一次)
            // Socket.emit('pay bill', null, null, null, function (socketId) {
            //     console.log(socketId);
            //     $scope.accountInfo.barcode = socketId + ')|(' + data.results.ince.available;  // 使用即时生成并返回的唯一的socketId作为二维码, 一次一码, 用后即废
            //     // Socket.disconnect();  // 需要断开连接才会废弃当前socket.id
            // });
        // });
        if (Storage.get('AccInfo')) {  // 离线显示的内容, 但是无法获取余额(或者说离线存储的余额可能是不对的)
            var AccInfo = JSON.parse(Storage.get('AccInfo'));
            $scope.accountInfo = {
                head: AccInfo.user.head,
                // head: 'img/userAvatar.jpg',  // 测试用
                name: AccInfo.user.personalInfo.name,
                gender: AccInfo.user.personalInfo.gender,
                mobile: AccInfo.user.mobile
            };
        }
        
        $scope.error = {};
        $scope.accountInfo = {};

        var deferredInfo = $q.defer(),  // 方式2: 并行获取数据并拼接出barcode, 采用$q.all, 快!
            deferredBarcode = $q.defer();  // 方式2: 并行获取数据并拼接出barcode, 采用$q.all, 快!

        User.getAccInfo().then(function (data) {
            $scope.accountInfo.head = data.results.user.head;
            // $scope.accountInfo.head = 'img/userAvatar.jpg',  // 测试用
            // $scope.accountInfo.barcode = data.results.user.extInfo.yiyangbaoHealInce.dynamicCode;
            $scope.accountInfo.name = data.results.user.personalInfo.name;
            $scope.accountInfo.gender = data.results.user.personalInfo.gender;
            $scope.accountInfo.mobile = data.results.user.mobile;
            $scope.accountInfo.available = data.results.ince.available;

            // Socket.emit('pay bill', null, null, null, function (socketId) {  // 方式1: 串行获取数据并拼接出barcode, 慢!
            //     // console.log(socketId);
            //     $scope.accountInfo.barcode = socketId + ')|(' + data.results.ince.available;  // 使用即时生成并返回的唯一的socketId作为二维码, 一次(连接)一码, 用后即废(不废, 断开socket连接才废)
            //     // Socket.disconnect();  // 需要断开连接才会废弃当前socket.id
            // });

            Storage.set('AccInfo', JSON.stringify(data.results));

            deferredInfo.resolve(data);  // 方式2: 并行获取数据并拼接出barcode, 采用$q.all, 快!
        }, function (err) {
            deferredInfo.reject(err);  // 方式2: 并行获取数据并拼接出barcode, 采用$q.all, 快!
            console.log(err);
            // $scope.error.barcodeErr = '二维码生成失败!';
        });

        Socket.emit('pay bill', null, null, null, function (socketId) {  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快!
            // console.log(socketId);
            // $scope.accountInfo.barcode = socketId + ')|(' + data.results.ince.available;  // 使用即时生成并返回的唯一的socketId作为二维码, 一次(连接)一码, 用后即废(不废, 断开socket连接才废)
            // Socket.disconnect();  // 需要断开连接才会废弃当前socket.id
            deferredBarcode.resolve(socketId);
        });
        $timeout(function () {  // 方式2: 并行获取数据并拼接出barcode, 采用$q.all, 快! 手工设置超时时间.
            deferredBarcode.reject('连接超时!');
        }, 10000);

        $q.all([deferredInfo.promise, deferredBarcode.promise]).then(function (data) {  // data is an array  // 方式2: 并行获取数据并拼接出barcode, 采用$q.all, 快!
            // console.log(data[0].results.ince);
            // console.log(data[1] + ')|(' + data[0].results.ince.available);
            $scope.accountInfo.barcode = data[1] + ')|(' + (data[0].results.ince.available || 0);
            // $scope.accountInfo.barcode = '123';  // 测试用
            deferred.resolve();
        }, function (errors) {
            console.log(errors);
            deferred.reject();
        });
        return deferred.promise;
    // });
    };

    init();
    
    Socket.on('pay bill', function (data, actions, options, cb) {
        // console.log(data);
        var AccInfo = JSON.parse(Storage.get('AccInfo'));
        var userId = AccInfo.user._id;
        var ince = AccInfo.ince;
        var socketData = data;

        if (actions === 'check') {
            // console.log(socketData);
            PageFunc.prompt('支付密码', '请输入支付密码').then(function (res) {
                if (res) {
                    // console.log(res);
                    // here goes the HTTP.request
                    var cons = {
                        userId: userId,
                        money: socketData.money,
                        note: socketData.note,
                        mediId: socketData.mediId,
                        incePolicyId: ince._id,
                        unitId: ince.unitId,
                        inceId: ince.inceId,
                        servId: ince.servId,
                        password: res
                    };
                    // console.log(cons);

                    Consumption.insertOne(cons).then(function (data) {
                        $scope.error.payError = '您消费' + data.results.cons.money + '元!';  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        Socket.emit('pay bill', {mediSocketId: socketData.mediSocketId, msg: '用户支付' + data.results.cons.money + '元!'}, 'paid');
                        $scope.accountInfo.available = data.results.ince.available;
                        $scope.accountInfo.barcode = $scope.accountInfo.barcode.split(')|(')[0] + ')|(' + data.results.ince.available;
                        // console.log($scope.accountInfo);  // mongoose.model.updateOne()返回的都是更新前的值, 需要设置参数new: true
                    }, function (err) {
                        // console.log(err);
                        $scope.error.payError = err.data;  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        Socket.emit('pay bill', {mediSocketId: socketData.mediSocketId, msg: err.data}, 'payError');
                    });
                }
                else {
                    Socket.emit('pay bill', {mediSocketId: socketData.mediSocketId}, 'cancelPay');
                }
            });
        }
    });

    $scope.actions = {
        doRefresh: function() {
            init()
            // .then(null, errorCallback)
            .catch(function (err) {  // 就是上面.then的简写
                console.log(err)
            })
            .finally(function () {
                $scope.$broadcast('scroll.refreshComplete');
            // }, function (notify) {
            });
        }
    };

}])
.controller('userConsList', ['$scope', '$q', 'Consumption', function ($scope, $q, Consumption) {
    var batch = null;
    var lastTime = null;  // 不需要存到localStorage, 如果lastTime不存在了, 说明程序内存已经被iOS回收, 程序会重启, $scope会重建; 如果lastTime存在, 则超过1小时刷新一下(最好配合下拉刷新一起使用).
    // var moreData = false;
    // $scope.items = [];

    var init = function () {
        var deferred = $q.defer();
        Consumption.getList(null, {skip: 0, limit: batch}).then(function (data) {
            $scope.items = data.results;
            lastTime = Date.now();  // 时间戳(毫秒), 不需要存到localStorage
            deferred.resolve();
        }, function (err) {
            console.log(err.data);
            deferred.reject();
        });
        return deferred.promise;
    };

    init();  // '$ionicView.beforeEnter' 事件在第一次载入$scope的时候都还没有监听, 所以不会执行, 必须init()一下;

    $scope.$on('$ionicView.beforeEnter', function() {  // 第一次进入不会执行, 因为都还没监听事件
        var thisMoment = Date.now();
        if ((thisMoment - lastTime)/3600000 > 1) {
          // moreData = false;
          init();
        }
    });

    $scope.actions = {
        doRefresh: function() {
            init()
            // .then(null, errorCallback)
            .catch(function (err) {  // 就是上面.then的简写
                console.log(err)
            })
            .finally(function () {
                $scope.$broadcast('scroll.refreshComplete');
            // }, function (notify) {
            });
        }
    };

}])
.controller('userActivities', ['$scope', function ($scope) {
}])
.controller('userAround', ['$scope', function ($scope) {
}])
.controller('userMine', ['$scope', '$ionicPopup', '$q', '$ionicActionSheet', '$cordovaCamera', '$cordovaFileTransfer', 'Storage', 'User', '$timeout', 'PageFunc', 'CONFIG', function ($scope, $ionicPopup, $q, $ionicActionSheet, $cordovaCamera, $cordovaFileTransfer, Storage, User, $timeout, PageFunc, CONFIG) {
    $scope.config = {
        genders: CONFIG.genders,
        q1: CONFIG.q1,
        q2: CONFIG.q2,
        q3: CONFIG.q3,
        images: [{title: '身份证正面'}, {title: '身份证反面'}, {title: '病历首页'}]
    };
    $scope.pageHandler = {
        progress: 0
    };
    $scope.data = {};
    $scope.error = {};
    var cameraOptions = angular.copy(CONFIG.cameraOptions), 
        uploadOptions = angular.copy(CONFIG.uploadOptions);
    // console.log(cameraOptions, uploadOptions);

    // var init = function () {
        if (Storage.get('AccInfo')) {
            $scope.accountInfo = JSON.parse(Storage.get('AccInfo'));
            // $scope.accountInfo.user.head = 'img/userAvatar.jpg';  // 测试用
            $scope.accountInfo.user.personalInfo.birthdate = new Date($scope.accountInfo.user.personalInfo.birthdate);
            // console.log($scope.accountInfo);
            
            // return $q.when();  // 如果有Storage.get('AccInfo'), 返回$q.when(), 可以马上执行User.dealPasswordModal(); 如果没有, 则在服务器返回数据后再加载User.dealPasswordModal()
        }
        else {
            return User.getAccInfo().then(function (data) {
                $scope.accountInfo = data.results;
                // $scope.accountInfo.user.head = 'img/userAvatar.jpg';  // 测试用
                $scope.accountInfo.user.personalInfo.birthdate = new Date($scope.accountInfo.user.personalInfo.birthdate);
                Storage.set('AccInfo', JSON.stringify(data.results));

                // User.dealPasswordModal($scope, $scope.accountInfo.user.extInfo.yiyangbaoHealInce.dealPassword, true, false);
            }, function (err) {
                console.log(err);
            });
        }
    // };

    $scope.actions = {
        chgHead: function () {
            // console.log('跳出action sheet, 选择相册或拍照');
            // Show the action sheet
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                   { text: '<b>拍摄头像</b>' },
                   { text: '相册照片' }
                ],
                // destructiveText: '删除',
                titleText: '设置头像',
                cancelText: '取消',
                cancel: function() {
                    // add cancel code..
                },
                buttonClicked: function(index) {
                    cameraOptions.quality = 10;
                    cameraOptions.allowEdit = true;
                    cameraOptions.targetWidth = 200;
                    cameraOptions.targetHeight = 200;
                    cameraOptions.cameraDirection = 1;

                    switch (index) {
                        case 0: {
                            // console.log(index);
                            cameraOptions.sourceType = 1;
                        }
                        break;
                        case 1: {
                            // console.log(index);
                            cameraOptions.sourceType = 2;
                        }
                        break;
                    }

                    $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
                        $timeout(function () {
                            var serverUrl = encodeURI(CONFIG.baseUrl + CONFIG.userResUploadPath);
                            uploadOptions.headers = {Authorization: 'Bearer ' + Storage.get('token')};
                            uploadOptions.fileName = 'userHead' + CONFIG.uploadOptions.fileExt;
                            uploadOptions.params = {method: '$set', dest: 'head'};

                            // console.log(cameraOptions, uploadOptions);

                            PageFunc.confirm('是否上传?', '上传头像').then(function (res) {
                                if (res) {
                                    return $cordovaFileTransfer.upload(serverUrl, imageURI, uploadOptions, true).then(function (result) {
                                        $scope.pageHandler.progress = 0;
                                        console.log(result);
                                        $scope.accountInfo.user.head.Url = result.response.results.Url;

                                        try {
                                            $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                                console.log("Camera cleanup success.");
                                            }, function (err) {
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
                                            $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                                console.log("Camera cleanup success.");
                                            }, function (err) {
                                                console.log(err);
                                            });
                                        }
                                        catch (e) {
                                            console.log(e);
                                        }
                                    }, function (progress) {
                                        $scope.pageHandler.progress = progress.loaded / progress.total * 100;
                                    });
                                }
                                
                                $scope.pageHandler.progress = 0;
                                $scope.error.receiptError = '取消上传!';
                                try {
                                    $cordovaCamera.cleanup().then(function () {  // only for ios when using FILE_URI
                                        console.log("Camera cleanup success.");
                                    }, function (err) {
                                        console.log(err);
                                    });
                                }
                                catch (e) {
                                    console.log(e);
                                }
                            });
                        }, 0);
                    }, function (err) {
                        $scope.error.receiptError = err;
                        console.log(err);
                    });
                    return true;
                }
            });
        },
        chgUsername: function () {
            if ($scope.accountInfo.user.username !== $scope.accountInfo.user.personalInfo.idNo) {
                return;
            }
            $scope.config.title = '修改用户名';
            $scope.data.key = 'username';
            $scope.data.value = $scope.accountInfo.user.username;
            $scope.actions.show();
        },
        chgMobile: function () {
            $scope.config.title = '修改手机号';
            $scope.data.key = 'mobile';
            $scope.data.value = $scope.accountInfo.user.mobile;
            $scope.actions.show();
        },
        chgEmail: function () {
            $scope.config.title = '修改邮箱地址';
            $scope.data.key = 'email';
            $scope.data.value = $scope.accountInfo.user.email;
            $scope.actions.show();
        },
        chgPwd: function () {
            // console.log($scope.passwordModal);
            if ($scope.passwordModal) {
                $scope.passwordModal.show();
            }
            else {
                User.passwordModal($scope);
            }
        },
        chgPwdQst: function () {
            // console.log('跳到新页面, 选择并回答问题');
            PageFunc.prompt('登录密码', '请输入登录密码').then(function (res) {
                if (res) {
                    User.verifyPwd(res).then(function (data) {
                        if (data.results === 'OK') {
                            $scope.config.title = '设置密保问题';
                            if ($scope.pwdQstModal) {
                                $scope.pwdQstModal.show();
                            }
                            else {
                                User.pwdQstModal($scope);
                            }
                        }
                    }, function (err) {
                        console.log(err.data);
                    });
                }
                else {
                    // console.log('用户取消!');
                }
            });
        },
        chgDealPwd: function () {
            // console.log($scope.dealPasswordModal);
            if ($scope.dealPasswordModal) {
                // console.log($scope.actions);
                $scope.dealPasswordModal.show();
            }
            else {
                User.dealPasswordModal($scope, $scope.accountInfo.user.extInfo.yiyangbaoHealInce.dealPassword, true);
            }
        },
        chgName: function () {
            $scope.config.title = '修改姓名';
            $scope.data.key = 'personalInfo.name';
            $scope.data.value = $scope.accountInfo.user.personalInfo.name;
            $scope.actions.show();
        },
        chgGender: function (gender) {
            // console.log(gender);
            User.updateOne({'personalInfo.gender': gender}).then(function (data) {
            }, function (err) {
                console.log(err.data);
            });
        },
        chgBirthdate: function (birthdate) {
            // console.log(birthdate);
            if (!birthdate) {
                $scope.accountInfo.user.personalInfo.birthdate = new Date(JSON.parse(Storage.get('AccInfo')).user.personalInfo.birthdate);
                return PageFunc.message('生日不能为空!');
            }
            
            User.updateOne({'personalInfo.birthdate': birthdate}).then(function (data) {
            }, function (err) {
                console.log(err.data);
            });
        },
        chgIdNo: function () {
            // $scope.config.title = '修改身份证';
            // $scope.data.key = 'personalInfo.idNo';
            // $scope.data.value = $scope.accountInfo.user.personalInfo.idNo;
            // $scope.actions.show();
            PageFunc.message('如有错误, 请联系服务专员修改!<br>' + CONFIG.serv400);
        },
        chgLocation: function () {
            $scope.config.title = '修改地址';
            $scope.data.key = 'personalInfo.location.city.name';
            $scope.data.value = $scope.accountInfo.user.personalInfo.location && $scope.accountInfo.user.personalInfo.location.city && $scope.accountInfo.user.personalInfo.location.city.name;
            $scope.actions.show();
        },
        chgIdImg: function () {
            // console.log('进入拍照流程: 身份证正反面2张, 病历首页照片1张');
            $scope.config.title = '拍摄证件照片';
            // $scope.accountInfo.user.personalInfo.idImg = [{Url: 'img/userAvatar.jpg', title: '身份证正面'}, {Url: 'img/userAvatar.jpg', title: '身份证反面'}];  // 测试用
            if ($scope.takePicsModal) {
                // console.log($scope.actions);
                $scope.takePicsModal.show();
            }
            else {
                User.takePicsModal($scope, $scope.accountInfo.user.personalInfo.idImg);
            }
        }
    };

    $scope.$on('$ionicView.loaded', function () {  // 页面全部加载完再加载modal, 防止卡顿
        User.updateModal($scope);
        // User.passwordModal($scope, false);
        // init().then(function () {  // 如果没有promise返回, 则只执行init(), 不会执行then的回调函数
        //     User.dealPasswordModal($scope, $scope.accountInfo.user.extInfo.yiyangbaoHealInce.dealPassword, true, false);
        // });
    });

    // $scope.$on('modal.hidden', function() {  // 事件监听可以对同一个事件反复监听, 比如这里的代码如果放在ng-click中反复调用, 则会不断增加监听事件, 导致一个modal隐藏时, 前面所有的监听事件都会响应, 执行console.log($scope.passwordModal)很多次
    //   console.log($scope.passwordModal);
    // });
    
}])
.controller('userHelper', ['$scope', function ($scope) {
}])
.controller('userSettings', ['$scope', '$ionicPopup', 'Storage', 'User', function ($scope, $ionicPopup, Storage, User) {
    // console.log(Storage.get('AccInfo'));
    if (Storage.get('AccInfo')) {
        var AccInfo = JSON.parse(Storage.get('AccInfo'));
        $scope.accountInfo = {
            head: AccInfo.user.head,
            // head: 'img/userAvatar.jpg',  // 测试用
            name: AccInfo.user.personalInfo.name,
            gender: AccInfo.user.personalInfo.gender
        };
    }
    else {
        User.getAccInfo().then(function (data) {
            $scope.accountInfo = {
                head: data.results.user.head,
                // head: 'img/userAvatar.jpg',  // 测试用
                name: data.results.user.personalInfo.name,
                gender: data.results.user.personalInfo.gender
            };
            Storage.set('AccInfo', JSON.stringify(data.results));
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
.controller('userFeedback', ['$scope', function ($scope) {
}])
.controller('userSearch', ['$scope', function ($scope) {
}])