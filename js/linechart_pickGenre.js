// Set Margins and explicit definition for genre and colors
const margin = { top: 10, right: 10, bottom: 100, left: 40 };
const margin2 = { top: 430, right: 10, bottom: 20, left: 40 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const height2 = 480 - margin2.top - margin2.bottom;

const genres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "TV Movie", "War", "Western"];
const customColors = [
    "#FF5733", // Vivid Red-Orange
    "#FF6F61", // Coral
    "#FF8C00", // Dark Orange
    "#FFA07A", // Light Salmon
    "#FF1493", // Deep Pink
    "#FF69B4", // Hot Pink
    "#FF00FF", // Magenta
    "#8A2BE2", // Blue Violet
    "#4B0082", // Indigo
    "#6A5ACD", // Slate Blue
    "#483D8B", // Dark Slate Blue
    "#32CD32", // Lime Green
    "#3CB371", // Medium Sea Green
    "#00CED1", // Dark Turquoise
    "#40E0D0", // Turquoise
    "#20B2AA", // Light Sea Green
    "#1E90FF", // Dodger Blue
    "#4682B4", // Steel Blue
    "#D2691E", // Chocolate
    "#8B4513"  // Saddle Brown
];
// Select Genre Menu
const selectButton = d3.select("#selectButton");
genres.forEach(genre => {
    selectButton.append("option")
        .attr("value", genre)
        .text(genre);
});

// Scales
const x = d3.scaleTime().range([0, width]);
const x2 = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const y2 = d3.scaleLinear().range([height2, 0]);

const svg = d3.select("#movie-vs-year-genreInteractive")
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

const main_chart = svg.append("g")
    .attr("class", "main_chart")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const mini_brush_chart = svg.append("g")
    .attr("class", "mini_brush_chart")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

// need tags for select menu and want posters
const tagsContainer = d3.select("#tags-container");
const postersContainer = d3.select("#posters-container");

d3.csv("js/TMDB_cleaned.csv", function (d) {
    d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);
    return {
        release_year: d3.timeFormat("%Y")(d.release_date), //this time just year
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

    // Aggregate Data 
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

// Multiline Chart for each selected genre
function drawLines(data, movieData) {

    // Domains
    x.domain(d3.extent(data[0].values, d => d.year));
    y.domain([0, d3.max(data, d => d3.max(d.values, v => v.count))]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    // Axes
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

    // Update only with selected Genres and brush selection -- gpt 3.5 for debugging
    function update(selectedGenres, brushSelection) {
        const filteredData = data.filter(d => selectedGenres.includes(d.genre));

        // Remove old lines and redraw
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

        // Clear and Update tags
        tagsContainer.selectAll(".tag").remove();
        selectedGenres.forEach(genre => {
            tagsContainer.append("span")
                .attr("class", "tag")
                .style("background-color", customColors[genres.indexOf(genre)])
                .text(genre);
        });

        // Brush like previous but without lines for cleanliness
        mini_brush_chart.selectAll(".brush").remove();
        const brush = d3.brushX()
            .extent([[0, 0], [width, height2]])
            .on("brush end", brushed);

        const brushGroup = mini_brush_chart.append("g")
            .attr("class", "brush")
            .call(brush);

        if (brushSelection) {
            brushGroup.call(brush.move, brushSelection);
        } else {
            brushGroup.call(brush.move, x2.range());
        }

        // Separate Brush Function -- D3: FOcus and Context
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

                // Update Posters
                updatePosters(selectedGenres, selection);
            }
        }

        // Tooltip for line chart
        const tooltip_yearCount = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px");

        const focus = main_chart.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", 0)
            .attr("y2", height);

        // help from GPT 3.5 and Stackoverflow to get tooltip to correctly overlay over line garph
        const overlay = main_chart.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => focus.style("display", null))
            .on("mouseout", () => {
                focus.style("display", "none");
                tooltip_yearCount.style("opacity", 0);
            })
            .on("mousemove", mousemove);

        // Tooltip with all selected genre with similar bisect from before
        function mousemove(event) {
            const mouseX = d3.pointer(event)[0];
            const x0 = x.invert(mouseX);
            const i = d3.bisector(d => d.year).left(data[0].values, x0, 1);
            const d0 = data[0].values[i - 1];
            const d1 = data[0].values[i];
            const dClosest = x0 - d0.year > d1.year - x0 ? d1 : d0;

            focus.attr("transform", `translate(${x(dClosest.year)},0)`);
            focus.select(".x-hover-line").attr("y2", height);

            let tooltipContent = `<strong>Year: ${dClosest.year.getFullYear()}</strong><br>----<br>`;

            //sort alpha w all relevant genre
            filteredData.sort((a, b) => a.genre.localeCompare(b.genre));
            filteredData.forEach(d => {
                const value = d.values.find(v => v.year.getFullYear() === dClosest.year.getFullYear());
                if (value) {
                    tooltipContent += `${d.genre}: <i> ${value.count} </i><br>`;
                }
            });

            // to get tooltip near pointer
            tooltip_yearCount.html(tooltipContent)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("opacity", 0.9);
        }

    }

    // genre select -- Stackoverflow
    d3.select("#selectButton").on("change", function () {
        const selectedGenres = Array.from(this.selectedOptions).map(option => option.value);
        update(selectedGenres);
    });

    // Tooltip for Posters -- help from Youtube Vid
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

    // tooltip formatting - Youtube Video help for styling (lines 279-287)
    const tooltipStyle = 
    `.tooltip-image {
        position: relative;
    }`;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = tooltipStyle;
    document.head.appendChild(styleSheet);

    // Posters update -- dynamic change to year and genre.
    function updatePosters(selectedGenres, brushSelection) {
        //Clear and repopulate posters -- Stackoverflow to help define const topMovies
        postersContainer.html("");
        selectedGenres.forEach(genre => {
            const topMovies = movieData.filter(d => d.genres.includes(genre) &&
                (!brushSelection || (d3.timeParse("%Y")(d.release_year) >= x.domain()[0] && d3.timeParse("%Y")(d.release_year) <= x.domain()[1])))
                .sort((a, b) => (b.vote_average - a.vote_average) && (b.vote_count - a.vote_count))
                .slice(0, 7);

            postersContainer.append("h3")
                .text(`Top ${genre} Movies`);

            // Flexbox -> displays images horizontally
            const genreContainer = postersContainer.append("div")
                .attr("class", "genre-container")
                .style("display", "flex")
                .style("flex-wrap", "wrap");

            // images pulled from web images from source (TMDB.org)
            topMovies.forEach(movie => {
                const posterUrl = `https://image.tmdb.org/t/p/w1280${movie.poster_path}`;
                const backdropUrl = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
                const posterDiv = genreContainer.append("div")
                    .attr("class", "poster");

                // Tooltip with mouseover and mouseout events
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

    // Initialize with all genre
    update(data.map(d => d.genre));

}