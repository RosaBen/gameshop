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

// get detailed game information by ID
const getGameDetails = async (gameId) => {
  try {
    // Construire l'URL pour récupérer les détails d'un jeu spécifique
    const baseUrl = url.split('?')[0]; // Enlever les paramètres de l'URL de base
    const apiKey = url.match(/key=([^&]*)/)?.[1]; // Extraire la clé API
    const detailUrl = `${baseUrl}/${gameId}?key=${apiKey}`;

    console.log('Fetching game details from:', detailUrl);
    const response = await fetch(detailUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const gameDetails = await response.json();
    console.log('Game details received:', gameDetails);
    return gameDetails;
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
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
    const slug = game.slug; // Ajouter le slug
    const tags = game.tags; // Ajouter les tags
    return {
      releaseDate, poster, title, gameId, platforms, genres, rating, description, slug, tags
    }
  });
}

const array = await getDataInfos();
games = array.slice(currentIndex, currentIndex + step);

// Variables globales pour la recherche
let allGames = array; // Garder une référence à tous les jeux
let filteredGames = []; // Jeux filtrés par la recherche
let isSearchActive = false; // État de la recherche

// Variables globales pour la navigation SPA
const DOMAIN = window.location.origin; // Récupère automatiquement le domaine
let currentRoute = null;

// Fonctions de navigation SPA
function navigateToGame(slug) {
  const gameUrl = `${DOMAIN}/game/${slug}`;
  window.history.pushState({ route: 'game', slug: slug }, '', gameUrl);
  currentRoute = { type: 'game', slug: slug };

  // Trouver et afficher le jeu
  const game = allGames.find(g => g.slug === slug);
  if (game) {
    InitializeCardPage(game);
  } else {
    console.error('Game not found for slug:', slug);
    // Essayer de récupérer le jeu via l'API
    loadGameBySlug(slug);
  }
}

function navigateToHome() {
  window.history.pushState({ route: 'home' }, '', DOMAIN);
  currentRoute = { type: 'home' };
  goBackToHomepage();
}

// Fonction pour charger un jeu par slug via l'API si pas trouvé localement
async function loadGameBySlug(slug) {
  try {
    const baseUrl = url.split('?')[0];
    const apiKey = url.match(/key=([^&]*)/)?.[1];
    const gameUrl = `${baseUrl}/${slug}?key=${apiKey}`;

    console.log('Loading game by slug:', gameUrl);
    const response = await fetch(gameUrl);

    if (!response.ok) {
      throw new Error(`Game not found: ${response.status}`);
    }

    const gameData = await response.json();
    console.log('Game loaded by slug:', gameData);

    // Convertir les données API au format de notre application
    const game = {
      releaseDate: gameData.released,
      poster: gameData.background_image,
      title: gameData.name,
      gameId: gameData.id,
      description: gameData.description,
      platforms: gameData.platforms,
      genres: gameData.genres,
      rating: gameData.rating,
      slug: gameData.slug,
      tags: gameData.tags
    };

    await InitializeCardPage(game);
  } catch (error) {
    console.error('Error loading game by slug:', error);
    // Rediriger vers la page d'accueil en cas d'erreur
    navigateToHome();
  }
}

// Gérer la navigation avec les boutons précédent/suivant du navigateur
function handlePopState(event) {
  if (event.state) {
    currentRoute = event.state;
    if (event.state.route === 'home') {
      goBackToHomepage();
    } else if (event.state.route === 'game' && event.state.slug) {
      const game = allGames.find(g => g.slug === event.state.slug);
      if (game) {
        InitializeCardPage(game);
      } else {
        loadGameBySlug(event.state.slug);
      }
    }
  } else {
    // Pas d'état, probablement la page d'accueil
    currentRoute = { type: 'home' };
    goBackToHomepage();
  }
}

// Parser l'URL actuelle pour déterminer la route
function parseCurrentUrl() {
  const path = window.location.pathname;
  const gameMatch = path.match(/\/game\/(.+)$/);

  if (gameMatch) {
    const slug = gameMatch[1];
    currentRoute = { type: 'game', slug: slug };
    return { type: 'game', slug: slug };
  } else {
    currentRoute = { type: 'home' };
    return { type: 'home' };
  }
}

// Initialiser la navigation SPA
function initializeSPA() {
  // Écouter les changements d'URL
  window.addEventListener('popstate', handlePopState);

  // Parser l'URL actuelle au chargement
  const route = parseCurrentUrl();

  if (route.type === 'game') {
    // Si on est sur une page de jeu, la charger
    const game = allGames.find(g => g.slug === route.slug);
    if (game) {
      // Attendre que le DOM soit prêt avant d'afficher la page de jeu
      setTimeout(() => {
        InitializeCardPage(game);
      }, 100);
    } else {
      // Essayer de charger via l'API
      setTimeout(() => {
        loadGameBySlug(route.slug);
      }, 100);
    }
  }
  // Si c'est la page d'accueil, ne rien faire (affichage par défaut)
}

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

