// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'yiyangbao' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var dependencies = ['ionic',
                    'w5c.validator',
                    'angular-jwt',
                    'monospaced.qrcode',
                    'btford.socket-io',
                    'ngCordova',
                    // 'angularFileUpload',  // ng-file-upload
                    'yiyangbao.services',
                    'yiyangbao.directives',
                    'yiyangbao.filters',
                    'yiyangbao.controllers',
                    'yiyangbao.controllers.user',
                    'yiyangbao.controllers.backend'];

var myAppVersion = '0.0.1';

var app = angular.module('yiyangbao', dependencies);

app
// 路由, 权限, url模式设置
.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider) {
    var access = routingConfig.accessLevels; // 如下说明, 还是存在问题!!!
    // var access = ACL.accessLevels; // 可以将服务(.factory) ACL 作为 ACLProvider 注入(injector)到配置(.config)中, 然后通过 ACL.something 方式调用, 注意不是通过 ACLProvider.something方式调用
    // 
    // https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-make-a-trailing-slash-optional-for-all-routes
    // Make a trailing slash optional for all routes, All routes in app/scripts/app.js must be redefined without trailing /. 
    $urlMatcherFactoryProvider.strictMode(false);
    
    // https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode
    // When you have html5Mode enabled, the # character will no longer be used in your urls. Without #, the url looks much nicer, but it also requires server side rewrites
    // 具体Rewrite规则及原理详见../../init.js的代码注释
    // $locationProvider.html5Mode({enabled: true});  // 设置了本模式后, 在angularjs 1.3 版本以上, 需要在 index.html 中设置 <base href="/app/www/">(app部署在子目录中), 如果app部署在服务器根目录, 则为 <base href="/">; 如果app是部署在子目录中, 则app.html模板中所有的链接都要采用相对链接的方式(如href='aboutUs'地址转换为'http://domain/app/www/aboutUs'), 否则(href='/aboutUs')仍旧会以根目录为前缀('http://domain/aboutUs'), $stateProvider.state中的url还是要加左边的反斜杠. 如果要重新启用html5Mode: (1) 去掉本行注释; (2) $urlRouterProvider.otherwise改用方法2; (3) 所有的.html模板中的href=""改为href="#", href="#/path"改为href="path".
    
    // For any unmatched url, redirect to /state1
    // $urlRouterProvider.otherwise("/login");
    // http://stackoverflow.com/questions/25065699/why-does-angularjs-with-ui-router-keep-firing-the-statechangestart-event
    // https://github.com/angular-ui/ui-router/issues/600
    // $urlRouterProvider.otherwise(function ($injector, $location) {  // 方法2
    //     var $state = $injector.get("$state");
    //     // $state.go("anon.login");
    //     $state.go("public.settings");
    // });
    // $urlRouterProvider.otherwise('/settings');  // 方法1
    // $urlRouterProvider.otherwise('/aboutUs');

    // 初装或升级App的介绍页面
    $stateProvider
        .state('intro', {
            url:'/intro',
            templateUrl: 'partials/about/intro.html',
            controller: 'intro',
            data: {
                access: access.public
            }
        });
    
    // Public routes
    $stateProvider
        .state('public', {
            abstract: true,
            // template: "<ui-view/>", // 注意<ui-view name='a'/><ui-view name='b'/>其实是嵌套<ui-view name='a'><ui-view name='b'></ui-view></ui-view>, 而不是并列<ui-view name='a'></ui-view><ui-view name='b'></ui-view>
            templateUrl: 'partials/sideMenuLeft.html',
            controller: 'publicSideMenu',
            data: {
                access: access.public
            }
        })
        .state('public.aboutUs', {
            url: '/aboutUs',
            templateUrl: 'partials/about/aboutUs.html',
            data: {
                // access: access.user,
                menuToggle: true
            },
            controller: 'aboutUs'
        })
        // .state('public.products', {
        //     url: '/products',
        //     templateUrl: 'partials/about/products.html',
        //     data: {
        //         menuToggle: true
        //     },
        //     controller: 'products'
        // })
        // .state('public.contactUs', {
        //     url: '/contactUs',
        //     templateUrl: 'partials/about/contactUs.html',
        //     data: {
        //         menuToggle: true
        //     },
        //     controller: 'contactUs'
        // })
        .state('public.agreement', {
            url: '/agreement',
            templateUrl: 'partials/about/agreement.html',
            data: {
                menuToggle: true
            },
            controller: 'agreement'
        })
        // .state('public.privacy', {
        //     url: '/privacy',
        //     templateUrl: 'partials/about/privacy.html',
        //     data: {
        //         menuToggle: true
        //     },
        //     controller: 'privacy'
        // })
        .state('public.settings', {
            url: '/settings',
            templateUrl: 'partials/about/settings.html',
            data: {
                menuToggle: true
            },
            controller: 'settings'
        })
        // 不在sideMenu中
        .state('public.feedback', {
            url: '/feedback',
            templateUrl: 'partials/about/feedback.html',
            controller: 'feedback'
        });

    // // Anonymous routes
    // $stateProvider
    //     .state('anon', {
    //         abstract: true,
    //         template: "<ui-view/>",
    //         data: {
    //             access: access.anon
    //         }
    //     })
    //     .state('anon.login', {
    //         url: '/login',
    //         templateUrl: 'partials/common/login.html',
    //         controller: 'login'
    //     });

    // Regular user routes
    $stateProvider
        .state('user', {
            abstract: true,
            url: '/user',
            templateUrl: 'partials/user/tabsBottom.html',
            controller: 'userTabsBottom',
            data: {
                access: access.user
            }
        })
        .state('user.home', {
            // cache: false,  // 是否缓存该页面, 全局设置缓存30个页面
            url: '/home',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/home.html',
                    controller: 'userHome'
                }
            }
        })
        .state('user.ConsList', {
            url: '/ConsList',
            views: {
                'userConsList': {
                    templateUrl: 'partials/user/ConsList.html',
                    controller: 'userConsList'
                }
            }
        })
        .state('user.activities', {
            url: '/activities',
            views: {
                'userActivities': {
                    templateUrl: 'partials/user/activities.html',
                    controller: 'userActivities'
                }
            }
        })
        .state('user.around', {
            url: '/around',
            views: {
                'userAround': {
                    templateUrl: 'partials/user/around.html',
                    controller: 'userAround'
                }
            }
        })
        // 不在tabs中
        .state('user.settings', {
            url: '/settings',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/settings.html',
                    controller: 'userSettings'
                }
            }
        })
        .state('user.feedback', {
            url: '/feedback',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/feedback.html',
                    controller: 'userFeedback'
                }
            }
        })
        .state('user.mine', {
            url: '/mine',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/mine.html',
                    controller: 'userMine'
                }
            }
        })
        .state('user.helper', {
            url: '/helper',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/helper.html',
                    controller: 'userHelper'
                }
            }
        })
        .state('user.search', {
            url: '/search',
            views: {
                'userConsList': {
                    templateUrl: 'partials/common/search.html',
                    controller: 'userSearch'
                }
            }
        });

    // // Serv routes
    // $stateProvider
    //     .state('serv', {
    //         abstract: true,
    //         template: "<ui-view/>",
    //         data: {
    //             access: access.serv
    //         }
    //     })
    //     .state('serv.servhome', {
    //         url: '/servhome',
    //         templateUrl: 'partials/backend/servhome.html',
    //         controller: 'servhome'
    //     });

    // // Ince routes
    // $stateProvider
    //     .state('ince', {
    //         abstract: true,
    //         template: "<ui-view/>",
    //         data: {
    //             access: access.ince
    //         }
    //     })
    //     .state('ince.incehome', {
    //         url: '/incehome',
    //         templateUrl: 'partials/backend/incehome.html',
    //         controller: 'incehome'
    //     });

    // Medi routes
    $stateProvider
        .state('medi', {
            abstract: true,
            url: '/medi',
            templateUrl: 'partials/backend/medi/tabsBottom.html',
            controller: 'mediTabsBottom',
            data: {
                access: access.medi
            }
        })
        .state('medi.barcode', {
            cache: false,  // 包含动态业务的页面不能缓存, 否则数据不会变化; 具有大量事件监听的页面最好也不要缓存?
            url: '/barcode',
            views: {
                'mediBarcode': {
                    templateUrl: 'partials/backend/medi/barcode.html',
                    controller: 'mediBarcode'
                }
            }
        })
        .state('medi.ConsList', {
            url: '/ConsList',
            views: {
                'mediConsList': {
                    templateUrl: 'partials/backend/medi/ConsList.html',
                    controller: 'mediConsList'
                }
            }
        })
        .state('medi.receipt', {
            url: '/receipt',
            views: {
                'mediReceipt': {
                    templateUrl: 'partials/backend/medi/receipt.html',
                    controller: 'mediReceipt'
                }
            }
        })
        .state('medi.home', {
            url: '/home',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/home.html',
                    controller: 'mediHome'
                }
            }
        })
        // 不在tabs中
        .state('medi.mine', {
            url: '/mine',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/mine.html',
                    controller: 'mediMine'
                }
            }
        })
        .state('medi.helper', {
            url: '/helper',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/helper.html',
                    controller: 'mediHelper'
                }
            }
        })
        .state('medi.settings', {
            url: '/settings',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/settings.html',
                    controller: 'mediSettings'
                }
            }
        })
        .state('medi.feedback', {
            url: '/feedback',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/feedback.html',
                    controller: 'mediFeedback'
                }
            }
        })
        .state('medi.search', {
            url: '/search',
            views: {
                'mediConsList': {
                    templateUrl: 'partials/common/search.html',
                    controller: 'mediSearch'
                }
            }
        });

    // // Unit routes
    // $stateProvider
    //     .state('unit', {
    //         abstract: true,
    //         template: "<ui-view/>",
    //         data: {
    //             access: access.unit
    //         }
    //     })
    //     .state('unit.unithome', {
    //         url: '/unithome',
    //         templateUrl: 'partials/backend/unithome.html',
    //         controller: 'unithome'
    //     });

}])

