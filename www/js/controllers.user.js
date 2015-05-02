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
    $scope.$on('$ionicView.beforeEnter', function () {
        // Socket.connect();  // 下面断开后需要重新连接
        // Socket.on('connect', function () {  // connect事件表示已连接上(如果没有Socket.disconnect(), 则事件只发生一次)
            // Socket.emit('pay bill', null, null, null, function (socketId) {
            //     console.log(socketId);
            //     $scope.accountInfo.barcode = socketId + ')|(' + data.results.ince.available;  // 使用即时生成并返回的唯一的socketId作为二维码, 一次一码, 用后即废
            //     // Socket.disconnect();  // 需要断开连接才会废弃当前socket.id
            // });
        // });
        
        $scope.error = {};
        $scope.accountInfo = {};

        var deferredInfo = $q.defer(),  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快!
            deferredBarcode = $q.defer();  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快!

        User.getAccInfo().then(function (data) {
            $scope.accountInfo.head = data.results.user.head;
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

            deferredInfo.resolve(data);  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快!
        }, function (err) {
            deferredInfo.reject(err);  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快!
            console.log(err);
            // $scope.error.barcodeErr = '二维码生成失败!';
        });

        Socket.emit('pay bill', null, null, null, function (socketId) {  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快!
            // console.log(socketId);
            // $scope.accountInfo.barcode = socketId + ')|(' + data.results.ince.available;  // 使用即时生成并返回的唯一的socketId作为二维码, 一次(连接)一码, 用后即废(不废, 断开socket连接才废)
            // Socket.disconnect();  // 需要断开连接才会废弃当前socket.id
            deferredBarcode.resolve(socketId);
        });
        $timeout(function () {  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快! 手工设置超时时间.
            deferredBarcode.reject('连接超时!');
        }, 10000);

        $q.all([deferredInfo.promise, deferredBarcode.promise]).then(function (data) {  // data is an array  // 方式2: 并获取数据并拼接出barcode, 采用$q.all, 快!
            // console.log(data[1] + ')|(' + data[0].results.ince.available);
            $scope.accountInfo.barcode = data[1] + ')|(' + data[0].results.ince.available;
        }, function (errors) {
            console.log(errors);
        });
    });
    Socket.on('pay bill', function (data, actions, options, cb) {
        // console.log(data);
        var AccInfo = JSON.parse(Storage.get('AccInfo'));
        var userId = AccInfo.user._id;
        var ince = AccInfo.ince;

        if (actions === 'check') {
            // console.log(data);
            PageFunc.prompt('支付密码', '请输入支付密码').then(function (res) {
                if (res) {
                    // console.log(res);
                    // here goes the HTTP.request
                    var cons = {
                        userId: userId,
                        money: data.money,
                        note: data.note,
                        mediId: data.mediId,
                        incePolicyId: ince._id,
                        unitId: ince.unitId,
                        inceId: ince.inceId,
                        servId: ince.servId,
                        password: res
                    };
                    // console.log(cons);

                    Consumption.insertOne(cons).then(function (data) {
                        $scope.error.payError = data.results;  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        Socket.emit('pay bill', data.results.cons, 'paid');
                        $scope.accountInfo.available = data.results.ince.available;
                        $scope.accountInfo.barcode = $scope.accountInfo.barcode.split(')|(')[0] + ')|(' + data.results.ince.available;
                        console.log($scope.accountInfo);  // mongoose.model.updateOne()返回的都是更新前的值, 需要设置参数new: true
                    }, function (err) {
                        // console.log(err);
                        $scope.error.payError = err.data;  // 要画界面~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        Socket.emit('pay bill', err.data, 'payError');
                    });
                }
                else {
                    Socket.emit('pay bill', null, 'cancelPay');
                }
            });
        }
    });

}])
.controller('userConsList', ['$scope', 'Consumption', function ($scope, Consumption) {
    var batch = null;
    Consumption.getList(null, {skip: 0, limit: batch}).then(function (data) {
        $scope.items = data.results;
    }, function (err) {
        console.log(err.data);
    });

}])
.controller('userActivities', ['$scope', function ($scope) {
}])
.controller('userAround', ['$scope', function ($scope) {
}])
.controller('userMine', ['$scope', function ($scope) {
}])
.controller('userHelper', ['$scope', function ($scope) {
}])
.controller('userSettings', ['$scope', '$ionicPopup', 'Storage', 'User', function ($scope, $ionicPopup, Storage, User) {
    // console.log(Storage.get('AccInfo'));
    if (Storage.get('AccInfo')) {
        var AccInfo = JSON.parse(Storage.get('AccInfo'));
        $scope.accountInfo = {
            head: AccInfo.user.head,
            name: AccInfo.user.personalInfo.name,
            gender: AccInfo.user.personalInfo.gender
        };
    }
    else {
        User.getAccInfo().then(function (data) {
            $scope.accountInfo = {
                head: data.results.user.head,
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