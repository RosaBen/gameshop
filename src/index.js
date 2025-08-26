import './style/index.scss'

let games = [];
let currentIndex = 0;
const step = 9;
const url = process.env.API_URL;
const header = document.querySelector('header');
const main = document.querySelector('main');

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
    const platforms = game.platforms;
    const genres = game.genres;
    const rating = game.rating;
    return {
      releaseDate, poster, title, gameId, platforms, genres, rating
    }
  });
}

const array = await getDataInfos();
games = array.slice(currentIndex, currentIndex + step);

// Intersection Observer pour l'animation des cartes
let observer;

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

// Initialize the application
function initApp() {
  // Setup the intersection observer
  setupObserver();

  // Create the homepage structure
  initializeHomepage();

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

