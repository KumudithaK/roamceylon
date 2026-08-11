import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {allocationReviewReason,createCuratedItinerary,curatedJourneyChanges,normaliseCuratedItinerary,validateCuratedJourney} from "../lib/journey/curated-journey.ts";
import type {JourneyState} from "../features/journey/journey-store.ts";

const state:JourneyState={currentStep:6,selectedThemeIds:["theme"],selectedDestinationIds:["galle","kandy"],selectedExperienceIds:["fort"],destinationPreferences:{galle:{stayPreference:"four_star_resorts",guidePreference:"recommend",specialistGuidePreference:"none",nights:0,notes:""},kandy:{stayPreference:"boutique_hotels_villas",guidePreference:"recommend",specialistGuidePreference:"none",nights:2,notes:""}},journeyGuidePreference:"national_tourist_guide",journeyGuideLanguages:["English"],journeyGuideNotes:"History focus",pickup:{type:"airport",airportCode:"CMB",location:"",date:"2027-02-12",time:"09:00",flightNumber:""},dropoff:{type:"airport",airportCode:"CMB",location:"",date:"2027-02-16",time:"18:00",flightNumber:""},globalTravelPreference:"private_chauffeur_car_suv",travelPreferencesByLeg:{"destination:galle:destination:kandy":{fromDestinationId:"destination:galle",toDestinationId:"destination:kandy",travelPreference:"scenic_train"}},selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"2027-02-12",end:"2027-02-16"},travellerCounts:{adults:2,children:0,infants:0},experienceParticipants:{fort:{adults:2,children:0,infants:0}},budgetPreference:"balanced",travelPace:"balanced",accessibilityRequirements:""};

test("curated journey starts as a detached copy of the traveller brief",()=>{const before=JSON.stringify(state),curated=createCuratedItinerary(state);curated.destinationPreferences.galle.nights=2;assert.equal(JSON.stringify(state),before);assert.equal(state.destinationPreferences.galle.nights,0);assert.equal(curated.destinationPreferences.galle.nights,2)});

test("curation supports destination and experience additions, removals and ordering",()=>{const original=createCuratedItinerary(state),next=normaliseCuratedItinerary({...original,selectedDestinationIds:["galle","ella","kandy"],selectedExperienceIds:["train","fort"],destinationOrigins:{...original.destinationOrigins,ella:"roam_ceylon"},experienceOrigins:{train:"roam_ceylon",fort:"traveller"},destinationPreferences:{...original.destinationPreferences,galle:{...original.destinationPreferences.galle,nights:2},ella:{stayPreference:"boutique_hotels_villas",guidePreference:"recommend",specialistGuidePreference:"none",nights:1,notes:"Added for route flow"}}},state);assert.deepEqual(next.selectedDestinationIds,["galle","ella","kandy"]);assert.deepEqual(next.selectedExperienceIds,["train","fort"]);assert.equal(next.destinationOrigins.ella,"roam_ceylon");assert.equal(validateCuratedJourney(next).plannedNights,5);const changes=curatedJourneyChanges(original,next,{destinations:{galle:"Galle",kandy:"Kandy",ella:"Ella"},experiences:{fort:"Fort walk",train:"Train ride"}});assert(changes.some(change=>change.changeType==="destination_added"));assert(changes.some(change=>change.changeType==="route_changed"));assert(changes.some(change=>change.changeType==="experience_added"));assert(changes.some(change=>change.fieldName==="nights"))});

test("participant normalization permits zero adults for a child-only experience group",()=>{const curated=normaliseCuratedItinerary({...createCuratedItinerary(state),experienceParticipants:{fort:{adults:0,children:2,infants:0}}},state);assert.deepEqual(curated.experienceParticipants.fort,{adults:0,children:2,infants:0})});

test("journey dates and traveller counts can be revised without mutating the original brief",()=>{const original=createCuratedItinerary(state),next=normaliseCuratedItinerary({...original,travelDates:{start:"2027-03-01",end:"2027-03-06"},pickup:{...original.pickup,date:"2027-03-01"},dropoff:{...original.dropoff,date:"2027-03-06"},travellerCounts:{adults:3,children:1,infants:0}},state),changes=curatedJourneyChanges(original,next,{destinations:{},experiences:{}});assert.deepEqual(state.travelDates,{start:"2027-02-12",end:"2027-02-16"});assert.deepEqual(state.travellerCounts,{adults:2,children:0,infants:0});assert(changes.some(change=>change.fieldName==="travelDates"));assert(changes.some(change=>change.fieldName==="travellerCounts"));assert(allocationReviewReason({allocation_type:"accommodation",destination_id:"galle",experience_id:null,from_location_key:null,to_location_key:null},original,next))});

test("experience participants cannot exceed revised journey traveller counts",()=>{
  const itinerary=normaliseCuratedItinerary({
    ...createCuratedItinerary(state),
    travellerCounts:{adults:1,children:0,infants:0},
    experienceParticipants:{fort:{adults:2,children:0,infants:0}}
  },state);
  assert(validateCuratedJourney(itinerary).errors.some(error=>error.includes("Experience participants")));
});

test("route, stay, guide, experience and transport changes require allocation review",()=>{const before=createCuratedItinerary(state),after=normaliseCuratedItinerary({...before,selectedDestinationIds:["kandy","galle"],destinationPreferences:{...before.destinationPreferences,galle:{...before.destinationPreferences.galle,nights:2}},selectedExperienceIds:[],journeyGuideLanguages:["English","Italian"]},state);assert(allocationReviewReason({allocation_type:"accommodation",destination_id:"galle",experience_id:null,from_location_key:null,to_location_key:null},before,after));assert(allocationReviewReason({allocation_type:"experience",destination_id:"galle",experience_id:"fort",from_location_key:null,to_location_key:null},before,after));assert(allocationReviewReason({allocation_type:"guide",destination_id:null,experience_id:null,from_location_key:null,to_location_key:null},before,after));assert(allocationReviewReason({allocation_type:"vehicle",destination_id:null,experience_id:null,from_location_key:"pickup",to_location_key:"destination:galle"},before,after))});

test("migration protects the brief and proposal generation resolves curated state",()=>{
  const migration=readFileSync(new URL("../supabase/migrations/202608100003_journey_studio_and_rbac.sql",import.meta.url),"utf8");
  const proposal=readFileSync(new URL("../lib/proposals/journey-proposal-service.ts",import.meta.url),"utf8");
  assert.match(migration,/protect_original_traveller_brief/);
  assert.match(migration,/Curated Journey instead/);
  assert.match(proposal,/resolveJourneyDesign/);
  assert.match(proposal,/curated_journey_snapshot/);
  assert.match(proposal,/eq\("review_required",true\)/);
  assert(proposal.indexOf('eq("review_required",true)')<proposal.indexOf("allocationCommercialSnapshot(enquiryId"));
});

test("legacy enquiries still fall back to their submitted journey state",()=>{const server=readFileSync(new URL("../lib/journey/curated-journey-server.ts",import.meta.url),"utf8");assert.match(server,/state:itinerary\?curatedItineraryToJourneyState\(itinerary,brief\.state\):brief\.state/)});
