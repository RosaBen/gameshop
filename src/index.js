import './style/index.scss'

let games = [];
let currentIndex = 0;
const step = 9;
const url = process.env.API_URL;
const container = document.querySelector('.games-container');

const getData = async (page = 1, pageSize = 40) => {
  try {
    const response = await fetch(`${url}&page_size=${pageSize}&page=${page}`);
    const data = await response.json();
    return {
      results: data.results,
      count: data.count,
      next: data.next,
      previous: data.previous
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { results: [], count: 0, next: null, previous: null };
  }
};


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

async function createCards(gamesToRender = games) {

  if (gamesToRender.length === 0) {
    console.error('No games found');
    return;
  }

  if (!container) {
    console.error('Games container not found');
    return;
  }

  gamesToRender.forEach((game) => {
    const { poster, title } = game;
    const divGame = document.createElement('div');
    divGame.classList.add('game-card');
    const img = document.createElement('img');
    img.src = poster;
    img.alt = title;
    img.classList.add('poster');
    divGame.appendChild(img);
    const div = document.createElement('div');
    div.classList.add('btnH3');
    const h3 = document.createElement('h3');
    h3.textContent = title;
    div.appendChild(h3);
    const btnReadMore = document.createElement('button');
    btnReadMore.id = 'readMore';
    btnReadMore.type = 'button';
    btnReadMore.innerHTML = 'Read More'
    div.appendChild(btnReadMore);
    divGame.appendChild(div);
    container.appendChild(divGame);
  });
}

function showMore() {
  const btnLoadMore = document.querySelector('.btnLoadMore');
  btnLoadMore.addEventListener('click', (event) => {
    event.preventDefault();
    currentIndex += step;
    if (currentIndex >= array.length) {
      console.log('Tous les jeux ont été chargés');
      btnLoadMore.disabled = true;
      btnLoadMore.textContent = 'Tous les jeux chargés';
      return;
    }
    const newGames = array.slice(currentIndex, currentIndex + step);
    games = [...games, ...newGames];

    createCards(newGames);

  });
}
showMore()

