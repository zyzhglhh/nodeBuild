angular.module('yiyangbao.controllers', [])

// 入口全局控制器
    .controller('main', ['$scope', function ($scope) {
    }])

// 初装或升级App的介绍页面控制器
    .controller('intro', ['$scope', 'Storage', function ($scope, Storage) {
      // Storage.set('initState', 'simple.homepage');
      Storage.set('myAppVersion', myAppVersion);
    }])

// 公众浏览组控制器
    // 采用layout为sideMenuLeft的抽象模板
    .controller('publicSideMenu', ['$scope', '$ionicPopup', 'Storage', 'User', function ($scope, $ionicPopup, Storage, User) {
        $scope.state = {};
        $scope.sideMenu = {
            // headerClass: 'bar-calm',
            // title: '侧边栏',
            firstItem: {
                // href: '#/feedback',  // sideMenu中的链接不会产生$ionicHistory.backView()
                click: function () {
                    User.loginModal($scope);
                },
                title: '请登录',
                imgSrc: ''
            },
            items: [
                {href: '#/aboutUs', iconClass: 'ion-ios-information-outline', title: '关于我们'},
                // {href: '#/products', iconClass: 'ion-ios-medkit-outline', title: '颐养产品'},
                // {href: '#/contactUs', iconClass: 'ion-ios-telephone-outline', title: '联系我们'},
                {href: '#/agreement', iconClass: 'ion-ios-compose-outline', title: '用户协议'},
                // {href: '#/privacy', iconClass: 'ion-ios-locked-outline', title: '隐私保护'},
                {href: '#/settings', iconClass: 'ion-ios-gear-outline', title: '系统设置'}
            ]
        };
    }])
    .controller('aboutUs', ['$scope', function ($scope) {
    }])
    // .controller('products', ['$scope', function ($scope) {
    // }])
    // .controller('contactUs', ['$scope', function ($scope) {
    // }])
    .controller('agreement', ['$scope', function ($scope) {
    }])
    // .controller('privacy', ['$scope', function ($scope) {
    // }])
    .controller('settings', ['$scope', '$ionicPopup', 'Storage', 'User', function ($scope, $ionicPopup, Storage, User) {
        // console.log($ionicHistory.currentView());

        $scope.userName = "王林";
        $scope.signature = "";

        $scope.actions = {
            clearCache: function () {
                var token = Storage.get('token') || '';
                var refreshToken = Storage.get('refreshToken') || '';
                var myAppVersionLocal = Storage.get('myAppVersion') || '';
                // var initState = Storage.get('initState') || '';
                Storage.clear();
                if (token) Storage.set('token', token);
                if (refreshToken) Storage.set('refreshToken', refreshToken);
                if (myAppVersionLocal) Storage.set('myAppVersion', myAppVersionLocal);
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
    .controller('feedback', ['$scope', '$ionicHistory', function ($scope, $ionicHistory) {
        // console.log($ionicHistory.viewHistory());
    }])

// common通用组控制器
    .controller('header', ['$scope', function ($scope) {
    }])
    .controller('footer', ['$scope', function ($scope) {
    }])
;