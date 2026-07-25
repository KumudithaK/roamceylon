/* ---------------- TABS / STEPS ---------------- */
const tabsEl = document.getElementById('tabs');
function renderTabs(){
  tabsEl.innerHTML = STEPS.map(s => `
    <button type="button" class="tab ${s===currentStep?'active':''}" data-step="${s}">
      ${STEP_LABELS[s]}
      ${s!=='customize'&&s!=='enquire' ? `<span class="tcount">${state[s].size + state[OTHER_KEY[s]].length}</span>` : ''}
    </button>
  `).join('');
}
let currentStep = 'destinations';
function goStep(step){
  currentStep = step;
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel===step));
  renderTabs();
  const idx = STEPS.indexOf(step);
  document.getElementById('progressFill').style.width = (((idx+1)/STEPS.length)*100) + '%';
  document.getElementById('builder').scrollIntoView({behavior:'smooth', block:'start'});
}
tabsEl.addEventListener('click', e=>{
  const t = e.target.closest('.tab'); if(!t) return;
  goStep(t.dataset.step);
});
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click', ()=>goStep(b.dataset.next)));
document.querySelectorAll('[data-prev]').forEach(b=>b.addEventListener('click', ()=>goStep(b.dataset.prev)));

/* ---------------- CUSTOMIZE CONTROLS ---------------- */
const nightsRange = document.getElementById('nightsRange');
const nightsVal = document.getElementById('nightsVal');
nightsRange.addEventListener('input', ()=>{
  state.nights = parseInt(nightsRange.value,10);
  nightsVal.textContent = state.nights + ' nights';
  updateTripCard();
});

const travVal = document.getElementById('travVal');
document.getElementById('travMinus').addEventListener('click', ()=>{ state.travelers=Math.max(1,state.travelers-1); travVal.textContent=state.travelers; updateTripCard(); });
document.getElementById('travPlus').addEventListener('click', ()=>{ state.travelers=Math.min(12,state.travelers+1); travVal.textContent=state.travelers; updateTripCard(); });

document.getElementById('tierGroup').addEventListener('change', e=>{
  state.tier = e.target.value;
  document.querySelectorAll('#tierGroup .radio-card').forEach(l=>l.classList.toggle('active', l.querySelector('input').checked));
  updateTripCard();
});
document.getElementById('paceGroup').addEventListener('change', e=>{
  state.pace = e.target.value;
  document.querySelectorAll('#paceGroup .radio-card').forEach(l=>l.classList.toggle('active', l.querySelector('input').checked));
});
document.getElementById('vehicleGroup').addEventListener('change', e=>{
  state.vehicle = e.target.value;
  document.querySelectorAll('#vehicleGroup .radio-card').forEach(l=>l.classList.toggle('active', l.querySelector('input').checked));
  updateTripCard();
});

/* ---------------- TRIP CARD ---------------- */
const ISLAND_PATH = "M198.4,270.3 L190.6,314.7 L175.7,335.1 L145.2,356.3 L121.7,364.6 L103.0,374.8 L88.9,376.7 L73.2,371.1 L53.7,346.2 L47.4,316.5 L39.6,282.3 L36.4,262.0 L34.1,224.0 L27.8,176.9 L38.0,145.4 L47.4,117.7 L45.8,104.7 L55.2,90.9 L59.9,76.1 L56.0,61.2 L63.0,47.4 L73.2,38.1 L67.0,24.2 L63.0,17.8 L78.7,24.2 L94.3,42.7 L86.5,52.0 L106.1,61.2 L120.2,79.7 L133.5,102.9 L145.2,126.0 L157.0,149.1 L164.8,176.9 L172.6,190.7 L184.3,213.9 L190.6,237.0 L198.4,270.3 Z";

function chip(label, type, id){
  return `<span class="chip">${label}<button type="button" data-remove="${type}" data-id="${id}">✕</button></span>`;
}

function otherChip(val, type, idx){
  return `<span class="chip">${val}<button type="button" data-remove-other="${type}" data-idx="${idx}">✕</button></span>`;
}

