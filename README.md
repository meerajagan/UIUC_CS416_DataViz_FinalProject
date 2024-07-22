# UIUC_CS416_DataViz_FinalProject
Final Project for Course: CS416 at UIUC

## Access the final site here:
<b> https://meerajagan.github.io/UIUC_CS416_DataViz_FinalProject/index.html </b>

## Data Pulls
Data is sourced from https://www.themoviedb.org/?language=en-US
Data was pulled into this Kaggle Site: https://www.kaggle.com/datasets/asaniczka/tmdb-movies-dataset-2023-930k-movies


The movies are updated daily. However due to the sheer number of movies, it was easier to visualize a subset of the data. The data was cleaned (and sampled) with the Alteryx Flow.


The Alteryx Flow specifically pulled data that was fully populated and filled in with 'reasonable' values. This means that a movie will have a rating score greater than 0 with at least 1 review. Furthermore, the movies with runtimes of at least 30 minutes and less than 7 hours were sampled to remove any extraneous data. 
