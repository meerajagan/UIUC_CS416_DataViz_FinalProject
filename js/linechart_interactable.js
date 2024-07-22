// Set dimensions and margins for both chart
const margin = { top: 10, right: 10, bottom: 100, left: 40 };
const margin2 = { top: 430, right: 10, bottom: 20, left: 40 };
const width = 1350 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const height2 = 500 - margin2.top - margin2.bottom;

// Scales
const x = d3.scaleTime().range([0, width]);
const x2 = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const y2 = d3.scaleLinear().range([height2, 0]);

// Create the SVG element with Title
const svg = d3.select("#movie-vs-year-interactable")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", margin.top / 2 + 6)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Number of Movies Released Over Time");

// Clip overflow - D3: Context and Focus
svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

// Append group elements
const main_chart = svg.append("g")
    .attr("class", "main_chart")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const mini_brush_chart = svg.append("g")
    .attr("class", "mini_brush_chart")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

// Load the dataset
d3.csv("js/TMDB_cleaned.csv", function(d) {
    d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);
    return {
        id: d.id,
        release_date: d.release_date,
    };
}).then(function(data) {
    // Aggregate data - StackOverFlow Help 
    const dataByYearMonth = d3.rollups(
        data,
        v => v.length,
        d => `${d.release_date.getFullYear()}-${d.release_date.getMonth() + 1}`
    ).map(d => {
        const [yearMonth, count] = d;
        const [year, month] = yearMonth.split("-").map(Number);
        return { date: new Date(year, month - 1), count: count };
    });

    // Sort
    dataByYearMonth.sort((a, b) => a.date - b.date);

    // Domains
    x.domain(d3.extent(dataByYearMonth, d => d.date));
    y.domain([0, d3.max(dataByYearMonth, d => d.count)]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    // Lines
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.count));

    const line2 = d3.line()
      .x(d => x2(d.date))
      .y(d => y2(d.count));
      
    // Y Label
    main_chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of Movies Released");

    // Add the line path to the main chart
    main_chart.append("path")
      .datum(dataByYearMonth)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "#5f50ff")
      .attr("stroke-width", 1)
      .attr("d", line);

    // Add the line path to the mini chart
    mini_brush_chart.append("path")
      .datum(dataByYearMonth)
      .attr("class", "line")
      .attr("fill", "#5f50ff")
      .attr("d", line2);

    // Add the x-axis to the main chart
    main_chart.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add the y-axis to the main chart
    main_chart.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y));

    // Add the x-axis to the mini chart
    mini_brush_chart.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height2})`)
      .call(d3.axisBottom(x2));

    // Brush: See D3 Focus and Context on Observable
    const brush = d3.brushX()
      .extent([[0, 0], [width, height2]])
      .on("brush end", brushed);

    mini_brush_chart.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

    function brushed({ selection }) {
      if (selection) {
        const [x0, x1] = selection.map(x2.invert);
        x.domain([x0, x1]);
        main_chart.select(".line").attr("d", line);
        main_chart.select(".x.axis").call(d3.axisBottom(x));
      }
    }

    // Tooltip and crosshair elements -- Youtube Video
    // Crosshair = tooltiplineX + tooltiplineY
    // With a circle for spot
    // Mouseover/mouseout with bisect listening rect
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("pointer-events", "none");

    const circle = main_chart.append("circle")
      .attr("r", 0)
      .attr("fill", "red")
      .style("stroke", "white")
      .attr("opacity", 0.7)
      .style("pointer-events", "none");

    const tooltipLineX = main_chart.append("line")
      .attr("class", "tooltip-line")
      .attr("id", "tooltip-line-x")
      .attr("stroke", "#777")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    const tooltipLineY = main_chart.append("line")
      .attr("class", "tooltip-line")
      .attr("id", "tooltip-line-y")
      .attr("stroke", "#777")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    main_chart.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", function(event) {
        const [xCoord] = d3.pointer(event, this);
        const bisectDate = d3.bisector(d => d.date).left;
        const x0 = x.invert(xCoord);
        const i = bisectDate(dataByYearMonth, x0, 1);
        const d0 = dataByYearMonth[i - 1];
        const d1 = dataByYearMonth[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        const xPos = x(d.date);
        const yPos = y(d.count);

        circle.attr("cx", xPos).attr("cy", yPos);
        circle.transition().duration(50).attr("r", 5);

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

        tooltip.transition().duration(100).style("opacity", .9);
        tooltip.html(`Date: ${d3.timeFormat("%B %Y")(d.date)}<br>Count: ${d.count}`)
          .style("left", `${xPos + margin.left}px`)
          .style("top", `${yPos + margin.top}px`);
      })
      .on("mouseout", function() {
        circle.transition().duration(200).attr("r", 0);
        tooltip.transition().duration(200).style("opacity", 0);
        tooltipLineX.style("display", "none");
        tooltipLineY.style("display", "none");
      });

});