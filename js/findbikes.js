var contracts_url = "./contracts.php";
var stations_url = "./stations.php?contract="
//var map, symbol, locator, handle, deviceGraphic, devicePt, watchId, shareLocation, stationsGraphicLayer;
var map, symbol, handle, deviceGraphic, devicePt, watchId, shareLocation, stationsGraphicLayer;
var onImg = "./img/whereami_on.png";
var offImg = "./img/whereami_off.png";

dojo.require("esri");
dojo.require("esri.map");
dojo.require("esri.symbol");
dojo.require("esri.graphic");
dojo.require("esri.geometry");
dojo.require("esri.dijit.Geocoder");
dojo.require("esri.InfoTemplate");
dojo.require("esri.dijit.InfoWindowLite");
dojo.require("esri.layers.GraphicsLayer");
dojo.require("dojo.date.locale");
/**
 * Init map, geocoder, locator, et JDDecaux contracts dropdown box
 */

function init() {
	console.log("init");

	// create the station symbol
	symbol = new esri.symbol.PictureMarkerSymbol({
		"angle": 0,
		"type": "esriPMS",
		"url": "img/velov.gif",
		"contentType": "image/gif",
		"width": 25,
		"height": 23,
		"xoffset": 0,
		"yoffset": 0
	});

	// create the map
	map = new esri.Map("map", {
		basemap: "streets",
		center: [2.3, 46.6], //long, lat un peu au centre de la France :)
		zoom: 6,
		sliderStyle: "small"
	});

	// create the geocoder
	geocoder = new esri.dijit.Geocoder({
		map: map
	}, "search");
	geocoder.startup();

	//locator = new esri.tasks.Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
	//dojo.connect(locator, "onAddressToLocationsComplete", showLocatorResults);

	// create the info window
	var infoWindowLite = new esri.dijit.InfoWindowLite(null, dojo.create("div", null, map.root));
	infoWindowLite.startup();
	map.setInfoWindow(infoWindowLite);

	var template = new esri.InfoTemplate();
	template.setTitle("<b>${name}</b>");
	template.setContent("<b>${address}</b>" +
		"<br />Statut : ${status}" +
		"<br />points d'attache opérationnels : ${bike_stands}" +
		"<br />nombre de points d'attache disponibles : ${available_bike_stands}" +
		"<br />nombre de vélos disponibles : ${available_bikes}" +
		"<br />CB : ${banking}" +
		"<br /><i>Mise à jour : ${last_update:DateFormat}</i>"
	);


	// Create graphic layer
	stationsGraphicLayer = new esri.layers.GraphicsLayer();
	stationsGraphicLayer.infoTemplate = template;
	map.addLayer(stationsGraphicLayer);
	//stationsGraphicLayer.setInfoWindow(infoWindowLite);

	// init data
	getContracts();

	// on load !
	dojo.connect(map, "onLoad", function() {

	});
}

function formatDate(value, key, data) {
	var dateMaj = new Date(data.last_update);
	return dateMaj.toLocaleDateString() + " " + dateMaj.toLocaleTimeString();
}

/**
 * Get JCDecaux contracts
 */

function getContracts() {
	$.get(contracts_url, function(data) {
		var contractsJSON = JSON.parse(data);
		if (contractsJSON) {
			$('#contractsList').append($('<option/>').attr("value", "").text("Sélectionner une ville"));
			$.each(contractsJSON, function(i, option) {
				$('#contractsList').append($('<option/>').attr("value", option.name).text(option.name + " : " + option.commercial_name));
			});
		}
	});
}

// @deprecated

function fillContracts(data) {
	if (data) {
		$.each(data, function(i, option) {
			$('#contractsList').append($('<option/>').attr("value", option.name).text(option.name + " : " + option.commercial_name));
		});
	}
}

/**
 * List of contract selection
 */

function selectContract(contractIdx) {
	console.log("param est " + contractIdx);
	var x = document.getElementById("contractsList");
	var contractName = x.options[contractIdx].value
	console.log(contractName);
	//locate(contractName);
	//map.graphics.clear();
	stationsGraphicLayer.clear();
	getStations(contractName);
}

/**
 * City locator
 * @deprecated
 */

function locate(contract) {
	var address = {
		"SingleLine": contract
	};
	locator.outSpatialReference = map.spatialReference;
	var options = {
		address: address,
		outFields: ["Loc_name"]
	}
	locator.addressToLocations(options);
}

