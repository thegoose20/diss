/*
D3 script
***
Musical Instruments Timeline
*/

callFunction();
d3.select(window).on("resize", callFunction);


function callFunction() {
  console.log("Drawing visualization");

  // Date parsers & formatters
  var parseDate = d3.timeParse("%d/%m/%Y");
  var parseMonth = d3.timeParse("%m");
  var parseYear = d3.timeParse("%Y");
  var parseDay = d3.timeParse("%j");
  var formatDate = d3.timeFormat("%d %B %Y");
  var formatMonth = d3.timeFormat("%m");
  var formatDay = d3.timeFormat("%j");                                        // day of the year as decimal number
  var formatYear = d3.timeFormat("%Y");

  var margin = {top: 0, right: 20, bottom: 20, left: 0},                    //read clockwise from top
      width = parseInt(d3.select("body").style("width"), 10),
      width = width - margin.left - margin.right,
      xHeight = 20, // approximate X axis height
      itemHeight = 2,
      itemSpacing = 2;

  console.log(width);

  // Load data
  d3.csv("clean_mimed_with_range.csv")
      // Create references to columns in data file
      .row(function(d){ return{ Id:d.Id,
                                Collection:d.Collection,
                                Type:d.Type,
                                Genus:d.Genus,
                                Family:d.Family,
                                Year_Early:d.Year_Early,
                                Year_Late:d.Year_Late,
                                Year_Uncertainty:d.Year_Uncertainty,
                                Country:d.Country,
                                City:d.City,
                                Location_Uncertainty:d.Location_Uncertainty,
                                Year_Range:d.Year_Range
                              }; })
      .get(function(error,data){
          //console.log(data);

          var svgTest = d3.select("body").select("#chart").select("svg");
          if (!svgTest.empty()) {
            svgTest.remove();
          };

          // Group agreements by year_early
          var years = d3.nest()
               // create an array of objects whose keys are years (sorted earliest to latest)...
               .key(function(d){ if (d.Year_Early > 0) return d.Year_Early; }).sortKeys(d3.ascending)  // Exclude unknown years (with value = 0)
               .sortValues(function(a,b){ return d3.descending(a.Year_Range, b.Year_Range); })
               // ...and whose values are an array of objects
               .entries(data);

          // Create an array of all years covered in the data
          var yrList = (d3.map(years, function(d){ return d.key; })).keys();
          // Remove any non-year values from the array
          for (i=0; i < yrList.length; i++){
            y = yrList[i];
            if (String(y).length != 4){ // valid years have 4 digits
              yrList.splice(i,1)
            }
          }

          // Count items per year
          var yr_count = d3.nest()
                // create an array of objects whose keys are years...
                .key(function(d){ if (d.Year_Early > 0) return d.Year_Early; }).sortKeys(d3.ascending)
                // ...and whose values are the count of items from that year
                .rollup(function(leaves){ return leaves.length; })
                .entries(data);

          // console.log(yrList); // an array of objects
          // console.log(yrList); // an array of years (excluding 0, as that signifies an unknown year)
          // console.log(years[0].values); // array of objects (one for each agreement in 1990)
          // console.log(years[0].values[0]); // first agreement object from 1990
          // console.log(years[0].values[0].Year); // Year (as number) of the first agreement object from 1990

          // Find the maximum number of items in a single year
          var maxItems = d3.max(yr_count, function(year){ if (year.key != "undefined") return year.value; });
          // Set the height of the visualization based on maxItems
          var height = (maxItems*(itemHeight+itemSpacing)) + xHeight*2;
          // console.log(maxItems); // 170

          // Set up the X Axis
          var minYear = +(yrList[0])-1;    // Set to one year earlier than earliest year in data file
          maxI = yrList.length-1;
          var maxYear = +(yrList[maxI])+1;   // Set to one year later than latest year in data file
          // console.log(maxYear);
          var x = d3.scaleTime()
                      .domain([parseYear(minYear),parseYear(maxYear)])  // data space
                      .range([margin.left,width]);                      // display space

          // Calculate default width of each item visualized based on display space
          var yearsCovered = (+maxYear)-(+minYear);
          var itemWidth = width/yearsCovered-2;                          // add 2 pixels of padding between visualized items

          // Define the full timeline chart SVG element
          var svg = d3.select("body").select("#chart").append("svg")
              .attr("height", height + margin.top + margin.bottom)
              .attr("width", width + margin.left + margin.right);

          // Define the tooltip
          var div = d3.select("body").append("div")
              .attr("class", "tooltip")
              .style("opacity", 0);

          // yrCounts = [];
          for (i = 0; i < yrList.length; i++){
            // var y = +(years[i].key);

            // create a g item for each year
            var chartGroup = svg.append("g")
                        .attr("class","yearGroup")
                        .attr("transform","translate("+(margin.left*2)+","+margin.top+")")

            var rects = chartGroup.selectAll("rect")
                .data(years[i].values)
              .enter().append("rect")
                .attr("class","item")
                .attr("id",function(d){ return d.Id; })
                .attr("name",function(d){ return d.Type; })
                .attr("value",function(d){ return d.Year_Early; })
                .attr("fill","black")
                .attr("stroke","black")
                .attr("x", function(d){ return x(parseYear(d.Year_Early)) - (itemWidth/2) + 1; })
                .attr("y",function(d,i){ return (height-xHeight-margin.bottom-(itemHeight)-((itemHeight)*(i*itemSpacing)))+"px"; })
                .attr("width", function(d) { return (itemWidth*d.Year_Range)+"px"; })
                .attr("height", itemHeight+"px")
                .attr("opacity",.7)
                .on("mouseover", function(d){
                  div.transition()
                    .duration(200)
                    .style("opacity",.9);
                  div.html("Type: " + d.Type + "<br/>" + "Genus: " + d.Genus + "<br/>" + "Family: " + d.Family + "<br/>" + "Year Estimate: " + d.Year_Early + "-" + d.Year_Late)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 64) + "px");
                })
                .on("mouseout", function(d){
                  div.transition()
                    .duration(500)
                    .style("opacity",0);
                });
          }

          /*
          FUNCTIONS
          */
          // ...

          // Draw X axis for the entire chart
          var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")).tickPadding([5]); //.ticks(4);

          var gX = chartGroup.append("g")
               .attr("class","xaxis")
               .attr("transform","translate("+(margin.left*2)+","+(height-xHeight-margin.bottom)+")")
               .call(xAxis);

      }); // end of .get(error,data)

      /*
      EXPORT PNG
      from https://github.com/exupero/saveSvgAsPng
      */
      d3.select("#export").on("click", function(){
        var title = "MusicalInstrumentTimeline_VizByLucyHavens";
        saveSvgAsPng(document.getElementsByTagName("svg")[0], title, {scale: 5, backgroundColor: "#FFFFFF"});
        // if IE need canvg: canvg passed between scale & backgroundColor
      });

  }; // end of callFunction()