async function InitializeCardPage(game) {
  console.log('InitializeCardPage called with game:', game);
  const { releaseDate, poster, title, platforms, genres, rating, gameId, slug, tags } = game;

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

  // Créer le bouton de retour
  const backButton = document.createElement('button');
  backButton.classList.add('backButton');
  backButton.textContent = '← Back to Games';
  backButton.addEventListener('click', () => {
    navigateToHome();
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

  // description container
  const divDescription = document.createElement('div');
  divDescription.classList.add('gameDescription');
  const divDescriptionPar = document.createElement('div');
  divDescriptionPar.classList.add('descriptionDiv');

  // Ajouter un loader pendant le chargement des détails
  const loadingText = document.createElement('p');
  loadingText.textContent = 'Loading detailed description...';
  loadingText.classList.add('loading-text');
  divDescriptionPar.appendChild(loadingText);

  // Récupérer les détails du jeu
  try {
    console.log('Fetching details for game ID:', gameId);
    const gameDetails = await getGameDetails(gameId);

    // Supprimer le texte de chargement
    loadingText.remove();

    if (gameDetails) {
      // Utiliser la description détaillée si disponible
      const description = gameDetails.description_raw || gameDetails.description || game.description || 'No description available';

      const descriptionPar = document.createElement('p');
      descriptionPar.innerHTML = description; // Utiliser innerHTML pour supporter le HTML
      divDescriptionPar.appendChild(descriptionPar);

      // Mettre à jour les plateformes et genres avec les données détaillées si disponibles
      const detailedPlatforms = gameDetails.platforms || platforms;
      const detailedGenres = gameDetails.genres || genres;

      // platforms
      const platformsContainer = document.createElement('div');
      const platformsH4 = document.createElement('h4');
      const platformsUl = document.createElement('ul');
      platformsContainer.classList.add('platformsGame');
      platformsH4.textContent = 'Platforms';

      // Extraire les noms des plateformes
      if (detailedPlatforms && detailedPlatforms.length > 0) {
        detailedPlatforms.forEach(platformObj => {
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
      if (detailedGenres && detailedGenres.length > 0) {
        detailedGenres.forEach(genreObj => {
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

      // tags
      const tagsContainer = document.createElement('div');
      const tagsH4 = document.createElement('h4');
      const tagsUl = document.createElement('ul');
      tagsContainer.classList.add('tagsGame');
      tagsH4.textContent = 'Tags';

      // Extraire les noms des tags (utiliser les tags détaillés ou ceux de base)
      const detailedTags = gameDetails.tags || tags;
      if (detailedTags && detailedTags.length > 0) {
        // Limiter à 10 tags pour éviter l'encombrement
        detailedTags.slice(0, 10).forEach(tagObj => {
          const tagLi = document.createElement('li');
          tagLi.textContent = tagObj.name || tagObj;
          tagsUl.appendChild(tagLi);
        });
      } else {
        const tagLi = document.createElement('li');
        tagLi.textContent = 'No tags available';
        tagsUl.appendChild(tagLi);
      }

      tagsContainer.appendChild(tagsH4);
      tagsContainer.appendChild(tagsUl);

      divDescription.appendChild(divDescriptionPar);
      divDescription.appendChild(platformsContainer);
      divDescription.appendChild(genresContainer);
      divDescription.appendChild(tagsContainer);
    } else {
      // Si on ne peut pas récupérer les détails, utiliser les données de base
      const descriptionPar = document.createElement('p');
      descriptionPar.textContent = game.description || 'No description available';
      divDescriptionPar.appendChild(descriptionPar);

      // Ajouter les plateformes et genres de base
      addPlatformsAndGenres(divDescription, platforms, genres, tags);
    }
  } catch (error) {
    console.error('Error loading game details:', error);
    // En cas d'erreur, supprimer le loader et afficher un message d'erreur
    loadingText.remove();
    const errorPar = document.createElement('p');
    errorPar.textContent = 'Error loading detailed description. Using basic information.';
    errorPar.classList.add('error-text');
    divDescriptionPar.appendChild(errorPar);

    // Ajouter les plateformes et genres de base
    addPlatformsAndGenres(divDescription, platforms, genres, tags);
  }

  section.appendChild(divDescription);
  header.appendChild(divTitle);
  main.appendChild(section);

  return {
    divTitle, section
  }
}

// Fonction helper pour ajouter plateformes et genres
function addPlatformsAndGenres(container, platforms, genres, tags) {
  // platforms
  const platformsContainer = document.createElement('div');
  const platformsH4 = document.createElement('h4');
  const platformsUl = document.createElement('ul');
  platformsContainer.classList.add('platformsGame');
  platformsH4.textContent = 'Platforms';

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

  // tags
  if (tags) {
    const tagsContainer = document.createElement('div');
    const tagsH4 = document.createElement('h4');
    const tagsUl = document.createElement('ul');
    tagsContainer.classList.add('tagsGame');
    tagsH4.textContent = 'Tags';

    if (tags && tags.length > 0) {
      // Limiter à 10 tags
      tags.slice(0, 10).forEach(tagObj => {
        const tagLi = document.createElement('li');
        tagLi.textContent = tagObj.name || tagObj;
        tagsUl.appendChild(tagLi);
      });
    } else {
      const tagLi = document.createElement('li');
      tagLi.textContent = 'No tags available';
      tagsUl.appendChild(tagLi);
    }

    tagsContainer.appendChild(tagsH4);
    tagsContainer.appendChild(tagsUl);
    container.appendChild(tagsContainer);
  }

  container.appendChild(platformsContainer);
  container.appendChild(genresContainer);
}

// Fonction de recherche
function searchGames(searchTerm) {
  console.log('Searching for:', searchTerm);

  if (!searchTerm || searchTerm.trim() === '') {
    // Si la recherche est vide, revenir à l'affichage normal
    isSearchActive = false;
    clearGameContainer();
    currentIndex = 0;
    games = allGames.slice(currentIndex, currentIndex + step);
    createCards(games);
    showLoadMoreButton();
    return;
  }

  isSearchActive = true;
  const term = searchTerm.toLowerCase().trim();

  // Filtrer les jeux par titre, genres, plateformes et tags
  filteredGames = allGames.filter(game => {
    // Recherche dans le titre
    const titleMatch = game.title.toLowerCase().includes(term);

    // Recherche dans les genres
    const genreMatch = game.genres && game.genres.some(genre =>
      genre.name && genre.name.toLowerCase().includes(term)
    );

    // Recherche dans les plateformes
    const platformMatch = game.platforms && game.platforms.some(platform => {
      const platformName = platform.platform ? platform.platform.name : platform.name;
      return platformName && platformName.toLowerCase().includes(term);
    });

    // Recherche dans les tags
    const tagMatch = game.tags && game.tags.some(tag =>
      tag.name && tag.name.toLowerCase().includes(term)
    );

    return titleMatch || genreMatch || platformMatch || tagMatch;
  });

  console.log(`Found ${filteredGames.length} games matching "${searchTerm}"`);

  // Afficher les résultats
  clearGameContainer();
  if (filteredGames.length > 0) {
    createCards(filteredGames);
    hideLoadMoreButton();
  } else {
    showNoResultsMessage(searchTerm);
    hideLoadMoreButton();
  }
}

// Vider le conteneur de jeux
function clearGameContainer() {
  const containerGames = document.querySelector('.games-container');
  if (containerGames) {
    containerGames.innerHTML = '';
  }
}

// Afficher un message quand aucun résultat n'est trouvé
function showNoResultsMessage(searchTerm) {
  const containerGames = document.querySelector('.games-container');
  if (containerGames) {
    const noResultsDiv = document.createElement('div');
    noResultsDiv.classList.add('no-results');
    noResultsDiv.innerHTML = `
      <h3>No games found for "${searchTerm}"</h3>
      <p>Try searching with different keywords or check your spelling.</p>
    `;
    containerGames.appendChild(noResultsDiv);
  }
}

// Cacher le bouton Load More
function hideLoadMoreButton() {
  const loadBtn = document.querySelector('.loadMore');
  if (loadBtn) {
    loadBtn.classList.add('hiddenLoad');

    // En mode mobile, retirer le padding-top du body
    if (window.innerWidth <= 768) {
      document.body.style.paddingTop = '0';
    }
  }
}

// Montrer le bouton Load More
function showLoadMoreButton() {
  const loadBtn = document.querySelector('.loadMore');
  if (loadBtn) {
    loadBtn.classList.remove('hiddenLoad');

    // En mode mobile, remettre le padding-top du body
    if (window.innerWidth <= 768) {
      document.body.style.paddingTop = window.innerWidth <= 480 ? '55px' : '60px';
    }
  }
}

// Configurer la barre de recherche
function setupSearchBar() {
  const searchInput = document.querySelector('.inputSearch');
  if (!searchInput) {
    console.error('Search input not found');
    return;
  }

  let searchTimeout;

  // Fonction de debounce pour éviter trop d'appels API
  const debouncedSearch = (searchTerm) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchGames(searchTerm);
    }, 300); // Attendre 300ms après que l'utilisateur arrête de taper
  };

  // Événement sur la saisie
  searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value;
    debouncedSearch(searchTerm);
  });

  // Événement sur la touche Entrée
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      clearTimeout(searchTimeout);
      searchGames(event.target.value);
    }
  });

  // Effacer la recherche quand on vide le champ
  searchInput.addEventListener('blur', () => {
    if (searchInput.value.trim() === '') {
      searchGames('');
    }
  });
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
  // Ne pas créer les flèches sur mobile
  if (window.innerWidth <= 768) {
    return;
  }

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

    // Ne pas charger plus de jeux si on est en mode recherche
    if (isSearchActive) {
      console.log('Search mode active, not loading more games');
      return;
    }

    currentIndex += step;
    if (currentIndex >= allGames.length) {
      btnLoadMore.disabled = true;
      btnLoadMore.textContent = 'Tous les jeux chargés';
      btnLoadMore.style.opacity = '0.6';
      return;
    }

    const newGames = allGames.slice(currentIndex, currentIndex + step);
    games = [...games, ...newGames];

    // Ajouter feedback visuel pendant le chargement
    btnLoadMore.classList.add('loading');
    btnLoadMore.textContent = 'Chargement...';
    btnLoadMore.disabled = true;

    // Créer les nouvelles cartes
    createCards(newGames);

    // Remettre le bouton normal après un court délai
    setTimeout(() => {
      btnLoadMore.classList.remove('loading');
      btnLoadMore.textContent = 'Load More Games';
      btnLoadMore.disabled = false;

      // En mode mobile, scroll automatiquement vers les nouvelles cartes
      if (window.innerWidth <= 768) {
        const gamesContainer = document.querySelector('.games-container');
        const lastCards = gamesContainer.querySelectorAll('.game-card');
        if (lastCards.length > 0) {
          // Scroll vers la première nouvelle carte
          const targetCard = lastCards[lastCards.length - newGames.length];
          if (targetCard) {
            setTimeout(() => {
              targetCard.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
              });
            }, 300);
          }
        }
      }
    }, 800);
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

      // Trouver les données du jeu correspondant dans tous les jeux (pas seulement ceux affichés)
      let gameData;
      if (isSearchActive) {
        gameData = filteredGames.find(game => game.title === gameTitle);
      } else {
        gameData = games.find(game => game.title === gameTitle);
      }

      // Si pas trouvé dans les jeux actuels, chercher dans tous les jeux
      if (!gameData) {
        gameData = allGames.find(game => game.title === gameTitle);
      }

      console.log('Game data found:', gameData);

      if (gameData && gameData.slug) {
        // Utiliser la navigation SPA avec le slug
        navigateToGame(gameData.slug);
      } else {
        console.error('No game data or slug found for title:', gameTitle);
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
  const gamesContainer = document.querySelector('.games-container');
  if (gamesContainer) {
    gamesContainer.classList.remove('hiddenGames');
  }

  // Restaurer l'état approprié (recherche ou normal)
  if (isSearchActive) {
    // Si on était en mode recherche, garder les résultats de recherche
    hideLoadMoreButton();
  } else {
    // Sinon, réafficher le bouton Load More
    showLoadMoreButton();
  }

  // Mettre à jour la route actuelle
  currentRoute = { type: 'home' };
}