/**
 * locator results
 */

function showLocatorResults(candidates) {
	var candidate, geom;

	dojo.every(candidates, function(candidate) {
		console.log(candidate.score);
		if (candidate.score > 80) {
			console.log(candidate.location);
			var attributes = {
				address: candidate.address,
				score: candidate.score,
				locatorName: candidate.attributes.Loc_name
			};
			geom = candidate.location;
			return false; //break out of loop after one candidate with score greater than 80 is found.
		}
	});
	if (geom !== undefined) {
		map.centerAndZoom(geom, 12);
	}
}

/**
 * Get bike stations
 */

function getStations(contractName) {
	console.log("Chargement des stations du contrat " + contractName);
	$.get(stations_url + contractName, function(data) {
		var stations = JSON.parse(data);
		for (var i = 0, len = stations.length; i < len; i++) {
			var point = new esri.geometry.Point(stations[i].position.lng, stations[i].position.lat);
			//map.graphics.add(new esri.Graphic(point, symbol, stations[i]));
			stationsGraphicLayer.add(new esri.Graphic(point, symbol, stations[i]));
		}
	}).done(function() {
		var data = [];
		if (stationsGraphicLayer && stationsGraphicLayer.graphics && stationsGraphicLayer.graphics.length > 0) {
			data = stationsGraphicLayer.graphics;
		}
		var zoomExtent = esri.graphicsExtent(data);
		map.setExtent(zoomExtent);
	}).fail(function() {
		console.log("error loading stations");
	}).always(function() {
		console.log("loading stations : finished!");
		//handle = dojo.connect(map.graphics, "onClick", onClick);
		//handle = dojo.connect(stationsGraphicLayer.graphics, "onClick", onClick);
	});
}

/**
 * station : on click
 * @deprecated
 */

function onClick(evt) {
	console.log('click' + evt);
	if (null != evt.graphic.attributes) {
		var station = evt.graphic.attributes;
		map.infoWindow.setTitle("<b>" + station.name + "</b>");
		var dateMaj = new Date(station.last_update);
		map.infoWindow.setContent("<b>" + station.address + "</b>" +
			"<br />Statut : " + station.status +
			"<br />points d'attache opérationnels : " + station.bike_stands +
			"<br />nombre de points d'attache disponibles : " + station.available_bike_stands +
			"<br />nombre de vélos disponibles : " + station.available_bikes +
			"<br />CB : " + station.banking +
			"<br /><i>Mise à jour : " + dateMaj.toLocaleDateString() + " " + dateMaj.toLocaleTimeString() +
			"</i>");
		map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
	}
}

/**
 * Mobile device location
 */

function locateDevice() {
	if (!shareLocation) {
		if (navigator.geolocation) {
			//$.mobile.showPageLoadingMsg();	
			//navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
			// start watching position
			watchId = navigator.geolocation.watchPosition(showLocation, locationError);
			shareLocation = true;
			// swap image source
			this.src = this.src == offImg ? onImg : offImg;
		} else {
			alert("Current location is not available");
		}
	} else {
		// stop watching position
		navigator.geolocation.clearWatch(watchId);
		shareLocation = false;
		// swap image source
		this.src = this.src == offImg ? onImg : offImg;
		// remove graphic
		map.graphics.remove(deviceGraphic);
		map.refresh();
	}
	//alert(shareLocation);
}

/**
 * zoom to mobile Device Location
 */

function zoomToLocation(position) {
	//$.mobile.hidePageLoadingMsg(); //true hides the dialog
	var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(position.coords.longitude, position.coords.latitude));
	map.centerAndZoom(pt, 13);
	//uncomment to add a graphic at the current location
	var symbol = new esri.symbol.PictureMarkerSymbol("./img/bluedot.png", 40, 40);
	deviceGraphic = new esri.Graphic(pt, symbol);
	map.graphics.add(deviceGraphic);

}

/**
 * mobile location found
 */

function showLocation(location) {
	if (location.coords.accuracy <= 500) {
		// the reading is accurate, do something
		if (devicePt) {
			map.graphics.remove(devicePt);
		}
		var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(location.coords.longitude, location.coords.latitude));
		map.centerAt(pt);
		var symbol = new esri.symbol.PictureMarkerSymbol("./img/bluedot.png", 40, 40);
		deviceGraphic = new esri.Graphic(pt, symbol);
		map.graphics.add(deviceGraphic);
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

dojo.ready(init);