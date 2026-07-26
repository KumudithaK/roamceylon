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
  constructor(repository = new ThemeRepository()){this.repository = repository;this.items = [];}
  async load(){
    this.items = (await this.repository.listPublished()).map(theme => ({
      ...theme, tag:'Travel theme', desc:theme.description
    }));
    return this.items;
  }
  getAll(){return this.items;}
}

class DestinationService {
  constructor(repository = new DestinationRepository()){this.repository = repository;this.items = [];}
  async load(){
    const items = await this.repository.listPublished();
    this.items = items.map(destination => {
      const {lat, lon} = destination.coordinates;
      return {
        ...destination,
        tag:destination.province,
        desc:destination.shortDescription,
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
  constructor(repository = new ExperienceRepository()){this.repository = repository;this.items = [];}
  async load(){
    this.items = (await this.repository.listPublished()).map(experience => ({
      ...experience,
      desc:experience.shortDescription
    }));
    return this.items;
  }
  getAll(){return this.items;}
}

class MarketplaceService {
  constructor({accommodations=new AccommodationRepository(),vehicles=new VehicleRepository(),guides=new GuideRepository()}={}){this.repositories={accommodations,vehicles,guides};this.accommodations=[];this.vehicles=[];this.guides=[];}
  async load(){
    [this.accommodations,this.vehicles,this.guides] = await Promise.all([
      this.repositories.accommodations.listPublished(),
      this.repositories.vehicles.listPublished(),
      this.repositories.guides.listPublished()
    ]);
    return {accommodations:this.accommodations,vehicles:this.vehicles,guides:this.guides};
  }
  getAccommodations(selectedDestinations){
    const selected = new Set(selectedDestinations);
    if(!selected.size) return [];
    return this.accommodations.filter(item => item.destinationIds.some(id => selected.has(id)))
      .sort((a,b) => a.style.localeCompare(b.style) || Number(b.featured)-Number(a.featured) || a.name.localeCompare(b.name));
  }
  getVehicles(){return [...this.vehicles].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.dayRate-b.dayRate);}
  getGuides({destinations,themes,experiences}){
    const selectedDestinations = new Set(destinations);
    const selectedThemes = new Set(themes);
    const selectedCategories = new Set(experiences.map(item => item.category));
    return this.guides.map(guide => ({
      ...guide,
      matchScore:
        guide.destinationIds.filter(id=>selectedDestinations.has(id)).length * 3 +
        guide.themeIds.filter(id=>selectedThemes.has(id)).length * 2 +
        guide.experienceCategoryIds.filter(id=>selectedCategories.has(id)).length
    })).filter(guide => guide.matchScore > 0)
      .sort((a,b)=>b.matchScore-a.matchScore||Number(b.featured)-Number(a.featured)||a.name.localeCompare(b.name));
  }
}
class SiteContentService {
  constructor(settings=new WebsiteSettingsRepository(),homepage=new HomepageRepository()){this.settingsRepository=settings;this.homepageRepository=homepage;}
  async load(){
    const [settings,homepage]=await Promise.all([this.settingsRepository.getPublic(),this.homepageRepository.getPublic()]);
    return {settings,homepage};
  }
}

class BuilderState {
  constructor(){
    this.themes = new Set();
    this.destinations = new Set();
    this.experiences = new Set();
    this.otherThemes = [];
    this.otherDestinations = [];
    this.otherExperiences = [];
    this.stays = new Set();
    this.nights = 14;
    this.travelers = 2;
    this.tier = '4star';
    this.pace = 'balanced';
    this.vehicle = null;
    this.guide = null;
    this.marketplaceTab = 'stay';
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
