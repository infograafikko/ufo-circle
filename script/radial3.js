
  //Global variables
  var parseDate = d3.timeParse("%Y-%m-%d");
  var rotation = 0;
  var selectedYear = 2016;
  var selectedFreq;
  var switcher = false;


  //Set angle ranges
  var angle = d3.scaleLinear()
  	.range([-176,176]);

  var margin = {
    	top: 70,
    	right: 20,
    	bottom: 120,
    	left: 20
    };

  var width = 575 - margin.left - margin.right ;
  var height = 667 - margin.top - margin.bottom;

  // Set the minimum inner radius and max outer radius of the chart
  var outerRadius = Math.min(width, height, 500) / 2,
  	innerRadius = outerRadius * 0.4;

    //Scale for the heights of the bar, not starting at zero to give the bars an initial offset outwards
    var barScale = d3.scaleLinear()
    	.range([innerRadius, outerRadius]);

  var firstYear = 1970

  var y = d3.scaleLinear()
    .rangeRound([height/4, 0])

  var x = d3.scaleLinear()
    .range([10, 290])

  var svg = d3.select("body")
  	.append("svg")
  	.attr("height", height)
  	.attr("width", width)
  	.append("g")
    .attr("class", "plot")
  	.attr("transform", "translate(" + width/2 + "," + height/2 + ")")




  d3.queue()
    .defer(d3.tsv, "data/ufotietokanta24122016.tsv")
    .await(ready)

  function ready (error, data) {

    	data.forEach(function(d, i) {
    		d.pvm = parseDate(d["Päivämäärä"]),
    		d.paikka = d["Kunta tai kaupunki"],
    		d.year = d.pvm.getFullYear(),
    		d.month = d.pvm.getMonth();
      })

      data = data.filter(function(d) { return d.year >= firstYear; })

      for (j = firstYear; j < 2017; j++) {

           data.filter(function(d) { return d.year == j}).forEach(function(k, i) {
             k.placement = i+1;
           })

    	}




      // Save frequencies of each yearly observations to map
      var yearEntries = [];
      for (j = firstYear; j < 2017; j++) {
        var yearMax = d3.max(data.filter(function(d) { return d.year == j}), function(d) { return d.placement; })
        var entry = d3.map()
          .set("freq", yearMax)
          .set("year", j)

        yearEntries.push(entry)
      }

      console.log(data)

      //Based on entries calculate domains for bar chart
      y.domain([0, d3.max(yearEntries, function(d) { return d.$freq})])
      x.domain([d3.max(yearEntries, function(d) { return d.$year }), d3.min(yearEntries, function(d) { return d.$year})])
      angle.domain([d3.max(yearEntries, function(d) { return d.$year }), d3.min(yearEntries, function(d) { return d.$year})])
      barScale.domain([0, d3.max(yearEntries, function(d) { return d.$freq})])


      //Make bar chart

      // Wrapper for the bars and to position it downwards
      var barWrapper = svg.append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")");

        //Draw gridlines below the bars
        var axes = barWrapper.selectAll(".gridCircles")
            .data([-5])
            .enter().append("g");

            //Draw the circles
            axes.append("circle")
              .attr("class", "axisCircles")
              .attr("r", function(d) { return barScale(d); })



      var updateBar = barWrapper.selectAll(".ufobar")
        .data(yearEntries);

      var enterBar = updateBar
          .enter()
          .append("rect")
          .attr("class", "ufobar")
          .attr("transform", function(d,i) { return "rotate(" + angle(d.$year) + ")"})
          .attr("x", function(d) { return -0.75; })
          .attr("y", function(d) { return 90; })
          .attr("width", 10)
          .attr("height", function(d) { return barScale(d.$freq) - 95.5; })
          .attr("fill", "white");

          //merge selected filter as solid black
          updateBar
            .merge(enterBar)
            .filter(function(d) { return d.$year == selectedYear; })
            .attr("fill", "#21F893")

          d3.selectAll(".rotation")
            .on("click", function() {
              if (d3.select(this).classed("left")) {
                switcher = true;
                rotationFunction()
              } else {
                switcher = false;
                rotationFunction()
              }

            })

            //function that allows the barplot to rotate

            function rotationFunction() {

              // Rotate circle graph and make changes to global variables
              if (switcher) {
                rotation = rotation - 7.66;
                if (selectedYear == 1970) {
                  selectedYear = 2016;
                } else {
                selectedYear = selectedYear - 1;
                }

              } else {
                rotation = rotation + 7.66;
                if (selectedYear == 2016) {
                  selectedYear = 1970;
                } else {
                selectedYear = selectedYear + 1;
                }
              }


              //Rotate barchart
              barWrapper
              .transition()
              .duration(500)
              .attr("transform", function(d,i) { return "rotate(" + rotation + ")"})

              //Update the fill color for bar chart
              updateBar
                .merge(enterBar)
                .attr("fill", "white")
                .filter(function(d) { return d.$year == selectedYear; })
                .attr("fill", "#21F893")

              selectedFreq = yearEntries.filter(function(d) { return d.$year == selectedYear;})

              //Update button texts
              d3.select(".lefttext")
                .text(function() {
                  if(selectedYear == 1970) {
                    return "2016"
                  } else {
                    return selectedYear - 1
                  }
                })

              d3.select(".righttext")
                .text(function() {
                  if(selectedYear == 2016) {
                    return "1970";
                } else {
                    return selectedYear + 1
                }
              })

              d3.select(".year")
                .text(function(d) { return "Vuonna " + selectedYear + " tehtiin " + selectedFreq[0].$freq + " ufohavaintoa" } )



                //Update force layout
              circleData = data.filter(function(d) { return d.year == selectedYear; })

              circlesWrapper = circlesWrapper.merge(circlesWrapper)

              circlesWrapper = cg.selectAll(".havainnot")
                .data(circleData)

              circlesWrapper
                .exit()
                .remove()

              circlesWrapper
                .enter()
                .append("circle")
                .attr("fill", "white")
                .attr("r", 5)
                .attr("class", "havainnot")


              simulation.nodes(circleData)
                .on("tick", ticked)
                .alpha(0.5)
                .restart()

        }




          var circleData = data.filter(function(d) { return d.year == selectedYear; })

          //Make a force layout
          var simulation = d3.forceSimulation();

          var cg = svg.append("g").attr("class", "circleGroup")

          var circlesWrapper= cg.selectAll(".havainnot")
          		.data(circleData)

          var circlesWrapperEnter = circlesWrapper
          		.enter().append("circle")
          		.attr("class", "havainnot")
          		.attr("r", 5)
              .attr("fill", "white")
              .on("click", function(d) {
                return console.log(d["Kunta tai kaupunki"] + " " + d.year)
              })

              circlesWrapper = circlesWrapperEnter.merge(circlesWrapper)


          simulation
            	.force("x", d3.forceX(function(d) { return 0}).strength(0.1))
            	.force("y", d3.forceY(function(d) { return 0}).strength(0.1))
            	.force("collide", d3.forceCollide(6));

          function ticked() {
            	cg.selectAll(".havainnot")
            		.attr("cx", function(d) {
            			return d.x;
            		})
            		.attr("cy", function(d) {
            			return d.y;
            		})
            }

            simulation.nodes(circleData)
          		.on("tick", ticked)
          		.alpha(0.5)
          		.restart()

              //Scrolling events
              axes.append("circle")
                  .attr("class", "wheelCircle")
                  .attr("r", function(d) { return barScale(d); })
                  .attr("fill", "black");

              $('svg').bind('DOMMouseScroll', function(e){
                    if(e.detail > 0) {
                        //scroll down
                        switcher = true;
                        rotationFunction()
                    }else {
                        //scroll up
                        switcher = false;
                        rotationFunction()
                    }

                    //IE, Opera, Safari
              $('svg').bind('mousewheel', function(e){
                  if(e.wheelDelta< 0) {
                      //scroll down
                      switcher = true;
                      rotationFunction()
                  }else {
                      //scroll up
                      switcher = false;
                      rotationFunction()
                  }

                  //prevent page fom scrolling
                  return false;
                });

                //prevent page fom scrolling
                return false;
                });

                var lastY;
                $('svg').bind('touchmove', function (e){
                     var currentY = e.originalEvent.touches[0].clientY;
                     if(currentY > lastY ){
                         // moved down
                         switcher = true;
                         window.setTimeout(rotationFunction(), 150)
                     }else if(currentY < lastY ){
                         // moved up
                         switcher = false;
                         window.setTimeout(rotationFunction(), 150)
                     }
                     lastY = currentY;
                });

}

document.ontouchmove = function(e){
    e.preventDefault();
}
