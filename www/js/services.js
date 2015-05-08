angular.module('yiyangbao.services', ['ngResource'])

// 客户端配置
.constant('CONFIG', {
  // baseUrl: '/',
  // baseUrl: 'http://10.12.43.168/',
  // ioDefaultNamespace: '10.12.43.168/default',
  baseUrl: 'http://192.168.1.99/',
  ioDefaultNamespace: '192.168.1.99/default',
  // baseUrl: 'http://www.go5le.net/',
  // ioDefaultNamespace: 'www.go5le.net/default',
  // baseUrl: 'http://app.xiaoyangbao.net/',
  // ioDefaultNamespace: 'app.xiaoyangbao.net/default',
  consReceiptUploadPath: 'cons/receiptUpload',
  cameraOptions: {
    quality: 20,
    destinationType: 1,  // Camera.DestinationType = {DATA_URL: 0, FILE_URI: 1, NATIVE_URI: 2};
    sourceType: 1,  // Camera.PictureSourceType = {PHOTOLIBRARY: 0, CAMERA: 1, SAVEDPHOTOALBUM: 2};
    // allowEdit: true,  // 会导致照片被正方形框crop, 变成正方形的照片
    encodingType: 0,  // Camera.EncodingType = {JPEG: 0, PNG: 1};
    // targetWidth: 100,  // 单位是pix/px, 必须和下面的属性一起出现, 不会改变原图比例?
    // targetHeight: 100,
    // mediaType: 0,  // 可选媒体类型: Camera.MediaType = {PICTURE: 0, VIDEO: 1, ALLMEDIA: 2};
    correctOrientation: true,
    saveToPhotoAlbum: false,
    // popoverOptions: { 
    //   x: 0,
    //   y:  32,
    //   width : 320,
    //   height : 480,
    //   arrowDir : 15  // Camera.PopoverArrowDirection = {ARROW_UP: 1, ARROW_DOWN: 2, ARROW_LEFT: 4, ARROW_RIGHT: 8, ARROW_ANY: 15};
    // },
    cameraDirection: 0  // 默认为前/后摄像头: Camera.Direction = {BACK : 0, FRONT : 1};
  },
  uploadOptions: {
    // fileKey: '',  // The name of the form element. Defaults to file. (DOMString)
    // fileName: '.jpg',  // 后缀名, 在具体controller中会加上文件名; 这里不能用fileName, 否则将CONFIG.uploadOptions赋值给任何变量(引用赋值)后, 如果对该变量的同名属性fileName的修改都会修改CONFIG.uploadOptions.fileName
    fileExt: '.jpg',  // 后缀名, 在具体controller中会加上文件名
    httpMethod: 'POST',  // 'PUT'
    mimeType: 'image/jpg',  // 'image/png'
    //params: {_id: $stateParams.consId},
    // chunkedMode: true,
    //headers: {Authorization: 'Bearer ' + Storage.get('token')}
  },
  showTime: 500,
	/* List all the roles you wish to use in the app
	* You have a max of 31 before the bit shift pushes the accompanying integer out of
	* the memory footprint for an integer
	*/
	userRoles: [
		'public',
    'user',
    'serv',
    'unit',
    'medi',
    'ince',
    'admin',
    'super'
	],
	/* Build out all the access levels you want referencing the roles listed above
	* You can use the "*" symbol to represent access to all roles.
	* The left-hand side specifies the name of the access level, and the right-hand side
	* specifies what user roles have access to that access level. E.g. users with user role
	* 'user' and 'admin' have access to the access level 'user'.
	*/
	accessLevels: {
		'public': "*",
    'anon': ['public'],
    'user': ['user', 'serv', 'unit', 'medi', 'ince', 'admin', 'super'],
    'serv': ['serv', 'super'],
    'unit': ['unit', 'super'],
    'medi': ['medi', 'super'],
    'ince': ['ince', 'super'],
    'admin': ['admin', 'super']
	}
})

// 本地存储函数
.factory('Storage', ['$window', function ($window) {
	return {
    set: function(key, value) {
    	$window.localStorage.setItem(key, value);
    },
    get: function(key) {
    	return $window.localStorage.getItem(key);
    },
    rm: function(key) {
    	$window.localStorage.removeItem(key);
    },
    clear: function() {
    	$window.localStorage.clear();
    }
	};
}])

