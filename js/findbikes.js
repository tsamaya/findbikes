var contracts_url = "./contracts.php";
var stations_url = "./stations.php?contract="

var map, symbol, handle, deviceGraphic, devicePt, watchId, shareLocation, stationsGraphicLayer;

var onImg = "./img/whereami_on.png";
var offImg = "./img/whereami_off.png";

define(["dojo/parser",
        "esri/map",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/InfoTemplate",
        "esri/dijit/InfoWindowLite",
        "esri/symbols/PictureMarkerSymbol",
        "esri/layers/GraphicsLayer",
        "esri/dijit/Geocoder",
        "esri/graphic",
        "esri/graphicsUtils",
        "esri/geometry/webMercatorUtils",
        "esri/geometry/Point",
        "esri/graphic",
        "esri/symbols/SimpleMarkerSymbol",
        "dojo/dom",
        'dojo/on',
        "dojo/dom-construct",
        "dojo/_base/Color",
        "dojo/domReady!"
    ],
    function(parser,
        Map,
        ArcGISDynamicMapServiceLayer,
        InfoTemplate,
        InfoWindowLite,
        PictureMarkerSymbol,
        GraphicsLayer,
        Geocoder,
        Graphic,
        graphicsUtils,
        webMercatorUtils,
        Point,
        Graphic,
        SimpleMarkerSymbol,
        dom,
        on,
        domConstruct,
        Color) {
        return {

            /**
             * startup function : entry point !
             */
            startup: function() {
                // call the parser to create the dijit layout dijits
                parser.parse();

                // init map
                this.initMap();
                // init data
                this.getContracts();
                // setup UX
                this.initView();
            },

            /**
             * creates ESRI map and other esri components
             */
            initMap: function() {
                // create the station symbol
                //"url": "img/velov.gif",
                symbol = new PictureMarkerSymbol({
                    "angle": 0,
                    "type": "esriPMS",
                    "url": "img/pin.png",
                    "contentType": "image/gif",
                    "width": 25,
                    "height": 23,
                    "xoffset": 0,
                    "yoffset": 0
                });


                // create the map
                map = new Map("map", {
                    basemap: "streets",
                    center: [2.3, 46.6], //long, lat un peu au centre de la France :)
                    zoom: 6,
                    sliderStyle: "small"
                });

                // create the info window
                var infoWindow = new InfoWindowLite(null, domConstruct.create("div", null, null, map.root));
                infoWindow.startup();
                map.setInfoWindow(infoWindow);
                
                var updateEnd = map.on("update-end", function() {
                    updateEnd.remove();

                    // create the geocoder
                    var geocoder = new Geocoder({
                        arcgisGeocoder: {
                            placeholder: "Find a place"
                        },
                        autoComplete: true,
                        map: map
                    }, dom.byId("search"));

                    geocoder.on("select", showGeocoderLocation);
                    geocoder.on("clear", removeGeocoderLocation);

                    geocoder.startup();

                    // with this template
                    var template = new InfoTemplate();
                    template.setTitle("<b>${name}</b>");
                    template.setContent("<b>${address}</b>" +
                        "<br />vélos disponibles : ${available_bikes}" +
                        "<br />points disponibles : ${available_bike_stands}" +
                        "<br />points opérationnels : ${bike_stands}" +
                        //"<br />CB : ${banking}" +
                        "<br />Statut : ${status}" +
                        "<br /><i>Mise à jour : ${last_update:DateFormat}</i>"
                    );

                    // Create graphics layer
                    stationsGraphicLayer = new GraphicsLayer();
                    stationsGraphicLayer.infoTemplate = template;
                    map.addLayer(stationsGraphicLayer);

                    function showGeocoderLocation(evt) {
                        map.graphics.clear();
                        var point = evt.result.feature.geometry;
                        var symbol = new SimpleMarkerSymbol().setStyle(
                            SimpleMarkerSymbol.STYLE_SQUARE).setColor(
                            new Color([255, 0, 0, 0.5])
                        );
                        var graphic = new Graphic(point, symbol);
                        map.graphics.add(graphic);

                        map.infoWindow.setTitle("Search Result");
                        map.infoWindow.setContent(evt.result.name);
                        map.infoWindow.show(evt.result.feature.geometry);
                    };

                    function removeGeocoderLocation() {
                        map.infoWindow.hide();
                        map.graphics.clear();
                    };
                });

            },

            initView: function() {
                on(dom.byId('contractsList'), 'change', this.selectContract);
                on(dom.byId('locateimage'), 'click', this.locateDevice);

            },

            /**
             * Get JCDecaux contracts
             */

            getContracts: function() {
                $.get(contracts_url, function(data) {
                    var contractsJSON = JSON.parse(data);
                    if (contractsJSON) {
                        $('#contractsList').append($('<option/>').attr("value", "").text("Sélectionner une ville"));
                        $.each(contractsJSON, function(i, option) {
                            $('#contractsList').append($('<option/>').attr("value", option.name).text(option.name + " : " + option.commercial_name));
                        });
                    }
                });
            },


            /**
             * fired when a contract is selected
             */
            selectContract: function(evt) {
                //var contractIdx = evt.srcElement.selectedIndex;
                var contractIdx = evt.currentTarget.selectedIndex;
                console.log("param est " + contractIdx);
                var x = dom.byId("contractsList");
                var contractName = x.options[contractIdx].value;
                console.log("selection du contrat " + contractName);
                stationsGraphicLayer.clear();
                getStations(contractName);


                function getStations(contractName) {
                    console.log("Chargement des stations du contrat " + contractName);
                    $.get(stations_url + contractName, function(data) {
                        var stations = JSON.parse(data);
                        for (var i = 0, len = stations.length; i < len; i++) {
                            var point = new esri.geometry.Point(stations[i].position.lng, stations[i].position.lat);
                            //
                            map.graphics.add(new Graphic(point, symbol, stations[i]));
                            stationsGraphicLayer.add(new esri.Graphic(point, symbol, stations[i]));
                        }
                    }).done(function() {
                        // to fix InfoWindow / check issue #1
                        map.infoWindow.hide();
                        map.graphics.clear();
                        // end issue #1 fix
                        var data = [];
                        if (stationsGraphicLayer && stationsGraphicLayer.graphics && stationsGraphicLayer.graphics.length > 0) {
                            data = stationsGraphicLayer.graphics;
                        }                        
                        var zoomExtent = graphicsUtils.graphicsExtent(data);
                        map.setExtent(zoomExtent);
                    }).fail(function() {
                        console.log("error loading stations");
                    }).always(function() {
                        console.log("loading stations : finished!");
                    });
                }

            },


            /**
             * test evt wiring
             */
            divClick: function() {
                dom.byId("operation").innerHTML = dom.byId("operation").innerHTML + " Click!";
            },
            /**
             * Mobile device location
             */

            locateDevice: function() {
                if (!shareLocation) {
                    if (navigator.geolocation) {
                        //$.mobile.showPageLoadingMsg();    
                        //navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
                        // start watching position
                        watchId = navigator.geolocation.watchPosition(showLocation, locationError);
                        // swap image source
                        swapImageGeolocation();
                        shareLocation = true;
                    } else {
                        alert("Current location is not available");
                    }
                } else {
                    // stop watching position
                    navigator.geolocation.clearWatch(watchId);
                    // swap image source
                    swapImageGeolocation();
                    // remove graphic
                    map.graphics.remove(deviceGraphic);
                    shareLocation = false;
                    //map.refresh();
                }
                console.log("shareLocation " + shareLocation);

                function swapImageGeolocation() {
                    var img = document.getElementById("locateimage");
                    if (shareLocation) {
                        img.src = offImg;
                    } else {
                        img.src = onImg;
                    }
                    //img.src = img.src == offImg ? onImg : offImg;
                }

                /**
                 * zoom to mobile Device Location
                 */

                function zoomToLocation(position) {
                    //$.mobile.hidePageLoadingMsg(); //true hides the dialog
                    var pt = webMercatorUtils.geographicToWebMercator(new Point(position.coords.longitude, position.coords.latitude));
                    map.centerAndZoom(pt, 13);
                    //uncomment to add a graphic at the current location
                    var symbol = new PictureMarkerSymbol("./img/bluedot.png", 40, 40);
                    deviceGraphic = new Graphic(pt, symbol);
                    map.graphics.add(deviceGraphic);

                }

                /**
                 * mobile location found
                 */

                function showLocation(location) {
                    if (location.coords.accuracy <= 25000) {
                        // the reading is accurate, do something
                        if (devicePt) {
                            map.graphics.remove(devicePt);
                        }
                        var pt = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude, location.coords.latitude));
                        map.centerAt(pt);
                        var symbol = new PictureMarkerSymbol("./img/bluedot.png", 40, 40);
                        deviceGraphic = new Graphic(pt, symbol);
                        map.graphics.add(deviceGraphic);
                        devicePt = deviceGraphic;
                    } else {
                        // reading is not accurate enough, do something else
                        // maybe nothing !
                    }
                }

                /**
                 * location error
                 */

                function locationError(error) {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            alert("Location not provided");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            alert("Current location not available");
                            break;
                        case error.TIMEOUT:
                            alert("Timeout");
                            break;
                        default:
                            alert("unknown error");
                            break;
                    }
                }

            }



        };
    });
