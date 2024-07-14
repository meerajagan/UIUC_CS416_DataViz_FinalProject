// Set dimensions and margins for the chart
const margin = { top: 70, right: 80, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Set up the x and y scales

const x = d3.scaleTime()
  .range([0, width]);

const y = d3.scaleLinear()
  .range([height, 0]);

// Create the SVG element and append it to the chart container

const svg = d3.select("#movie-vs-year")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// load the dataset
d3.csv("js/TMDB_cleaned.csv", function(d) {
    d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);
    return {
        id: d.id,
        release_date: d.release_date,
    };
}).then(function (data) {
    console.log(data)
    // Aggregate data by year and month
    const dataByYearMonth = d3.rollups(
        data,
        v => v.length,
        d => `${d.release_date.getFullYear()}-${d.release_date.getMonth() + 1}`
    ).map(d => {
        const [yearMonth, count] = d;
        const [year, month] = yearMonth.split("-").map(Number);
        return { date: new Date(year, month - 1), count: count }; // Use `count` instead of `value`
    });

    // Sort data by date
    dataByYearMonth.sort((a, b) => a.date - b.date);

    // Define the x and y domains
    x.domain(d3.extent(dataByYearMonth, d => d.date));
    y.domain([0, d3.max(dataByYearMonth, d => d.count)]); // Use `count` instead of `value`

    // Add the x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll(".tick line")
        .style("stroke-opacity", 1)
    svg.selectAll(".tick text")
        .attr("fill", "#777");
        //.ticks(d3.timeYear.every(5)) 
        //.tickFormat(d3.timeFormat("%Y"))) 

    // Add the y-axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll(".tick line")
        .style("stroke-opacity", 1)
    svg.selectAll(".tick text")
        .attr("fill", "#777");

    // Create the line generator
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count)); // Use `count` instead of `value`

    // Add the line path to the SVG element
    svg.append("path")
        .datum(dataByYearMonth)
        .attr("fill", "none")
        .attr("stroke", "#5f50ff")
        .attr("stroke-width", 1)
        .attr("d", line);

    //title 
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text("Number of Movie Releases Over Years");

    // y axis name
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Number of Releases");

    // source
    svg.append("text")
        .attr("class", "source-credit")
        .attr("x", width - 1100)
        .attr("y", height + margin.bottom - 3)
        .style("font-size", "9px")
        .style("font-family", "sans-serif")
        .style("fill", "#777")
        .text("Source: TMDB.org");

    //tooltip mouse follow
        // Define the tooltip
        const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("padding", "5px")
        .style("pointer-events", "none");
  
      // Append a rect to capture mouse movements
      const listeningRect = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .style("pointer-events", "all");
  
      // Tooltip mouse follow elements
      const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "red")
        .style("stroke", "white")
        .attr("opacity", 0.7)
        .style("pointer-events", "none");
  
      const tooltipLineX = svg.append("line")
        .attr("class", "tooltip-line")
        .attr("id", "tooltip-line-x")
        .attr("stroke", "#777")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2");
  
      const tooltipLineY = svg.append("line")
        .attr("class", "tooltip-line")
        .attr("id", "tooltip-line-y")
        .attr("stroke", "#777")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2");
  
      // Add the mouse listener for the tooltip and crosshair
      listeningRect.on("mousemove", function(event) {
        const [xCoord] = d3.pointer(event, this);
        const bisectDate = d3.bisector(d => d.date).left;
        const x0 = x.invert(xCoord);
        const i = bisectDate(dataByYearMonth, x0, 1);
        const d0 = dataByYearMonth[i - 1];
        const d1 = dataByYearMonth[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        const xPos = x(d.date);
        const yPos = y(d.count);
  
        // Update circle position
        circle.attr("cx", xPos).attr("cy", yPos);
        circle.transition().duration(100).attr("r", 5);
  
        // Update tooltip lines position
        tooltipLineX.style("display", "block")
          .attr("x1", xPos)
          .attr("x2", xPos)
          .attr("y1", 0)
          .attr("y2", height);
  
        tooltipLineY.style("display", "block")
          .attr("y1", yPos)
          .attr("y2", yPos)
          .attr("x1", 0)
          .attr("x2", width);
  
        // Update the tooltip position and content
        tooltip.transition().duration(50).style("opacity", .9);
        tooltip.html(`${d3.timeFormat("%B %Y")(d.date)}<br>Number of Movies Released: ${d.count}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 40}px`);
      });

      listeningRect.on("mouseout", function() {
        tooltip.transition().duration(50).style("opacity", 0);
        circle.transition().duration(50).attr("r", 0);
        tooltipLineX.style("display", "none");
        tooltipLineY.style("display", "none");
      });

});