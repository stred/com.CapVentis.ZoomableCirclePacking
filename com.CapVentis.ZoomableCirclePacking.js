/**
 * com.CapVentis.ZoomableCirclePacking
 * Implementation of d3 Circle Packing visualization for Qlik Sense
 * Based on d3 sample code from Mike Bostock: http://bl.ocks.org/mbostock/7607535
 * @creator @owner Stephen Redmond
 * www.capventis.com 
 */
var _zoom_object;

define( ["jquery", "qlik", "text!./style.css", "./d3.min", "./com.CapVentis.d3.utils"], function ( $, qlik, cssContent ) { 

	$("<style>").html(cssContent).appendTo("head");
	return {
		initialProperties: {
			version: 1.0,
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 6,
					qHeight: 1000
				}]
			}
		},
		//property panel
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 1,
					max: 5
				},
				measures: {
					uses: "measures",
					min: 1,
					max: 1
				},
				sorting: {
					uses: "sorting"
				},
				settings: {
					uses: "settings"
				}
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},

		paint: function ( $element, layout ) {
			
			var app=qlik.currApp();
			
			// Assign variables
			var self = this, 
				dimensions = layout.qHyperCube.qDimensionInfo,
				qData = layout.qHyperCube.qDataPages[0].qMatrix,
				cubeWidth=layout.qHyperCube.qSize.qcx;

			// Get the chart ID from the Sense document for this control
			var divName = 'div_' + layout.qInfo.qId;

			// Calculate the height and width that user has drawn the extension object
            var vw = $element.width();
            var vh = $element.height();

			// Replace the QS element with a new Div
			$element.html( '<div id="' + divName + '"></div>' );

			// Build the JSON hierarchy from the data cube
			var root=buildJSON(qData, cubeWidth);
			
			// Use QS color range 
			var palette = [
			 '#4477aa',
			 '#117733',
			 '#ddcc77',
			 '#cc6677',
			 '#7db8da',
			 '#b6d7ea',
			 '#b0afae',
			 '#7b7a78',
			 '#545352',
			 '#46c646',
			 '#f93f17',
			 '#ffcf02',
			 '#276e27'
			];						

			// Build the chart using the d3 library
			
			var margin = 20,
				diameter = vw > vh  ? vh : vw;			
			
			var format = d3.format(",d");
			//var	color = d3.scale.ordinal().range(palette); //category20c();
			var color = d3.scale.linear()
				.domain([-1, 5])
				.range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
				.interpolate(d3.interpolateHcl);
			
			
			var pack = d3.layout.pack()
				.padding(2)
				.size([diameter - margin, diameter - margin])
				.value(function(d) { return d.size; })	

			var svg = d3.select("#"+divName).append("svg")
				.attr("width", diameter)
				.attr("height", diameter)
				.append("g")
				.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");				

			var focus = root,
				nodes = pack.nodes(root),
				view;
				
			var circle = svg.selectAll("circle")
				.data(nodes)
				.enter().append("circle")
				.attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
				.style("fill", function(d) { return color(d.depth); }) //d.children ? color(d.depth) : null; })
				.on("click", function(d) { 
					if(d.Id != '0')
					{
						var value = [], dim = parseInt( d.Id.split('.')[0], 10 );
						value.push(parseInt( d.Id.split('.')[1], 10 ));
						console.info('Click: ' + value + ', ' + dim);
						self.selectValues( dim, value, true );
						console.info('Selected: ' + value);
						if (focus !== d) zoom(d), d3.event.stopPropagation();
					}
				});

			
			var text = svg.selectAll("text")
				.data(nodes)
				.enter().append("text")
				.attr("class", "label")
				.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
				.style("display", function(d) { return d.parent === root ? null : "none"; })
				.text(function(d) { return d.name; });
			
			
			var node = svg.selectAll("circle,text");

			node.append("title")
			  .text(function(d) { var vSize=(d.size === undefined) ? '' : ' : ' + d.size.toLocaleString(undefined,{maximumFractionDigits: 2}); return d.name + vSize });  // locale string undefined to use local
			
			
			d3.select("body")
			  .style("background", color(-1))
			  .on("click", function() { zoom(root); });
			
			zoomTo([root.x, root.y, root.r * 2 + margin]);

			function zoom(d) {
			var focus0 = focus; focus = d;

			var vDuration;
			if(d3.event)
				vDuration=d3.event.altKey ? 7500 : 750;
			else
				vDuration=750;
			var transition = d3.transition()
				.duration(vDuration)
				.tween("zoom", function(d) {
					var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
					return function(t) { zoomTo(i(t)); };
				});

			transition.selectAll("text")
				.filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
				.style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
				.each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
				.each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
			}

			function zoomTo(v) {
				var k = diameter / v[2]; view = v;
				node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
				circle.attr("r", function(d) { return d.r * k; });
			}
			
		}
	};

} );


