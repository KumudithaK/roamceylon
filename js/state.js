let THEMES = [];
let DESTINATIONS = [];
let EXPERIENCES = [];
let EXCURSIONS = [];
let HOTELS = [];
let VEHICLES = [];
let GUIDES = [];

async function loadTravelData(){
  const [themes, destinations, experiences, hotels, vehicles, guides] = await Promise.all([
    fetch('data/themes.json').then(response => response.json()),
    fetch('data/destinations.json').then(response => response.json()),
    fetch('data/experiences.json').then(response => response.json()),
    fetch('data/hotels.json').then(response => response.json()),
    fetch('data/vehicles.json').then(response => response.json()),
    fetch('data/guides.json').then(response => response.json())
  ]);
  THEMES = themes;
  DESTINATIONS = destinations;
  EXPERIENCES = experiences.filter(item => item.kind !== 'excursion');
  EXCURSIONS = experiences.filter(item => item.kind === 'excursion');
  HOTELS = hotels;
  VEHICLES = vehicles;
  GUIDES = guides;
}

const TIER_LABEL = {boutique:'Boutique & guesthouses',['4star']:'4-star comfort',['5star']:'5-star hotels',luxury:'Luxury villas & suites'};
const TIER_RATE = {boutique:60,['4star']:95,['5star']:155,luxury:270};

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
};
const OTHER_KEY = {themes:'otherThemes', destinations:'otherDestinations', experiences:'otherExperiences', excursions:'otherExcursions'};
const VEHICLE_LABEL = {car:'Private car (1–3 pax)', van:'Van (4–7 pax)', suv:'SUV / 4x4', minicoach:'Mini-coach (8–14 pax)', luxurycoach:'Luxury coach (15+ pax)'};
const VEHICLE_RATE = {
  car:{day:34, perKm:0.34},
  van:{day:52, perKm:0.44},
  suv:{day:66, perKm:0.52},
  minicoach:{day:92, perKm:0.68},
  luxurycoach:{day:145, perKm:0.92},
};
function haversineKm(lat1,lon1,lat2,lon2){
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const STEPS = ['themes','destinations','experiences','excursions','customize','enquire'];
const STEP_LABELS = {themes:'1. Theme',destinations:'2. Destinations',experiences:'3. Experiences',excursions:'4. Excursions',customize:'5. Customize',enquire:'6. Send it'};
