let THEMES = [];
let DESTINATIONS = [];
let EXPERIENCES = [];
let HOTELS = [];
let VEHICLES = [];
let GUIDES = [];
let PRICING = {};
let TIER_LABEL = {};
const themeService = new ThemeService();
const destinationService = new DestinationService();
const experienceService = new ExperienceService();
const journeyEngine = new JourneyEngine(destinationService, experienceService);

async function loadTravelData(){
  const [themes, destinations, experiences, hotels, vehicles, guides, pricing] = await Promise.all([
    themeService.load(),
    destinationService.load(),
    experienceService.load(),
    JsonRepository.load('data/hotels.json'),
    JsonRepository.load('data/vehicles.json'),
    JsonRepository.load('data/guides.json'),
    JsonRepository.load('data/pricing.json')
  ]);
  THEMES = themes;
  DESTINATIONS = destinations;
  EXPERIENCES = experiences;
  HOTELS = hotels;
  VEHICLES = vehicles;
  GUIDES = guides;
  PRICING = pricing;
  TIER_LABEL = Object.fromEntries(Object.entries(pricing.tiers).map(([id, tier]) => [id, tier.label]));
}

const state = new BuilderState();
const OTHER_KEY = {themes:'otherThemes', destinations:'otherDestinations', experiences:'otherExperiences'};
const VEHICLE_LABEL = {car:'Private car (1–3 pax)', van:'Van (4–7 pax)', suv:'SUV / 4x4', minicoach:'Mini-coach (8–14 pax)', luxurycoach:'Luxury coach (15+ pax)'};
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

const STEPS = ['themes','destinations','experiences','accommodation','transportation','guides','summary'];
const STEP_LABELS = {themes:'1. Themes',destinations:'2. Destinations',experiences:'3. Experiences',accommodation:'4. Accommodation',transportation:'5. Transportation',guides:'6. Guide',summary:'7. Summary'};
