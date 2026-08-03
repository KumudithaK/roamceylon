/* ---------------- REVEAL ON SCROLL ---------------- */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('show'); io.unobserve(en.target); } });
},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------------- INIT ---------------- */
async function initApp(){
  await loadTravelData();
  applyManagedSiteContent();
  renderAllGrids();
  renderMarketplace();
  marketplaceTabs.select(state.marketplaceTab);
  renderTabs();
  updateTripCard();
}
function applyManagedSiteContent(){
  if(SITE_SETTINGS.default_seo_title)document.title=SITE_SETTINGS.default_seo_title;
  const description=document.querySelector('meta[name="description"]');
  if(description&&SITE_SETTINGS.default_seo_description)description.content=SITE_SETTINGS.default_seo_description;
  document.querySelectorAll('.nav-phone span').forEach(node=>node.textContent=SITE_SETTINGS.contact_phone||node.textContent);
  const heroTitle=document.querySelector('.hero h1');
  const heroLead=document.querySelector('.hero .lead');
  if(heroTitle&&HOMEPAGE_CONTENT.hero_title)heroTitle.textContent=HOMEPAGE_CONTENT.hero_title;
  if(heroLead&&HOMEPAGE_CONTENT.hero_subtitle)heroLead.textContent=HOMEPAGE_CONTENT.hero_subtitle;
  const primary=document.querySelector('.hero-actions .btn-coral'),secondary=document.querySelector('.hero-actions .btn-outline');
  if(primary&&HOMEPAGE_CONTENT.primary_cta?.label){primary.textContent=HOMEPAGE_CONTENT.primary_cta.label;primary.href=HOMEPAGE_CONTENT.primary_cta.href||'#builder';}
  if(secondary&&HOMEPAGE_CONTENT.secondary_cta?.label){secondary.textContent=HOMEPAGE_CONTENT.secondary_cta.label;secondary.href=HOMEPAGE_CONTENT.secondary_cta.href||'#how';}
  if(HOMEPAGE_CONTENT.hero_background_image_url){
    const hero=document.querySelector('.hero');hero.style.backgroundImage=`linear-gradient(rgba(6,40,36,.75),rgba(6,40,36,.75)),url("${HOMEPAGE_CONTENT.hero_background_image_url}")`;
    hero.style.backgroundSize='cover';hero.style.backgroundPosition='center';
  }
  if(Array.isArray(HOMEPAGE_CONTENT.why_content)&&HOMEPAGE_CONTENT.why_content.length){
    const grid=document.querySelector('.why-grid');
    grid.innerHTML=HOMEPAGE_CONTENT.why_content.map(item=>`<div class="why-item reveal show"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.description)}</p></div>`).join('');
  }
  if(Array.isArray(HOMEPAGE_CONTENT.traveller_stories)&&HOMEPAGE_CONTENT.traveller_stories.length){
    const track=document.querySelector('.quote-track');
    track.innerHTML=HOMEPAGE_CONTENT.traveller_stories.map(item=>`<div class="quote-card reveal show"><div class="stars">★★★★★</div><p>${escapeHtml(item.quote)}</p><div class="who">${escapeHtml(item.attribution)}</div></div>`).join('');
  }
  const footerContact=document.querySelector('footer .foot-grid>div:last-child ul');
  if(footerContact)footerContact.innerHTML=[SITE_SETTINGS.enquiry_email,SITE_SETTINGS.contact_phone,SITE_SETTINGS.business_address].filter(Boolean).map(item=>`<li>${escapeHtml(item)}</li>`).join('');
}

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const siteHeader = document.getElementById('siteHeader');
navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  navLinks.classList.toggle('open', open);
});
navLinks.addEventListener('click', event => {
  if (!event.target.closest('a')) return;
  navToggle.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('open');
});
window.addEventListener('scroll', () => siteHeader.classList.toggle('scrolled', window.scrollY > 12), {passive:true});
initApp().catch(error => {
  console.error('Unable to initialize Roam Ceylon', error);
  document.getElementById('builder').classList.add('load-error');
});
