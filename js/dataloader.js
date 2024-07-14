let movieData = [];

d3.csv("https://raw.githubusercontent.com/meerajagan/UIUC_CS416_DataViz_FinalProject/main/js/TMDB_cleaned.csv", function(d) {
    d.release_date = d3.timeParse("%Y-%m-%d")(d.release_date);

    return {
        id: d.id,
        title: d.title,
        vote_average: +d.vote_average,
        vote_count: +d.vote_count,
        release_date: d.release_date,
        duration: +d.duration,
        backdrop_path: d.backdrop_path,
        overview: d.overview,
        poster_path: d.poster_path,
        tagline: d.tagline,
        genres: d.genres,
        production_companies: d.production_companies,
        production_countries: d.production_countries,
        keywords: d.keywords
    };
})
.then(function(data) {
    movieData = data
    console.log(movieData); // Log the loaded data
})
.catch(function(error) {
    console.error("Error loading data:", error); // Handle errors
});
