import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import type {JourneyState} from "../features/journey/journey-store.tsx";
import {arrivalDateIssue,departureDateIssue,localCalendarDate,minimumArrivalDate} from "../lib/journey/journey-dates.ts";
import {mergeJourneyRestoreState} from "../lib/journey/journey-restore.ts";

const localDate=(year:number,month:number,day:number,hour=12)=>new Date(year,month-1,day,hour);

test("arrival requires fourteen local calendar days",()=>{
  const today=localDate(2026,9,13);
  assert.match(arrivalDateIssue("2026-09-26",today),/at least 14 days/);
  assert.equal(arrivalDateIssue("2026-09-27",today),"");
  assert.equal(arrivalDateIssue("2026-09-28",today),"");
  assert.match(arrivalDateIssue("not-a-date",today),/at least 14 days/);
});

test("minimum arrival crosses month and year boundaries",()=>{
  assert.equal(minimumArrivalDate(localDate(2026,1,25)),"2026-02-08");
  assert.equal(minimumArrivalDate(localDate(2026,12,25)),"2027-01-08");
});

test("minimum arrival follows leap-year calendar behaviour",()=>{
  assert.equal(minimumArrivalDate(localDate(2028,2,20)),"2028-03-05");
  assert.equal(arrivalDateIssue("2028-03-04",localDate(2028,2,20)),"Please choose an arrival date at least 14 days from today.");
});

test("calendar formatting uses local date fields rather than UTC conversion",()=>{
  const nearLocalMidnight=localDate(2026,9,13,0);
  nearLocalMidnight.setMinutes(5);
  assert.equal(localCalendarDate(nearLocalMidnight),"2026-09-13");
  assert.equal(minimumArrivalDate(nearLocalMidnight),"2026-09-27");
});

test("departure remains valid on or after arrival",()=>{
  assert.equal(departureDateIssue("2026-09-27","2026-09-27"),"");
  assert.equal(departureDateIssue("2026-09-27","2026-09-28"),"");
  assert.equal(departureDateIssue("2026-09-27","2026-09-26"),"Drop-off must be on or after pickup.");
  assert.equal(departureDateIssue("2026-09-27","not-a-date"),"Please choose a valid drop-off date.");
});

test("a stale persisted arrival is rejected without destroying other journey state",()=>{
  const saved={
    currentStep:4,
    selectedThemeIds:["heritage"],
    selectedDestinationIds:["sigiriya","colombo"],
    selectedExperienceIds:["rock-fortress"],
    travellerCounts:{adults:2,children:1,infants:0},
    destinationPreferences:{sigiriya:{notes:"Quiet room"}},
    pickup:{date:"2026-09-20"},
    dropoff:{date:"2026-09-28"}
  } as unknown as JourneyState;
  const restored=mergeJourneyRestoreState(saved,saved,undefined,true);
  assert.equal(restored,saved);
  assert.match(arrivalDateIssue(restored.pickup.date,localDate(2026,9,13)),/at least 14 days/);
  assert.deepEqual(restored.selectedDestinationIds,["sigiriya","colombo"]);
  assert.deepEqual(restored.travellerCounts,{adults:2,children:1,infants:0});
  assert.equal(restored.destinationPreferences.sigiriya.notes,"Quiet room");
});

test("arrival input minimum and application validation share the same rule",()=>{
  const source=readFileSync(new URL("../features/journey/journey-builder.tsx",import.meta.url),"utf8");
  assert.match(source,/dateInputRef\.current\.min=minimumArrivalDate\(\)/);
  assert.match(source,/ref=\{dateInputRef\}/);
  assert.match(source,/arrivalDateIssue\(state\.pickup\.date\)/);
});
