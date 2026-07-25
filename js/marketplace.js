class MarketplaceCard {
  static details(item, type){
    if(type === 'stay') return [
      `${'★'.repeat(item.starRating)}${'☆'.repeat(Math.max(0,5-item.starRating))}`,
      item.location,
      item.priceRange,
      item.amenities.slice(0,3).join(' · ')
    ];
    if(type === 'transport') return [
      item.capacity,
      item.luggage,
      item.airConditioning ? 'Air conditioned' : 'Open air',
      item.driverIncluded ? 'Driver included' : 'Self drive'
    ];
    return [
      item.languages.join(' · '),
      `${item.experience} years`,
      item.specialities.join(' · ')
    ];
  }

  static render(item,type,selected){
    const label = type === 'stay' ? item.type : type === 'transport' ? item.type : 'Local specialist';
    const action = type === 'guides' ? 'Add to My Journey' : 'Add to My Journey';
    return `<article class="planner-card ${selected?'selected':''}" data-market-card="${type}" data-id="${escapeHtml(item.id)}">
      <div class="planner-card-media">
        <img src="${escapeHtml(item.heroImage)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" sizes="(max-width:720px) 100vw, 360px">
        <span class="planner-card-shade"></span>
        ${item.verified?`<span class="verified-badge">${type==='guides'?'✓ Verified Guide':'✓ Verified Partner'}</span>`:''}
        <span class="planner-type">${escapeHtml(label)}</span>
      </div>
      <div class="planner-card-body">
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.description)}</p>
        <div class="planner-meta">${MarketplaceCard.details(item,type).map(detail=>`<span>${escapeHtml(detail)}</span>`).join('')}</div>
        <div class="planner-actions">
          <button type="button" class="market-detail" data-market-detail="${type}" data-id="${escapeHtml(item.id)}">${type==='guides'?'View Profile':'View Details'}</button>
          <button type="button" class="market-add ${selected?'added':''}" data-market-add="${type}" data-id="${escapeHtml(item.id)}">${selected?'Added ✓':action}</button>
        </div>
      </div>
    </article>`;
  }
}

class PartnerRegistrationCTA {
  static content = {
    stay:['Own a hotel, villa or guest house?','Become a Roam Ceylon Accommodation Partner.','List Your Property'],
    transport:['Own a vehicle or transport company?','Become a Roam Ceylon Transport Partner.','Register Your Fleet'],
    guides:['Are you a licensed local guide?','Become a Roam Ceylon Guide Partner.','Join Our Guide Network']
  };
  static render(type){
    const [title,text,action] = this.content[type];
    return `<aside class="planner-partner"><div><span class="market-tag">Partner with us</span><h4>${title}</h4><p>${text}</p></div><a class="btn btn-outline" href="mailto:partners@roamceylon.com?subject=${encodeURIComponent(action)}">${action}</a></aside>`;
  }
}

class MarketplaceTabs {
  constructor(root,onChange){this.root=root;this.onChange=onChange;}
  select(tab){
    state.marketplaceTab = tab;
    this.root.querySelectorAll('[data-market-tab]').forEach(button=>{
      const active=button.dataset.marketTab===tab;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
    document.querySelectorAll('[data-market-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.marketPanel===tab));
    this.onChange?.(tab);
  }
}

class MarketplaceRenderer {
  constructor(service){this.service=service;}
  groupStays(items){
    const groups = items.reduce((result,item)=>{
      if(!result.has(item.style))result.set(item.style,[]);
      result.get(item.style).push(item);
      return result;
    },new Map());
    return [...groups].map(([style,properties])=>`<section class="market-grouping"><h4>${escapeHtml(style)}</h4><div class="planner-grid">${properties.map(item=>MarketplaceCard.render(item,'stay',state.stays.has(item.id))).join('')}</div></section>`).join('');
  }
  render(){
    const stays=this.service.getAccommodations(state.destinations);
    const selectedExperiences=EXPERIENCES.filter(item=>state.experiences.has(item.id));
    const guides=this.service.getGuides({destinations:state.destinations,themes:state.themes,experiences:selectedExperiences});
    if(state.guide&&!guides.some(item=>item.id===state.guide))state.guide=null;
    document.getElementById('plannerStay').innerHTML=(stays.length?this.groupStays(stays):'<div class="destination-empty">Select destinations to see matching places to stay.</div>')+PartnerRegistrationCTA.render('stay');
    document.getElementById('plannerTransport').innerHTML=`<div class="planner-grid">${this.service.getVehicles().map(item=>MarketplaceCard.render(item,'transport',state.vehicle===item.id)).join('')}</div>${PartnerRegistrationCTA.render('transport')}`;
    document.getElementById('plannerGuides').innerHTML=(guides.length?`<div class="planner-grid">${guides.map(item=>MarketplaceCard.render(item,'guides',state.guide===item.id)).join('')}</div>`:'<div class="destination-empty">Choose themes, destinations or experiences to meet matching local guides.</div>')+PartnerRegistrationCTA.render('guides');
  }
  showDetails(type,id){
    const source=type==='stay'?this.service.accommodations:type==='transport'?this.service.vehicles:this.service.guides;
    const item=source.find(entry=>entry.id===id);
    if(!item)return;
    let dialog=document.getElementById('marketplaceDialog');
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.id='marketplaceDialog';
      dialog.className='market-dialog';
      document.body.append(dialog);
    }
    dialog.innerHTML=`<button type="button" class="market-dialog-close" aria-label="Close">×</button>
      <img src="${escapeHtml(item.heroImage)}" alt="${escapeHtml(item.name)}">
      <div><span class="market-tag">${item.verified?'Verified by Roam Ceylon':'Marketplace listing'}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p>
      <div class="planner-meta">${MarketplaceCard.details(item,type).map(detail=>`<span>${escapeHtml(detail)}</span>`).join('')}</div></div>`;
    dialog.showModal();
    dialog.querySelector('.market-dialog-close').addEventListener('click',()=>dialog.close(),{once:true});
  }
}
