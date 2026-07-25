/* ---------------- REVEAL ON SCROLL ---------------- */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('show'); io.unobserve(en.target); } });
},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------------- INIT ---------------- */
async function initApp(){
  await loadTravelData();
  renderAllGrids();
  renderMarketplace();
  renderTabs();
  updateTripCard();
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