// 用户token验证状态
.factory('Token', ['Storage', 'jwtHelper', 'ACL', function (Storage, jwtHelper, ACL) {
  return {
    // isAuthenticated: false,
    curUserRole: function () {
      var userRole = ACL.userRoles.public.title;
      try {
        userRole = jwtHelper.decodeToken(Storage.get('token')).userRole;
      }
      catch (e) {
        // console.log(e);
        return ACL.userRoles.public.title;
      }
      return userRole;
    },
    isExpired: function () {
      // return Storage.get('token') && jwtHelper.isTokenExpired(Storage.get('token'));
      var isExpired = true;
      try {
        isExpired = jwtHelper.isTokenExpired(Storage.get('token'));
        // console.log(isExpired);
      }
      catch (e) {
        // console.log(e);
        return true;
      }
      return isExpired;
    }
  };
}])

// 数据模型函数, 具有取消(cancel/abort)HTTP请求(HTTP request)的功能
.factory('Data', ['$resource', '$q', 'CONFIG', '$interval', function ($resource, $q, CONFIG, $interval) {
  var self = this;

  // self.promises = [];  // 服务是单例, 在一个app实例中只中实例化一次, 刷新页面导致app重新实例化, 服务也重新实例化(初始化)
  var abort = $q.defer();
  // self.promises.push(abort);  // 只会存在一个元素: self.promises[0] = abort
  // console.log(self.promises.length);

  var User = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
  		// baseurl:'localhost', 
  		path:'user',
  		// callback: 'JSON_CALLBACK' //jsonp_flag
    }, {
    	// register: {method:'POST', params:{route: 'register'}, timeout: 10000},
      // bulkInsert: {method:'POST', params:{route: 'bulkInsert'}},
      // insertOne: {method:'POST', params:{route: 'insertOne'}, timeout: 10000},
    	login: {method:'POST', params:{route: 'login'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
    	getInfo: {method:'GET', params:{route: 'getInfo'}, timeout: 10000},
      getAccInfo: {method:'GET', params:{route: 'getAccInfo'}, timeout: 10000},
      // getOthersInfo: {method:'POST', params:{route: 'getOthersInfo'}, timeout: 10000},
      // modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      // update: {method:'POST', params:{route: 'update'}, timeout: 10000},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000},
      updateOnesPwd: {method:'POST', params:{route: 'updateOnesPwd'}, timeout: 10000},
      // remove: {method:'POST', params:{route: 'remove'}, timeout: 10000},
      // removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000},
      logout: {method:'GET', params:{route: 'logout'}, timeout: 10000}
    });
  };
  var Insurance = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      // baseurl:'localhost', 
      path:'ince',
      // callback: 'JSON_CALLBACK' //jsonp_flag
    }, {
      getInceInfo: {method:'POST', params:{route: 'getInceInfo'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      remove: {method:'POST', params:{route: 'remove'}, timeout: 10000},
      removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000}
    });
  };
  var Consumption = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      // baseurl:'localhost', 
      path:'cons',
      // callback: 'JSON_CALLBACK' //jsonp_flag
    }, {
      insertOne: {method:'POST', params:{route: 'insertOne'}, timeout: 10000},
      getOne: {method:'POST', params:{route: 'getOne'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      // modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000}//,
      // remove: {method:'POST', params:{route: 'remove'}, timeout: 10000},
      // removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000}
    });
  };
  var Post = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      // baseurl:'localhost', 
      path:'post',
      // callback: 'JSON_CALLBACK' //jsonp_flag
    }, {
      post: {method:'POST', params:{route:'post'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000},
      removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000}
    });
  };
  var Resource = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      // baseurl:'localhost', 
      path:'multer',
      // callback: 'JSON_CALLBACK' //jsonp_flag
    }, {
      rmBrokenFile: {method:'GET', params:{route:'upload'}, timeout: 10000}
    });
  };
  var Interface = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      // baseurl:'localhost', 
      path:'interface',
      // callback: 'JSON_CALLBACK' //jsonp_flag
    }, {
      captchaImg: {method:'GET', params:{route:'captchaImg'}, timeout: 10000}
    });
  };
  self.abort = function ($scope) {
    abort.resolve();  // resolve()模拟服务器返回status(200), 进入successCallBack(); 如果用reject(), 进入errCallBack()
    // angular.forEach(self.promises, function (p) { p.resolve();});  // resolve()模拟服务器返回status(200), 进入successCallBack(); 如果用reject(), 进入errCallBack()
    // $scope.$evalAsync(function () {
    $interval(function () {  // 因为这里有递归调用的$resource.Insurance.getList(), 所以不能马上恢复设置 abort = $q.defer(); 要加一个延时(将abort = $q.defer()操作放置为下一个event loop的最后一个操作), 否则一旦恢复设置, 只能取消一个request, 后面剩余的递归调用的request由于 abort 又等于 $q.defer(), 会继续执行.
      // self.promises = [];  // 清空数组
      abort = $q.defer();
      // self.promises.push(abort);
      self.User = User();  // 重新初始化$resource方法(必须在恢复abort = $q.defer();后初始化), 主要是初始化其中的timeout: abort.promise, 因为原来的abort已经resolve()或reject()了
      self.Insurance = Insurance();
      self.Consumption = Consumption();
      self.Post = Post();
      self.Resource = Resource();
      self.Interface = Interface();
    }, 0, 1);
    // });
  };

  self.User = User();
  self.Insurance = Insurance();
  self.Consumption = Consumption();
  self.Post = Post();
  self.Resource = Resource();
  self.Interface = Interface();

  return self;
}])

