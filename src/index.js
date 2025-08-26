import './style/index.scss'

let games = [];
let currentIndex = 0;
const step = 9;
const url = process.env.API_URL;
const header = document.querySelector('header');
const main = document.querySelector('main');
let observer;

// gets all data results from api
const getData = async (page = 1, pageSize = 40) => {
  try {
    const response = await fetch(`${url}&page_size=${pageSize}&page=${page}`);
    const data = await response.json();
    return {
      results: data.results,
      next: data.next
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      results: [], next: null
    };
  }
};

// get specific infos from data
async function getDataInfos() {
  let allGames = [];
  let currentPage = 1;
  const gamesPerPage = 40;
  const totalPagesToFetch = 5;

  for (let page = 1; page <= totalPagesToFetch; page++) {
    const data = await getData(page, gamesPerPage);

    if (data.results.length === 0) {
      break;
    }

    allGames = [...allGames, ...data.results];
    if (!data.next) {
      console.log('no more pages..');
      break;
    }
  }

  return allGames.map(game => {
    const releaseDate = game.released;
    const poster = game.background_image;
    const title = game.name;
    const gameId = game.id;
    const description = game.description;
    const platforms = game.platforms;
    const genres = game.genres;
    const rating = game.rating;
    return {
      releaseDate, poster, title, gameId, platforms, genres, rating, description
    }
  });
}

const array = await getDataInfos();
games = array.slice(currentIndex, currentIndex + step);

// Intersection Observer pour l'animation des cartes
function setupObserver() {
  const options = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // L'élément entre dans la zone visible
        entry.target.classList.add('visible');
      } else {
        // L'élément sort de la zone visible
        entry.target.classList.remove('visible');
      }
    });
  }, options);
}

function observeCards() {
  const cards = document.querySelectorAll('.game-card');
  cards.forEach(card => {
    observer.observe(card);
  });
}

// create homepage html
function initializeHomepage() {
  // header load more button
  const divBtnLoad = document.createElement('div');
  divBtnLoad.classList.add('loadMore');
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btnLoadMore');
  button.textContent = 'Load More Games';
  divBtnLoad.appendChild(button);
  header.appendChild(divBtnLoad);

  // main container
  const containerGames = document.createElement('div');
  containerGames.classList.add('games-container');
  main.appendChild(containerGames);

  return {
    button, containerGames
  }
}

function InitializeCardPage(game) {
  console.log('InitializeCardPage called with game:', game);
  const { releaseDate, poster, title, platforms, genres, rating, description } = game;

  // header
  // hide homepage loadmore button
  const loadBtn = document.querySelector('.loadMore');
  console.log('Load button found:', loadBtn);
  if (loadBtn) {
    loadBtn.classList.add('hiddenLoad');
    console.log('Added hiddenLoad class to load button');
  } else {
    console.error('Load button not found!');
  }

  // Créer le bouton de retour
  const backButton = document.createElement('button');
  backButton.classList.add('backButton');
  backButton.textContent = '← Back to Games';
  backButton.addEventListener('click', () => {
    goBackToHomepage();
  });

  const divTitle = document.createElement('div');
  divTitle.classList.add('titlePage');
  divTitle.appendChild(backButton);

  const h2Page = document.createElement('h2');
  h2Page.textContent = title;
  const ratingPar = document.createElement('p');
  const releasedPar = document.createElement('p');
  ratingPar.textContent = `Rating: ${rating}`;
  releasedPar.textContent = `Released: ${releaseDate}`;
  divTitle.appendChild(h2Page);
  divTitle.appendChild(ratingPar);
  divTitle.appendChild(releasedPar);

  // main
  // hide games container
  const gamesContainer = document.querySelector('.games-container');
  console.log('Games container found:', gamesContainer);
  if (gamesContainer) {
    gamesContainer.classList.add('hiddenGames');
    console.log('Added hiddenGames class to games container');
  } else {
    console.error('Games container not found!');
  }

  const section = document.createElement('section');
  section.classList.add('oneCardContainer');
  // image
  const divImage = document.createElement('div');
  divImage.classList.add('containerImage');
  const imagePage = document.createElement('img');
  imagePage.src = poster;
  imagePage.alt = title;
  divImage.appendChild(imagePage);
  section.appendChild(divImage);
  // description
  const divDescription = document.createElement('div');
  divDescription.classList.add('gameDescription');
  const divDescriptionPar = document.createElement('div');
  divDescriptionPar.classList.add('descriptionDiv');
  const descriptionPar = document.createElement('p');
  descriptionPar.textContent = description || 'No description available';
  divDescriptionPar.appendChild(descriptionPar);

  // platforms
  const platformsContainer = document.createElement('div');
  const platformsH4 = document.createElement('h4');
  const platformsUl = document.createElement('ul');
  platformsContainer.classList.add('platformsGame');
  platformsH4.textContent = 'Platforms';

  // Extraire les noms des plateformes
  if (platforms && platforms.length > 0) {
    platforms.forEach(platformObj => {
      const platformLi = document.createElement('li');
      platformLi.textContent = platformObj.platform ? platformObj.platform.name : platformObj.name || platformObj;
      platformsUl.appendChild(platformLi);
    });
  } else {
    const platformLi = document.createElement('li');
    platformLi.textContent = 'No platforms available';
    platformsUl.appendChild(platformLi);
  }

  platformsContainer.appendChild(platformsH4);
  platformsContainer.appendChild(platformsUl);

  // genres
  const genresContainer = document.createElement('div');
  const genresH4 = document.createElement('h4');
  const genresUl = document.createElement('ul');
  genresContainer.classList.add('genresGame');
  genresH4.textContent = 'Genres';

  // Extraire les noms des genres
  if (genres && genres.length > 0) {
    genres.forEach(genreObj => {
      const genreLi = document.createElement('li');
      genreLi.textContent = genreObj.name || genreObj;
      genresUl.appendChild(genreLi);
    });
  } else {
    const genreLi = document.createElement('li');
    genreLi.textContent = 'No genres available';
    genresUl.appendChild(genreLi);
  }

  genresContainer.appendChild(genresH4);
  genresContainer.appendChild(genresUl);

  divDescription.appendChild(divDescriptionPar);
  divDescription.appendChild(platformsContainer);
  divDescription.appendChild(genresContainer);

  section.appendChild(divDescription);

  header.appendChild(divTitle);
  main.appendChild(section);

  return {
    divTitle, section
  }
}

