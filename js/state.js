let THEMES = [];
let DESTINATIONS = [];
let EXPERIENCES = [];
let EXCURSIONS = [];
let HOTELS = [];
let VEHICLES = [];
let GUIDES = [];
let PRICING = {};
let TIER_LABEL = {};

async function loadTravelData(){
  const [themes, destinations, experiences, hotels, vehicles, guides, pricing] = await Promise.all([
    fetch('data/themes.json').then(response => response.json()),
    fetch('data/destinations.json').then(response => response.json()),
    fetch('data/experiences.json').then(response => response.json()),
    fetch('data/hotels.json').then(response => response.json()),
    fetch('data/vehicles.json').then(response => response.json()),
    fetch('data/guides.json').then(response => response.json()),
    fetch('data/pricing.json').then(response => response.json())
  ]);
  THEMES = themes;
  DESTINATIONS = destinations;
  EXPERIENCES = experiences.filter(item => item.kind !== 'excursion');
  EXCURSIONS = experiences.filter(item => item.kind === 'excursion');
  HOTELS = hotels;
  VEHICLES = vehicles;
  GUIDES = guides;
  PRICING = pricing;
  TIER_LABEL = Object.fromEntries(Object.entries(pricing.tiers).map(([id, tier]) => [id, tier.label]));
}

const state = {
  themes: new Set(),
  destinations: new Set(),
  experiences: new Set(),
  excursions: new Set(),
  otherThemes: [],
  otherDestinations: [],
  otherExperiences: [],
  otherExcursions: [],
  nights: 14,
  travelers: 2,
  tier: '4star',
  pace: 'balanced',
  vehicle: 'van',
  travelMonth: '',
};
const OTHER_KEY = {themes:'otherThemes', destinations:'otherDestinations', experiences:'otherExperiences', excursions:'otherExcursions'};
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

const STEPS = ['themes','destinations','experiences','excursions','customize','enquire'];
const STEP_LABELS = {themes:'1. Theme',destinations:'2. Destinations',experiences:'3. Experiences',excursions:'4. Excursions',customize:'5. Customize',enquire:'6. Send it'};
