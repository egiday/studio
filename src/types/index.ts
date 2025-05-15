
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
  | 'CautiousConsolidator'
  | 'OpportunisticInfiltrator'
  | 'IsolationistDefender'
  | 'ZealousPurifier';

export type DiplomaticStance = 'Neutral' | 'Hostile' | 'Allied';

export interface RivalMovement {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  startingCountryId: string; // Thematic: Starting Solar System ID
  aggressiveness: number; // 0-1, general likelihood to act
  personality: AIPersonalityType; // Defines strategic tendencies
  playerStance: DiplomaticStance;
}

export interface RivalPresence {
  rivalId: string;
  influenceLevel: number; // 0-1
}

export type ResistanceArchetype =
  | 'TraditionalistGuardians' // Thematic: 'Stellar Conservators' - Resist change, strong in isolated systems
  | 'CounterCulturalRebels'   // Thematic: 'Void Anarchists' - Push back against established player culture
  | 'AuthoritarianSuppressors'; // Thematic: 'Galactic Enforcers' - Use heavy-handed tactics

// Represents a Planet within a Solar System
export interface SubRegion {
  id: string;
  name: string; // Planet Name
  adoptionLevel: number; // 0-1 Player's culture
  resistanceLevel: number; // 0-1 Towards player's culture
  resistanceArchetype?: ResistanceArchetype | null;
  economicDevelopment: number; // Thematic: Resource Output 0-1
  culturalOpenness: number; // Thematic: Xeno-Acceptance 0-1
  internetPenetration?: number; // Thematic: Hypernet Access 0-1
  educationLevel?: number; // Thematic: Tech Literacy 0-1
  mediaFreedom?: number; // Thematic: Info-Flow Freedom 0-1
  rivalPresences: RivalPresence[];
}

// Represents a Solar System
export interface Country {
  id: string;
  name: string; // Solar System Name
  internetPenetration: number; // Thematic: Avg Hypernet Access 0-1
  educationLevel: number; // Thematic: Avg Tech Literacy 0-1
  economicDevelopment: number; // Thematic: Avg Resource Output 0-1
  culturalOpenness: number; // Thematic: Avg Xeno-Acceptance 0-1
  mediaFreedom: number; // Thematic: Avg Info-Flow Freedom 0-1
  adoptionLevel: number; // 0-1, dynamic (overall for system, derived from planets if they exist) Player's culture
  resistanceLevel: number; // 0-1, dynamic (overall for system, derived from planets if they exist) Towards player's culture
  resistanceArchetype?: ResistanceArchetype | null; // Overall system resistance archetype if no planets
  subRegions?: SubRegion[]; // Planets in this system
  rivalPresences: RivalPresence[];
}

export interface NewsHeadline {
  id: string;
  text: string;
  timestamp: number;
}

// --- Global Events System Types ---
export type GlobalEventEffectProperty =
  | 'culturalOpenness' // Xeno-Acceptance
  | 'economicDevelopment' // Resource Output
  | 'resistanceLevel'
  | 'adoptionRateModifier'
  | 'ipBonus';

export type GlobalEventTargetType = 'global' | 'country' | 'subregion'; // country = system, subregion = planet

export interface GlobalEventEffect {
  targetType: GlobalEventTargetType;
  countryId?: string; // System ID
  subRegionId?: string; // Planet ID
  property: GlobalEventEffectProperty;
  value: number;
  isMultiplier?: boolean;
  duration?: number;
}

export interface GlobalEventOption {
  id: string;
  text: string;
  description: string;
  effects: GlobalEventEffect[];
}

export interface GlobalEvent {
  id: string;
  name: string;
  description: string;
  turnStart: number;
  duration: number;
  effects: GlobalEventEffect[];
  options?: GlobalEventOption[];
  hasBeenTriggered: boolean;
  chosenOptionId?: string;
}