// Initialize the application
function initApp() {
  // Setup the intersection observer
  setupObserver();

  // Create the homepage structure
  initializeHomepage();

  // Setup search functionality
  setupSearchBar();

  // Initialize SPA navigation
  initializeSPA();

  // Create the card page structure
  readMore();

  // Create initial cards (seulement si on est sur la page d'accueil)
  if (!currentRoute || currentRoute.type === 'home') {
    createCards(games);
  }

  // Set up event listeners
  showMore();

  // Setup scroll arrows with a small delay to ensure DOM is ready
  setTimeout(() => {
    setupScrollArrows();
  }, 100);

  // Setup responsive handlers
  setupResponsiveHandlers();
}

// Setup responsive event handlers
function setupResponsiveHandlers() {
  let resizeTimeout;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const loadBtn = document.querySelector('.loadMore');

      if (loadBtn && !loadBtn.classList.contains('hiddenLoad')) {
        // Ajuster le padding du body selon la taille d'écran
        if (window.innerWidth <= 768) {
          document.body.style.paddingTop = window.innerWidth <= 480 ? '55px' : '60px';
        } else {
          document.body.style.paddingTop = '0';
        }
      }

      // Gérer l'affichage des scroll arrows selon la taille d'écran
      const scrollArrows = document.querySelector('.scroll-arrows');
      if (scrollArrows) {
        if (window.innerWidth <= 768) {
          scrollArrows.style.display = 'none';
        } else {
          scrollArrows.style.display = 'block';
        }
      }
    }, 250);
  });
}

// Start the application
initApp();