// create a single game card
function createGameCard(game) {
  const { poster, title } = game;

  const divGame = document.createElement('div');
  divGame.classList.add('game-card');

  const img = document.createElement('img');
  img.classList.add('poster');
  img.src = poster;
  img.alt = title;
  divGame.appendChild(img);

  const divBtnMore = document.createElement('div');
  divBtnMore.classList.add('btnH3');

  const h3 = document.createElement('h3');
  h3.textContent = title;
  divBtnMore.appendChild(h3);

  const btnReadMore = document.createElement('button');
  btnReadMore.classList.add('readMore');
  btnReadMore.type = 'button';
  btnReadMore.innerHTML = 'Read More';
  divBtnMore.appendChild(btnReadMore);

  divGame.appendChild(divBtnMore);

  return divGame;
}

// create games cards
function createCards(gamesToRender = games) {
  const containerGames = document.querySelector('.games-container');

  if (gamesToRender.length === 0) {
    console.error('No games found');
    return;
  }

  if (!containerGames) {
    console.error('Games container not found');
    return;
  }

  gamesToRender.forEach((game) => {
    const gameCard = createGameCard(game);
    containerGames.appendChild(gameCard);
  });

  // Observer toutes les cartes (nouvelles et existantes)
  observeCards();
}

// Créer les flèches de scroll
function createScrollArrows() {
  console.log('Creating scroll arrows...');
  const scrollContainer = document.createElement('div');
  scrollContainer.classList.add('scroll-arrows');

  // Flèche vers le haut
  const upArrow = document.createElement('button');
  upArrow.classList.add('scroll-arrow', 'scroll-up');
  upArrow.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M7 14l5-5 5 5z"/>
    </svg>
  `;

  // Flèche vers le bas
  const downArrow = document.createElement('button');
  downArrow.classList.add('scroll-arrow', 'scroll-down');
  downArrow.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M7 10l5 5 5-5z"/>
    </svg>
  `;

  scrollContainer.appendChild(upArrow);
  scrollContainer.appendChild(downArrow);
  document.body.appendChild(scrollContainer);

  console.log('Scroll arrows created and added to DOM');
  return { upArrow, downArrow };
}

