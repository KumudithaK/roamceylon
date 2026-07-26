/* ---------------- TABS / STEPS ---------------- */
const tabsEl = document.getElementById('tabs');
function renderTabs(){
  const counts = {
    themes:state.themes.size + state.otherThemes.length,
    destinations:state.destinations.size + state.otherDestinations.length,
    experiences:state.experiences.size + state.otherExperiences.length
  };
  tabsEl.innerHTML = STEPS.map(s => `
    <button type="button" class="tab ${s===currentStep?'active':''}" data-step="${s}">
      ${STEP_LABELS[s]}
      ${counts[s] !== undefined ? `<span class="tcount">${counts[s]}</span>` : ''}
    </button>
  `).join('');
}
let currentStep = 'themes';
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

/* ---------------- JOURNEY CONTROLS ---------------- */
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

document.getElementById('paceGroup').addEventListener('change', e=>{
  state.pace = e.target.value;
  document.querySelectorAll('#paceGroup .radio-card').forEach(l=>l.classList.toggle('active', l.querySelector('input').checked));
});
document.getElementById('travelMonth').addEventListener('change', e=>{
  state.travelMonth = e.target.value;
  updateTripCard();
});

/* ---------------- TRIP CARD ---------------- */
const ISLAND_PATH = "M198.4,270.3 L190.6,314.7 L175.7,335.1 L145.2,356.3 L121.7,364.6 L103.0,374.8 L88.9,376.7 L73.2,371.1 L53.7,346.2 L47.4,316.5 L39.6,282.3 L36.4,262.0 L34.1,224.0 L27.8,176.9 L38.0,145.4 L47.4,117.7 L45.8,104.7 L55.2,90.9 L59.9,76.1 L56.0,61.2 L63.0,47.4 L73.2,38.1 L67.0,24.2 L63.0,17.8 L78.7,24.2 L94.3,42.7 L86.5,52.0 L106.1,61.2 L120.2,79.7 L133.5,102.9 L145.2,126.0 L157.0,149.1 L164.8,176.9 L172.6,190.7 L184.3,213.9 L190.6,237.0 L198.4,270.3 Z";

function chip(label, type, id){
  const safeLabel = escapeHtml(label);
  return `<span class="chip">✓ <span class="chip-label" title="${safeLabel}">${safeLabel}</span><button type="button" aria-label="Remove ${safeLabel}" data-remove="${type}" data-id="${id}">✕</button></span>`;
}

function otherChip(val, type, idx){
  const safeValue = escapeHtml(val);
  return `<span class="chip">✓ <span class="chip-label" title="${safeValue}">${safeValue}</span><button type="button" aria-label="Remove ${safeValue}" data-remove-other="${type}" data-idx="${idx}">✕</button></span>`;
}

