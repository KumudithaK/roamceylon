import type {JourneyEndpoint} from "@/lib/journey/journey-endpoints";
import type {DestinationPreferences,JourneyGuidePreference} from "@/lib/journey/journey-preferences";
import type {TravelPreference,TravelPreferencesByLeg} from "@/lib/journey/travel-preferences";
import type {ParticipantCounts} from "@/lib/types";

export type JourneyEstimateRequest={
  selectedDestinationIds:string[];
  selectedExperienceIds:string[];
  selectedPricingPlanIds:Record<string,string>;
  destinationPreferences:DestinationPreferences;
  journeyGuidePreference:JourneyGuidePreference;
  pickup:JourneyEndpoint;
  dropoff:JourneyEndpoint;
  globalTravelPreference:TravelPreference;
  travelPreferencesByLeg:TravelPreferencesByLeg;
  travelDates:{start:string;end:string};
  travellerCounts:ParticipantCounts;
  experienceParticipants:Record<string,ParticipantCounts>;
};

export type EstimateFactor="Journey duration"|"Accommodation style"|"Experiences"|"Transport preferences"|"Guide preferences"|"Number of travellers"|"Travel period";

export type PublicJourneyEstimate={
  status:"estimated_range"|"tailored";
  currency:string;
  basis:"per_person";
  perPersonMin:number|null;
  perPersonMax:number|null;
  totalMin:number|null;
  totalMax:number|null;
  durationDays:number;
  estimatedAt:string;
  factors:EstimateFactor[];
  message:string;
  context:{version:1;pricedComponents:string[];unavailableInputs:string[]};
};

export const isJourneyEstimate=(value:unknown):value is PublicJourneyEstimate=>Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&["estimated_range","tailored"].includes(String((value as {status?:unknown}).status)));

