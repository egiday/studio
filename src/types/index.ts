
import type { LucideIcon } from 'lucide-react';

export interface CulturalMovement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface EvolutionCategory {
  id: string;
  name: string;
  description?: string;
}

export interface EvolutionItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: LucideIcon;
  category: string; // ID of EvolutionCategory
  isEvolved: boolean;
  prerequisites?: string[]; // IDs of other EvolutionItems
  specialAbilityName?: string;
  specialAbilityDescription?: string;
}

export type AIPersonalityType =
  | 'AggressiveExpansionist'
  | 'CautiousConsolidator';
  // Future: | 'OpportunisticInfiltrator';

export type DiplomaticStance = 'Neutral' | 'Hostile' | 'Allied';

export interface RivalMovement {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  startingCountryId: string;
  aggressiveness: number; // 0-1, general likelihood to act
  personality: AIPersonalityType; // Defines strategic tendencies
  focus: 'spread' | 'resistance'; // This is illustrative, personality drives more now
  playerStance: DiplomaticStance;
}

export interface RivalPresence {
  rivalId: string;
  influenceLevel: number; // 0-1
}

export type ResistanceArchetype =
  | 'TraditionalistGuardians' // Resists change, strong in low openness areas
  | 'CounterCulturalRebels'   // Pushes back against established player culture
  | 'AuthoritarianSuppressors'; // Uses heavy-handed tactics, impacts IP/costs

export interface SubRegion {
  id: string;
  name: string;
  adoptionLevel: number; // 0-1 Player's culture
  resistanceLevel: number; // 0-1 Towards player's culture
  resistanceArchetype?: ResistanceArchetype | null;
  economicDevelopment: number; // 0-1, relative to country or absolute
  culturalOpenness: number; // 0-1
  internetPenetration?: number; // 0-1
  educationLevel?: number; // 0-1
  mediaFreedom?: number; // 0-1
  rivalPresences: RivalPresence[]; // Changed from rivalPresence: RivalPresence | null
}

export interface Country {
  id: string;
  name: string;
  internetPenetration: number; // 0-1
  educationLevel: number; // 0-1
  economicDevelopment: number; // 0-1 (Can be average of subregions or base if no subregions)
  culturalOpenness: number; // 0-1 (Can be average of subregions or base if no subregions)
  mediaFreedom: number; // 0-1 (Can be average of subregions or base if no subregions)
  adoptionLevel: number; // 0-1, dynamic (overall for country, derived from subregions if they exist) Player's culture
  resistanceLevel: number; // 0-1, dynamic (overall for country, derived from subregions if they exist) Towards player's culture
  resistanceArchetype?: ResistanceArchetype | null;
  subRegions?: SubRegion[];
  rivalPresences: RivalPresence[]; // Changed from rivalPresence: RivalPresence | null
}

export interface NewsHeadline {
  id: string;
  text: string;
  timestamp: number;
}

// --- Global Events System Types ---
export type GlobalEventEffectProperty =
  | 'culturalOpenness'
  | 'economicDevelopment'
  | 'resistanceLevel' // Modifies player's resistance to their own culture
  | 'adoptionRateModifier' // This would likely be a multiplier for player's culture
  | 'ipBonus'; // Direct IP gain for player

export type GlobalEventTargetType = 'global' | 'country'; // Sub-region targeting could be added later

export interface GlobalEventEffect {
  targetType: GlobalEventTargetType;
  countryId?: string; // Required if targetType is 'country'
  property: GlobalEventEffectProperty;
  value: number; // The amount of change or the multiplier
  isMultiplier?: boolean; // If true, value is a multiplier (e.g., 1.1 for +10%), else additive
  duration?: number; // How many turns this specific effect lasts, defaults to event duration
}

export interface GlobalEventOption {
  id: string;
  text: string; // Player-facing choice text
  description: string; // Explains the potential outcome of this choice
  effects: GlobalEventEffect[]; // Specific effects if this option is chosen
}

export interface GlobalEvent {
  id: string;
  name: string;
  description: string;
  turnStart: number; // Turn the event begins
  duration: number; // How many turns the event lasts
  effects: GlobalEventEffect[]; // Base effects if not interactive, or default if no option chosen (not used if options replace)
  options?: GlobalEventOption[]; // Optional choices for the player
  hasBeenTriggered: boolean; // To ensure one-off events don't re-trigger
  chosenOptionId?: string; // ID of the chosen option, if applicable
}