function updateTripCard(){
  renderTabs();
  const otherCount = state.otherThemes.length + state.otherDestinations.length + state.otherExperiences.length;
  const total = state.themes.size + state.destinations.size + state.experiences.size + state.stays.size + Number(Boolean(state.vehicle)) + Number(Boolean(state.guide)) + otherCount;
  document.getElementById('tripEmpty').style.display = total ? 'none' : 'block';
  document.getElementById('tripBody').style.display = total ? 'block' : 'none';

  document.getElementById('chipsTheme').innerHTML =
    [...state.themes].map(id=>chip(THEMES.find(d=>d.id===id).name,'themes',id)).join('') +
    state.otherThemes.map((v,i)=>otherChip(v,'themes',i)).join('') ||
    '<span style="opacity:.5;font-size:.78rem">None yet</span>';
  document.getElementById('chipsDest').innerHTML =
    [...state.destinations].map(id=>chip(DESTINATIONS.find(d=>d.id===id).name,'destinations',id)).join('') +
    state.otherDestinations.map((v,i)=>otherChip(v,'destinations',i)).join('') ||
    '<span style="opacity:.5;font-size:.78rem">None yet</span>';
  document.getElementById('chipsExp').innerHTML =
    [...state.experiences].map(id=>chip(EXPERIENCES.find(d=>d.id===id).name,'experiences',id)).join('') +
    state.otherExperiences.map((v,i)=>otherChip(v,'experiences',i)).join('') ||
    '<span style="opacity:.5;font-size:.78rem">None yet</span>';
  document.getElementById('chipsStay').innerHTML =
    [...state.stays].map(id=>chip(ACCOMMODATIONS.find(item=>item.id===id).name,'stays',id)).join('') ||
    '<span style="opacity:.5;font-size:.78rem">None yet</span>';
  const selectedVehicle = VEHICLES.find(vehicle=>vehicle.id===state.vehicle);
  document.getElementById('chipsVehicle').innerHTML = selectedVehicle
    ? `<span class="chip">✓ <span class="chip-label">${escapeHtml(selectedVehicle.name)}</span><button type="button" data-remove-market="vehicle">✕</button></span>`
    : '<span style="opacity:.5;font-size:.78rem">None yet</span>';
  const selectedGuide = GUIDES.find(guide => guide.id === state.guide);
  document.getElementById('chipsGuide').innerHTML = selectedGuide
    ? `<span class="chip">✓ <span class="chip-label">${escapeHtml(selectedGuide.name)}</span><button type="button" data-remove-market="guide">✕</button></span>`
    : '<span style="opacity:.5;font-size:.78rem">Optional</span>';

  document.getElementById('sumNights').textContent = state.nights;
  document.getElementById('sumTrav').textContent = state.travelers;
  document.getElementById('sumVehicle').textContent = selectedVehicle?.name || 'Not selected';

  const rate = PRICING.tiers[state.tier].nightlyPerGuest;
  const activityCount = state.experiences.size + state.otherExperiences.length;
  const accommodationCost = state.nights * rate * state.travelers;
  const activityCost = activityCount * PRICING.activityPerGuest * state.travelers;

  const vehicle = selectedVehicle || {dayRate:0,perKm:0};
  const selectedDests = DESTINATIONS.filter(d=>state.destinations.has(d.id));
  const colomboRef = DESTINATIONS.find(d=>d.id==='colombo');
  const totalTourKm = selectedDests.reduce((sum,d)=>sum + haversineKm(colomboRef.lat,colomboRef.lon,d.lat,d.lon)*PRICING.routeDistanceFactor, 0);
  const transportCost = (vehicle.dayRate * Math.max(state.nights, selectedDests.length)) + (vehicle.perKm * totalTourKm);

  const season = getSeason(state.travelMonth);
  const base = (accommodationCost + activityCost + transportCost) * season.multiplier;
  document.getElementById('sumTransport').textContent = '$' + Math.round(transportCost).toLocaleString();
  document.getElementById('sumAccommodation').textContent = '$' + Math.round(accommodationCost).toLocaleString();
  document.getElementById('sumActivities').textContent = '$' + Math.round(activityCost).toLocaleString();
  document.getElementById('sumSeason').textContent = `${season.label} × ${season.multiplier}`;
  document.getElementById('sumPrice').textContent = '$' + Math.round(base*PRICING.estimateFactor).toLocaleString();

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

document.addEventListener('click',e=>{
  const remove=e.target.closest('[data-remove-market]');
  if(!remove)return;
  if(remove.dataset.removeMarket==='vehicle')state.vehicle=null;
  if(remove.dataset.removeMarket==='guide')state.guide=null;
  marketplaceRenderer.render();
  renderMarketplace();
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
document.getElementById('enquireForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const fd = new FormData(this);
  const name = fd.get('name') || 'there';
  const destNames = [...[...state.destinations].map(id=>DESTINATIONS.find(d=>d.id===id).name), ...state.otherDestinations].join(', ') || 'no destinations yet';
  const expNames = [...[...state.experiences].map(id=>EXPERIENCES.find(d=>d.id===id).name), ...state.otherExperiences].join(', ') || 'none selected';
  const stayNames = [...state.stays].map(id=>ACCOMMODATIONS.find(item=>item.id===id)?.name).filter(Boolean).join(', ') || 'none selected';
  const vehicleName = VEHICLES.find(item=>item.id===state.vehicle)?.name || 'none selected';
  const guideName = GUIDES.find(item=>item.id===state.guide)?.name || 'none selected';

  const summaryText = `Trip request for ${name}
Destinations: ${destNames}
Experiences: ${expNames}
Stay: ${stayNames}
Getting Around: ${vehicleName}
Local Guide: ${guideName}
Nights: ${state.nights} | Travellers: ${state.travelers} | Pace: ${state.pace}
Preferred month: ${fd.get('dates')||'flexible'}
Notes: ${fd.get('notes')||'—'}
Email: ${fd.get('email')} | Phone: ${fd.get('phone')||'—'} | Nationality: ${fd.get('nationality')||'—'}`;

  const totalDest = state.destinations.size + state.otherDestinations.length;
  const totalExp = state.experiences.size + state.otherExperiences.length;
  document.getElementById('confirmSummary').textContent = `Thanks, ${name}! We've noted ${totalDest} destination(s) and ${totalExp} experience(s) for ${state.nights} nights. A consultant will email ${fd.get('email')} shortly.`;

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
  try {
    await RoamBackend.submitEnquiry({
      name,
      email:fd.get('email'),
      phone:fd.get('phone') || null,
      nationality:fd.get('nationality') || null,
      summary:summaryText,
      traveller_notes:fd.get('notes')||null,
      adults:state.travelers,
      selected_themes:[...state.themes],
      selected_destinations:[...state.destinations],
      selected_experiences:[...state.experiences],
      selected_stays:[...state.stays],
      selected_vehicle:state.vehicle,
      selected_guide:state.guide,
      trip_state:{themes:[...state.themes],destinations:[...state.destinations],experiences:[...state.experiences],stays:[...state.stays],nights:state.nights,travelers:state.travelers,tier:state.tier,vehicle:state.vehicle,guide:state.guide,travelMonth:state.travelMonth}
    });
  } catch(error) {
    console.warn('Enquiry persistence unavailable; email fallback remains active.');
  }
});
