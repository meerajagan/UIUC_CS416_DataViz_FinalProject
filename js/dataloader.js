d3.csv('TMDB_cleaned.csv', function (d) {
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
    .then(function (data) {
      // 'data' is an array of processed objects
      console.log(data);
    })
    .catch(function (error) {
      // Handle any errors that occurred during loading or parsing
      console.error(error);
    });

  
  