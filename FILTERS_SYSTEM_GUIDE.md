# Guide du Système de Filtres - Games Shop

Ce guide documente le système de filtres avancé implémenté pour permettre la recherche par plateformes, genres et années dans le projet Games Shop.

## 🎯 Fonctionnalités du Système de Filtres

### 1. Interface de Filtres
- **Bouton toggle responsive** : Affiche/masque les filtres avec animation
- **Trois types de filtres** : Plateformes, Genres, Années
- **Bouton Reset** : Réinitialise tous les filtres
- **Design responsive** : S'adapte aux écrans mobiles et desktop

### 2. Intégration API
- **Filtres URL** : Paramètres ajoutés dynamiquement à l'API RAWG
- **Chargement intelligent** : Load More fonctionne avec les filtres actifs
- **Performance** : Requêtes optimisées selon les filtres sélectionnés

## 🛠️ Architecture Technique

### Variables Globales
```javascript
// Variables pour les filtres
let currentFilters = {
  platforms: '',
  genres: '',
  dates: ''
};
```

### Fonction getData Modifiée
```javascript
const getData = async (page = 1, pageSize = 40, filters = null) => {
  try {
    let apiUrl = `${url}&page_size=${pageSize}&page=${page}`;
    
    // Ajouter les filtres à l'URL si ils existent
    if (filters) {
      if (filters.platforms) {
        apiUrl += `&platforms=${filters.platforms}`;
      }
      if (filters.genres) {
        apiUrl += `&genres=${filters.genres}`;
      }
      if (filters.dates) {
        apiUrl += `&dates=${filters.dates}`;
      }
    }
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    return {
      results: data.results,
      next: data.next
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { results: [], next: null };
  }
};
```

## 🎨 Interface Utilisateur

### Structure HTML Générée
```javascript
function createFiltersContainer() {
  const filtersDiv = document.createElement('div');
  filtersDiv.classList.add('filters-container');

  // Bouton toggle
  const toggleBtn = document.createElement('button');
  toggleBtn.classList.add('filters-toggle');
  toggleBtn.innerHTML = '<span>🎮</span> Filtres';

  // Conteneur des filtres
  const filtersContent = document.createElement('div');
  filtersContent.classList.add('filters-content');

  // Sélecteurs de filtres...
  return filtersDiv;
}
```

### Sélecteurs de Filtres

#### Plateformes Disponibles
```javascript
const platformsSelect = createFilterSelect('platforms', 'Plateformes', [
  { value: '', text: 'Toutes les plateformes' },
  { value: '4', text: 'PC' },
  { value: '18', text: 'PlayStation 4' },
  { value: '1', text: 'Xbox One' },
  { value: '7', text: 'Nintendo Switch' },
  { value: '3', text: 'iOS' },
  { value: '21', text: 'Android' }
]);
```

#### Genres Disponibles
```javascript
const genresSelect = createFilterSelect('genres', 'Genres', [
  { value: '', text: 'Tous les genres' },
  { value: '4', text: 'Action' },
  { value: '51', text: 'Indie' },
  { value: '3', text: 'Adventure' },
  { value: '5', text: 'RPG' },
  { value: '10', text: 'Strategy' },
  { value: '2', text: 'Shooter' },
  // ... autres genres
]);
```

#### Filtres par Années
```javascript
const datesSelect = createFilterSelect('dates', 'Années', [
  { value: '', text: 'Toutes les années' },
  { value: '2024-01-01,2024-12-31', text: '2024' },
  { value: '2023-01-01,2023-12-31', text: '2023' },
  // ... autres années
]);
```

## 🔄 Gestion des Événements

### Event Listeners
```javascript
function setupFiltersEventListeners(toggleBtn, filtersContent, resetBtn) {
  // Toggle filtres
  toggleBtn.addEventListener('click', () => {
    filtersContent.classList.toggle('open');
    toggleBtn.classList.toggle('active');
  });

  // Event listeners pour les sélecteurs
  const selects = filtersContent.querySelectorAll('select');
  selects.forEach(select => {
    select.addEventListener('change', handleFilterChange);
  });

  // Reset filtres
  resetBtn.addEventListener('click', resetFilters);
}
```

### Changement de Filtres
```javascript
function handleFilterChange() {
  const platformsSelect = document.getElementById('filter-platforms');
  const genresSelect = document.getElementById('filter-genres');
  const datesSelect = document.getElementById('filter-dates');

  currentFilters = {
    platforms: platformsSelect.value,
    genres: genresSelect.value,
    dates: datesSelect.value
  };

  console.log('Filtres appliqués:', currentFilters);
  applyFilters();
}
```

### Application des Filtres
```javascript
async function applyFilters() {
  try {
    // Réinitialiser l'index
    currentIndex = 0;
    
    // Vider le conteneur
    const gamesContainer = document.querySelector('.games-container');
    gamesContainer.innerHTML = '';
    
    // Récupérer les données avec filtres
    const hasFilters = currentFilters.platforms || currentFilters.genres || currentFilters.dates;
    games = await getDataInfos(hasFilters ? currentFilters : null);
    
    // Afficher les premiers jeux
    await displayGames();
  } catch (error) {
    console.error('Erreur lors de l\'application des filtres:', error);
  }
}
```

