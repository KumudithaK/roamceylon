import type {JourneyState} from "@/features/journey/journey-store";
import type {JourneyExperience,ParticipantCounts} from "@/lib/types";

const experiencePlanKey=(experienceId:string)=>`experience:${experienceId}`;

export function includeExperienceSelection(state:JourneyState,experience:JourneyExperience,participants:ParticipantCounts,travellers:ParticipantCounts,pricingPlanId?:string):JourneyState{
  return {
    ...state,
    selectedThemeIds:[...new Set([...state.selectedThemeIds,...experience.themeIds])],
    selectedDestinationIds:[...new Set([...state.selectedDestinationIds,...experience.destinationIds.slice(0,1)])],
    selectedExperienceIds:[...new Set([...state.selectedExperienceIds,experience.id])],
    travellerCounts:travellers,
    experienceParticipants:{...state.experienceParticipants,[experience.id]:participants},
    selectedPricingPlanIds:pricingPlanId?{...(state.selectedPricingPlanIds??{}),[experiencePlanKey(experience.id)]:pricingPlanId}:state.selectedPricingPlanIds??{}
  };
}

export function removeExperienceSelection(state:JourneyState,experienceId:string):JourneyState{
  const {[experienceId]:removed,...experienceParticipants}=state.experienceParticipants;
  const {[experiencePlanKey(experienceId)]:removedPlan,...selectedPricingPlanIds}=state.selectedPricingPlanIds??{};
  void removed;
  void removedPlan;
  return {...state,selectedExperienceIds:state.selectedExperienceIds.filter(id=>id!==experienceId),experienceParticipants,selectedPricingPlanIds};
}
