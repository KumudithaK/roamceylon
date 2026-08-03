const experienceRenderer = new ExperienceRenderer(
  document.getElementById('grid-experiences'),
  destinationService
);
const marketplaceRenderer = new MarketplaceRenderer(marketplaceService);
const marketplaceTabs = new MarketplaceTabs(document.getElementById('marketplaceTabs'));

function iconSvg(id){ return `<svg><use href="#${id}"/></svg>`; }

function renderGrid(containerId, items, stateSet, type){
  const el = document.getElementById(containerId);
  if(type === 'destinations' && !state.themes.size){
    el.innerHTML = '<div class="destination-empty">Select one or more travel themes to discover matching destinations.</div>';
    return;
  }
  const otherArr = state[OTHER_KEY[type]];
  const otherTags = otherArr.map((val,i) => `
    <div class="pick-card selected flat-card">
      <div class="pick-badge" style="position:static;margin-right:12px;">${iconSvg('i-tag')}</div>
      <div class="pick-body" style="padding:0;flex:1;"><span class="flat-tag">Your request</span><h4 style="font-size:.95rem;margin:0;">${val}</h4></div>
      <button type="button" class="check-dot" data-remove-other="${type}" data-idx="${i}" style="position:static;background:var(--coral);border-color:var(--coral);cursor:pointer;flex:none;">${iconSvg('i-check')}</button>
    </div>`).join('');
  const otherInput = `
    <div class="pick-card other-card flat-card" style="grid-column:1/-1;border-style:dashed;">
      <div class="pick-badge" style="position:static;margin-right:12px;background:var(--seafoam,#DCEEE8);"><svg><use href="#i-tag"/></svg></div>
      <div class="pick-body" style="padding:0;flex:1;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <span class="flat-tag" style="min-width:110px;">Don't see it? Add it</span>
        <input type="text" data-other-input="${type}" placeholder="Type your own request..." style="flex:1;min-width:160px;border:1.5px solid var(--line);border-radius:10px;padding:9px 12px;font-family:inherit;font-size:.86rem;">
        <button type="button" class="btn btn-dark" data-other-add="${type}" style="padding:9px 16px;font-size:.82rem;">Add</button>
      </div>
    </div>`;
  el.innerHTML = items.map(it => `
    <button type="button" class="pick-card filter-enter ${stateSet.has(it.id)?'selected':''}" data-type="${type}" data-id="${it.id}">
      <div class="pick-photo">
        ${it.heroImage?`<img src="${it.heroImage}" alt="${escapeHtml(it.name)}" loading="lazy" decoding="async" class="loaded">`:''}
        <div class="pick-badge">${iconSvg(it.icon)}</div>
        <div class="check-dot">${iconSvg('i-check')}</div>
        <span class="tag">${it.tag}</span>
      </div>
      <div class="pick-body">
        <h4>${it.name}</h4>
        <p>${it.desc}</p>
      </div>
    </button>
  `).join('') + otherTags + otherInput;
}

function renderAllGrids(){
  renderGrid('grid-themes', THEMES, state.themes, 'themes');
  const availableDestinations = journeyEngine.getAvailableDestinations(state.themes);
  const availableIds = new Set(availableDestinations.map(destination => destination.id));
  [...state.destinations].forEach(id => {if(!availableIds.has(id)) state.destinations.delete(id);});
  renderGrid('grid-destinations', availableDestinations, state.destinations, 'destinations');
  const availableExperiences = journeyEngine.getAvailableExperiences(state.destinations);
  const availableExperienceIds = new Set(availableExperiences.map(experience => experience.id));
  [...state.experiences].forEach(id => {if(!availableExperienceIds.has(id)) state.experiences.delete(id);});
  experienceRenderer.render(availableExperiences, state.experiences, state.destinations.size > 0);
  [...state.stays].forEach(id=>{if(!marketplaceService.getAccommodations(state.destinations).some(item=>item.id===id)) state.stays.delete(id);});
  marketplaceRenderer.render();
}

function renderMarketplace(){
  document.getElementById('market-hotels').innerHTML = ACCOMMODATIONS.slice(0,3).map(item=>MarketplaceCard.render(item,'stay',state.stays.has(item.id))).join('');
  document.getElementById('market-vehicles').innerHTML = VEHICLES.slice(0,3).map(item=>MarketplaceCard.render(item,'transport',state.vehicle===item.id)).join('');
  document.getElementById('market-guides').innerHTML = GUIDES.slice(0,3).map(item=>MarketplaceCard.render(item,'guides',state.guide===item.id)).join('');
}

document.addEventListener('click', (e) => {
  if(e.target.closest('[data-other-add]') || e.target.closest('[data-remove-other]') || e.target.closest('.other-card')) return;
  const card = e.target.closest('.pick-card');
  if(!card || !card.dataset.type) return;
  const type = card.dataset.type, id = card.dataset.id;
  const set = state[type];
  if(set.has(id)) set.delete(id); else set.add(id);
  renderAllGrids();
  updateTripCard();
});

function addOther(type){
  const input = document.querySelector(`[data-other-input="${type}"]`);
  const val = input.value.trim();
  if(!val) return;
  state[OTHER_KEY[type]].push(val);
  renderAllGrids();
  updateTripCard();
}
document.addEventListener('click', e=>{
  const addBtn = e.target.closest('[data-other-add]');
  if(addBtn){ addOther(addBtn.dataset.otherAdd); return; }
  const rmBtn = e.target.closest('[data-remove-other]');
  if(rmBtn){
    state[OTHER_KEY[rmBtn.dataset.removeOther]].splice(parseInt(rmBtn.dataset.idx,10),1);
    renderAllGrids();
    updateTripCard();
  }
});

document.addEventListener('click',event=>{
  const tab=event.target.closest('[data-market-tab]');
  if(tab){marketplaceTabs.select(tab.dataset.marketTab);return;}
  const partner=event.target.closest('[data-partner-open]');
  if(partner){marketplaceRenderer.showPartnerForm(partner.dataset.partnerOpen);return;}
  const add=event.target.closest('[data-market-add]');
  const detail=event.target.closest('[data-market-detail]');
  if(detail){marketplaceRenderer.showDetails(detail.dataset.marketDetail,detail.dataset.id);return;}
  if(!add)return;
  const {marketAdd:type,id}=add.dataset;
  if(type==='stay'){
    if(state.stays.has(id))state.stays.delete(id);else state.stays.add(id);
  }else if(type==='transport'){
    state.vehicle=state.vehicle===id?null:id;
  }else{
    state.guide=state.guide===id?null:id;
  }
  marketplaceRenderer.render();
  renderMarketplace();
  updateTripCard();
});
document.addEventListener('keydown', e=>{
  if(e.target.matches('[data-other-input]') && e.key==='Enter'){
    e.preventDefault();
    addOther(e.target.dataset.otherInput);
  }
});
