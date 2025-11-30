
export interface GiftIdea {
  id: string;
  item: string;
  description?: string;
  forEmail: string; // The person who WANTS this gift
}

export interface DinnerSuggestion {
  id: string;
  dish: string;
  author: string;
}

export interface Participant {
  email: string;
  targetEmail: string; // The person they have to gift
  targetName: string; // Simulated name for the demo
}

export enum AppStage {
  WELCOME = 'WELCOME',
  REGISTRATION = 'REGISTRATION',
  NAME_INPUT = 'NAME_INPUT',
  DASHBOARD = 'DASHBOARD'
}
