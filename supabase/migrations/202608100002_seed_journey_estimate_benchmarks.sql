alter table public.journey_estimate_bands
  drop constraint if exists journey_estimate_bands_unit_check;

alter table public.journey_estimate_bands
  add constraint journey_estimate_bands_unit_check
  check (unit in ('per_person_night','per_leg','per_person_leg','per_day','per_person'));

update public.journey_estimate_bands as band
set minimum=seed.minimum,
    maximum=seed.maximum,
    unit=seed.unit,
    active=true,
    notes='2026 Sri Lanka market-planning benchmark. Review against contracted supplier rates and seasonality before live launch.'
from (values
  ('stay:five_star_resorts',120::numeric,300::numeric,'per_person_night'),
  ('stay:four_star_resorts',70,150,'per_person_night'),
  ('stay:boutique_hotels_villas',80,220,'per_person_night'),
  ('stay:guest_houses',20,50,'per_person_night'),
  ('stay:homestays',15,40,'per_person_night'),
  ('stay:bungalows',35,100,'per_person_night'),
  ('stay:eco_lodges_tented_camps',70,200,'per_person_night'),
  ('stay:wellness_retreats',120,350,'per_person_night'),
  ('stay:recommend',60,180,'per_person_night'),
  ('transport:scenic_train',5,25,'per_person_leg'),
  ('transport:private_chauffeur_car_suv',45,100,'per_leg'),
  ('transport:high_roof_van',60,130,'per_leg'),
  ('transport:mini_coach_bus',120,250,'per_leg'),
  ('transport:tuk_tuk',15,50,'per_leg'),
  ('transport:scooter',12,30,'per_leg'),
  ('transport:domestic_floatplane',120,250,'per_person_leg'),
  ('transport:self_drive_car',35,75,'per_leg'),
  ('transport:self_drive_van',55,100,'per_leg'),
  ('transport:self_drive_tuk_tuk',12,30,'per_leg'),
  ('transport:self_drive_scooter',8,20,'per_leg'),
  ('transport:recommend',50,120,'per_leg'),
  ('guide:national_tourist_guide',55,100,'per_day'),
  ('guide:chauffeur_tourist_guide',40,70,'per_day'),
  ('guide:recommend',50,90,'per_day'),
  ('guide:specialist',30,80,'per_day'),
  ('experience:default',25,100,'per_person')
) as seed(key,minimum,maximum,unit)
where band.key=seed.key;

comment on constraint journey_estimate_bands_unit_check on public.journey_estimate_bands is
  'Controls how confidential planning bands respond to nights, journey legs, service days and traveller counts.';
