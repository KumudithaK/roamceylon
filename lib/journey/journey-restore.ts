import type {JourneyState} from "../../features/journey/journey-store.tsx";

type JourneyRestoreLaunchSelection={
  themeId?:string|null;
  themeIds?:string[];
  destinationIds?:string[];
  experienceId?:string|null;
  travellers?:JourneyState["travellerCounts"];
  experienceParticipants?:JourneyState["travellerCounts"];
  step?:number;
};

export function mergeJourneyRestoreState(saved:JourneyState,startingState:JourneyState,initialSelection:JourneyRestoreLaunchSelection|undefined,applyLaunchSelection:boolean):JourneyState{
  const hasLaunchSelection=Boolean(initialSelection?.themeId||initialSelection?.themeIds?.length||initialSelection?.destinationIds?.length||initialSelection?.experienceId||initialSelection?.step!==undefined);
  if(!applyLaunchSelection||!hasLaunchSelection)return saved;
  return {
    ...saved,
    selectedThemeIds:[...new Set([...saved.selectedThemeIds,...startingState.selectedThemeIds])],
    selectedDestinationIds:[...new Set([...saved.selectedDestinationIds,...startingState.selectedDestinationIds])],
    selectedExperienceIds:[...new Set([...saved.selectedExperienceIds,...startingState.selectedExperienceIds])],
    currentStep:initialSelection?.step??saved.currentStep,
    travellerCounts:initialSelection?.travellers??saved.travellerCounts,
    experienceParticipants:{...saved.experienceParticipants,...startingState.experienceParticipants}
  };
}
