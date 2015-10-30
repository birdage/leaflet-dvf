$(document).ready(function() {
	var map;

	var resize = function () {
		var $map = $('#map');

		$map.height($(window).height() - $('div.navbar').outerHeight());

		if (map) {
			map.invalidateSize();
		}
	};

	$(window).on('resize', function () {
		resize();
	});

	resize();

	map = L.map('map').setView([36.1866956,-75.7465267], 16);

	var baseLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'examples.map-i875mjb7'
	})

	/*
	var baseLayer = new L.StamenTileLayer('toner', {
		detectRetina: true
	});
	*/
	baseLayer.addTo(map);

	var layerControl = L.control.layers({
		'Base Layer': baseLayer
	}).addTo(map);

	var marker;
	var layer;
	var radialLayerGroup;


	map.on('zoomend', function() {		
		/*
		if (map.getZoom() < 15) {
			radialLayerGroup.clearLayers()						
        	console.log("less than 15:",map.getZoom())
	    } else {
	       radialLayerGroup.clearLayers()			
	       addTempMarkers(map.getZoom());
	       console.log("greater than 15:",15)
	    }*/
	});

	var createLayerGroup = function (name) {
		var layerGroup = new L.LayerGroup();
		map.addLayer(layerGroup);
		layerControl.addOverlay(layerGroup, name);
		return layerGroup;
	};

	var addMarkers = function (layerGroupName, zoomLevel, markerFunction, text) {

		radialLayerGroup = createLayerGroup(layerGroupName);
		
		console.log("ZL:",zoomLevel)
		
		url = 'http://usace.asa.rocks/services/stations/?date=2011-10-10T14:17:00Z'

		$.ajax({
		  url: url,
		  dataType:"jsonp", 		  		  
		})
		.done(function(data) {
		 	console.log("DONE!",data)

		 	var station_list = ['awac01','awac02','awac03','awac04','awac05','adop01','adop02']
			
		 	var lat_lon = []
		 	var angle_list = []
		 	var mag_list = []
		 	
		 	


			$.each(station_list, function( i, station ) {

				//generate the base options for a station
				var meterMarkerOptions = generateBaseOptions(generateTooltip(),zoomLevel);


				//generate the ll
				var ll = [data[station]['lat'],data[station]['lon']]	

				var lat_lon = new L.LatLng(ll[0], ll[1])

				//check for data
				isData = false

				var var_list = Object.keys(data[station]['variables'])
				//waves
				if ($.inArray( 'waveHs', var_list ) > -1){
					var temp_angle = (data[station]['variables']['waveDp']['value'])

					var hs = (data[station]['variables']['waveHs']['value'])
					var fp = (data[station]['variables']['waveFp']['value'])

					meterMarkerOptions = updateStructure(meterMarkerOptions,'waveHs','Wave Height',temp_angle,hs,"m");
					meterMarkerOptions = updateStructure(meterMarkerOptions,'waveFp','Wave Period',temp_angle,fp,"s");					
				}
				//currents
				if ($.inArray( 'currentSpeed', var_list ) > -1){
					var temp_angle = (data[station]['variables']['currentDirection']['value'])	

					var spd = (data[station]['variables']['currentSpeed']['value'])				
					meterMarkerOptions = updateStructure(meterMarkerOptions,'currentSpeed','Current Speed',temp_angle,spd,"knots");					
				}

				if (isData && angles.length > 0){
					angle_list.push(angles)
					angle_list.push(angles)
					lat_lon.push(ll)
				}

				radial_layer = markerFunction(lat_lon, meterMarkerOptions)			
				radialLayerGroup.addLayer(radial_layer);
			});		
	
		});
	};

	var generateTooltip = function(){
		tt = '<div class="panel panel-info">'+
				  '<div class="panel-heading">'+
				    '<h3 class="panel-title">Station info</h3>'+
				  '</div>'+
				  '<div class="panel-body">'+
				    'Station content'+
				  '</div>'+
			  '</div>'

		tt+= '<div class="progress">'
	  		tt+= '<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 40%">'
	    		tt+= '<span class="sr-only">40% Complete (success)</span>40%'
	  		tt+= '</div>'
		tt+= '</div>'

		tt+= '<div class="col-sm-8 panel" style="margin-top:10px">'
		tt+= 'Wave Height:'
		tt+= '</div>'
		tt+= '<div class="col-sm-2 panel">'
			tt+= '<span class="fa-stack fa-lg">'
			tt+= '  <i class="fa fa-circle-thin fa-stack-2x"></i>'
			tt+= '  <i class="fa fa-stack-1x">12</i>'
			tt+= '</span>'
			tt+= '</span>'
		tt+= '</div>'
		
		
		return tt
	};

	var updateStructure = function (structure, varName, displayName, angle,value, units) {

		var minHue = 120;
		var maxHue = 0;	
		var maxValue = 20;

		structure.angle[varName] = parseFloat(angle);
		structure.dir[varName] = (360/10);
		structure.data[varName] = value;
		structure.chartOptions[varName] = generateChartOptions(varName,units);
		structure.displayOptions[varName] = generateDisplayOptions(minHue,maxHue,maxValue)

		return structure
	};

	var updateAngleDirection = function (input_angle) {
		var temp = input_angle;				
		temp -=90;
		if (temp < 0){
			temp = 360-90;
		}		
		return temp
	};

	var generateChartOptions = function (displayName, units) {
		return	{
					displayName: displayName,
					displayText: function (value_mag) {
						return value_mag.toFixed(1)+ " ("+units+")";
					},
					color: 'hsl(240,100%,55%)',
					fillColor: 'rgb(240,80%,55%)',
					maxValue: 360,
					minValue: 0
			}
	};

	var generateDisplayOptions = function (minHue,maxHue,maxValue) {
		return {
			color: 	new L.HSLHueFunction(new L.Point(0,minHue), 
					new L.Point(maxValue,maxHue), {
							outputSaturation: '100%', outputLuminosity: '25%'
						}),
			fillColor: new L.HSLHueFunction(new L.Point(0,minHue), 
					   new L.Point(maxValue,maxHue), {
							outputSaturation: '100%', outputLuminosity: '50%'
						})
		}
	};

	var generateBaseOptions = function (popupText,zoomLevel) {
		var numFields = 2
		var percent = (zoomLevel/16)
		var radius = (10*(numFields))*percent

		return {	
				angle:{},
				dir:{},
				data:{},
				chartOptions:{},
				displayOptions:{},
				backgroundStyle: {
					fill: true,
					fillColor: '#707070',   ///backgound fill color
					fillOpacity: 0.2,
					opacity: 0.8,
					color: '#505050'
				},
				popupText:popupText,																						
				gradient:1,				
				fillOpacity: 1,			
				opacity: 1,
				weight: 1,			
				outsideCircle: true,		
				numFields: 2,
				offset:2,
				radius: radius,          //size
				barThickness: 10,   //bar thickness
				maxDegrees: 360,   //highest deg
				rotation: 0,    //initial angle
				numSegments: 10  //number of segs around the circle
			};

	};

	var addTempMarkers = function(zoomLevel){		
		addMarkers('Radial Meter Markers', zoomLevel,function (latlng, temp_meterMarkerOptions) {			
			return new L.RadialDirMarker(latlng, temp_meterMarkerOptions);
		});
	}

	addTempMarkers(16);	
});
