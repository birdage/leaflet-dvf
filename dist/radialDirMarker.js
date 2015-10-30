/*
 * 
 */
L.RadialDirMarker = L.ChartMarker.extend({
	initialize: function (centerLatLng, options) {
		L.Util.setOptions(this, options);
		this.centerLatLng = centerLatLng;
		L.ChartMarker.prototype.initialize.call(this, centerLatLng, options);		
	},

	options: {
		weight:	1,
		opacity: 1,
		color: '#000',
		fill: true,
		radius: 10,
		rotation: 180.0,
		numberOfSides: 30,
		offset: 2,
		barThickness: 5,
		maxDegrees: 180.0,
		iconSize: new L.Point(50, 40),
		backgroundStyle: {
			fill: true,
			fillColor: '#707070',   ///backgound fill color
			fillOpacity: 0.2,
			opacity: 0.8,
			color: '#505050'
		}
	},

	_loadComponents: function() {

		var angle_list = this.options.angle

		var value, minValue, maxValue;
		
		

		var numSegments = this.options.numSegments || 10;
		var maxDegrees = this.options.maxDegrees || 360.0;			
		var angle_offset = (this.options.maxDegrees/numSegments)/2;


			
		
		var options = this.options;
		var lastRadiusX = this.options.radiusX || this.options.radius;
		var lastRadiusY = this.options.radiusY || this.options.radius;

		var data = this.options.data;
		var dir = this.options.dir;
		var chartOptions = this.options.chartOptions;
		var chartOption;
		var barThickness = this.options.barThickness || 4;
		var fillOpacity = this.options.fillOpacity
		var gradient = this.options.gradient
		
		var offset = this.options.offset

		var radius_spacing = this.options.radiusSpacing
		var angleDelta = maxDegrees / numSegments;
		var displayOptions;		
		

		console.log(lastRadiusX,lastRadiusY)

		// Iterate through the data values
		var field_count = 0
		for (var key in data) {	
			var startAngle = angle_list[key];
			console.log("st angle",startAngle)
			startAngle = startAngle-angle_offset;


			var lastAngle = startAngle;
			value_mag = parseFloat(data[key]);
			value_dir = parseFloat(dir[key]);

			chartOption = chartOptions[key];
			displayOptions = this.options.displayOptions ? this.options.displayOptions[key] : {};
			
			minValue = chartOption.minValue || 0;
			maxValue = chartOption.maxValue || 10;			

			var range = maxValue - minValue;
			var angle = (maxDegrees / range) * (value_dir - minValue);
			var endAngle = startAngle + angle;
			var maxAngle = startAngle + maxDegrees;
			var evalFunction = new L.LinearFunction(new L.Point(startAngle, value_mag), new L.Point(startAngle, value_mag));
			var delta, evalValue;
			


			var count = 0;
			while (count < 2) {	
				options.fillOpacity = fillOpacity;
				options.gradient = gradient;						
				options.fillColor = chartOption.fillColor;	
				options.startAngle = lastAngle;				
				delta = Math.min(angleDelta, endAngle - lastAngle);				
				options.endAngle = lastAngle + delta;				
				options.radiusX = lastRadiusX;
				options.radiusY = lastRadiusY;
				options.barThickness = barThickness;
				options.rotation = 0;
				options.key = key;
				options.value = value_mag;
				options.displayName = chartOption.displayName;
				options.displayText = chartOption.displayText;

				evalValue = evalFunction.evaluate(lastAngle + delta);
				
				for (var displayKey in displayOptions) {					
					options[displayKey] = displayOptions[displayKey].evaluate ? displayOptions[displayKey].evaluate(evalValue) : displayOptions[displayKey];
				}																		

				bar = new L.RadialBarMarker(this._latlng, options);
				this._bindMouseEvents(bar);
				
				this.addLayer(bar);
				
				lastAngle += delta;
				count+=1;
				field_count+=1									
			}						

			// Add a background
			if (this.options.outsideCircle && this.options.backgroundStyle) {
				if (lastAngle < maxAngle) {
					delta = maxAngle - lastAngle;
				
					options.endAngle = lastAngle + delta;
					options.radiusX = lastRadiusX;
					options.radiusY = lastRadiusY;
					options.barThickness = barThickness;
					options.rotation = 0;
					options.key = key;
					options.value = value_dir;
					options.displayName = chartOption.displayName;
					options.displayText = chartOption.displayText;
					
					options.fillColor = null;
					options.fill = false;
					options.gradient = false;
					
					for (var property in this.options.backgroundStyle) {
						options[property] = this.options.backgroundStyle[property];
					}
					
					evalValue = evalFunction.evaluate(lastAngle + delta);
				
					bar = new L.RadialBarMarker(this._latlng, options);

					this.addLayer(bar);
				}
			}
			lastRadiusX += barThickness + offset;
			lastRadiusY += barThickness + offset;	
			

			//add the center marker
			var circle = L.circle(this.centerLatLng, this.options.radius/4, {
			    color: 'white',
			    fillColor: 'white',
			    fillOpacity: 1
			})


			circle.bindPopup(this.options.popupText,{
		        closeButton: true,
		        minWidth: 320
		    });
			this.addLayer(circle)
		}
	}
});