// ionic全局初始化设置
.config(['$ionicConfigProvider', function ($ionicConfigProvider) {
  // $ionicConfigProvider.views.transition('platform');
  // $ionicConfigProvider.platform.android.views.transition('ios');  // 可以指定具体每一个平台的全局设置
  $ionicConfigProvider.views.maxCache(30);  // 缓存页面, 默认为10, 0为不缓存
  // $ionicConfigProvider.platform.android.views.maxCache(5);  // 可以指定具体每一个平台的全局设置
  $ionicConfigProvider.views.forwardCache(true); // 设置点击返回按钮的那个页面是否会被缓存，即不在$ionicHistory(history view, 历史记录)里面的页面是否会被缓存
  $ionicConfigProvider.backButton.icon('ion-ios7-arrow-back');
  $ionicConfigProvider.backButton.text('');
  $ionicConfigProvider.backButton.previousTitleText(false);  // 前一个页面的title是否成为当前页面backButton的按钮显示值
  // $ionicConfigProvider.form.checkbox('square'/'circle');  // 括号中为android/ios默认值
  // $ionicConfigProvider.form.toggle('small'/'large');  // 括号中为android/ios默认值
  // $ionicConfigProvider.tabs.style('standard');
  $ionicConfigProvider.tabs.position('bottom');
  // $ionicConfigProvider.templates.maxPrefetch(0);  // 预读取$stateProvider.state定义的模板数量, 默认为30, 0为不读取(点击链接才加载)
  $ionicConfigProvider.navBar.alignTitle('center');
  // $ionicConfigProvider.navBar.positionPrimaryButtons('platform');
  // $ionicConfigProvider.navBar.positionSecondaryButtons('platform');
}])

