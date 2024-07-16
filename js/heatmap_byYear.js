// Set dimensions and margins for the chart
const margin = { top: 70, right: 80, bottom: 70, left: 120 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG element and append it to the chart container
const svg = d3.select("#genre-vs-year")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Initialize scales
const x = d3.scaleBand().range([0, width]).padding(0.1);
const y = d3.scaleBand().range([height, 0]).padding(0.1);

// Define a color scale
const color = d3.scaleSequential(d3.interpolateWarm);

// Create tooltip element
const tooltip = d3.select("#tooltip");

// Load and process the data
d3.csv("js/TMDB_cleaned.csv", function(d) {
  // Parse release_date
  d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);
  return {
    release_year: d3.timeFormat("%Y")(d.release_date), // Format as year
    genres: d.genres.split(", ")
  };
}).then(function(data) {
  // Initialize an empty object to store the grouped data
  let genreYearCount = {};

  // Iterate through each data point
  data.forEach(d => {
    d.genres.forEach(genre => {
      // Initialize the genre object if it doesn't exist
      if (!genreYearCount[genre]) {
        genreYearCount[genre] = {};
      }

      // Initialize the year count if it doesn't exist
      if (!genreYearCount[genre][d.release_year]) {
        genreYearCount[genre][d.release_year] = 0;
      }

      // Increment the count for the genre and year combination
      genreYearCount[genre][d.release_year]++;
    });
  });

  // Extract genres and years from the data for scales
  const genres = Object.keys(genreYearCount);
  const years = Object.keys(genreYearCount[genres[0]]); // Assuming all genres have the same years

  // Sort years chronologically
  years.sort((a, b) => d3.ascending(new Date(a), new Date(b)));

  const genreOrder = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "TV Movie", "War", "Western"]
  genres.sort((a, b) => genreOrder.indexOf(b) - genreOrder.indexOf(a));


  // Update x and y domains based on extracted data
  x.domain(years);
  y.domain(genres);

  // Update color domain
  color.domain([0, d3.max(genres, genre => d3.max(years, year => genreYearCount[genre][year]))]);

  // Create the heatmap
  const heatmap = svg.selectAll()
    .data(genres, genre => genre)
    .enter()
    .append("g")
      .attr("transform", genre => `translate(0, ${y(genre)})`)
    .selectAll("rect")
    .data(genre => years.map(year => ({ genre, year, value: genreYearCount[genre][year] })))
    .enter()
    .append("rect")
      .attr("x", d => x(d.year))
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => color(d.value))
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", 2);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Year: ${d.year}<br>Count: ${d.value}`)
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
    .call(d3.axisBottom(x).tickValues(x.domain().filter(year => year % 10 === 0)))
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
    .text("Genre vs Year Heatmap");

  // Add legend
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 250}, -30)`);

  // Create a color scale for the legend
  const legendColor = color
    .domain([0, d3.max(genres, genre => d3.max(years, year => genreYearCount[genre][year]))]);

  // Calculate legend positions and colors
  const legendWidth = 200;
  const legendSteps = 9; // Number of legend steps
  const legendStepSize = (legendWidth / legendSteps) - 2.5;

  // Generate legend data
  const legendData = d3.range(legendSteps + 1).map(d => legendColor(d * (d3.max(genres, genre => d3.max(years, year => genreYearCount[genre][year])) / legendSteps)));

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
    .text(d3.max(genres, genre => d3.max(years, year => genreYearCount[genre][year])));


});