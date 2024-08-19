const API_KEY = '5bda5df823bd8aa847a7a80ae2a56f40';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200'; // URL base para las imágenes

// Búsqueda de películas en TMDb
document.getElementById('search-button').addEventListener('click', function() {
    const query = document.getElementById('search-input').value;
    searchMovies(query);
});

let userRatings = [];

function searchMovies(query) {
    fetch(`${BASE_URL}/search/movie?api_key=5bda5df823bd8aa847a7a80ae2a56f40&query=${query}`)
        .then(response => response.json())
        .then(data => {
            displayMovies(data.results);
        });
}

function displayMovies(movies) {
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = ''; // Limpiar la lista antes de agregar nuevos resultados

    movies.forEach(movie => {
        const movieItem = document.createElement('div');
        movieItem.className = 'movie-item';
        movieItem.innerHTML = `
            <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'placeholder.jpg'}" alt="${movie.title} poster">
            <h3>${movie.title} (${movie.release_date.split('-')[0]})</h3>
            <button onclick="rateMovie(${movie.id}, '${movie.title}')">Valorar</button>
        `;
        movieList.appendChild(movieItem);
    });
}

function rateMovie(movieId, title) {
    const rating = prompt(`¿Qué calificación le das a ${title}? (1-10)`);
    if (rating && rating >= 1 && rating <= 10) {
        fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                userRatings.push({
                    movieId,
                    title,
                    year: data.release_date.split('-')[0], // Añadimos el año
                    rating: parseInt(rating),
                    genre: data.genres[0]?.name || 'Desconocido',
                    tmdbRating: parseFloat(data.vote_average),
                    posterPath: data.poster_path // Añadimos el poster_path
                });
                saveRatings();
                calculateStats();
                displayRatedMovies();
            });
    }
}

function calculateStats() {
    if (userRatings.length === 0) return;

    // Calcular categorías más y menos valoradas
    const genreRatings = {};
    userRatings.forEach(rating => {
        if (!genreRatings[rating.genre]) genreRatings[rating.genre] = [];
        genreRatings[rating.genre].push(rating.rating);
    });

    let favGenre = '';
    let leastFavGenre = '';
    let highestAvg = 0;
    let lowestAvg = 10;

    for (const genre in genreRatings) {
        const avg = genreRatings[genre].reduce((a, b) => a + b) / genreRatings[genre].length;
        if (avg > highestAvg) {
            highestAvg = avg;
            favGenre = genre;
        }
        if (avg < lowestAvg) {
            lowestAvg = avg;
            leastFavGenre = genre;
        }
    }

    document.getElementById('fav-genre').textContent = `Género favorito: ${favGenre} (${highestAvg.toFixed(1)})`;
    document.getElementById('least-fav-genre').textContent = `Género menos favorito: ${leastFavGenre} (${lowestAvg.toFixed(1)})`;

    // Calcular desviación con TMDb
    const totalDeviation = userRatings.reduce((acc, rating) => acc + Math.abs(rating.rating - rating.tmdbRating), 0);
    const averageDeviation = totalDeviation / userRatings.length;
    document.getElementById('rating-deviation').textContent = `Desviación media con TMDb: ${averageDeviation.toFixed(1)}`;
}

// Guardar valoraciones en Local Storage
function saveRatings() {
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
}

// Cargar valoraciones de Local Storage
function loadRatings() {
    const storedRatings = localStorage.getItem('userRatings');
    if (storedRatings) {
        userRatings = JSON.parse(storedRatings);
        calculateStats(); // Recalcular estadísticas
        displayRatedMovies(); // Mostrar películas valoradas
    }
}

function displayRatedMovies() {
    const ratedMoviesContainer = document.getElementById('rated-movies');
    ratedMoviesContainer.innerHTML = ''; // Limpiar el contenedor antes de agregar nuevas valoraciones

    userRatings.forEach((rating, index) => {
        const movieItem = document.createElement('div');
        movieItem.className = 'movie-item';
        movieItem.innerHTML = `
            <img src="${rating.posterPath ? IMAGE_BASE_URL + rating.posterPath : 'placeholder.jpg'}" alt="${rating.title} poster">
            <h3>${rating.title} (${rating.year}) - Tu valoración: ${rating.rating}/10</h3>
            <p>Género: ${rating.genre}</p>
            <p>Calificación TMDb: ${rating.tmdbRating}/10</p>
            <button onclick="editRating(${index})">Editar</button>
            <button onclick="deleteRating(${index})">Eliminar</button>
        `;
        ratedMoviesContainer.appendChild(movieItem);
    });
}

function editRating(index) {
    const rating = userRatings[index];
    const newRating = prompt(`Editar calificación para ${rating.title} (1-10):`, rating.rating);
    if (newRating && newRating >= 1 && newRating <= 10) {
        userRatings[index].rating = parseInt(newRating);
        saveRatings();
        calculateStats();
        displayRatedMovies();
    }
}

function deleteRating(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta valoración?')) {
        userRatings.splice(index, 1);
        saveRatings();
        calculateStats();
        displayRatedMovies();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadRatings();
    displayRatedMovies(); // Mostrar las películas valoradas al cargar la página
});