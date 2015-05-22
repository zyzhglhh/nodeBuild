angular.module('yiyangbao.directives', [])

// 输入框清除按钮
.directive("buttonClearInput", function () {
    return {
        restrict: "AE",
        scope: {
            input: "="  //这里可以直接用input获取父scope(包括兄弟元素)中ng-model的值, 传递给本directive创建的isolate scope使用, template也属于当前isolate scope
        },
        // replace: true,   //使用replace之后, 本元素的click不能删除输入框中的内容, 原因大致可以理解为: 父元素被替换后, scope.$apply没有执行对象
        template:"<button ng-if='input' class='button button-icon ion-android-close input-button' type='button' ng-click='clearInput()'></button>",
        controller: function ($scope, $element, $attrs) {
            $scope.clearInput = function () {
                $scope.input = "";
            };
        }
    };
})
;