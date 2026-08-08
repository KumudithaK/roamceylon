import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const themes=JSON.parse(readFileSync(new URL("../data/themes.json",import.meta.url),"utf8"));
const migration=readFileSync(new URL("../supabase/migrations/202608060005_sporting_sri_lanka_editorial_reset.sql",import.meta.url),"utf8");
const strictScope=readFileSync(new URL("../supabase/migrations/202608060006_sporting_sri_lanka_strict_scope.sql",import.meta.url),"utf8");
const ownership=readFileSync(new URL("../supabase/migrations/202608080001_enforce_sporting_experience_theme_ownership.sql",import.meta.url),"utf8");
const approved=[
  "sri-lanka-international-cricket-matchday",
  "cricket-with-local-players",
  "colombo-royal-golf-private-round",
  "victoria-golf-country-resort-experience",
  "nuwara-eliya-golf-club-experience",
  "shangri-la-hambantota-golf-experience",
  "horse-riding-in-nuwara-eliya"
];

test("Sporting Sri Lanka maps only its five sporting destinations",()=>{
  const theme=themes.find((item:{id:string})=>item.id==="sporting");
  assert.equal(theme.description,"Experience Sri Lanka through its rich sporting culture, iconic venues and world-class sporting experiences.");
  assert.deepEqual(theme.destinations,["colombo","kandy","galle","hambantota","nuwaraeliya"]);
});

test("sporting reset publishes the seven approved canonical experiences",()=>{
  for(const slug of approved)assert.match(migration,new RegExp(`\\"slug\\":\\"${slug}\\"`));
  assert.match(migration,/delete from public\.experience_themes where theme_id=/);
  assert.match(migration,/jsonb_array_length\(gallery\)<>5/);
  assert.doesNotMatch(migration,/white-water|surfing|snorkel|diving|ziplin|kayak|trekking|rock-climbing/i);
});

test("strict sporting scope adds sport fishing without adding an adventure destination",()=>{
  assert.match(strictScope,/private-colombo-sport-fishing-charter/);
  assert.match(strictScope,/d\.slug in \('colombo','kandy','galle','hambantota','nuwaraeliya'\)/);
  assert.doesNotMatch(strictScope,/d\.slug in \([^)]*(kalpitiya|kitulgala|arugambay|hikkaduwa)/i);
  assert.match(strictScope,/destinations_count<>5 or invalid_count<>0/);
});

test("sporting products cannot retain legacy cross-theme relationships",()=>{
  assert.match(ownership,/t\.slug<>'sporting'/);
  assert.match(ownership,/cross_theme_count<>0/);
  assert.match(ownership,/colombo-royal-golf-private-round/);
});