// $httpProvider.interceptors提供http request及response的预处理
.config(['$httpProvider', 'jwtInterceptorProvider', function ($httpProvider, jwtInterceptorProvider) {
    jwtInterceptorProvider.tokenGetter = ['config', 'jwtHelper', '$http', function(config, jwtHelper, $http) {
        // console.log(config);

        // var token = sessionStorage.getItem('token');
        var token = localStorage.getItem('token');
        // var refreshToken = sessionStorage.getItem('refreshToken');
        var refreshToken = localStorage.getItem('refreshToken');
        var isExpired = true;
        try {
            isExpired = jwtHelper.isTokenExpired(token);
            // console.log(isExpired);
        }
        catch (e) {
            // console.log(e);
            isExpired = true;
        }
        // 这里如果同时http.get两个模板, 会产生两个$http请求, 插入两次jwtInterceptor, 执行两次getrefreshtoken的刷新token操作, 会导致同时查询redis的操作, ×××估计由于数据库锁的关系×××(由于token_manager.js中的exports.refreshToken中直接删除了redis数据库里前一个refreshToken, 导致同时发起的附带有这个refreshToken的getrefreshtoken请求查询返回reply为null, 导致返回"凭证不存在!"错误), 其中一次会查询失败, 导致返回"凭证不存在!"错误, 使程序流程出现异常(但是为什么会出现模板不能加载的情况? 是什么地方阻止了模板的下载?)
        if (isExpired) {    // 需要加上refreshToken条件, 否则会出现网页循环跳转
            // This is a promise of a JWT token
            // console.log(token);
            if (refreshToken) {
                return $http({
                    url: '/refreshToken',
                    // This makes it so that this request doesn't send the JWT
                    skipAuthorization: true,
                    method: 'POST',
                    timeout: 5000,
                    data: { 
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken 
                    }
                }).then(function (res) { // $http返回的值不同于$resource, 包含config等对象, 其中数据在res.data中
                    // console.log(res);
                    // sessionStorage.setItem('token', res.data.token);
                    // sessionStorage.setItem('refreshToken', res.data.refreshToken);
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('refreshToken', res.data.refreshToken);
                    return res.data.token;
                }, function (err) {
                    console.log(err);
                    // sessionStorage.removeItem('token');
                    // sessionStorage.removeItem('refreshToken');
                    // localStorage.removeItem('token');
                    // localStorage.removeItem('refreshToken');
                    return null;
                });
            }
            else {
                return null;
            }  
        } 
        else if (config.url.substr(config.url.length - 5) === '.html') {
            return null;
        }
        else {
            return token;
        }
    }];

    $httpProvider.interceptors.push('jwtInterceptor');
}])

