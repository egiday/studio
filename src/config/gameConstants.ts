
// Game Balance Constants
export const BASE_IP_PER_TURN = 1;
export const ADOPTION_IP_MULTIPLIER = 5;
export const RIVAL_SPREAD_PENALTY_ON_PLAYER = 0.15; // Player spread reduced by this factor due to rival presence
export const PLAYER_SPREAD_PENALTY_ON_RIVAL = 0.15; // Rival spread reduced by this factor due to player presence
export const RIVAL_COUNTER_RESISTANCE_CHANCE = 0.40; // Chance for Cautious Consolidator to increase player resistance
export const RIVAL_COUNTER_RESISTANCE_AMOUNT = 0.03; // Amount player resistance increases by
export const DIPLOMACY_STANCE_CHANGE_COST = 25;
export const EVOLVED_IP_BOOST_PER_ITEM = 0.5; // IP boost per evolved item

// Win/Loss Condition Thresholds
export const WIN_PLAYER_GLOBAL_ADOPTION = 0.70; // Player needs 70% global adoption
export const WIN_RIVAL_MAX_GLOBAL_INFLUENCE = 0.15; // All rivals must be below 15% global influence for player to win
export const LOSE_RIVAL_DOMINANCE_THRESHOLD = 0.60; // If any single rival reaches 60% global influence, player loses
export const LOSE_PLAYER_COLLAPSE_ADOPTION = 0.05; // Player adoption drops below 5% after reaching a peak
export const LOSE_PLAYER_MIN_PEAK_ADOPTION = 0.20; // The peak adoption player must have reached for collapse to trigger
export const LOSE_IP_ZERO_STREAK_TURNS = 3; // Player loses if IP stays at 0 for this many consecutive turns

// Resistance System
export const RESISTANCE_ARCHETYPE_ACTIVATION_THRESHOLD = 0.15;
export const RESISTANCE_ARCHETYPES_LIST: ResistanceArchetype[] = ['TraditionalistGuardians', 'CounterCulturalRebels', 'AuthoritarianSuppressors'];

// Rival AI
export const RIVAL_AGGRESSIVE_SPREAD_NEW_SUBREGION_CHANCE = 0.05; // Base chance for aggressive rival to spread to new sub-region
export const RIVAL_AGGRESSIVE_SPREAD_NEW_COUNTRY_CHANCE = 0.015; // Base chance for aggressive rival to spread to new country
export const RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD = 0.20; // Min influence in any region to attempt new country spread
export const RIVAL_AGGRESSIVE_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT = 0.01;

export const RIVAL_CAUTIOUS_SPREAD_NEW_SUBREGION_CHANCE = 0.02; // Base chance for cautious rival to spread to new sub-region
export const RIVAL_CAUTIOUS_SPREAD_NEW_COUNTRY_CHANCE = 0.005; // Base chance for cautious rival to spread to new country
export const RIVAL_CAUTIOUS_MIN_COUNTRY_DOMINANCE_FOR_NEW_COUNTRY_SPREAD = 0.60; // Min avg influence in a country to attempt new country spread
export const RIVAL_CAUTIOUS_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT = 0.005;

// Evolution Items (example, specific effects are in gameData.ts)
// export const EVOLVED_IP_BOOST_PER_ITEM = 0.5; // This is currently used directly in useGameLogic

// This type import is needed if ResistanceArchetype is used in this file, as it is for RESISTANCE_ARCHETYPES_LIST
import type { ResistanceArchetype } from '@/types';
