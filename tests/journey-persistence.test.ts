import assert from "node:assert/strict";
import test from "node:test";
import {mergeJourneyRestoreState} from "../lib/journey/journey-restore.ts";
import type {JourneyState} from "../features/journey/journey-store.tsx";

const state=(currentStep:number):JourneyState=>({
  currentStep,
  selectedThemeIds:["heritage"],
  selectedDestinationIds:["sigiriya","kandy"],
  selectedExperienceIds:["rock-fortress"],
  destinationPreferences:{
    sigiriya:{stayPreference:"four_star_resorts",guidePreference:"recommend",specialistGuidePreference:"site_tourist_guide",nights:2,notes:"Quiet room"},
    kandy:{stayPreference:"boutique_hotels_villas",guidePreference:"recommend",specialistGuidePreference:"none",nights:1,notes:""}
  },
  journeyGuidePreference:"national_tourist_guide",
  journeyGuideLanguages:["English"],
  journeyGuideNotes:"Cultural focus",
  pickup:{type:"airport",airportCode:"CMB",location:"",date:"2027-02-12",time:"09:00",flightNumber:""},
  dropoff:{type:"airport",airportCode:"CMB",location:"",date:"2027-02-16",time:"18:00",flightNumber:""},
  globalTravelPreference:"private_chauffeur_car_suv",
  travelPreferencesByLeg:{"destination:sigiriya:destination:kandy":{fromDestinationId:"destination:sigiriya",toDestinationId:"destination:kandy",travelPreference:"scenic_train"}},
  selectedStayIdsByDestination:{},
  selectedVehicleId:null,
  selectedGuideId:null,
  selectedPricingPlanIds:{"experience:rock-fortress":"foreigner"},
  travelDates:{start:"2027-02-12",end:"2027-02-16"},
  travellerCounts:{adults:2,children:1,infants:0},
  experienceParticipants:{"rock-fortress":{adults:2,children:1,infants:0}},
  budgetPreference:"premium",
  travelPace:"balanced",
  accessibilityRequirements:"Step-free room where available"
});

test("fresh builder state keeps its default step and empty selections",()=>{
  const fresh={...state(0),selectedThemeIds:[],selectedDestinationIds:[],selectedExperienceIds:[]};
  assert.deepEqual(mergeJourneyRestoreState(fresh,fresh,undefined,true),fresh);
});

test("an explicit step zero launch applies only to the initial restore",()=>{
  const saved=state(6),starting={...state(0),selectedThemeIds:[],selectedDestinationIds:[],selectedExperienceIds:[]};
  const initial=mergeJourneyRestoreState(saved,starting,{step:0},true);
  assert.equal(initial.currentStep,0);

  const progressed={...initial,currentStep:6};
  const visibilityRestore=mergeJourneyRestoreState(progressed,starting,{step:0},false);
  assert.equal(visibilityRestore.currentStep,6);
});

test("visibility restoration preserves persisted selections, travellers and preferences",()=>{
  const saved=state(6),starting=state(0);
  const restored=mergeJourneyRestoreState(saved,starting,{step:0},false);
  assert.deepEqual(restored,saved);
  assert.deepEqual(restored.travellerCounts,{adults:2,children:1,infants:0});
  assert.deepEqual(restored.selectedDestinationIds,["sigiriya","kandy"]);
  assert.equal(restored.destinationPreferences.sigiriya.notes,"Quiet room");
  assert.equal(restored.travelPreferencesByLeg["destination:sigiriya:destination:kandy"].travelPreference,"scenic_train");
});

test("normal refresh without launch parameters restores the complete persisted state",()=>{
  const saved=state(5),starting={...state(0),selectedThemeIds:[],selectedDestinationIds:[],selectedExperienceIds:[]};
  assert.deepEqual(mergeJourneyRestoreState(saved,starting,undefined,true),saved);
});

test("a first deep link still merges its intended selections before later restores use persisted progress",()=>{
  const saved=state(4),starting={...state(1),selectedThemeIds:["wildlife"],selectedDestinationIds:["yala"],selectedExperienceIds:[]};
  const first=mergeJourneyRestoreState(saved,starting,{themeId:"wildlife",destinationIds:["yala"],step:1},true);
  assert.equal(first.currentStep,1);
  assert.deepEqual(first.selectedThemeIds,["heritage","wildlife"]);
  assert.deepEqual(first.selectedDestinationIds,["sigiriya","kandy","yala"]);

  const progressed={...first,currentStep:5};
  assert.equal(mergeJourneyRestoreState(progressed,starting,{themeId:"wildlife",destinationIds:["yala"],step:1},false).currentStep,5);
});
