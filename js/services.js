class JsonRepository {
  static cache = new Map();

  static load(path){
    if(!this.cache.has(path)){
      this.cache.set(path, fetch(path).then(response => {
        if(!response.ok) throw new Error(`Unable to load ${path}`);
        return response.json();
      }));
    }
    return this.cache.get(path);
  }
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, character => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  })[character]);
}

class ThemeService {
  constructor(repository = JsonRepository){this.repository = repository;this.items = [];}
  async load(){
    this.items = (await this.repository.load('data/themes.json')).map(theme => ({
      ...theme, tag:'Travel theme', desc:theme.description, wiki:theme.name
    }));
    return this.items;
  }
  getAll(){return this.items;}
}

class DestinationService {
  constructor(repository = JsonRepository){this.repository = repository;this.items = [];}
  async load(){
    const items = await this.repository.load('data/destinations.json');
    this.items = items.map(destination => {
      const {lat, lon} = destination.coordinates;
      return {
        ...destination,
        tag:destination.province,
        desc:destination.shortDescription,
        wiki:destination.name,
        icon:'i-map',
        lat,
        lon,
        x:Math.round(32 + ((lon - 79.6) / 2.4) * 166),
        y:Math.round(376 - ((lat - 5.8) / 4.2) * 344)
      };
    });
    return this.items;
  }
  getAll(){return this.items;}
}

class ExperienceService {
  constructor(repository = JsonRepository){this.repository = repository;this.items = [];}
  async load(){
    this.items = (await this.repository.load('data/experiences.json')).map(experience => ({
      ...experience,
      desc:experience.shortDescription
    }));
    return this.items;
  }
  getAll(){return this.items;}
}

class BuilderState {
  constructor(){
    this.themes = new Set();
    this.destinations = new Set();
    this.experiences = new Set();
    this.otherThemes = [];
    this.otherDestinations = [];
    this.otherExperiences = [];
    this.nights = 14;
    this.travelers = 2;
    this.tier = '4star';
    this.pace = 'balanced';
    this.vehicle = 'van';
    this.guide = null;
    this.travelMonth = '';
  }
}

class JourneyEngine {
  static priorityOrder = new Map([
    ['Must Do', 0],
    ['Popular', 1],
    ['Hidden Gem', 2],
    ['Seasonal', 3]
  ]);

  constructor(destinationService, experienceService){
    this.destinationService = destinationService;
    this.experienceService = experienceService;
  }

  getAvailableDestinations(selectedThemes){
    const selected = new Set(selectedThemes);
    if(!selected.size) return [];
    return this.destinationService.getAll()
      .filter(destination => destination.themeIds.some(themeId => selected.has(themeId)))
      .sort((a,b) => a.name.localeCompare(b.name));
  }

  filterBySelections(items, selectedIds, relationKey){
    const selected = new Set(selectedIds);
    if(!selected.size) return [];
    return items.filter(item => (item[relationKey] || []).some(id => selected.has(id)));
  }

  getAvailableExperiences(selectedDestinations){
    const matches = this.filterBySelections(
      this.experienceService.getAll(),
      selectedDestinations,
      'destinationIds'
    );
    return [...new Map(matches.map(experience => [experience.id, experience])).values()]
      .sort((a,b) => {
        const priority = JourneyEngine.priorityOrder.get(a.priority) - JourneyEngine.priorityOrder.get(b.priority);
        return priority || a.name.localeCompare(b.name);
      });
  }
}
