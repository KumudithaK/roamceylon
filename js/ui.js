/* ---------------- WIKI IMAGE LOADER ---------------- */
const wikiImageCache = {};
async function fetchWikiImage(title){
  if(wikiImageCache[title] !== undefined) return wikiImageCache[title];
  try{
    const url = `https://en.wikipedia.org/w/api.php?origin=*&action=query&redirects=1&prop=pageimages&piprop=original&format=json&titles=${encodeURIComponent(title)}`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query && data.query.pages;
    const page = pages ? Object.values(pages)[0] : null;
    const src = page && page.original ? page.original.source : null;
    wikiImageCache[title] = src;
    return src;
  }catch(err){
    wikiImageCache[title] = null;
    return null;
  }
}
async function fetchWikiImageAny(titleList){
  const titles = titleList.split('|');
  for(const t of titles){
    const src = await fetchWikiImage(t.trim());
    if(src) return src;
  }
  return null;
}
function loadWikiImages(scope){
  scope.querySelectorAll('[data-wiki]').forEach(async (el)=>{
    if(el.dataset.loaded) return;
    el.dataset.loaded = '1';
    const src = await fetchWikiImageAny(el.dataset.wiki);
    if(src){
      const img = new Image();
      img.src = src;
      img.alt = el.dataset.wiki.split('|')[0];
      img.loading = 'lazy';
      img.onload = ()=>img.classList.add('loaded');
      el.prepend(img);
    }
  });
}
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
      <div class="pick-photo" ${!it.heroImage&&it.wiki?`data-wiki="${it.wiki}"`:''}>
        ${it.heroImage?`<img src="${it.heroImage}" alt="" loading="lazy" class="loaded">`:''}
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
  loadWikiImages(el);
}

function renderAllGrids(){
  renderGrid('grid-themes', THEMES, state.themes, 'themes');
  const availableDestinations = journeyEngine.getAvailableDestinations(state.themes);
  const availableIds = new Set(availableDestinations.map(destination => destination.id));
  [...state.destinations].forEach(id => {if(!availableIds.has(id)) state.destinations.delete(id);});
  renderGrid('grid-destinations', availableDestinations, state.destinations, 'destinations');
  renderGrid('grid-experiences', EXPERIENCES, state.experiences, 'experiences');
}

function marketplaceCard(item, type){
  const meta = type === 'hotel'
    ? `${item.location} · From $${item.from}/night`
    : type === 'vehicle'
      ? `${item.capacity} · From $${item.dayRate}/day`
      : `${item.speciality} · ${item.experience} years`;
  return `<article class="market-card">
    <span class="market-tag">${item.category || type}</span>
    <h3>${item.name}</h3><p class="market-meta">${meta}</p>
    <p>${item.description}</p>
    <a href="#builder" class="market-link">Add to journey <span aria-hidden="true">→</span></a>
  </article>`;
}

function renderMarketplace(){
  document.getElementById('market-hotels').innerHTML = HOTELS.map(item => marketplaceCard(item, 'hotel')).join('');
  document.getElementById('market-vehicles').innerHTML = VEHICLES.map(item => marketplaceCard(item, 'vehicle')).join('');
  document.getElementById('market-guides').innerHTML = GUIDES.map(item => marketplaceCard(item, 'guide')).join('');
}

function renderGuideOptions(){
  const options = [{id:null,name:'No guide selected',speciality:'Optional',description:'Continue with private transport and local hosts as arranged.'}, ...GUIDES];
  document.getElementById('guideOptions').innerHTML = options.map(guide => `
    <button type="button" class="guide-card ${state.guide===guide.id?'selected':''}" data-guide-id="${guide.id || ''}">
      <span class="market-tag">${guide.speciality}</span>
      <h3>${guide.name}</h3>
      <p>${guide.description}</p>
      <span class="check-dot">${iconSvg('i-check')}</span>
    </button>`).join('');
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

document.addEventListener('click', event => {
  const guide = event.target.closest('[data-guide-id]');
  if(!guide) return;
  state.guide = guide.dataset.guideId || null;
  renderGuideOptions();
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
document.addEventListener('keydown', e=>{
  if(e.target.matches('[data-other-input]') && e.key==='Enter'){
    e.preventDefault();
    addOther(e.target.dataset.otherInput);
  }
});
