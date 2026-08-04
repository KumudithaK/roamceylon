begin;

update public.experiences
set
  short_description='Read Galle Fort as a living UNESCO city through its street plan, ramparts, religious buildings, houses and layered history, with a late-afternoon departure available for sunset atmosphere.',
  full_description=full_description || E'\n\nWhen requested, the walk can begin later and finish along the seaward ramparts in the final light. This replaces a separate sunset checklist product: the bastions, lighthouse precinct and changing ocean light are more meaningful when they remain connected to the complete story of the living city.',
  updated_at=now()
where slug='galle-walking-tour-of-galle-dutch-fort-17th-century-unesco-fortified-living-ci';

update public.experiences
set
  status='archived',
  active=false,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Archived as a duplicate experience. Sunset ramparts are now an optional conclusion to the complete Private Galle Fort Living Heritage Walk.'),
  updated_at=now()
where slug='galle-sunset-walking-along-the-historic-galle-fort-ramparts-overlooking-the-oc';

update public.experiences
set
  slug='galle-sri-lanka-navy-underwater-museum-certified-dive',
  name='Sri Lanka Navy Underwater Museum Dive — Galle',
  category='Water Sports',
  short_description='Dive the Sri Lanka Navy’s underwater museum near Galle Harbour, where a purpose-built cultural installation at recreational depth is developing into an artificial reef.',
  full_description=$copy$The Galle Underwater Museum is a contemporary marine installation created by the Sri Lanka Navy near Galle Harbour. Resting at approximately 45–50 feet, its stone pillars, sculptures, plaques and cannon forms were designed as both a cultural attraction and substrate for coral growth and fish habitat. It is not an ancient shipwreck, and the distinction matters: the experience brings together recent naval initiative, underwater art and the gradual formation of an artificial reef.

The primary product is a guided scuba dive for appropriately certified travellers through a confirmed, registered operator. Certification, recent experience, medical fitness, equipment and conditions are checked before acceptance. The Navy describes the site as accessible to snorkellers, but surface visibility at this depth varies; snorkelling is offered only when a qualified operator confirms that the day’s clarity, sea state, vessel plan and supervision make it worthwhile. Foreign travellers are not shown as restricted by the official listing, but harbour access and operational permission are reconfirmed for every booking.$copy$,
  duration='Approximately 3–4 hours including equipment checks, boat movement, briefing and water time',
  difficulty='Moderate; scuba participation requires recognised Open Water certification or higher',
  best_season='Generally November to April, subject to visibility, current, weather and harbour operations',
  highlights='["Sri Lanka’s first Navy-created underwater museum","A sculpture and artifact installation at recreational diving depth","Artificial-reef development and schooling marine life around the structures","A distinctive underwater perspective on Galle’s maritime identity","A certified, operator-led dive rather than an unsupervised attraction visit"]'::jsonb,
  unique_points='["The site is a modern cultural installation rather than a historic wreck","Conservation, marine colonisation and underwater art share the same space","Its depth makes it accessible to many certified recreational divers","Official Navy documentation provides site depth, season and qualification context"]'::jsonb,
  included='["Confirmed registered dive operator","Tank, weights and standard scuba equipment when specified","Qualified dive guide and boat transfer","Site and safety briefing","Roam Ceylon booking and harbour-access coordination"]'::jsonb,
  things_to_know='["Certified scuba divers must provide recognised certification and recent diving history.","Medical screening and operator insurance requirements apply; some conditions require physician clearance.","Visibility, current and marine-life sightings cannot be guaranteed.","Snorkelling is confirmed only when the operator considers surface viewing safe and worthwhile.","Harbour or Navy operational requirements may alter or cancel access at short notice."]'::jsonb,
  nearby_attractions='["Galle Fort","National Maritime Museum","Galle Harbour","Unawatuna Bay"]'::jsonb,
  traveller_tips='["Send certification details and last-dive date before the proposal is finalised.","Do not fly or travel to significant altitude within the operator’s required post-dive interval.","Use only reef-safe products and never touch the installation or marine growth.","Keep the following hours flexible in case the departure changes with harbour operations." ]'::jsonb,
  badges='["Water Activity","Adventure","Eco Experience","Advance Booking Recommended","Roam Ceylon Recommended"]'::jsonb,
  seo_title='Sri Lanka Navy Underwater Museum Dive in Galle | Roam Ceylon',
  seo_description='A certified recreational dive to the Sri Lanka Navy underwater museum near Galle Harbour, arranged through a confirmed operator and subject to marine conditions.',
  image_status='needs_review',
  needs_image_review=true,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Replace the former Fort-landmark imagery with verified Sri Lanka Navy Underwater Museum diving photography before final visual approval.'),
  status='published',
  active=true,
  updated_at=now()
where slug='galle-exploring-the-old-dutch-hospital-galle-lighthouse-and-historic-churches';

delete from public.experience_themes
where experience_id=(
  select id
  from public.experiences
  where slug='galle-sri-lanka-navy-underwater-museum-certified-dive'
);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from public.experiences e
join public.themes t on t.slug in ('adventure','nature','culture')
where e.slug='galle-sri-lanka-navy-underwater-museum-certified-dive'
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from public.themes t
join public.destinations d on d.slug='galle'
where t.slug in ('adventure','nature','culture')
on conflict do nothing;

update public.pricing_plans
set active=false,updated_at=now()
where entity_type='experience'
  and entity_id=(
    select id
    from public.experiences
    where slug='galle-sri-lanka-navy-underwater-museum-certified-dive'
  );

do $$
declare
  museum_count integer;
  sunset_count integer;
  destination_count integer;
  theme_count integer;
begin
  select count(*) into museum_count
  from public.experiences
  where slug='galle-sri-lanka-navy-underwater-museum-certified-dive'
    and status='published'
    and active
    and image_status='needs_review'
    and needs_image_review
    and length(full_description)>900;

  select count(*) into sunset_count
  from public.experiences
  where slug='galle-sunset-walking-along-the-historic-galle-fort-ramparts-overlooking-the-oc'
    and status='archived'
    and not active;

  select count(*) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  where e.slug='galle-sri-lanka-navy-underwater-museum-certified-dive'
    and d.slug='galle';

  select count(*) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  where e.slug='galle-sri-lanka-navy-underwater-museum-certified-dive';

  if museum_count<>1 or sunset_count<>1 or destination_count<>1 or theme_count<>3 then
    raise exception 'Galle underwater replacement failed: museum %, sunset %, destination %, themes %',museum_count,sunset_count,destination_count,theme_count;
  end if;

  raise notice 'Galle result corrected: sunset folded into heritage walk; standalone sunset archived; Navy Underwater Museum dive published and flagged for verified imagery.';
end $$;

commit;
