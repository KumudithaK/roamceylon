let THEMES = [];
let DESTINATIONS = [];
let EXPERIENCES = [];
let ACCOMMODATIONS = [];
let VEHICLES = [];
let GUIDES = [];
let PRICING = {};
let TIER_LABEL = {};
let SITE_SETTINGS = {};
let HOMEPAGE_CONTENT = {};
const themeService = new ThemeService();
const destinationService = new DestinationService();
const experienceService = new ExperienceService();
const marketplaceService = new MarketplaceService();
const siteContentService = new SiteContentService();
const journeyEngine = new JourneyEngine(destinationService, experienceService);

async function loadTravelData(){
  const [themes, destinations, experiences, marketplace, pricing, siteContent] = await Promise.all([
    themeService.load(),
    destinationService.load(),
    experienceService.load(),
    marketplaceService.load(),
    JsonRepository.load('data/pricing.json'),
    siteContentService.load()
  ]);
  THEMES = themes;
  DESTINATIONS = destinations;
  EXPERIENCES = experiences;
  ACCOMMODATIONS = marketplace.accommodations;
  VEHICLES = marketplace.vehicles;
  GUIDES = marketplace.guides;
  PRICING = pricing;
  TIER_LABEL = Object.fromEntries(Object.entries(pricing.tiers).map(([id, tier]) => [id, tier.label]));
  SITE_SETTINGS = siteContent.settings;
  HOMEPAGE_CONTENT = siteContent.homepage;
}

const state = new BuilderState();
const OTHER_KEY = {themes:'otherThemes', destinations:'otherDestinations', experiences:'otherExperiences'};
function getSeason(monthValue){
  const month = Number((monthValue || '').split('-')[1]) || new Date().getMonth() + 1;
  return Object.values(PRICING.seasons).find(season => season.months.includes(month));
}
function haversineKm(lat1,lon1,lat2,lon2){
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const STEPS = ['themes','destinations','experiences','planner','summary'];
const STEP_LABELS = {themes:'1. Themes',destinations:'2. Destinations',experiences:'3. Experiences',planner:'4. Plan Your Journey',summary:'5. Summary'};