// 表单校验初始配置
.config(['w5cValidatorProvider', function (w5cValidatorProvider) {
    // 全局配置
    w5cValidatorProvider.config({
        blurTrig   : false,
        showError  : true,
        removeError: true
    });
    w5cValidatorProvider.setRules({
        email: {  // 对应的是form中input的name属性值(可以大写, camelCase等), 似乎也对应于变量名
            required : "邮箱地址不能为空",
            email    : "输入邮箱的格式不正确"
        },
        username: {
            required : "输入的用户名不能为空",
            pattern  : "用户名必须输入字母、数字、下划线,以字母开头"
        },
        password: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        repeatPassword: {
            required : "密码不能为空",
            repeat: "两次填写的密码不一致"
        },
        oldPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        newPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        repeatPwd: {
            required : "密码不能为空",
            repeat: "两次填写的密码不一致"
        },
        oldDealPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        newDealPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        // repeatDealPwd: {
        //     required : "密码不能为空",
        //     repeat: "两次填写的密码不一致"
        // },
        name : {
            required : "姓名不能为空",
            pattern  : "请正确输入中文姓名"
        },
        mobile: {
            required : "手机号不能为空",
            pattern  : "请填写正确手机号",
            minlength: "手机号长度不能小于{minlength}",
            maxlength: "手机号长度不能大于{maxlength}"
        },
        tel: {
            pattern  : "请填写正确电话号",
            minlength: "电话号长度不能小于{minlength}",
            maxlength: "电话号长度不能大于{maxlength}"
        },
        idNo: {
            required : "证件号不能为空",
            pattern  : "请填写正确证件号",
            minlength: "证件号长度不能小于{minlength}",
            maxlength: "证件号长度不能大于{maxlength}"
        },
        money: {
            required : "金额不能为空",
            min: "最小金额0.01元"
        }
    });
}])

