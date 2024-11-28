const main = document.querySelector(".movies-container");
const watchedBtn = document.getElementById("watched-button");
const queueBtn = document.getElementById("queue-button");
const modalContainer = document.querySelector(".modal");

const imgUrl = "https://image.tmdb.org/t/p/w500/";

let watchedMovies = JSON.parse(localStorage.getItem("watchedMovies")) || [];
let queueMovies = JSON.parse(localStorage.getItem("queueMovies")) || [];
//
let genreMap = {};
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let isTrending = true;

//Get movies genres
const fetchGenres = async function () {
  try {
    const genreRes = await fetch(
      "https://api.themoviedb.org/3/genre/movie/list?language=en",
      options
    );
    const genreData = await genreRes.json();
    if (!genreRes.ok)
      throw new Error(`${genreData.message} (${genreRes.status})`);

    genreMap = genreData.genres.reduce((map, genre) => {
      map[genre.id] = genre.name;
      return map;
    }, {});

    console.log("Genre map:", genreMap);
  } catch (err) {
    console.error("Genre Data error", err);
  }
};

//

const showMovies = function (movies) {
  const moviesToShow = movies.slice(0, 15);
  main.innerHTML = "";

  if (!Array.isArray(movies)) {
    console.error("Expected an array of movies, but got:", movies);
    return;
  }

  moviesToShow.forEach((movie) => {
    const {
      title,
      poster_path,
      vote_average,
      overview,
      genre_ids,
      release_date,
      id,
    } = movie;

    // const movieImg = document.createElement("img");
    // movieImg.classList.add("movie-img");
    // movieImg.src = imgUrl + poster_path;
    const movieEl = document.createElement("div");
    movieEl.classList.add("movie-card");
    movieEl.dataset.movieId = id;

    const truncatedTitle =
      title.length > 26 ? title.slice(0, 26) + "..." : title;
    const genres = movie.genres || "Unknown"; // Get genres directly from stored movie

    const year = release_date
      ? new Date(release_date).getFullYear()
      : "Unknown Year";

    movieEl.innerHTML = `
      <img
        class="movie-img"
        src="${imgUrl + poster_path}" 
        alt="${truncatedTitle}"
      />
      <h2 class="movie-name">${truncatedTitle}</h2>
      <p class="movie-genre">${genres} | ${year}</p>
    `;

    movieEl.addEventListener("click", () => showModal(movie));

    main.appendChild(movieEl);
  });
};

const showModal = function (movie) {
  if (!movie) return; // Check if movie is valid

  modalContainer.innerHTML = ""; // Clear previous content

  const {
    original_title,
    poster_path,
    vote_count,
    vote_average,
    overview,
    genre_ids,
    popularity,
  } = movie;

  if (!vote_average) return;

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  const genres = genre_ids.map((id) => genreMap[id] || "Unknown").join(", ");

  modalContent.innerHTML = `
    <button class="close-button">&times;</button>
    <div class="modal-left">
      <img
        src="${imgUrl + poster_path}"
        alt="${original_title}"
        class="poster"
      />
    </div>
    <div class="modal-right">
      <h2>${original_title}</h2>
      <div class="movie-details">
        <div class="detail-item">
          <span class="detail-label">Vote / Votes</span>
          <span class="detail-value"><span class="rating-badge">${vote_average.toFixed(
            1
          )}</span> / ${vote_count}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Popularity</span>
          <span class="detail-value">${popularity.toFixed(1)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Original Title</span>
          <span class="detail-value">${original_title}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Genre</span>
          <span class="detail-value">${genres}</span>
        </div>
      </div>
      <div class="about">
        <h3>About</h3>
        <p>${overview}</p>
      </div>
      <div class="modal-buttons">
        <button id="addToWatched">Add to Watched</button>
        <button id="addToQueue">Add to Queue</button>
      </div>
    </div>`;

  modalContainer.appendChild(modalContent);
  modalContainer.classList.remove("hidden"); // Show the modal

  //Close button
  const closeButton = modalContent.querySelector(".close-button");
  closeButton.addEventListener("click", closeModal);

  //Close on ESC
  document.addEventListener("keydown", handleEsc);
  /////
};
const closeModal = function () {
  modalContainer.classList.add("hidden");
  document.removeEventListener("keydown", handleEsc);
};

// Updated handleEsc function
const handleEsc = function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
};
const loadLibraryMovies = (listType) => {
  console.log(`Loading ${listType} movies`);
  const movies = listType === "watched" ? watchedMovies : queueMovies;

  console.log("Movies to display:", movies);
  showMovies(movies);
};
/////
const initializeLibraryPage = async () => {
  console.log("Initializing library page");

  // Load genres from localStorage if they exist
  const storedGenres = localStorage.getItem("genreMap");
  if (storedGenres) {
    genreMap = JSON.parse(storedGenres);
    console.log("Loaded genre map from localStorage:", genreMap);
  } else {
    // Fetch genres if they are not in localStorage
    await fetchGenres();
  }

  if (watchedBtn && queueBtn) {
    watchedBtn.addEventListener("click", () => loadLibraryMovies("watched"));
    queueBtn.addEventListener("click", () => loadLibraryMovies("queue"));

    // Load watched movies by default
    loadLibraryMovies("watched");
  } else {
    console.error("Watched or Queue buttons not found");
  }
};

document.addEventListener("DOMContentLoaded", initializeLibraryPage);

//////////Pagination