## 📱 Design Responsive

### Styles SCSS
```scss
.filters-container {
  margin: 10px 0;
  background: linear-gradient(145deg, #f0f0f0, #ffffff);
  border-radius: var(--border-radius);
  box-shadow: 
    inset 5px 5px 10px rgba(0, 0, 0, 0.1),
    inset -5px -5px 10px rgba(255, 255, 255, 0.9);

  .filters-toggle {
    width: 100%;
    padding: 15px 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
      background: linear-gradient(145deg, #e0e0e0, #f5f5f5);
      box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.1);
    }
  }

  .filters-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;

    &.open {
      max-height: 300px;
      padding: 20px;
    }

    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      
      &.open {
        max-height: 500px;
      }
    }
  }
}
```

### Responsive Breakpoints
```scss
// Mobile
@media (max-width: 768px) {
  .filters-content {
    grid-template-columns: 1fr;
    &.open {
      max-height: 500px;
    }
  }
}

// Mobile très petit
@media (max-width: 480px) {
  .filters-toggle {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
}
```

## 🔄 Intégration Load More

### Load More avec Filtres
```javascript
function showMore() {
  btnLoadMore.addEventListener('click', async (event) => {
    // Vérifier s'il faut charger plus de données depuis l'API
    if (currentIndex + step >= games.length) {
      // Déterminer si on utilise les filtres
      const hasFilters = currentFilters.platforms || currentFilters.genres || currentFilters.dates;
      const newData = await getDataInfos(hasFilters ? currentFilters : null);
      
      if (newData && newData.length > games.length) {
        games = newData;
      }
    }

    // Afficher plus de jeux
    currentIndex += step;
    const newGames = games.slice(currentIndex, currentIndex + step);
    createCards(newGames);
  });
}
```

## 🎮 API RAWG - Paramètres de Filtres

### Plateformes (platforms)
- **PC** : `4`
- **PlayStation 4** : `18`
- **Xbox One** : `1`
- **Nintendo Switch** : `7`
- **iOS** : `3`
- **Android** : `21`

### Genres (genres)
- **Action** : `4`
- **Indie** : `51`
- **Adventure** : `3`
- **RPG** : `5`
- **Strategy** : `10`
- **Shooter** : `2`
- **Casual** : `40`
- **Simulation** : `14`
- **Puzzle** : `7`

### Dates (dates)
Format : `YYYY-MM-DD,YYYY-MM-DD`
Exemple : `2024-01-01,2024-12-31`

## 🔧 Gestion des États

### Masquage/Affichage
```javascript
// Dans InitializeCardPage - masquer les filtres
const filtersContainer = document.querySelector('.filters-container');
if (filtersContainer) {
  filtersContainer.style.display = 'none';
}

// Dans goBackToHomepage - réafficher les filtres
const filtersContainer = document.querySelector('.filters-container');
if (filtersContainer) {
  filtersContainer.style.display = 'block';
}
```

### Reset des Filtres
```javascript
function resetFilters() {
  currentFilters = {
    platforms: '',
    genres: '',
    dates: ''
  };

  // Reset des sélecteurs
  document.getElementById('filter-platforms').value = '';
  document.getElementById('filter-genres').value = '';
  document.getElementById('filter-dates').value = '';

  // Réappliquer sans filtres
  applyFilters();
}
```

## 🧪 Test et Validation

### Checklist Fonctionnelle
- [ ] Filtres s'affichent/masquent avec animation
- [ ] Chaque filtre fonctionne individuellement
- [ ] Combinaison de filtres fonctionne
- [ ] Load More respecte les filtres actifs
- [ ] Reset remet à zéro tous les filtres
- [ ] Interface responsive sur mobile
- [ ] Filtres masqués sur page de détail
- [ ] Filtres réapparaissent au retour homepage

### Test de Performance
```javascript
// Mesurer le temps de réponse des filtres
console.time('filter-apply');
await applyFilters();
console.timeEnd('filter-apply');
```

## 💡 Bonnes Pratiques

### Performance
- **Debounce** : Évite les requêtes multiples
- **Cache local** : Mémorise les résultats de filtres
- **Requêtes optimisées** : Ne charge que ce qui est nécessaire

### UX/UI
- **Feedback visuel** : Loading states pendant les requêtes
- **Animations fluides** : Transitions CSS pour meilleure UX
- **Mobile-first** : Interface adaptée aux écrans tactiles

### Code
- **Modularité** : Fonctions séparées et réutilisables
- **Error handling** : Gestion d'erreurs complète
- **Documentation** : Code commenté et explicite

Ce système de filtres offre une expérience de recherche avancée et intuitive, parfaitement intégrée à l'architecture existante du projet Games Shop.
