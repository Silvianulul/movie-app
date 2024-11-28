const main = document.querySelector(".movies-container");
const searchBox = document.querySelector(".searchbar-container input");
const searchBtn = document.querySelector(".searchbar-container a");
const paginationContainer = document.querySelector(".pagination");
const modalContainer = document.querySelector(".modal");

const imgUrl = "https://image.tmdb.org/t/p/w500/";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMDhmMjUzZDExOTg2ZjVkMTI5MzNlYzc1YjhmZGNiNyIsIm5iZiI6MTcyNzQyODc0NS4wNTg1NDgsInN1YiI6IjY2ZjY3NmZkYWE3ZTVmYTIwMjk2NjRkNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.YPEPGARvRRupPRtJehR6Kq1Nq20H-NqAb_d-zk4swBw",
  },
};

let genreMap = {};
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let isTrending = true;

//Get movies genres
// Get movies genres
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

    // Store genres in localStorage
    localStorage.setItem("genreMap", JSON.stringify(genreMap));
    console.log("Genre map:", genreMap);
  } catch (err) {
    console.error("Genre Data error", err);
  }
};

//Get movies data
const fetchMovies = async function (url) {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(`${data.message} (${res.status})`);

    console.log(data.results);
    totalPages = data.total_pages;
    showMovies(data.results);
    showModal(data.results);
    showPagination();
  } catch (err) {
    console.error("Error fetching movie data", err);
  }
};

//Render movies
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
    const genres = genre_ids
      .map((id) => genreMap[id] || "Unknown")
      .slice(0, 2)
      .join(" | ");

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

  showPagination();
};
//Movies pagination
const showPagination = function () {
  paginationContainer.innerHTML = "";

  const createPageButton = (text, page, isActive = false) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add("page-button");
    if (isActive) button.classList.add("active");
    if (typeof page === "number") {
      button.addEventListener("click", () => changePage(page));
    }
    return button;
  };

  const prevButton = createPageButton("←", currentPage - 1);
  prevButton.disabled = currentPage === 1;
  paginationContainer.appendChild(prevButton);

  const maxVisiblePages = 7;
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    paginationContainer.appendChild(createPageButton("1", 1));
    if (startPage > 2) {
      paginationContainer.appendChild(createPageButton("...", null));
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationContainer.appendChild(
      createPageButton(i.toString(), i, i === currentPage)
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationContainer.appendChild(createPageButton("...", null));
    }
    paginationContainer.appendChild(
      createPageButton(totalPages.toString(), totalPages)
    );
  }

  const nextButton = createPageButton("→", currentPage + 1);
  nextButton.disabled = currentPage === totalPages;
  paginationContainer.appendChild(nextButton);
};

const changePage = function (newPage) {
  currentPage = newPage;
  if (isTrending) {
    fetchTrendingMovies();
  } else {
    searchMovies(currentQuery);
  }
};

const fetchTrendingMovies = async function () {
  isTrending = true;
  const trendingUrl = `https://api.themoviedb.org/3/trending/movie/week?language=en-US&page=${currentPage}`;
  await fetchMovies(trendingUrl);
};

//Search movies
const searchMovies = async function (query) {
  isTrending = false;
  currentQuery = query;
  const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
    query
  )}&include_adult=false&language=en-US&page=${currentPage}`;
  await fetchMovies(searchUrl);
};

const init = async function () {
  await fetchGenres();
  await fetchTrendingMovies();
};

init();

searchBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const query = searchBox.value.trim();
    if (query) {
      currentPage = 1;
      searchMovies(query);
      searchBox.value = "";
    }
  }
});

searchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const query = searchBox.value.trim();
  if (query) {
    currentPage = 1;
    searchMovies(query);
    searchBox.value = "";
  }
});

let watchedMovies = JSON.parse(localStorage.getItem("watchedMovies")) || [];
let queueMovies = JSON.parse(localStorage.getItem("queueMovies")) || [];
//Show modal for any movie

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
  const addToWatchedBtn = modalContent.querySelector("#addToWatched");
  const addToQueueBtn = modalContent.querySelector("#addToQueue");

  addToWatchedBtn.addEventListener("click", () => addToList(movie, "watched"));
  addToQueueBtn.addEventListener("click", () => addToList(movie, "queue"));
};

// Updated closeModal function
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

/////////////////////////////////////
// const watchedBtn = document.getElementById("watched-button");
// const queueBtn = document.getElementById("queue-button");
// const addToWatchedBtn = document.getElementById("addToWatched");
// const addToQueueBtn = document.getElementById("addToQueue");
const addToList = (movie, listType) => {
  let list = JSON.parse(localStorage.getItem(`${listType}Movies`)) || [];
  const existingMovie = list.find((m) => m.id === movie.id);

  if (!existingMovie) {
    // Debug: Log the movie object and genreMap
    console.log("Movie being added:", movie);
    console.log("Genre Map:", genreMap);

    // Convert genre_ids to genre names before saving
    const genres = movie.genre_ids
      .map((id) => genreMap[id] || "Unknown") // Convert genre IDs to names
      .slice(0, 2) // Slice to get only the first two genres
      .join(" | "); // Join them with " | "

    const movieWithGenres = { ...movie, genres }; // Add genres to movie object

    list.push(movieWithGenres); // Store movie with genre names in localStorage
    localStorage.setItem(`${listType}Movies`, JSON.stringify(list));

    // Debug: Log the saved list
    console.log(`Updated ${listType} list:`, list);

    alert(`Added to ${listType} list!`);
  } else {
    alert(`Movie already in ${listType} list!`);
  }
};

// ... (rest of your existing code)

// Initialize the page

const movieee = async function () {
  await fetchGenres();
  await fetchTrendingMovies();
};

movieee();
searchBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const query = searchBox.value.trim();
    if (query) {
      currentPage = 1;
      searchMovies(query);
      searchBox.value = "";
    }
  }
});

searchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const query = searchBox.value.trim();
  if (query) {
    currentPage = 1;
    searchMovies(query);
    searchBox.value = "";
  }
});