function updateTripCard(){
  renderTabs();
  const otherCount = state.otherDestinations.length + state.otherExperiences.length + state.otherExcursions.length;
  const total = state.destinations.size + state.experiences.size + state.excursions.size + otherCount;
  document.getElementById('tripEmpty').style.display = total ? 'none' : 'block';
  document.getElementById('tripBody').style.display = total ? 'block' : 'none';

  document.getElementById('chipsDest').innerHTML =
    [...state.destinations].map(id=>chip(DESTINATIONS.find(d=>d.id===id).name,'destinations',id)).join('') +
    state.otherDestinations.map((v,i)=>otherChip(v,'destinations',i)).join('') ||
    '<span style="opacity:.5;font-size:.78rem">None yet</span>';
  document.getElementById('chipsExp').innerHTML =
    [...state.experiences].map(id=>chip(EXPERIENCES.find(d=>d.id===id).name,'experiences',id)).join('') +
    state.otherExperiences.map((v,i)=>otherChip(v,'experiences',i)).join('') ||
    '<span style="opacity:.5;font-size:.78rem">None yet</span>';
  document.getElementById('chipsExc').innerHTML =
    [...state.excursions].map(id=>chip(EXCURSIONS.find(d=>d.id===id).name,'excursions',id)).join('') +
    state.otherExcursions.map((v,i)=>otherChip(v,'excursions',i)).join('') ||
    '<span style="opacity:.5;font-size:.78rem">None yet</span>';

  document.getElementById('sumNights').textContent = state.nights;
  document.getElementById('sumTrav').textContent = state.travelers;
  document.getElementById('sumTier').textContent = TIER_LABEL[state.tier];
  document.getElementById('sumVehicle').textContent = VEHICLE_LABEL[state.vehicle];

  const rate = TIER_RATE[state.tier];
  const activityCount = state.experiences.size + state.excursions.size + state.otherExperiences.length + state.otherExcursions.length;
  const accommodationCost = state.nights * rate * state.travelers;
  const activityCost = activityCount * 46 * state.travelers;

  const vRate = VEHICLE_RATE[state.vehicle];
  const selectedDests = DESTINATIONS.filter(d=>state.destinations.has(d.id));
  const colomboRef = DESTINATIONS.find(d=>d.id==='colombo');
  const totalTourKm = selectedDests.reduce((sum,d)=>sum + haversineKm(colomboRef.lat,colomboRef.lon,d.lat,d.lon)*1.3, 0);
  const transportCost = (vRate.day * Math.max(state.nights, selectedDests.length)) + (vRate.perKm * totalTourKm);

  const base = accommodationCost + activityCost + transportCost;
  document.getElementById('sumTransport').textContent = '$' + Math.round(transportCost).toLocaleString();
  document.getElementById('sumPrice').textContent = '$' + Math.round(base*0.92).toLocaleString();

  // map pins
  const pinsG = document.getElementById('tripPins');
  const selected = DESTINATIONS.filter(d=>state.destinations.has(d.id));
  pinsG.innerHTML = selected.map((d,i)=>`
    <g class="map-pin" data-id="${d.id}" style="cursor:pointer;">
      <circle cx="${d.x}" cy="${d.y}" r="9" fill="transparent"/>
      <circle cx="${d.x}" cy="${d.y}" r="4" fill="#F2C368" class="pin-pulse" style="animation-delay:${i*0.25}s"/>
      <text x="${d.x+8}" y="${d.y+3}" font-size="9" fill="#F6EFDF" font-family="Manrope,sans-serif" opacity="0.85">${d.name}</text>
    </g>
  `).join('');
  const routeEl = document.getElementById('tripRoute');
  if(selected.length>1){
    routeEl.setAttribute('d', 'M' + selected.map(d=>`${d.x},${d.y}`).join(' L '));
    routeEl.style.display='block';
  } else {
    routeEl.style.display='none';
  }
}

document.addEventListener('click', e=>{
  const pin = e.target.closest('.map-pin');
  if(!pin) return;
  state.destinations.delete(pin.dataset.id);
  renderAllGrids();
  updateTripCard();
});

document.addEventListener('click', e=>{
  const rm = e.target.closest('[data-remove]');
  if(!rm) return;
  state[rm.dataset.remove].delete(rm.dataset.id);
  renderAllGrids();
  updateTripCard();
});

/* ---------------- FORM SUBMIT ---------------- */
document.getElementById('enquireForm').addEventListener('submit', function(e){
  e.preventDefault();
  const fd = new FormData(this);
  const name = fd.get('name') || 'there';
  const destNames = [...[...state.destinations].map(id=>DESTINATIONS.find(d=>d.id===id).name), ...state.otherDestinations].join(', ') || 'no destinations yet';
  const expNames = [...[...state.experiences].map(id=>EXPERIENCES.find(d=>d.id===id).name), ...state.otherExperiences].join(', ') || 'none selected';
  const excNames = [...[...state.excursions].map(id=>EXCURSIONS.find(d=>d.id===id).name), ...state.otherExcursions].join(', ') || 'none selected';

  const summaryText = `Trip request for ${name}
Destinations: ${destNames}
Experiences: ${expNames}
Excursions: ${excNames}
Nights: ${state.nights} | Travellers: ${state.travelers} | Style: ${TIER_LABEL[state.tier]} | Pace: ${state.pace} | Vehicle: ${VEHICLE_LABEL[state.vehicle]}
Preferred month: ${fd.get('dates')||'flexible'}
Notes: ${fd.get('notes')||'—'}
Email: ${fd.get('email')} | Phone: ${fd.get('phone')||'—'} | Nationality: ${fd.get('nationality')||'—'}`;

  const totalDest = state.destinations.size + state.otherDestinations.length;
  const totalExp = state.experiences.size + state.otherExperiences.length;
  const totalExc = state.excursions.size + state.otherExcursions.length;
  document.getElementById('confirmSummary').textContent = `Thanks, ${name}! We've noted ${totalDest} destination(s), ${totalExp} experience(s) and ${totalExc} excursion(s) for ${state.nights} nights. A consultant will email ${fd.get('email')} shortly.`;

  const mailto = `mailto:hello@roamceylon.com?subject=${encodeURIComponent('New tailor-made trip request — '+name)}&body=${encodeURIComponent(summaryText)}`;
  document.getElementById('mailtoBtn').href = mailto;

  document.getElementById('copyBtn').onclick = ()=>{
    navigator.clipboard.writeText(summaryText).then(()=>{
      document.getElementById('copyBtn').textContent = 'Copied ✓';
      setTimeout(()=>document.getElementById('copyBtn').textContent='Copy summary',1800);
    });
  };

  this.style.display = 'none';
  document.getElementById('confirmBox').style.display = 'block';
});

