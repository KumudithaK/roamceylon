const TIER_LABEL = {boutique:'Boutique & guesthouses',['4star']:'4-star comfort',['5star']:'5-star hotels',luxury:'Luxury villas & suites'};
const TIER_RATE = {boutique:60,['4star']:95,['5star']:155,luxury:270};

const state = {
  destinations: new Set(),
  experiences: new Set(),
  excursions: new Set(),
  otherDestinations: [],
  otherExperiences: [],
  otherExcursions: [],
  nights: 14,
  travelers: 2,
  tier: '4star',
  pace: 'balanced',
  vehicle: 'van',
};
const OTHER_KEY = {destinations:'otherDestinations', experiences:'otherExperiences', excursions:'otherExcursions'};
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

const STEPS = ['destinations','experiences','excursions','customize','enquire'];
const STEP_LABELS = {destinations:'1. Destinations',experiences:'2. Experiences',excursions:'3. Excursions',customize:'4. Customize',enquire:'5. Send it'};
