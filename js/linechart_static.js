// Set dimensions and margins for the main chart and the mini chart
const margin = { top: 10, right: 10, bottom: 100, left: 40 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Set up the x and y scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Create the SVG element and append it to the chart container
const svg = d3.select("#movie-vs-year")
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

// Append group elements for chart
const main_chart = svg.append("g")
    .attr("class", "main_chart")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the dataset
d3.csv("js/TMDB_cleaned.csv", function(d) {
    d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);
    return {
        id: d.id,
        release_date: d.release_date,
    };
}).then(function(data) {
    // Aggregate data by year and month -- StackOverFlow Help
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

    // Lines and append to chart
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.count));

    main_chart.append("path")
      .datum(dataByYearMonth)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "#5f50ff")
      .attr("stroke-width", 1)
      .attr("d", line);

    // Y Label
    main_chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of Movies Released");

    // X Label
    main_chart.append("text")
    .attr("transform", "translate(" + (width / 2) + "," + (height + margin.bottom- 60) + ")")
    .style("text-anchor", "middle")
    .text("Year");

    // Add the x-axis
    main_chart.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add the y-axis
    main_chart.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y));


    const annotations = [
        {
            note: {
                label: "Sound movies were introduced and the Rise of HollyWood",
                title: "Late 1920's, Early 1930's"
            },
            x: 190,
            y: y(21),
            dy: -50,
            dx: 50
        },
        {
            note: {
                label: "COVID-19 pandemic started",
                title: "April 2020"
            },
            x: 880,
            y: y(25),
            dy: 10,
            dx: -20
        },
        {
          note: {
              label: "Technology improvement makes movies more cost effective and accessible",
              title: "2000's Digital Enhancement and the Rise of Social Media"
          },
          x: 700,
          y: y(50),
          dy: -10,
          dx: -200
      },
      {
        note: {
            label: "Strike cut off the films coming to market and streaming services",
            title: "2023 SAG-AFTRA Strike"
        },
        x: 900,
        y: y(70),
        dy: -30,
        dx: -120
    },
    {
      note: {
          title: "2010's",
          label: "Rise of Streaming Services"
      },
      x: 800,
      y: y(65),
      dy: -1,
      dx: -150
    }
    ];

    // Create Annotation
    const makeAnnotations = d3.annotation()
        .annotations(annotations);

    // Add to Chart
    main_chart.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
});