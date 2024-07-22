// Set dimensions and margins for the chart
const margin = { top: 70, right: 120, bottom: 120, left: 120 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG element and append it to the chart container
const svg = d3.select("#genre-vs-month")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Initialize scales
const x = d3.scaleBand().range([0, width]).padding(0);
const y = d3.scaleBand().range([height, 0]).padding(0.1);

// Define a color scale
const color = d3.scaleSequential(d3.interpolatePuRd);

// Create tooltip element
const tooltip = d3.select("#tooltip");

// Load and process the data
d3.csv("js/TMDB_cleaned.csv", function(d) {
  // Parse release_date
  d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);
  return {
    release_month: d3.timeFormat("%B")(d.release_date), // Format as month
    genres: d.genres.split(", ")
  };
}).then(function(data) {
  // Initialize an empty object to store the grouped data
  let genreMonthCount = {};

  // Iterate through each data point
  data.forEach(d => {
    d.genres.forEach(genre => {
      // Initialize the genre object if it doesn't exist
      if (!genreMonthCount[genre]) {
        genreMonthCount[genre] = {};
      }

      // Initialize the month count if it doesn't exist
      if (!genreMonthCount[genre][d.release_month]) {
        genreMonthCount[genre][d.release_month] = 0;
      }

      // Increment the count for the genre and month combination
      genreMonthCount[genre][d.release_month]++;
    });
  });

  // Extract genres and months from the data for scales
  const genres = Object.keys(genreMonthCount);
  const months = Object.keys(genreMonthCount[genres[0]]); // Assuming all genres have the same months

  // Sort months chronologically
  const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

  const genreOrder = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "TV Movie", "War", "Western"]
  genres.sort((a, b) => genreOrder.indexOf(b) - genreOrder.indexOf(a));


  // Update x and y domains based on extracted data
  x.domain(months);
  y.domain(genres);

  // Update color domain
  color.domain([0, d3.max(genres, genre => d3.max(months, month => genreMonthCount[genre][month]))]);

  // Create the heatmap
  const heatmap = svg.selectAll()
    .data(genres, genre => genre)
    .enter()
    .append("g")
      .attr("transform", genre => `translate(0, ${y(genre)})`)
    .selectAll("rect")
    .data(genre => months.map(month => ({ genre, month, value: genreMonthCount[genre][month] })))
    .enter()
    .append("rect")
      .attr("x", d => x(d.month))
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => color(d.value))
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", 2);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Count: ${d.value}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        d3.select(this)
          .style("stroke", "none");
        tooltip.transition().duration(500).style("opacity", 0);
      });

  // Add x-axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickValues(x.domain()))
    .selectAll("text")
    .style("text-anchor", "end");

  // Add y-axis
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  // Add chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Genre vs Month Heatmap");


  // Add legend
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 250}, -30)`);

  // Create a color scale for the legend
  const legendColor = color
    .domain([0, d3.max(genres, genre => d3.max(months, month => genreMonthCount[genre][month]))]);

  // Calculate legend positions and colors
  const legendWidth = 200;
  const legendSteps = 9; // Number of legend steps
  const legendStepSize = (legendWidth / legendSteps) - 2.5;

  // Generate legend data
  const legendData = d3.range(legendSteps + 1).map(d => legendColor(d * (d3.max(genres, genre => d3.max(months, month => genreMonthCount[genre][month])) / legendSteps)));

  // Append legend rectangles
  legend.selectAll("rect")
    .data(legendData)
    .enter().append("rect")
    .attr("x", (d, i) => 50 + i * legendStepSize)
    .attr("y", 0)
    .attr("width", legendStepSize)
    .attr("height", 10)
    .style("fill", d => d);

  // Add text labels
  legend.append("text")
    .attr("x", 50)
    .attr("y", 25)
    .style("text-anchor", "start")
    .text("0");

  legend.append("text")
    .attr("x", 250)
    .attr("y", 25)
    .style("text-anchor", "end")
    .text(d3.max(genres, genre => d3.max(months, month => genreMonthCount[genre][month])));



  // Add annotations using d3-annotation
  const annotations = [
    {
      note: {
        label: "Most horror movies released in October",
        title: "High Releases"
      },
      x: x("October") + x.bandwidth() / 2,
      y: height + 15,
      dx: 20,
      dy: 20,
      connector: { end: "arrow" }
    },
    {
      note: {
        label: "Extra Drama Releases in Spring",
        title: "High Releases"
      },
      x: x("March") + x.bandwidth() / 2,
      y: height + 15,
      dx: 20,
      dy: 20,
      connector: { end: "arrow" }
    },
    {
      note: {
        label: "Many movies released in September",
        title: "High Releases"
      },
      x: x("September") + x.bandwidth() / 2,
      y: height + 15,
      dx: -20,
      dy: 20,
      connector: { end: "arrow" }
    },
    {
        note: {
          label: "Most Family movies released in second half of Year",
          title: "High Releases",
        },
        x: width,
        y: y("Family") + y.bandwidth() / 2,
        dx: 60,
        dy: -20,
        connector: { end: "arrow" }
      }
  ];

  const makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  svg.append("g")
    .attr("class", "annotation-group")
    .call(makeAnnotations);

});