import type {JourneyState} from "@/features/journey/journey-store";
import type {JourneyExperience,ParticipantCounts} from "@/lib/types";

export function includeExperienceSelection(state:JourneyState,experience:JourneyExperience,participants:ParticipantCounts,travellers:ParticipantCounts):JourneyState{
  return {
    ...state,
    selectedThemeIds:[...new Set([...state.selectedThemeIds,...experience.themeIds])],
    selectedDestinationIds:[...new Set([...state.selectedDestinationIds,...experience.destinationIds.slice(0,1)])],
    selectedExperienceIds:[...new Set([...state.selectedExperienceIds,experience.id])],
    travellerCounts:travellers,
    experienceParticipants:{...state.experienceParticipants,[experience.id]:participants}
  };
}

export function removeExperienceSelection(state:JourneyState,experienceId:string):JourneyState{
  const {[experienceId]:removed,...experienceParticipants}=state.experienceParticipants;
  void removed;
  return {...state,selectedExperienceIds:state.selectedExperienceIds.filter(id=>id!==experienceId),experienceParticipants};
}