// Gérer le scroll avec les flèches
function setupScrollArrows() {
  const { upArrow, downArrow } = createScrollArrows();

  function getCardRows() {
    const cards = Array.from(document.querySelectorAll('.game-card.visible'));
    if (cards.length === 0) return [];

    const rows = [];
    const tolerance = 50; // Tolérance pour considérer des cartes sur la même ligne

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardTop = rect.top + window.pageYOffset;

      // Cherche si cette carte appartient à une row existante
      let addedToExistingRow = false;
      for (let row of rows) {
        if (Math.abs(cardTop - row) < tolerance) {
          addedToExistingRow = true;
          break;
        }
      }

      // Si pas trouvé de row existante, crée une nouvelle row
      if (!addedToExistingRow) {
        rows.push(cardTop);
      }
    });

    return rows.sort((a, b) => a - b);
  }

  upArrow.addEventListener('click', () => {
    console.log('Up arrow clicked');
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 100) {
      // Si on est déjà en haut, aller tout en haut
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }

    // Version simplifiée : scroll par viewport
    const viewportHeight = window.innerHeight;
    const targetRow = Math.max(0, currentScroll - viewportHeight);

    console.log('Scrolling to:', targetRow);
    window.scrollTo({
      top: targetRow,
      behavior: 'smooth'
    });
  });

  downArrow.addEventListener('click', () => {
    console.log('Down arrow clicked');
    const currentScroll = window.pageYOffset;

    // Version simplifiée : scroll par viewport
    const viewportHeight = window.innerHeight;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const targetRow = Math.min(maxScroll, currentScroll + viewportHeight);

    console.log('Scrolling to:', targetRow);
    window.scrollTo({
      top: targetRow,
      behavior: 'smooth'
    });
  });

  // Masquer/afficher les flèches selon la position
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const scrollHeight = document.body.scrollHeight - window.innerHeight;

    // Masquer flèche haut si on est en haut
    upArrow.style.opacity = scrollTop > 100 ? '1' : '0.3';

    // Masquer flèche bas si on est en bas
    downArrow.style.opacity = scrollTop < scrollHeight - 100 ? '1' : '0.3';
  });
}


// load more games with button
function showMore() {
  const btnLoadMore = document.querySelector('.btnLoadMore');
  if (!btnLoadMore) {
    console.error('Load more button not found');
    return;
  }

  btnLoadMore.addEventListener('click', (event) => {
    event.preventDefault();
    currentIndex += step;
    if (currentIndex >= array.length) {
      btnLoadMore.disabled = true;
      btnLoadMore.textContent = 'Tous les jeux chargés';
      return;
    }
    const newGames = array.slice(currentIndex, currentIndex + step);
    games = [...games, ...newGames];

    createCards(newGames);
  });
}

// Read More information about game
function readMore() {
  // Utiliser la délégation d'événements pour gérer les clics sur les boutons "Read More"
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('readMore')) {
      console.log('Read More button clicked!');
      event.preventDefault();

      // Trouver la carte parente pour obtenir le titre du jeu
      const gameCard = event.target.closest('.game-card');
      const gameTitle = gameCard.querySelector('h3').textContent;
      console.log('Game title found:', gameTitle);

      // Trouver les données du jeu correspondant
      const gameData = games.find(game => game.title === gameTitle);
      console.log('Game data found:', gameData);

      if (gameData) {
        InitializeCardPage(gameData);
      } else {
        console.error('No game data found for title:', gameTitle);
      }
    }
  });
}

// Fonction pour revenir à la page d'accueil
function goBackToHomepage() {
  // Supprimer la page de détail
  const titlePage = document.querySelector('.titlePage');
  const detailSection = document.querySelector('.oneCardContainer');

  if (titlePage) {
    titlePage.remove();
  }
  if (detailSection) {
    detailSection.remove();
  }

  // Réafficher les éléments de la page d'accueil
  const loadBtn = document.querySelector('.loadMore');
  const gamesContainer = document.querySelector('.games-container');

  if (loadBtn) {
    loadBtn.classList.remove('hiddenLoad');
  }
  if (gamesContainer) {
    gamesContainer.classList.remove('hiddenGames');
  }
}

// Initialize the application
function initApp() {
  // Setup the intersection observer
  setupObserver();

  // Create the homepage structure
  initializeHomepage();

  // Create the card page structure
  readMore();

  // Create initial cards
  createCards(games);

  // Set up event listeners
  showMore();

  // Setup scroll arrows with a small delay to ensure DOM is ready
  setTimeout(() => {
    setupScrollArrows();
  }, 100);
}

// Start the application
initApp();

