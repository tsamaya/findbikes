var contracts_url = "./contracts.php";
var stations_url = "./stations.php?contract="
var map, symbol, locator, handle, deviceGraphic, devicePt, watchId, shareLocation ;

dojo.require("esri.map");
dojo.require("esri.symbol");
dojo.require("esri.graphic");
dojo.require("esri.geometry");
dojo.require("esri.dijit.Geocoder");
dojo.require("esri.dijit.InfoWindowLite");

/**
 * Init map, geocoder, locator, et JDDecaux contracts dropdown box
 */
function init() {
	console.log("init");

	// create the station symbol
	symbol = new esri.symbol.PictureMarkerSymbol({"angle":0,
		"type":"esriPMS",
		"url":"img/velov.gif",
		"contentType":"image/gif","width":25,"height":23,"xoffset":0,"yoffset":0});
	
	// create the map
	map = new esri.Map("map",{
 		basemap:"streets",
  		center:[2.3,46.6], //long, lat un peu au centre de la France :)
  		zoom:6,
  		sliderStyle:"small"
	});

    // create the geocoder
    geocoder = new esri.dijit.Geocoder({ 
	      map: map 
	    }, "search" );
    geocoder.startup();

    locator = new esri.tasks.Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    dojo.connect(locator, "onAddressToLocationsComplete", showLocatorResults);

	// create the info window
    var infoWindowLite = new esri.dijit.InfoWindowLite(null, dojo.create("div", null, map.root));
    infoWindowLite.startup();
    map.setInfoWindow(infoWindowLite);

    // init data
    getContracts(); 

	// on load !
	dojo.connect(map, "onLoad", function() {

	});
}

function getContracts() {
	$.get(contracts_url, function(data) {
		var contractsJSON = JSON.parse(data);
		if( contractsJSON ) {
	        $('#contractsList').append($('<option/>').attr("value", "").text("Sélectionner une ville"));
		    $.each(contractsJSON, function(i, option) {
		        $('#contractsList').append($('<option/>').attr("value", option.name).text(option.name + " : " + option.commercial_name));
	    	});
		}
	});
}

// deprec
function fillContracts(data) {
	if( data ) {
	    $.each(data, function(i, option) {
	        $('#contractsList').append($('<option/>').attr("value", option.name).text(option.name + " : " + option.commercial_name));
    	});
	}
}

/**
 * selection d'un element de la liste
 */
function selectContract(contractIdx) {
	console.log("param est "+contractIdx);
	var x=document.getElementById("contractsList");
	var contractName = x.options[contractIdx].value
	console.log(contractName);
	locate(contractName);
	map.graphics.clear();
    getStations(contractName);
}

/**
 * localisation sur une ville
 */
function locate(contract) {
	var address = {"SingleLine":contract};
	locator.outSpatialReference= map.spatialReference;
	var options = {
	  address:address,
	  outFields:["Loc_name"]
	}
	locator.addressToLocations(options);
}

/**
  * resultats du locator
  */
function showLocatorResults(candidates) {
	var candidate, geom;

	dojo.every(candidates,function(candidate){
		console.log(candidate.score);
		if (candidate.score > 80) {
			console.log(candidate.location);
			var attributes = { address: candidate.address, score:candidate.score, locatorName:candidate.attributes.Loc_name };   
			geom = candidate.location;
			return false; //break out of loop after one candidate with score greater than 80 is found.
		}
	});
	if(geom !== undefined){
		map.centerAndZoom(geom,12);
	}
}

/**
 * récuperation des stations
 */
function getStations(contractName) {
	console.log("Chargement des stations du contrat " + contractName);
	$.get(stations_url+contractName, function(data) {
		var stations = JSON.parse(data);
		for (var i = 0, len = stations.length; i < len; i++) {
			var point = new esri.geometry.Point(stations[i].position.lng,stations[i].position.lat);
			map.graphics.add(new esri.Graphic(point, symbol, stations[i]));
		}
	});
	handle = dojo.connect(map.graphics, "onClick", onClick);
}

/**
 * station : on click
 */
function onClick(evt) {
	if(null != evt.graphic.attributes) {
		var station = evt.graphic.attributes;
 		map.infoWindow.setTitle("<b>"+station.name+"</b>");
 		var dateMaj = new Date(station.last_update);
		map.infoWindow.setContent("<b>"+station.address+"</b>"+
								  "<br />Statut : "+station.status+
								  "<br />points d'attache opérationnels : "+station.bike_stands+
								  "<br />nombre de points d'attache disponibles : "+station.available_bike_stands+
								  "<br />nombre de vélos disponibles : "+station.available_bikes+
								  "<br />CB : "+station.banking+
								  "<br /><i>Mise à jour : "+ dateMaj.toLocaleDateString()+" "+dateMaj.toLocaleTimeString()+
								  "</i>");
		map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
	}
}

function locateDevice() {
	if( !shareLocation) {			
		if (navigator.geolocation) {
			//$.mobile.showPageLoadingMsg();	
			//navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
			watchId = navigator.geolocation.watchPosition(showLocation, locationError);
			shareLocation = true;
		} else {
			alert("Current location is not available");
		}
		// TODO: swapimage()
	} else {
		navigator.geolocation.clearWatch(watchId);
		shareLocation = false;
		// TODO: swapimage()
		map.graphics.remove(deviceGraphic);
		map.refresh();
	}
	//alert(shareLocation);
}

function zoomToLocation(position) {
	//$.mobile.hidePageLoadingMsg(); //true hides the dialog
	var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(position.coords.longitude, position.coords.latitude));
	map.centerAndZoom(pt, 13);
	//uncomment to add a graphic at the current location
	var symbol = new esri.symbol.PictureMarkerSymbol("./img/bluedot.png",40,40);
	deviceGraphic = new esri.Graphic(pt,symbol);
	map.graphics.add(deviceGraphic);

}

function showLocation(location) {
	if (location.coords.accuracy <= 500) {
	 	// the reading is accurate, do something
		if( devicePt ) {
			map.graphics.remove(devicePt);
		}	
		var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(location.coords.longitude, location.coords.latitude));
	    map.centerAt(pt);
		var symbol = new esri.symbol.PictureMarkerSymbol("./img/bluedot.png",40,40);
		deviceGraphic = new esri.Graphic(pt,symbol);
		map.graphics.add(deviceGraphic);
	} else {
	 // reading is not accurate enough, do something else
	 // maybe nothing !
	}
}

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

dojo.ready(init);