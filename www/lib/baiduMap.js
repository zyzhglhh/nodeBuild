/**
 *  A directive which helps you easily show a baidu-map on your page.
 *
 *
 *  Usages:
 *
 *      <baidu-map options='options'></baidu-map>
 *
 *      options: The configurations for the map
 *            .center.longitude[Number]{M}: The longitude of the center point
 *            .center.latitude[Number]{M}: The latitude of the center point
 *            .zoom[Number]{O}:         Map's zoom level. This must be a number between 3 and 19
 *            .navCtrl[Boolean]{O}:     Whether to add a NavigationControl to the map
 *            .scaleCtrl[Boolean]{O}:   Whether to add a ScaleControl to the map
 *            .overviewCtrl[Boolean]{O}: Whether to add a OverviewMapControl to the map
 *            .enableScrollWheelZoom[Boolean]{O}: Whether to enableScrollWheelZoom to the map
 *            .city[String]{M}:         The city name which you want to display on the map
 *            .markers[Array]{O}:       An array of marker which will be added on the map
 *                   .longitude{M}:                The longitude of the marker
 *                   .latitude{M}:                 The latitude of the marker
 *                   .icon[String]{O}:             The icon's url for the marker
 *                   .width[Number]{O}:            The icon's width for the icon
 *                   .height[Number]{O}:           The icon's height for the icon
 *                   .title[String]{O}:            The title on the infowindow displayed once you click the marker
 *                   .content[String]{O}:          The content on the infowindow displayed once you click the marker
 *                   .enableMessage[Boolean]{O}:   Whether to enable the SMS feature for this marker window. This option only available when title/content are defined.
 *
 *  @author      Howard.Zuo
 *  @copyright   Jun 9, 2015
 *  @version     1.2.0
 *
 *  @author fenglin han
 *  @copyright 6/9/2015
 *  @version 1.1.1
 * 
 *  Usages:
 *
 *  <baidu-map options='options' ></baidu-map>
 *  comments: An improvement that the map should update automatically while coordinates changes
 *
 *  @version 1.2.1
 *  comments: Accounding to 史魁杰's comments, markers' watcher should have set deep watch equal to true, and previous overlaies should be removed
 *
 */
(function(global, factory) {
    'use strict';

    if (typeof exports === 'object') {
        module.exports = factory(require('angular'));
    } else if (typeof define === 'function' && define.amd) {
        define(['angular'], factory);
    } else {
        factory(global.angular);
    }

}(window, function(angular) {
    'use strict';

    var checkMandatory = function(prop, desc) {
        if (!prop) {
            throw new Error(desc);
        }
    };

    var defaults = function(dest, src) {
        for (var key in src) {
            if (typeof dest[key] === 'undefined') {
                // console.log(dest[key])
                dest[key] = src[key];
            }
        }
    };

    var baiduMapDir = function() {

        // Return configured, directive instance

        return {
            restrict: 'E',
            scope: {
                'options': '='
            },
            link: function($scope, element, attrs) {

                var defaultOpts = {
                    navCtrl: true,
                    scaleCtrl: true,
                    overviewCtrl: true,
                    enableScrollWheelZoom: true,
                    zoom: 10,
                    center: {}
                };

                var getLocationSuccess = function(posi){
                    
                    
                    defaultOpts.center.longitude= posi.lng;
                    defaultOpts.center.latitude = posi.lat;

                    var opts = $scope.options;
                    defaults(opts, defaultOpts);

                    checkMandatory(opts.center, 'options.center must be set');

                    var map = new BMap.Map(element.find('div')[0]);

            

                    map.centerAndZoom(new BMap.Point(opts.center.longitude, opts.center.latitude), opts.zoom);
                    if (opts.navCtrl){
                        map.addControl(new BMap.NavigationControl());
                    }

                    if ( opts.scaleCtrl){
                        map.addControl(new BMap.ScaleControl());
                    }

                    if ( opts.overviewCtrl){
                        map.addControl(new BMap.OverviewMapControl());
                    }

                    if ( opts.enableScrollWheelZoom){
                        map.enableScrollWheelZoom();
                    }
                    
                    var point = new BMap.Point(opts.center.longitude,opts.center.latitude);
                    var circle = new BMap.Circle(point, 10000, {fillColor:"blue", strokeWeight:1, fillOpacity:0.3,strokeOpacity:0.3});
                    map.addOverlay(circle);

                    var local = new BMap.LocalSearch(map,{renderOptions:{map:map,autoViewport:false}});
                    local.searchNearby(['九洲大药房'],point, 10000);
                };


                var geolocation = new BMap.Geolocation();

                geolocation.getCurrentPosition(function(r){
                    if (this.getStatus() == BMAP_STATUS_SUCCESS){
                        //alert(r.point.lng + ', ' + r.point.lat);
                        //map.panTo(r.point);
                        
                        getLocationSuccess(r.point);

                    } else {
                        alert('failed' + this.getStatus());
                    }
                }, {enableHighAccuracy: true});


            },
            template: '<div style="width: 100%; height: 100%;"></div>'
        };
    };

    var baiduMap = angular.module('baiduMap', []);
    
    baiduMap.directive('baiduMap', [baiduMapDir]);
}));