// socket.io操作函数
.factory('Socket', ['socketFactory', 'CONFIG', function (socketFactory, CONFIG) {
  return socketFactory({
    // prefix: '',
    // scope: '',  // 要用scope需要改造返回函数为: return function($scope) {return socketFactory({scope: $scope})}; 然后使用方法为: Socket($scope).emit()...
    ioSocket: io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace)  // 文档里是用io.connect()方法; 必须连接全URL地址(可以加namespace), 而不能是相对路径, 因为在App中, 相对路径访问的是本地资源, 因此不会给服务器发送socket消息
    // ioSocket: io(CONFIG.baseUrl + CONFIG.ioDefaultNamespace, {multiplex: false})  // 直接用io()也可以, 加multiplex选项强制每次使用新的socket Manager(不会改变服务器的socket.id!!!)
  });

  // return {
  //   default: socketFactory({
  //     // prefix: '',
  //     ioSocket: io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace)
  //   }),
  //   chat: socketFactory({
  //     // prefix: '',
  //     ioSocket: io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace + '/chat')
  //   }),
  //   consume: socketFactory({
  //     // prefix: '',
  //     ioSocket: io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace + '/consume')
  //   })
  // }
}])

// 用户操作函数
.factory('User', ['Storage', 'Data', 'Token', '$state', '$ionicHistory', '$ionicModal', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $ionicHistory, $ionicModal, $q, jwtHelper) {
  // console.log(this);
  var self = this;
  // self.register = function (user, options) {
  //   var deferred = $q.defer();
  //   Data.User.register(user, function (data, headers) {
  //     deferred.resolve(data);
  //   }, function (err) {
  //     deferred.reject(err);
  //   });
  //   return deferred.promise;
  // };
  self.login = function ($scope) {
    // var deferred = $q.defer();
    Data.User.login($scope.login, function (data, headers) {
      $scope.error.loginError = '';
      var userRole = jwtHelper.decodeToken(data.results.token).userRole;

      Storage.set('token', data.results.token);
      $scope.login.rememberme ? Storage.set('refreshToken', data.results.refreshToken) : Storage.rm('refreshToken');

      if (data.results.justActivated) {
        // console.log('haha');
        if (userRole === 'user') {
        // if (false) {
          self.dealPasswordModal($scope);
        }
        else {
          self.passwordModal($scope);
        }
      }

      if ($scope.loginModal) {
        $scope.loginModal.remove()
        // .then(function () {
        //   console.log(data.results);
        // });
      }
      // $state.go($scope.state.toStateName || 'user.home');
      var toStateName = userRole === 'medi' && 'medi.home' || 'user.home';
      $state.go($scope.state.toStateName || toStateName);
      // $state.go($scope.state.toStateName || jwtHelper.decodeToken(data.results.token).userRole + '.' + 'home');
      // deferred.resolve(data);
    }, function (err) {
      // Erase the token if the user fails to log in
      // 已经由 TokenInterceptor 服务统一处理 401 类型的返回错误, 这里可以不处理, 除非有其他非 401 错误发生
      // Storage.rm('token');
      // Storage.rm('refreshToken');
      // Storage.rm('fullname');
      // Storage.rm('gender');
      var myAppVersionLocal = Storage.get('myAppVersion') || '';
      Storage.clear();
      myAppVersionLocal ? Storage.set('myAppVersion', myAppVersionLocal) : null;
      // Storage.rm('userRole');
      // Token.isAuthenticated = false;
      // Handle login errors here
      // $state.go($scope.state.fromStateName || 'anon.login');  // 不需要跳转, 直接显示 $scope.error.loginError 即可, 如果跳转会造成 modal 后面的页面跳转, 而 modal 还显示在顶层
      $scope.error.loginError = err.data;
      // deferred.reject(err);
    });
    // return deferred.promise;
  };
  // self.getList = function (query, options, fields) {
  //   var deferred = $q.defer();
  //   Data.User.getList(query, function (data, headers) {
  //     deferred.resolve(data);
  //   }, function (err) {
  //     deferred.reject(err);
  //   });
  //   return deferred.promise;
  // };
  self.getInfo = function (token, options, fields) {  // 可以不传递token, 由服务器端的tokenManager中间件获取headers中的token并解析为req.user, 获取req.user._id
    var deferred = $q.defer();
    Data.User.getInfo({token: token}, function (data, headers) {  // http.get方法不能传递json对象, 会将{token: token}转换为url?token=token
      deferred.resolve(data);
    }, function (err) {
      // console.log('Request fail for getInfo !!!!! ' + err.data);
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.getAccInfo = function (token, options, fields) {  // 可以不传递token, 由服务器端的tokenManager中间件获取headers中的token并解析为req.user, 获取req.user._id
    var deferred = $q.defer();
    Data.User.getAccInfo({token: token}, function (data, headers) {  // http.get方法不能传递json对象, 会将{token: token}转换为url?token=token
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  // self.getOthersInfo = function (query, options, fields) {  // 可以不传递token, 由服务器端的tokenManager中间件获取headers中的token并解析为req.user, 获取req.user._id
  //   var deferred = $q.defer();
  //   Data.User.getOthersInfo({query: query, options: options, fields: fields}, function (data, headers) {  // http.get方法不能传递json对象, 会将{token: token}转换为url?token=token
  //     deferred.resolve(data);
  //   }, function (err) {
  //     // console.log('Request fail for getInfo !!!!! ' + err.data);
  //     deferred.reject(err);
  //   });
  //   return deferred.promise;
  // };
  // self.modify = function (user, options) {
  //   var deferred = $q.defer();
  //   Data.User.modify({user: user, options: options}, function (data, headers) {
  //     deferred.resolve(data);
  //   }, function (err) {
  //     deferred.reject(err);
  //   });
  //   return deferred.promise;
  // };
  // // self.update = function (user, options) {
  // //   var deferred = $q.defer();
  // //   Data.User.update({user: user, options: options}, function (data, headers) {
  // //     deferred.resolve(data);
  // //   }, function (err) {
  // //     deferred.reject(err);
  // //   });
  // //   return deferred.promise;
  // // };
  // self.updateOne = function (user, options) {
  //   var deferred = $q.defer();
  //   Data.User.updateOne({user: user, options: options}, function (data, headers) {
  //     deferred.resolve(data);
  //   }, function (err) {
  //     deferred.reject(err);
  //   });
  //   return deferred.promise;
  // };
  self.updateOnesPwd = function (user, options) {
    var deferred = $q.defer();
    Data.User.updateOnesPwd(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  // // self.remove = function (user) {
  // //   var deferred = $q.defer();
  // //   Data.User.remove(user, function (data, headers) {
  // //     deferred.resolve(data);
  // //   }, function (err) {
  // //     deferred.reject(err);
  // //   });
  // //   return deferred.promise;
  // // };
  // self.removeOne = function (user, options) {
  //   var deferred = $q.defer();
  //   Data.User.removeOne({user: user, options: options}, function (data, headers) {
  //     deferred.resolve(data);
  //   }, function (err) {
  //     deferred.reject(err);
  //   });
  //   return deferred.promise;
  // };
  // // self.logout = function () {
  self.logout = function ($scope) {
    // var deferred = $q.defer();
    
    var refreshToken = Storage.get('refreshToken') && {refreshToken: Storage.get('refreshToken')} || {};  // 这里必须传递refreshToken, 因为refreshToken在redis中保存, 退出的时候也要一并删除, 否则就长期有效!!!(过程: userCtrl.js的exports.logout中执行tokenManager.expireToken(req), 在其中删除redis数据库中的refreshToken)
    Data.User.logout(refreshToken, function (data, headers) {
      // deferred.resolve(data);
    }, function (err) {
      // deferred.reject(err);
    });

    var myAppVersionLocal = Storage.get('myAppVersion') || '';
    Storage.clear();
    myAppVersionLocal ? Storage.set('myAppVersion', myAppVersionLocal) : null;

    $ionicHistory.clearHistory();
    $ionicHistory.clearCache();

    $state.go('public.aboutUs');
    // return deferred.promise;
  };
  self.loginModal = function ($scope) {
    // Create the login modal that will show immediately when template 'partials/modal/login.html' is loaded
    $ionicModal.fromTemplateUrl('partials/modal/login.html', {
      scope: $scope,
      animation: 'slide-in-up'
      //,animation: 'no-animation'
    }).then(function (modal) {
      $scope.loginModal = modal;
      $scope.loginModal.show(); //20140804: 直接在这里打开登录窗口，因为是异步加载，所以在其他地方马上打开会因为模板还没加载完成而出错

      // 在$scope销毁的时候, 务必清除该$scope的modal, 否则容易造成内存溢出
      $scope.$on('$destroy', function() {
        if ($scope.loginModal) {  // 加判断是因为有可能已经在登录成功后清除了$scope.loginModal
          $scope.loginModal.remove()
          // .then(function () {
          //   console.log('Leaving ' + $scope.$id);
          // });
        }
      });
    });

    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};

    self.registerModal($scope);

    // Triggered in the login modal to close it
    $scope.actions.closeLogin = function () {
      $scope.loginModal.hide();
    };

    // Open the login modal
    $scope.actions.showLogin = function () {
      $scope.loginModal.show();
    };

    $scope.actions.preRegister = function () {
      $scope.actions.closeLogin();
      $scope.actions.showRegister();
    };

    // Perform the login action when the user submits the login form
    $scope.actions.login = function () {
      // console.log('正在登录', $scope.login);
      self.login($scope);
    };

    $scope.login = {
      username: 'b',
      password: 'a',
      rememberme: true
    };
  };
  self.registerModal = function ($scope) {
    // Create the register modal that we will use later(show up when we click the register button on loginModal)
    $ionicModal.fromTemplateUrl('partials/modal/register.html', {
      scope: $scope,
      animation: 'slide-in-up'
      //,animation: 'no-animation'
    }).then(function (modal) {
      $scope.registerModal = modal;

      // 在$scope销毁的时候, 务必清除该$scope的modal, 否则容易造成内存溢出
      $scope.$on('$destroy', function () {
        // if ($scope.loginModal) {  // 加判断是因为有可能已经在登录成功后清除了$scope.loginModal
        //   $scope.loginModal.remove()
        //   .then(function () {
        //     console.log('Leaving ' + $scope.$id);
        //   });
        // }
        if ($scope.registerModal) {  // 加判断是因为有可能已经在注册成功后清除了$scope.registerModal
          $scope.registerModal.remove()
          // .then(function () {
          //   console.log('Leaving ' + $scope.$id);
          // });
        }
      });
    });

    // $scope.actions = $scope.actions || {};
    // $scope.error = $scope.error || {};

    // Triggered in the login modal to close it
    $scope.actions.closeRegister = function () {
      $scope.registerModal.hide();
    };

    // Open the login modal
    $scope.actions.showRegister = function () {
      $scope.registerModal.show();
    };

    $scope.actions.preLogin = function () {
      $scope.actions.closeRegister();
      $scope.actions.showLogin();
    };

    // Perform the register action when the user submits the register form
    $scope.actions.register = function () {
      // console.log('正在注册', $scope.register);
      self.register($scope.register).then(function (data) {
        $scope.error.registerError = '';
        Storage.set('token', data.results.token);
        if ($scope.loginModal) {
          $scope.loginModal.remove()
          // .then(function () {
          //   console.log(data.results);
          // });
        }
        $scope.registerModal.remove()
        // .then(function () {
        //   console.log(data.results);
        // });

        $state.go($scope.state.toStateName || 'user.home');
        // $state.go($scope.state.toStateName || jwtHelper.decodeToken(data.results.token).userRole + '.' + 'home');
      }, function (err) {
        // Storage.rm('token');
        // Storage.rm('refreshToken');
        // Storage.rm('fullname');
        // Storage.rm('gender');
        var myAppVersionLocal = Storage.get('myAppVersion') || '';
        Storage.clear();
        myAppVersionLocal ? Storage.set('myAppVersion', myAppVersionLocal) : null;
        // $state.go($scope.state.fromStateName || 'anon.login');  // 不需要跳转, 直接显示 $scope.error.registerError 即可, 如果跳转要同时$scope.registerModal.remove(), 否则会造成 modal 后面的页面跳转, 而 modal 还显示在顶层
        $scope.error.registerError = err.data;
      });
    };

    // 测试默认用户名密码
    $scope.register = {
      username: 'z',
      mobile: '13282037883',
      password: 'a',
      repeatPassword: 'a',
      // email: 'a@z.z',
      name: '周天才',
      gender: true,
      // birthdate: new Date('1983-05-05'),
      // idType: '身份证',
      // idNo: '33018300000000'//,
      // contactAddr: '比弗利大道',
      // unit: '浙江大学',
      // tel: '0571-80000000',
      // userRole: {title: '管理员', value:'admin'},
      // userGrade: 0
      rememberme: false
    };
  };
  self.passwordModal = function ($scope) {
    // Create the register modal that we will use later(show up when we click the register button on loginModal)
    $ionicModal.fromTemplateUrl('partials/modal/password.html', {
      scope: $scope,
      animation: 'slide-in-up'
      //,animation: 'no-animation'
    }).then(function (modal) {
      $scope.passwordModal = modal;
      $scope.passwordModal.show();

      // 在$scope销毁的时候, 务必清除该$scope的modal, 否则容易造成内存溢出
      $scope.$on('$destroy', function () {
        // if ($scope.loginModal) {  // 加判断是因为有可能已经在登录成功后清除了$scope.loginModal
        //   $scope.loginModal.remove()
        //   .then(function () {
        //     console.log('Leaving' + $scope.$id);
        //   })
        //   ;
        // }
        // if ($scope.registerModal) {  // 加判断是因为有可能已经在注册成功后清除了$scope.registerModal
        //   $scope.registerModal.remove()
        //   .then(function () {
        //     console.log('Leaving' + $scope.$id);
        //   });
        // }
        if ($scope.passwordModal) {  // 加判断是因为有可能已经在注册成功后清除了$scope.passwordModal
          $scope.passwordModal.remove()
          // .then(function () {
          //   console.log('Leaving' + $scope.$id);
          // });
        }
      });
    });

    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.password = {
      targetKey: 'password'
    };

    // Triggered in the password modal to close it
    $scope.actions.closePassword = function () {
      $scope.passwordModal.hide();
    };

    // Perform the password action when the user submits the password form
    $scope.actions.password = function () {
      // console.log('正在修改密码', $scope.password);
      self.updateOnesPwd($scope.password).then(function () {
        $scope.error.passwordError = '';
        $scope.passwordModal.remove()
        // .then(function () {
        //   console.log(data.results);
        // });
      
        // Storage.set('token', data.results.token);
      }, function (err) {
        $scope.error.passwordError = err.data;
      });
    };
  };

  self.dealPasswordModal = function ($scope, oldDealPwd, closeAble) {
    // Create the register modal that we will use later(show up when we click the register button on loginModal)
    $scope.closeAble = closeAble;  // 是否可关闭本modal
    $scope.oldDealPwd = oldDealPwd; // 如果之前设置过支付密码, 则页面上会显示旧密码输入框
    $ionicModal.fromTemplateUrl('partials/modal/dealPassword.html', {
      scope: $scope,
      backdropClickToClose: false,  // 点击窗口外区域不能关闭窗口
      hardwareBackButtonClose: false,  // 点击android的返回按钮不能关闭窗口
      animation: 'slide-in-up'
      //,animation: 'no-animation'
    }).then(function (modal) {
      $scope.dealPasswordModal = modal;
      $scope.dealPasswordModal.show();

      // 在$scope销毁的时候, 务必清除该$scope的modal, 否则容易造成内存溢出
      $scope.$on('$destroy', function () {
        if ($scope.dealPasswordModal) {  // 加判断是因为有可能已经在修改成功后清除了$scope.dealPasswordModal
          $scope.dealPasswordModal.remove()
          // .then(function () {
          //   console.log('Leaving' + $scope.$id);
          // });
        }
      });
    });

    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.payBill = $scope.payBill || {};
    $scope.dealPassword = {
      // isNewlySet: !oldDealPwd,
      seriesNum: $scope.payBill.userSocketId,
      targetKey: 'extInfo.yiyangbaoHealInce.dealPassword'
    };
    $scope.password = {
      targetKey: 'password'
    };

    // Triggered in the dealPassword modal to close it
    $scope.actions.closeDealPassword = function () {
      $scope.dealPasswordModal.hide();
    };

    // Perform the dealPassword action when the user submits the dealPassword form
    $scope.actions.dealPassword = function () {
      console.log('正在修改支付密码', $scope.dealPassword);
      self.updateOnesPwd($scope.dealPassword).then(function (data) {
        $scope.error.dealPasswordError = '';
        // Storage.set('token', data.results.token);

        $scope.dealPwd = true;  // 如果密码新增成功, 改变支付密码设置状态
        $scope.actions.check && $scope.actions.check();  // 如果密码新增成功, 则执行check函数进行支付

        if (($scope.dealPassword.loginPwd || $scope.password.oldPassword) && $scope.password.newPassword && $scope.password.repeatPwd) {
          $scope.password.loginPwd = $scope.dealPassword.loginPwd;
          $scope.password.seriesNum = $scope.dealPassword.seriesNum;

          console.log('正在修改密码', $scope.password);
          self.updateOnesPwd($scope.password).then(function (data) {
            console.log(data.results);
            $scope.error.passwordError = '';
            $scope.dealPasswordModal.remove();

          }, function () {
            console.log(err);
            $scope.error.passwordError = err.data;
          });
        }
        else {
          $scope.dealPasswordModal.remove()
          // .then(function () {
          //   console.log(data.results);
          // });
        }

      }, function (err) {
        console.log(err);
        $scope.error.dealPasswordError = err.data;
      });
    };
  };

  return self;
}])

// 保单操作函数
.factory('Insurance', ['Storage', 'Data', 'Token', '$state', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $q, jwtHelper) {
  return {
    getInceInfo: function (query, options, fields) {  // 可以不传递token, 由服务器端的tokenManager中间件获取headers中的token并解析为req.user, 获取req.user._id
      var deferred = $q.defer();
      Data.Insurance.getInceInfo({query: query, options: options, fields: fields}, function (data, headers) {  // http.get方法不能传递json对象, 会将{token: token}转换为url?token=token
        deferred.resolve(data);
      }, function (err) {
        // console.log('Request fail for getInfo !!!!! ' + err.data);
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getList: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Insurance.getList(query, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    modify: function (ince, options) {
      var deferred = $q.defer();
      Data.Insurance.modify(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    remove: function (ince) {
      var deferred = $q.defer();
      Data.Insurance.remove(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    removeOne: function (ince, options) {
      var deferred = $q.defer();
      Data.Insurance.removeOne(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])

// 消费操作函数
.factory('Consumption', ['Storage', 'Data', 'Token', '$state', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $q, jwtHelper) {
  return {
    insertOne: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.insertOne(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getOne: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Consumption.getOne({query: query, options: options, fields: fields}, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getList: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Consumption.getList({query: query, options: options, fields: fields}, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    updateOne: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.updateOne(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])

// 文章操作函数
.factory('Post', ['Storage', 'Data', 'Token', '$state', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $q, jwtHelper) {
  return {
    post: function (post, options) {
      var deferred = $q.defer();
      Data.Post.post(post, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])

// 页面功能函数
.factory('PageFunc', ['$ionicPopup', '$timeout', function ($ionicPopup, $timeout) {
  return {
    message: function (_msg, _time, _title) {
      var messagePopup = $ionicPopup.alert({
        title: _title || '消息',  // String. The title of the popup.
        // cssClass: '',  // String, The custom CSS class name.
        // subTitle: '',  // String (optional). The sub-title of the popup.
        template: _msg,  // String (optional). The html template to place in the popup body.
        // templateUrl: '',  // String (optional). The URL of an html template to place in the popup   body.
        okText: '确认',  // String (default: 'OK'). The text of the OK button.
        okType: 'button-energized'  // String (default: 'button-positive'). The type of the OK button.
      });

      if (_time) {
        $timeout(function () {
          messagePopup.close('Timeout!');
        }, _time);
      }

      // messagePopup.then(function(res) {
      //   console.log(res);
      // });

      // 这里返回Popup实例, 便于在调用的地方编程执行messagePopup.close()关闭alert; 需要的话还可以执行messagePopup.then(callback).
      return messagePopup;
    },
    confirm: function (_msg, _title) {
      var confirmPopup = $ionicPopup.confirm({
        title: _title,
        // cssClass: '',
        // subTitle: '',
        template: _msg,
        // templateUrl: '',
        cancelText: '取消', // String (default: 'Cancel'). The text of the Cancel button.
        cancelType: 'button-default', // String (default: 'button-default'). The type of the Cancel button.
        okText: '确定',
        okType: 'button-energized'
      });

      // confirmPopup.then(function(res) {  // true if press 'OK' button, false if 'Cancel' button
      //   console.log(res);
      // });
      
      // 这里返回Popup实例, 便于在调用的地方执行confirmPopup.then(callback).
      return confirmPopup;  
    },
    prompt: function (_msg, _title) {
      var promptPopup = $ionicPopup.prompt({
        title: _title,
        // cssClass: '',
        // subTitle: '',
        template: _msg,
        // templateUrl: '',
        inputType: 'password',  // String (default: 'text'). The type of input to use
        inputPlaceholder: _msg,  // String (default: ''). A placeholder to use for the input.
        cancelText: '取消', // String (default: 'Cancel'). The text of the Cancel button.
        cancelType: 'button-default', // String (default: 'button-default'). The type of the Cancel button.
        okText: '确定',
        okType: 'button-energized'
      });

      // promptPopup.then(function(res) {  // true if press 'OK' button, false if 'Cancel' button
      //   console.log(res);
      // });
      
      // 这里返回Popup实例, 便于在调用的地方执行promptPopup.then(callback).
      return promptPopup;  
    }
  };
}])

// 安全认证函数
.factory('Auth', ['Storage', 'Data', '$q', 'ACL', 'Token', function (Storage, Data, $q, ACL, Token) {
  return {
    authorize: function(accessLevel, role) {
        if (role === undefined) {
            // console.log(Token.curUserRole());
            role = ACL.userRoles[Token.curUserRole()];
            // console.log(accessLevel.bitMask, role.bitMask);
        }
        return accessLevel.bitMask & role.bitMask;
    },
    isLoggedIn: function() {
        return !Token.isExpired();
    }
  };
}])

// // angular内部的ACL权限控制列表
// .factory('ACL', ['CONFIG', function (CONFIG) {
//   /*
//    * Method to build a distinct bit mask for each role
//    * It starts off with "1" and shifts the bit to the left for each element in the
//    * roles array parameter
//    */

//   function buildRoles (roles) {

//     var bitMask = "01";
//     var userRoles = {};

//     for(var role in roles){
//       var intCode = parseInt(bitMask, 2);
//       userRoles[roles[role]] = {
//         bitMask: intCode,
//         title: roles[role]
//       };
//       bitMask = (intCode << 1 ).toString(2)
//     }

//     return userRoles;
//   }

//   /*
//    * This method builds access level bit masks based on the accessLevelDeclaration parameter which must
//    * contain an array for each access level containing the allowed user roles.
//    */
//   function buildAccessLevels (accessLevelDeclarations, userRoles) {

//     var accessLevels = {};
//     for(var level in accessLevelDeclarations){

//       if(typeof accessLevelDeclarations[level] == 'string'){
//         if(accessLevelDeclarations[level] == '*'){

//           var resultBitMask = '';

//           for( var role in userRoles){
//             resultBitMask += "1"
//           }
//           //accessLevels[level] = parseInt(resultBitMask, 2);
//           accessLevels[level] = {
//             bitMask: parseInt(resultBitMask, 2)
//           };
//         }
//         else console.log("Access Control Error: Could not parse '" + accessLevelDeclarations[level] + "' as access definition for level '" + level + "'")

//       }
//       else {

//         var resultBitMask = 0;
//         for(var role in accessLevelDeclarations[level]){
//           if(userRoles.hasOwnProperty(accessLevelDeclarations[level][role]))
//             resultBitMask = resultBitMask | userRoles[accessLevelDeclarations[level][role]].bitMask
//           else console.log("Access Control Error: Could not find role '" + accessLevelDeclarations[level][role] + "' in registered roles while building access for '" + level + "'")
//         }
//         accessLevels[level] = {
//           bitMask: resultBitMask
//         };
//       }
//     }

//     return accessLevels;
//   }

//   var userRoles = buildRoles(CONFIG.userRoles);
//   var accessLevels = buildAccessLevels(CONFIG.accessLevels, userRoles);

//   return {
//     userRoles: userRoles,
//     accessLevels: accessLevels
//   };
// }])

;