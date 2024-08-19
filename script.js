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
            <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'placeholder.jpg'}" 
                 alt="${movie.title} poster" 
                 title="${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})">
        `;
        movieItem.addEventListener('click', () => rateMovie(movie.id, movie.title, movie.poster_path));
        movieList.appendChild(movieItem);
    });
}

function rateMovie(movieId, title, posterPath) {
    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'rating-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <div class="rating-content">
                <h4>Valora</h4>
                <img src="${posterPath ? IMAGE_BASE_URL + posterPath : 'placeholder.jpg'}" alt="${title} poster" class="movie-poster">
                <h2>${title}</h2>
                <input type="range" min="0" max="10" value="5" step="0.5" id="rating-slider">
                <p><span id="rating-value">5</span> / 10</p>
                <button id="submit-rating">Valorar</button>
            </div>
        </div>
    `;
    
    // Agregar el modal al DOM
    document.body.appendChild(modal);

    // Obtener referencias a los elementos del modal
    const slider = modal.querySelector('#rating-slider');
    const ratingValue = modal.querySelector('#rating-value');
    const submitButton = modal.querySelector('#submit-rating');
    const closeButton = modal.querySelector('.close-btn');

    // Verificar si todos los elementos necesarios existen
    if (!slider || !ratingValue || !submitButton || !closeButton) {
        console.error('No se pudieron encontrar todos los elementos necesarios en el modal');
        return;
    }

    // Actualizar el valor mostrado cuando se mueve el slider
    slider.addEventListener('input', () => {
        ratingValue.textContent = slider.value;
    });

    // Manejar el envío de la valoración
    submitButton.addEventListener('click', () => {
        const rating = parseFloat(slider.value);
        const ratingDate = new Date().toISOString(); // Guardar la fecha y hora actual
        fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                const year = data.release_date ? data.release_date.split('-')[0] : 'N/A';
                userRatings.push({
                    movieId,
                    title,
                    year: year,
                    rating: rating,
                    genre: data.genres && data.genres.length > 0 ? data.genres[0].name : 'Desconocido',
                    tmdbRating: data.vote_average ? parseFloat(data.vote_average) : 0,
                    posterPath: data.poster_path,
                    ratingDate: ratingDate // Añadir la fecha y hora de la valoración
                });
                saveRatings();
                calculateStats();
                displayRatedMovies();
                document.body.removeChild(modal);
            })
            .catch(error => {
                console.error('Error al obtener datos de la película:', error);
                alert('Hubo un error al enviar la valoración. Por favor, inténtalo de nuevo.');
            });
    });

    // Manejar el cierre del modal
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
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

    // Ordenar userRatings en orden inverso (más recientes primero)
    const sortedRatings = [...userRatings].sort((a, b) => new Date(b.ratingDate) - new Date(a.ratingDate));

    sortedRatings.forEach((rating, index) => {
        const movieItem = document.createElement('div');
        movieItem.className = 'movie-item';
        movieItem.innerHTML = `
            <img src="${rating.posterPath ? IMAGE_BASE_URL + rating.posterPath : 'placeholder.jpg'}" alt="${rating.title} poster">
            <div class="movie-item-content">
                <h2>${rating.title}</h2>
                <p>Año: ${rating.year}<br>Género: ${rating.genre}<br>Calificación TMDb: ${rating.tmdbRating}/10</p>
                <h3>Tu valoración: ${rating.rating}/10</h3>
                <p>Valorada el: ${new Date(rating.ratingDate).toLocaleString()}</p>
                <button class="edit-button">Editar</button>
                <button class="delete-button">Eliminar</button>
            </div>
        `;
        
        const editButton = movieItem.querySelector('.edit-button');
        const deleteButton = movieItem.querySelector('.delete-button');
        
        editButton.addEventListener('click', () => editRating(rating.movieId));
        deleteButton.addEventListener('click', () => deleteRating(rating.movieId));
        
        ratedMoviesContainer.appendChild(movieItem);
    });
}

function editRating(movieId) {
    const ratingIndex = userRatings.findIndex(r => r.movieId === movieId);
    if (ratingIndex === -1) {
        console.error('No se encontró la película con ID:', movieId);
        return;
    }
    const rating = userRatings[ratingIndex];
    
    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'rating-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h4>Edita la valoración de</h4>
            <h2>${rating.title}</h2>
            <input type="range" min="0" max="10" value="${rating.rating}" step="0.5" id="edit-rating-slider">
            <p>Tu valoración ahora es <span id="edit-rating-value">${rating.rating}</span></p>
            <button id="edit-submit-rating">Guardar</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Actualizar el valor mostrado cuando se mueve el slider
    const slider = modal.querySelector('#edit-rating-slider');
    const ratingValue = modal.querySelector('#edit-rating-value');
    slider.addEventListener('input', () => {
        ratingValue.textContent = slider.value;
    });

    // Manejar el envío de la valoración
    modal.querySelector('#edit-submit-rating').addEventListener('click', () => {
        const newRating = parseFloat(slider.value);
        userRatings[ratingIndex].rating = newRating;
        userRatings[ratingIndex].ratingDate = new Date().toISOString(); // Actualizar la fecha de valoración
        saveRatings();
        calculateStats();
        displayRatedMovies();
        document.body.removeChild(modal);
    });

    // Manejar el cierre del modal
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function deleteRating(movieId) {
    const ratingIndex = userRatings.findIndex(r => r.movieId === movieId);
    if (ratingIndex === -1) {
        console.error('No se encontró la película con ID:', movieId);
        return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar esta valoración?')) {
        userRatings.splice(ratingIndex, 1);
        saveRatings();
        calculateStats();
        displayRatedMovies();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadRatings();
    displayRatedMovies(); // Mostrar las películas valoradas al cargar la página
});

movieElement.style.backgroundImage = `url(${movie.Poster})`;