// ionic平台ready事件
.run(['$ionicPlatform', '$rootScope', '$state', 'Storage', 'Token', '$ionicPopup', function ($ionicPlatform, $rootScope, $state, Storage, Token, $ionicPopup) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    // 在线离线事件监听及广播
    $ionicPlatform.on('online', function () {
      if (navigator.connection) {
        $rootScope.myOnline = navigator.connection.type;
      }
      else {
        $rootScope.myOnline = window.navigator.onLine;
      }
      $rootScope.$broadcast('onOnline');
    }, false);
    $ionicPlatform.on('offline', function () {
      // $ionicPopup.alert({title: '离线事件', template: navigator.connection.type, okText: '确认'}); //================for Test
      if (navigator.connection) {
        $rootScope.myOnline = navigator.connection.type;
      }
      else {
        $rootScope.myOnline = window.navigator.onLine;
      }
      $rootScope.$broadcast('onOffline');
    }, false);

    // // 首次进入程序进入intro页面
    // if (myAppVersion !== Storage.get('myAppVersion')) {
    //   $state.go('intro');
    // }

    switch (Token.curUserRole()) {
      case 'public':
        $state.go('public.aboutUs');
        break;
      // case 'user':
      //   $state.go('user.home');
      //   break;
      // case 'serv':
      //   $state.go();
      //   break;
      case 'medi':
        $state.go('medi.home');
        break;
      // case 'unit':
      //   $state.go();
      //   break;
      // case 'ince':
      //   $state.go();
      //   break;
      // case 'admin':
      //   $state.go();
      //   break;
      // case 'super':
      //   $state.go();
      //   break;
      default:
        $state.go('user.home');
    }
  });
}])

.run(['$rootScope', '$state', '$ionicHistory', 'Auth', 'ACL', 'Token', 'User', 'Storage', 'PageFunc', function ($rootScope, $state, $ionicHistory, Auth, ACL, Token, User, Storage, PageFunc) {
  $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
    // console.log(toState.name);

    if (!('data' in toState) || !('access' in toState.data)){
      // $rootScope.error = "Access undefined for this state";
      event.preventDefault();
      PageFunc.message('当前内容建设中, 敬请期待!', 2000);
      $state.go(fromState.name || 'anon.login');
    }
    else if (Auth.authorize(toState.data.access) && 
            !Auth.isLoggedIn() && 
            !Storage.get('refreshToken') && 
            toState.data.access.bitMask !== ACL.accessLevels.public.bitMask && 
            toState.data.access.bitMask !== ACL.accessLevels.anon.bitMask) {
        event.preventDefault();
        $rootScope.state = {
          toStateName: toState.name,
          fromStateName: fromState.name
        };
        User.loginModal($rootScope);
    }
    else if (!Auth.authorize(toState.data.access)) {
      // $rootScope.error = "Seems like you tried accessing a route you don't have access to...";
      event.preventDefault();  // 这里用了preventDefault()会和$urlRouterProvider.otherwise发生冲突, 造成Infinite $digest Loop, 暂时的解决方法见$urlRouterProvider.otherwise

      // console.log(fromState.url);

      // if (fromState.url === '^') {  // 直接在浏览器地址栏输入并回车的时候, fromState.url === '^', 且 fromState.name === ''
        if (Auth.isLoggedIn() || Storage.get('refreshToken')) {
          PageFunc.message('页面不存在或不能浏览!', 2000);
          // console.log(fromState.name);
          $state.go(fromState.name || 'user.home');
        } 
        else {
          $rootScope.state = {
            toStateName: toState.name,
            fromStateName: fromState.name
          };
          User.loginModal($rootScope);
        }
      // }
    }

    // 如果没有被上述条件拦截, 说明$state可以顺利到达toState, 则执行下列操作, 即如果state.data.menuToggle, 则sideMenu可以滑出来; 应该可以通过sideMenuLeft.html中的enable-menu-with-back-views="false"达到同样效果?
    if (toState.data.menuToggle) {
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
    }

    // console.log($ionicHistory.viewHistory());
  });
}])
