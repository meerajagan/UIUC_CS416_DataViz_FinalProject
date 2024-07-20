const margin = { top: 10, right: 10, bottom: 100, left: 40 };
const margin2 = { top: 430, right: 10, bottom: 20, left: 40 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const height2 = 480 - margin2.top - margin2.bottom;

const genres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "TV Movie", "War", "Western"];
const customColors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5"];

// Populate dropdown menu
const selectButton = d3.select("#selectButton");
genres.forEach(genre => {
    selectButton.append("option")
        .attr("value", genre)
        .text(genre);
});

// Set up the x and y scales
const x = d3.scaleTime().range([0, width]);
const x2 = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const y2 = d3.scaleLinear().range([height2, 0]);

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

// Create clipPath to clip overflow
svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

const main_chart = svg.append("g")
    .attr("class", "main_chart")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const mini_brush_chart = svg.append("g")
    .attr("class", "mini_brush_chart")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

// Create a div to show selected tags
const tagsContainer = d3.select("body")
    .append("div")
    .attr("id", "tagsContainer");

const postersContainer = d3.select("#posters-container");

d3.csv("js/TMDB_cleaned.csv", function (d) {
    d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);
    return {
        release_year: d3.timeFormat("%Y")(d.release_date),
        genres: d.genres.split(", "),
        title: d.title,
        poster_path: d.poster_path,
        backdrop_path: d.backdrop_path,
        vote_average: +d.vote_average,
        vote_count: +d.vote_count,
        duration: d.duration,
        keywords: d.keywords,
        overview: d.overview,
        tagline: d.tagline
    };
}).then(function (data) {
    let genreYearCount = {};

    data.forEach(d => {
        d.genres.forEach(genre => {
            if (!genreYearCount[genre]) genreYearCount[genre] = {};
            if (!genreYearCount[genre][d.release_year]) genreYearCount[genre][d.release_year] = 0;
            genreYearCount[genre][d.release_year]++;
        });
    });

    let dataArray = [];
    for (let genre in genreYearCount) {
        let genreData = [];
        for (let year in genreYearCount[genre]) {
            genreData.push({ year: new Date(year, 0, 1), count: genreYearCount[genre][year] });
        }
        dataArray.push({ genre: genre, values: genreData });
    }

    drawLines(dataArray, data);
});

function drawLines(data, movieData) {
    x.domain(d3.extent(data[0].values, d => d.year));
    y.domain([0, d3.max(data, d => d3.max(d.values, v => v.count))]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    main_chart.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    main_chart.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    mini_brush_chart.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height2})`)
        .call(d3.axisBottom(x2));

    function update(selectedGenres, brushSelection) {
        const filteredData = data.filter(d => selectedGenres.includes(d.genre));

        main_chart.selectAll(".line").remove();

        main_chart.selectAll(".line")
            .data(filteredData)
            .enter().append("path")
            .attr("class", "line")
            .attr("d", d => d3.line()
                .x(d => x(d.year))
                .y(d => y(d.count))
                (d.values))
            .style("stroke", (d, i) => customColors[genres.indexOf(d.genre)])
            .attr("fill", "none");

        // Add and set up the brush
        mini_brush_chart.selectAll(".brush").remove();
        const brush = d3.brushX()
            .extent([[0, 0], [width, height2]])
            .on("brush end", brushed);

        const brushGroup = mini_brush_chart.append("g")
            .attr("class", "brush")
            .call(brush);

        // Set the initial brush selection
        if (brushSelection) {
            brushGroup.call(brush.move, brushSelection);
        } else {
            brushGroup.call(brush.move, x2.range()); // Corrected to use x2.range()
        }

        function brushed(event) {
            const { selection } = event;
            if (selection) {
                const [x0, x1] = selection.map(x2.invert);
                x.domain([x0, x1]);
                main_chart.selectAll(".line")
                    .attr("d", d => d3.line()
                        .x(d => x(d.year))
                        .y(d => y(d.count))
                        (d.values));
                main_chart.select(".x.axis").call(d3.axisBottom(x));

                // Update posters based on brush selection
                updatePosters(selectedGenres, selection);
            }
        }

        // Update tags
        tagsContainer.html("");  // Clear previous tags
        selectedGenres.forEach(genre => {
            tagsContainer.append("span")
                .attr("class", "tag")
                .style("background-color", customColors[genres.indexOf(genre)])
                .text(genre);
        });
    }

    d3.select("#selectButton").on("change", function () {
        const selectedGenres = Array.from(this.selectedOptions).map(option => option.value);
        update(selectedGenres);
    });

    // Append tooltip div
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("width", "600px")
        .style("height", "300px")
        .style("display", "flex")
        .style("align-items", "center")
        .style("padding", "10px");

    tooltip.append("div")
        .attr("class", "tooltip-image")
        .style("flex", "0 0 40%")
        .style("height", "100%")
        .style("background-size", "cover")
        .style("background-position", "center")
        .style("border-radius", "5px");

    tooltip.append("div")
        .attr("class", "tooltip-text")
        .style("flex", "1")
        .style("padding-left", "10px")
        .style("color", "white");

    const tooltipStyle = 
    `.tooltip-image {
        position: relative;
    }`;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = tooltipStyle;
    document.head.appendChild(styleSheet);

    function updatePosters(selectedGenres, brushSelection) {
        postersContainer.html("");  // Clear previous posters
        selectedGenres.forEach(genre => {
            const topMovies = movieData.filter(d => d.genres.includes(genre) &&
                (!brushSelection || (d3.timeParse("%Y")(d.release_year) >= x.domain()[0] && d3.timeParse("%Y")(d.release_year) <= x.domain()[1])))
                .sort((a, b) => (b.vote_average - a.vote_average) && (b.vote_count - a.vote_count))
                .slice(0, 5);

            postersContainer.append("h3")
                .text(`Top ${genre} Movies`);

            const genreContainer = postersContainer.append("div")
                .attr("class", "genre-container")
                .style("display", "flex")  // Use flexbox for horizontal layout
                .style("flex-wrap", "wrap");

            topMovies.forEach(movie => {
                const posterUrl = `https://image.tmdb.org/t/p/w1280${movie.poster_path}`;
                const backdropUrl = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
                const posterDiv = genreContainer.append("div")
                    .attr("class", "poster");

                posterDiv.append("img")
                    .attr("src", posterUrl)
                    .attr("alt", movie.title)
                    .style("width", "150px")
                    .style("margin-right", "20px")
                    .on("mouseover", (event) => {
                        const mouseX = event.pageX;
                        const mouseY = event.pageY;

                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 0.9)
                            .style("left", (mouseX + 10) + "px")
                            .style("top", (mouseY - 70) + "px");

                        tooltip.select(".tooltip-image")
                            .style("background-image", `url(${backdropUrl})`);

                        tooltip.select(".tooltip-text")
                            .html(`<strong>${movie.title} (${movie.release_year})</strong><br>
                                <i>"${movie.tagline}"</i><br>
                                <strong>---------</strong><br>
                                <strong>Duration:</strong> ${movie.duration} Minutes<br>
                                <strong>Average Score:</strong> ${movie.vote_average} / 10<br>
                                <strong>---------</strong><br>
                                <strong>Overview:</strong> ${movie.overview}<br><br>
                                <strong>Keywords:</strong> ${movie.keywords}`);
                    })
                    .on("mouseout", () => {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
            });
        });
    }

    // Initialize with no brush selection
    update(data.map(d => d.genre));
}