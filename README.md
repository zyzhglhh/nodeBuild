1. 升级ionic(进入工程根目录 `$ cd app`): `$ ionic lib update`; 其他包还是用bower管理: `$ bower install`, `$ bower update --save/--save-dev`; 也可以用 `$ bower update ionic --save-dev` 升级ionic; 用 `$ bower install ionic --save-dev` 安装ionic.

2. The ionic.bundle.js file includes both the core Ionic JS and the Ionic AngularJS extensions and the Angular-UI-Router. Ionic comes with ngAnimate and ngSanitize bundled in, but to use other Angular modules like ngResource, you'll need to include them from the lib/js/angular directory.
/*!
 * ionic.bundle.js is a concatenation of:
 * ionic.js, angular.js, angular-animate.js,
 * angular-sanitize.js, angular-ui-router.js,
 * and ionic-angular.js
 */