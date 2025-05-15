
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Country, SubRegion, EvolutionItem, GlobalEvent, GlobalEventEffectProperty, GlobalEventOption, RivalMovement, DiplomaticStance, CulturalMovement, ResistanceArchetype, RivalPresence, AIPersonalityType } from '@/types';
import { useToast } from "@/hooks/use-toast";
import {
  BASE_IP_PER_TURN,
  ADOPTION_IP_MULTIPLIER,
  RIVAL_SPREAD_PENALTY_ON_PLAYER,
  PLAYER_SPREAD_PENALTY_ON_RIVAL,
  RIVAL_COUNTER_RESISTANCE_CHANCE,
  RIVAL_COUNTER_RESISTANCE_AMOUNT,
  WIN_PLAYER_GLOBAL_ADOPTION,
  WIN_RIVAL_MAX_GLOBAL_INFLUENCE,
  LOSE_RIVAL_DOMINANCE_THRESHOLD,
  LOSE_PLAYER_COLLAPSE_ADOPTION,
  LOSE_PLAYER_MIN_PEAK_ADOPTION,
  LOSE_IP_ZERO_STREAK_TURNS,
  RESISTANCE_ARCHETYPE_ACTIVATION_THRESHOLD,
  RESISTANCE_ARCHETYPES_LIST,
  RIVAL_AGGRESSIVE_SPREAD_NEW_SUBREGION_CHANCE,
  RIVAL_AGGRESSIVE_SPREAD_NEW_COUNTRY_CHANCE,
  RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD,
  RIVAL_AGGRESSIVE_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT,
  RIVAL_CAUTIOUS_SPREAD_NEW_SUBREGION_CHANCE,
  RIVAL_CAUTIOUS_SPREAD_NEW_COUNTRY_CHANCE,
  RIVAL_CAUTIOUS_MIN_COUNTRY_DOMINANCE_FOR_NEW_COUNTRY_SPREAD,
  RIVAL_CAUTIOUS_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT,
  // DIPLOMACY_STANCE_CHANGE_COST, // This is imported by page.tsx, keep it in gameConstants
} from '@/config/gameConstants';
import type { EVOLUTION_ITEMS as AllEvolutionItemsType, INITIAL_COUNTRIES as AllInitialCountriesType, CULTURAL_MOVEMENTS as AllCulturalMovementsType, RIVAL_MOVEMENTS as AllRivalMovementsType, POTENTIAL_GLOBAL_EVENTS as AllPotentialEventsType } from '@/config/gameData';
import { calculateGlobalAdoptionRate, calculateRivalGlobalInfluence, getCountryModifiers, deepClone, getRegionStat } from '@/lib/game-logic-utils';


interface UseGameLogicProps {
  initialCountriesData: typeof AllInitialCountriesType;
  initialRivalMovementsData: typeof AllRivalMovementsType;
  initialPotentialEventsData: typeof AllPotentialEventsType;
  startingInfluencePoints: number;
  allCulturalMovements: typeof AllCulturalMovementsType;
  allEvolutionItems: typeof AllEvolutionItemsType;
  selectedMovementId?: string;
  selectedStartCountryId?: string;
}

export function useGameLogic({
  initialCountriesData,
  initialRivalMovementsData,
  initialPotentialEventsData,
  startingInfluencePoints,
  allCulturalMovements,
  allEvolutionItems,
  selectedMovementId: initialSelectedMovementId,
  selectedStartCountryId: initialSelectedStartCountryId,
}: UseGameLogicProps) {
  const [influencePoints, setInfluencePoints] = useState(startingInfluencePoints);
  const [evolvedItemIds, setEvolvedItemIds] = useState<Set<string>>(new Set());
  const [countries, setCountries] = useState<Country[]>(initialCountriesData.map(c => ({
    ...c,
    adoptionLevel: 0,
    resistanceLevel: c.resistanceLevel || 0.1,
    resistanceArchetype: c.resistanceArchetype || null,
    subRegions: c.subRegions ? c.subRegions.map(sr => ({ ...sr, adoptionLevel: 0, resistanceLevel: sr.resistanceLevel || 0.1, rivalPresences: sr.rivalPresences || [], resistanceArchetype: sr.resistanceArchetype || null })) : undefined,
    rivalPresences: c.rivalPresences || [],
  })));
  const [rivalMovements, setRivalMovements] = useState<RivalMovement[]>(initialRivalMovementsData.map(r => ({...r, playerStance: r.playerStance || 'Hostile'})));
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [recentEvents, setRecentEvents] = useState("The cultural movement is just beginning.");

  const [activeGlobalEvents, setActiveGlobalEvents] = useState<GlobalEvent[]>([]);
  const [allPotentialEvents, setAllPotentialEvents] = useState<GlobalEvent[]>(initialPotentialEventsData.map(e => ({ ...e, hasBeenTriggered: false })));

  const [pendingInteractiveEvent, setPendingInteractiveEvent] = useState<GlobalEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [gameOver, setGameOver] = useState(false);
  const [gameOverTitle, setGameOverTitle] = useState("");
  const [gameOverDescription, setGameOverDescription] = useState("");
  const [maxPlayerAdoptionEver, setMaxPlayerAdoptionEver] = useState(0);
  const [ipZeroStreak, setIpZeroStreak] = useState(0);

  const { toast } = useToast();

  const currentMovement = allCulturalMovements.find(m => m.id === initialSelectedMovementId);
  const currentMovementName = currentMovement?.name || "Unnamed Movement";


  const addRecentEventEntry = useCallback((entry: string) => {
    setRecentEvents(prev => `${prev} ${entry}`);
  }, []);

  const showToast = useCallback((title: string, description: string, variant?: "default" | "destructive", duration?: number) => {
    setTimeout(() => { // Defer toast to avoid issues during render cycles
        toast({ title, description, variant, duration });
    }, 0);
  }, [toast]);


  const startGame = useCallback(() => {
    if (initialSelectedMovementId && initialSelectedStartCountryId) {
      setGameStarted(true);
      setCurrentTurn(1);
      setMaxPlayerAdoptionEver(0);
      setIpZeroStreak(0);
      setGameOver(false);
      setGameOverTitle("");
      setGameOverDescription("");
      setEvolvedItemIds(new Set());
      setInfluencePoints(startingInfluencePoints);
      setActiveGlobalEvents([]);
      setAllPotentialEvents(initialPotentialEventsData.map(e => ({ ...e, hasBeenTriggered: false })));
      setPendingInteractiveEvent(null);
      setIsEventModalOpen(false);

      let initialEventsSummary = "";

      let initialCountriesWithRivals = initialCountriesData.map(c => deepClone({ // Use deepClone for initial setup
        ...c,
        adoptionLevel: 0,
        resistanceLevel: c.resistanceLevel || 0.1,
        resistanceArchetype: null,
        rivalPresences: [],
        subRegions: c.subRegions ? c.subRegions.map(sr => ({
          ...sr,
          adoptionLevel: 0,
          resistanceLevel: sr.resistanceLevel || 0.1,
          resistanceArchetype: null,
          rivalPresences: []
        })) : undefined,
      }));

      initialCountriesWithRivals = initialCountriesWithRivals.map(c => {
        let countryUpdate: Country = deepClone(c);
        if (c.id === initialSelectedStartCountryId) {
          if (countryUpdate.subRegions && countryUpdate.subRegions.length > 0) {
            const updatedSubRegions = countryUpdate.subRegions.map((sr, index) =>
              index === 0 ? { ...sr, adoptionLevel: 0.05, resistanceLevel: Math.max(0.01, (sr.resistanceLevel || 0.1) * 0.8) } : sr
            );
            const newCountryAdoption = updatedSubRegions.reduce((sum, sr) => sum + sr.adoptionLevel, 0) / updatedSubRegions.length;
            initialEventsSummary += ` The ${currentMovementName} takes root in ${updatedSubRegions[0].name}, ${c.name}.`;
            countryUpdate = { ...countryUpdate, subRegions: updatedSubRegions, adoptionLevel: newCountryAdoption };
          } else {
            initialEventsSummary += ` The ${currentMovementName} takes root in ${c.name}.`;
            countryUpdate = { ...countryUpdate, adoptionLevel: 0.05, resistanceLevel: Math.max(0.01, (c.resistanceLevel || 0.1) * 0.8) };
          }
        }
        return countryUpdate;
      });
      
      const currentRivalMovementsConfig = initialRivalMovementsData.map(r => ({...r, playerStance: r.playerStance || 'Hostile'}));
      currentRivalMovementsConfig.forEach(rival => {
        initialCountriesWithRivals = initialCountriesWithRivals.map(c => {
          let countryUpdate: Country = deepClone(c); // Use deepClone
          if (c.id === rival.startingCountryId) {
            const rivalPresenceObj: RivalPresence = { rivalId: rival.id, influenceLevel: 0.05 };
            if (countryUpdate.subRegions && countryUpdate.subRegions.length > 0) {
               const targetSubRegionIndex = countryUpdate.subRegions.findIndex(sr => sr.name.includes("Citadel") || sr.name.includes("Capital") || sr.name.includes("Plexus") || sr.name.includes("Prime"))
              const actualIndex = targetSubRegionIndex !== -1 ? targetSubRegionIndex : Math.floor(Math.random() * countryUpdate.subRegions.length);

              const updatedSubRegions = countryUpdate.subRegions.map((sr, index) => {
                if (index === actualIndex) {
                  const currentRivalPresences = Array.isArray(sr.rivalPresences) ? sr.rivalPresences : [];
                  return { ...sr, rivalPresences: [...currentRivalPresences, rivalPresenceObj] };
                }
                return sr;
              });
              initialEventsSummary += ` The ${rival.name} begins to stir in ${updatedSubRegions[actualIndex].name}, ${c.name}.`;
              countryUpdate = { ...countryUpdate, subRegions: updatedSubRegions };
            } else {
              const currentRivalPresences = Array.isArray(countryUpdate.rivalPresences) ? countryUpdate.rivalPresences : [];
              countryUpdate = { ...countryUpdate, rivalPresences: [...currentRivalPresences, rivalPresenceObj] };
              initialEventsSummary += ` The ${rival.name} begins to stir in ${c.name}.`;
            }
          }
          return countryUpdate;
        });
      });
      setCountries(initialCountriesWithRivals);
      setRivalMovements(currentRivalMovementsConfig);

      const movement = allCulturalMovements.find(m => m.id === initialSelectedMovementId)?.name;
      const countryName = initialCountriesData.find(c => c.id === initialSelectedStartCountryId)?.name;
      showToast("Revolution Started!", `The ${movement} movement has begun in ${countryName}.`);
      setRecentEvents(initialEventsSummary || `The ${movement} movement has begun in ${countryName}. Initial adoption is low.`);
    }
  }, [initialSelectedMovementId, initialSelectedStartCountryId, initialCountriesData, initialRivalMovementsData, initialPotentialEventsData, startingInfluencePoints, allCulturalMovements, currentMovementName, showToast]);

  const evolveItem = useCallback((itemId: string) => {
    const item = allEvolutionItems.find(i => i.id === itemId);
    if (item && influencePoints >= item.cost && !evolvedItemIds.has(itemId)) {
      const canEvolve = !item.prerequisites || item.prerequisites.every(prereqId => evolvedItemIds.has(prereqId));
      if (canEvolve) {
        setInfluencePoints(prev => prev - item.cost);
        setEvolvedItemIds(prev => new Set(prev).add(itemId));
        showToast("Evolution Unlocked!", `${item.name} has been evolved.`);
        addRecentEventEntry(`${item.name} was adopted, strengthening the ${currentMovementName}.`);
      } else {
        showToast("Evolution Failed", `Prerequisites for ${item.name} not met.`, "destructive");
      }
    } else if (item && influencePoints < item.cost) {
      showToast("Evolution Failed", `Not enough Influence Points for ${item.name}.`, "destructive");
    }
  }, [influencePoints, evolvedItemIds, allEvolutionItems, currentMovementName, showToast, addRecentEventEntry]);

  const collectInfluencePoints = useCallback((points: number) => {
    setInfluencePoints(prev => prev + points);
    showToast("Influence Gained!", `Collected ${points} Influence Points.`);
  }, [showToast]);


  const selectEventOption = useCallback((eventWithNoChoice: GlobalEvent, optionId: string) => {
    const chosenOption = eventWithNoChoice.options?.find(opt => opt.id === optionId);
    if (!chosenOption) return;

    let ipFromChoice = 0;
    chosenOption.effects.forEach(effect => {
      if (effect.property === 'ipBonus' && effect.targetType === 'global') { 
        ipFromChoice += effect.value;
      }
    });
    if (ipFromChoice !== 0) {
      setInfluencePoints(prev => prev + ipFromChoice);
    }

    const resolvedEvent: GlobalEvent = {
      ...eventWithNoChoice,
      effects: chosenOption.effects,
      chosenOptionId: optionId,
      hasBeenTriggered: true, // Ensure it's marked as triggered
    };
    
    const hasOngoingEffects = chosenOption.effects.some(eff => eff.property !== 'ipBonus' || eff.targetType !== 'global');
    
    if (hasOngoingEffects && resolvedEvent.duration > 0) { // Only add if it has duration and ongoing effects
        setActiveGlobalEvents(prev => [...prev, resolvedEvent]);
    }

    const eventMessage = `EVENT: ${eventWithNoChoice.name} - You chose: "${chosenOption.text}". ${chosenOption.description}`;
    addRecentEventEntry(eventMessage);
    showToast(`Event Choice: ${eventWithNoChoice.name}`, `You selected: ${chosenOption.text}. ${ipFromChoice !== 0 ? `IP change: ${ipFromChoice}.` : ''}`);

    setPendingInteractiveEvent(null);
    setIsEventModalOpen(false);
  }, [showToast, addRecentEventEntry]);

  const processNextTurnInHook = useCallback(() => {
    if (pendingInteractiveEvent) {
      showToast("Action Required", "Please respond to the active global event.", "destructive");
      setIsEventModalOpen(true);
      return;
    }
    if (gameOver) return;

    const nextTurn = currentTurn + 1;
    setCurrentTurn(nextTurn);

    let turnEventsSummary = `Day ${nextTurn}: The ${currentMovementName} continues its journey.`;
    let ipFromNonInteractiveEventsThisTurn = 0;
    let newPendingInteractiveEvent: GlobalEvent | null = null;

    // 1. Event Processing
    let currentActiveGlobalEventsList = [...activeGlobalEvents];
    const newlyTriggeredNonInteractiveEventsForThisTurn: GlobalEvent[] = [];

    setAllPotentialEvents(prevAllEvents =>
      prevAllEvents.map(event => {
        if (!event.hasBeenTriggered && event.turnStart === nextTurn) {
          const eventToProcess = { ...event, hasBeenTriggered: true };
          if (eventToProcess.options && eventToProcess.options.length > 0) {
            newPendingInteractiveEvent = eventToProcess; // Capture for later setting
            turnEventsSummary += ` ATTENTION: ${eventToProcess.name} requires your decision! ${eventToProcess.description}`;
            showToast("Interactive Event!", `${eventToProcess.name} needs your input.`);
          } else {
            if (eventToProcess.duration > 0) {
               newlyTriggeredNonInteractiveEventsForThisTurn.push(eventToProcess);
            }
            turnEventsSummary += ` NEWS: ${eventToProcess.name} has begun! ${eventToProcess.description}`;
            showToast("Global Event!", `${eventToProcess.name} has started.`);
            eventToProcess.effects.forEach(effect => {
              if (effect.property === 'ipBonus' && effect.targetType === 'global') {
                ipFromNonInteractiveEventsThisTurn += effect.value;
              }
            });
          }
          return eventToProcess; // Mark as triggered
        }
        return event;
      })
    );
    
    if(newPendingInteractiveEvent){
        setPendingInteractiveEvent(newPendingInteractiveEvent);
        setIsEventModalOpen(true);
        // If an interactive event triggered, we pause turn processing here to let user respond.
        // The rest of the turn will resume after they make a choice OR if they somehow bypass (which current UI doesn't allow)
        // For now, we'll set recent events and return.
        setRecentEvents(turnEventsSummary);
        return;
    }
    
    currentActiveGlobalEventsList = [...currentActiveGlobalEventsList, ...newlyTriggeredNonInteractiveEventsForThisTurn];
    const nonExpiredActiveEventsForNextState: GlobalEvent[] = [];
    currentActiveGlobalEventsList.forEach(event => {
        if (event.duration > 0 && nextTurn < event.turnStart + event.duration) {
          nonExpiredActiveEventsForNextState.push(event);
        } else {
          turnEventsSummary += ` NEWS: ${event.name} has concluded.`;
          showToast("Global Event Over", `${event.name} has ended.`);
        }
    });
    setActiveGlobalEvents(nonExpiredActiveEventsForNextState);
    const finalActiveEventsForThisTurnProcessing = nonExpiredActiveEventsForNextState;


    // 2. IP Calculation
    let pointsFromAdoptionThisTurn = 0;
    countries.forEach(country => {
      const countryModifiers = getCountryModifiers(country.id, undefined, finalActiveEventsForThisTurnProcessing, countries);
      if (country.subRegions && country.subRegions.length > 0) {
        country.subRegions.forEach(sr => {
          if (sr.adoptionLevel > 0) {
            // For subregion-specific econ dev, pass sr.id to getCountryModifiers if needed
            const srEconDev = getRegionStat(sr, country, 'economicDevelopment');
            const effectiveEconDev = Math.max(0, (srEconDev + countryModifiers.economicDevelopment.additive) * countryModifiers.economicDevelopment.multiplicative);
            pointsFromAdoptionThisTurn += sr.adoptionLevel * effectiveEconDev * ADOPTION_IP_MULTIPLIER;
          }
        });
      } else {
        if (country.adoptionLevel > 0) {
          const effectiveEconDev = Math.max(0, (country.economicDevelopment + countryModifiers.economicDevelopment.additive) * countryModifiers.economicDevelopment.multiplicative);
          pointsFromAdoptionThisTurn += country.adoptionLevel * effectiveEconDev * ADOPTION_IP_MULTIPLIER;
        }
      }
    });
    const evolvedIpBoost = evolvedItemIds.size * 0.5;
    const newPoints = Math.floor(BASE_IP_PER_TURN + pointsFromAdoptionThisTurn + evolvedIpBoost + ipFromNonInteractiveEventsThisTurn);
    setInfluencePoints(prev => {
      const updatedIP = prev + newPoints;
      if (updatedIP <= 0) {
        setIpZeroStreak(currentStreak => currentStreak + 1);
      } else {
        setIpZeroStreak(0);
      }
      return updatedIP;
    });
    turnEventsSummary += ` ${newPoints} IP generated.`;

    // 3. Player Spread
    const currentGlobalAdoptionForSpreadCalc = calculateGlobalAdoptionRate(countries);
    const hasResistanceManagement = evolvedItemIds.has('adapt_resistance_mgmt');
    let countriesAfterPlayerSpread = countries.map(country => {
      let currentCountryState: Country = deepClone(country);
      const applySpreadAndResistanceToRegion = (region: SubRegion | Country, isSubRegion: boolean, parentCountryForSR?: Country) => {
        let currentRegion: SubRegion | Country = deepClone(region);
        const parentCountry = isSubRegion ? parentCountryForSR! : currentRegion as Country;
        
        const regionModifiers = getCountryModifiers(parentCountry.id, isSubRegion ? (currentRegion as SubRegion).id : undefined, finalActiveEventsForThisTurnProcessing, countries);

        const regionInternetPenetration = getRegionStat(currentRegion, parentCountry, 'internetPenetration');
        const regionCulturalOpenness = getRegionStat(currentRegion, parentCountry, 'culturalOpenness');
        const regionEducationLevel = getRegionStat(currentRegion, parentCountry, 'educationLevel');

        let effectiveCulturalOpenness = Math.max(0, Math.min(1, (regionCulturalOpenness + regionModifiers.culturalOpenness.additive) * regionModifiers.culturalOpenness.multiplicative));
        let newResistanceLevel = Math.max(0, Math.min(1, (currentRegion.resistanceLevel + regionModifiers.resistanceLevel.additive) * regionModifiers.resistanceLevel.multiplicative));
        let currentAdoptionLevel = currentRegion.adoptionLevel;

        if (newResistanceLevel >= RESISTANCE_ARCHETYPE_ACTIVATION_THRESHOLD && !currentRegion.resistanceArchetype) {
          currentRegion.resistanceArchetype = RESISTANCE_ARCHETYPES_LIST[Math.floor(Math.random() * RESISTANCE_ARCHETYPES_LIST.length)];
          turnEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''} now exhibits ${currentRegion.resistanceArchetype?.replace(/([A-Z])/g, ' $1').trim()} behavior.`;
        }

        let archetypeResistanceFactor = 1.0;
        let archetypeSpreadDebuff = 0;
        if (currentRegion.resistanceArchetype === 'TraditionalistGuardians') {
          archetypeResistanceFactor = 1.2;
          archetypeSpreadDebuff = effectiveCulturalOpenness < 0.4 ? 0.1 : 0;
           if (hasResistanceManagement) archetypeResistanceFactor = 1.1; 
        } else if (currentRegion.resistanceArchetype === 'AuthoritarianSuppressors') {
          archetypeResistanceFactor = 1.1; // Placeholder, real effects might be direct IP drain or cost increase.
        }


        if (hasResistanceManagement && currentAdoptionLevel > 0 && newResistanceLevel > 0.05) {
          newResistanceLevel = Math.max(0.01, newResistanceLevel - (0.01 / archetypeResistanceFactor));
        }
        
        if (currentAdoptionLevel > 0.3 && currentAdoptionLevel < 0.9) { // Resistance fights back
          let resistanceIncreaseFactor = (0.005 * (1 - effectiveCulturalOpenness)) * (currentAdoptionLevel - 0.2);
          if (hasResistanceManagement) resistanceIncreaseFactor *= 0.3; // Reduced by management
          resistanceIncreaseFactor *= archetypeResistanceFactor;
          if(currentRegion.resistanceArchetype === 'CounterCulturalRebels') resistanceIncreaseFactor *= 1.5;

          if (Math.random() < 0.3) { // Chance for resistance to increase
            const previousResistance = newResistanceLevel;
            newResistanceLevel = Math.min(0.9, newResistanceLevel + resistanceIncreaseFactor);
            if (newResistanceLevel > previousResistance + 0.001){
               turnEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}`:''} shows increased opposition to ${currentMovementName}.`;
            }
          }
        }
        currentRegion.resistanceLevel = newResistanceLevel;

        let potentialPlayerSpreadIncrease = 0;
        if (currentAdoptionLevel > 0) { // Internal Growth
          const internalGrowthRate = 0.01;
          potentialPlayerSpreadIncrease = internalGrowthRate + (regionInternetPenetration * 0.02) + (effectiveCulturalOpenness * 0.02) + ((evolvedItemIds.size / (allEvolutionItems.length || 1)) * 0.03) + (regionEducationLevel * 0.01);
          const isStartingRegion = parentCountry.id === initialSelectedStartCountryId && (!isSubRegion || (isSubRegion && parentCountry.subRegions && parentCountry.subRegions.length > 0 && parentCountry.subRegions[0].id === (currentRegion as SubRegion).id));
          potentialPlayerSpreadIncrease *= (isStartingRegion && currentAdoptionLevel > 0.04) ? 1.2 : 0.8; // Starting region bonus/normal region penalty
          potentialPlayerSpreadIncrease *= (1 - (newResistanceLevel * 0.75 + archetypeSpreadDebuff)); // Resistance impact
        } else { // Chance to spread to new region
          const baseChanceToStart = 0.005;
          const globalInfluenceFactor = currentGlobalAdoptionForSpreadCalc * 0.1;
          let chance = baseChanceToStart + (regionInternetPenetration * 0.01) + (effectiveCulturalOpenness * 0.01) + globalInfluenceFactor + ((evolvedItemIds.size / (allEvolutionItems.length || 1)) * 0.015) + (regionEducationLevel * 0.005);
          chance *= (1 - (newResistanceLevel * 0.9 + archetypeSpreadDebuff)); // Resistance impact
          if (Math.random() < chance) {
            potentialPlayerSpreadIncrease = 0.005 + (effectiveCulturalOpenness * 0.005);
          }
        }
        potentialPlayerSpreadIncrease = Math.max(0, potentialPlayerSpreadIncrease * regionModifiers.adoptionRateModifier.multiplicative + regionModifiers.adoptionRateModifier.additive);
        const strongestRivalInfluenceInRegion = currentRegion.rivalPresences.reduce((max, rp) => Math.max(max, rp.influenceLevel), 0);
        if (strongestRivalInfluenceInRegion > 0.01) {
          potentialPlayerSpreadIncrease *= (1 - (RIVAL_SPREAD_PENALTY_ON_PLAYER + strongestRivalInfluenceInRegion * 0.1));
        }
        potentialPlayerSpreadIncrease = Math.max(0, potentialPlayerSpreadIncrease);

        let actualPlayerGain = 0;
        if (potentialPlayerSpreadIncrease > 0) {
            let currentRivalsTotalInfluence = currentRegion.rivalPresences.reduce((sum, rp) => sum + rp.influenceLevel, 0);
            let totalOccupiedSpace = currentAdoptionLevel + currentRivalsTotalInfluence;
            const emptySpace = Math.max(0, 1.0 - totalOccupiedSpace);
            
            const gainFromEmptySpace = Math.min(potentialPlayerSpreadIncrease, emptySpace);
            actualPlayerGain += gainFromEmptySpace;
            
            let remainingSpreadToGain = potentialPlayerSpreadIncrease - gainFromEmptySpace;
            if (remainingSpreadToGain > 0 && currentRivalsTotalInfluence > 0) {
                const influenceTakenFromRivalsThisTurn = Math.min(remainingSpreadToGain, currentRivalsTotalInfluence);
                actualPlayerGain += influenceTakenFromRivalsThisTurn;
                currentRegion.rivalPresences = currentRegion.rivalPresences.map(rp => {
                    const proportionOfRivalInfluence = currentRivalsTotalInfluence > 0 ? rp.influenceLevel / currentRivalsTotalInfluence : 0;
                    const reductionAmount = proportionOfRivalInfluence * influenceTakenFromRivalsThisTurn;
                    return { ...rp, influenceLevel: Math.max(0, rp.influenceLevel - reductionAmount) };
                }).filter(rp => rp.influenceLevel > 0.001); 
            }
            currentAdoptionLevel = Math.min(1, currentAdoptionLevel + actualPlayerGain);

            if (region.adoptionLevel === 0 && currentAdoptionLevel > 0.005 && potentialPlayerSpreadIncrease > 0) { // was actualPlayerGain
                 turnEventsSummary += ` Whispers of ${currentMovementName} reach ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
            } else if (region.adoptionLevel > 0 && currentAdoptionLevel > region.adoptionLevel && currentAdoptionLevel > 0.1 && region.adoptionLevel <= 0.1 && Math.random() < 0.3) {
                turnEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}`:''} shows growing interest in ${currentMovementName}.`;
            }
        }
        currentRegion.adoptionLevel = Math.max(0, currentAdoptionLevel);
        return currentRegion;
      };

      if (currentCountryState.subRegions && currentCountryState.subRegions.length > 0) {
        currentCountryState.subRegions = currentCountryState.subRegions.map(sr => applySpreadAndResistanceToRegion(sr, true, currentCountryState) as SubRegion);
      } else {
        currentCountryState = applySpreadAndResistanceToRegion(currentCountryState, false, undefined) as Country;
      }
      return currentCountryState;
    });

    // 4. Rival Turns
    let countriesAfterRivalTurns = deepClone(countriesAfterPlayerSpread); // Start with player-updated state
    rivalMovements.forEach(rival => {
      countriesAfterRivalTurns = countriesAfterRivalTurns.map(country => {
        let modCountryForRival: Country = deepClone(country);

        const applyRivalSpreadToRegion = (region: SubRegion | Country, isSubRegion: boolean, parentCountryForSR?: Country): SubRegion | Country => {
          let modRegion: SubRegion | Country = deepClone(region);
          const parentCountry = isSubRegion ? parentCountryForSR! : modRegion as Country;
          const regionCulturalOpenness = getRegionStat(modRegion, parentCountry, 'culturalOpenness');
          const regionPlayerAdoption = modRegion.adoptionLevel; // Player adoption after their turn

          let rivalDataForRegion = modRegion.rivalPresences.find(rp => rp.rivalId === rival.id);
          let currentRivalInfluence = rivalDataForRegion ? rivalDataForRegion.influenceLevel : 0;
          
          let potentialRivalGain = 0;
          let baseGain = 0;
          let opennessFactor = 1;
          let playerPresencePenaltyFactor = 1;

          switch (rival.personality) {
            case 'AggressiveExpansionist':
              baseGain = (0.022 + Math.random() * 0.038) * rival.aggressiveness;
              opennessFactor = (1 - regionCulturalOpenness * 0.35);
              playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.5)); // More aggressive against player
              break;
            case 'CautiousConsolidator':
              if (currentRivalInfluence > 0) { 
                  baseGain = (0.025 + Math.random() * 0.028) * rival.aggressiveness;
                  opennessFactor = (1 - regionCulturalOpenness * 0.55);
                  playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.7)); // More careful with player
              }
              break;
            case 'OpportunisticInfiltrator': {
              const totalOtherInfluence = regionPlayerAdoption + modRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((s, rp) => s + rp.influenceLevel, 0);
              if (totalOtherInfluence > 0.2 && totalOtherInfluence < 0.8) { 
                  baseGain = (0.015 + Math.random() * 0.025) * rival.aggressiveness;
                  opennessFactor = (1 - regionCulturalOpenness * 0.25);
                  playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.2));
              }
              break;
            }
            case 'IsolationistDefender': {
              const isHomeCountry = parentCountry.id === rival.startingCountryId;
               if (isHomeCountry) {
                   baseGain = (0.03 + Math.random() * 0.03) * rival.aggressiveness; 
                   opennessFactor = (1 - regionCulturalOpenness * 0.1); 
                   playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.1)); 
               }
               break;
            }
            case 'ZealousPurifier':
               baseGain = (0.028 + Math.random() * 0.04) * rival.aggressiveness; 
               opennessFactor = (1 - regionCulturalOpenness * 0.3);
               playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.2));
               break;
          }
          potentialRivalGain = baseGain * opennessFactor * playerPresencePenaltyFactor;
          potentialRivalGain = Math.max(0, potentialRivalGain);

          let actualRivalGainThisTurn = 0; // Renamed to avoid clash
          if (potentialRivalGain > 0) {
            let otherRivalsTotalInfluence = modRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((sum, rp) => sum + rp.influenceLevel, 0);
            let totalOccupiedByPlayerAndOtherRivals = regionPlayerAdoption + otherRivalsTotalInfluence;
            let totalOccupiedSpace = currentRivalInfluence + totalOccupiedByPlayerAndOtherRivals;
            const emptySpace = Math.max(0, 1.0 - totalOccupiedSpace);
            
            const gainFromEmptySpace = Math.min(potentialRivalGain, emptySpace);
            actualRivalGainThisTurn += gainFromEmptySpace;
            
            let remainingGainForRival = potentialRivalGain - gainFromEmptySpace;
            const totalInfluenceToTakeFrom = regionPlayerAdoption + otherRivalsTotalInfluence;

            if (remainingGainForRival > 0 && totalInfluenceToTakeFrom > 0) {
              const influenceTakenThisTurn = Math.min(remainingGainForRival, totalInfluenceToTakeFrom);
              actualRivalGainThisTurn += influenceTakenThisTurn;
              
              if (regionPlayerAdoption > 0) {
                const playerProportion = totalInfluenceToTakeFrom > 0 ? regionPlayerAdoption / totalInfluenceToTakeFrom : 0;
                modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel - (playerProportion * influenceTakenThisTurn));
              }
              
              modRegion.rivalPresences = modRegion.rivalPresences.map(rp => {
                if (rp.rivalId === rival.id) return rp; 
                if (otherRivalsTotalInfluence > 0) { 
                    const otherRivalProportion = totalInfluenceToTakeFrom > 0 ? rp.influenceLevel / totalInfluenceToTakeFrom : 0;
                    const reductionFromOtherRival = otherRivalProportion * influenceTakenThisTurn;
                    return { ...rp, influenceLevel: Math.max(0, rp.influenceLevel - reductionFromOtherRival) };
                }
                return rp;
              }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === rival.id); 
            }
            currentRivalInfluence = Math.min(1, currentRivalInfluence + actualRivalGainThisTurn);
          }

          const rivalIdx = modRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
          if (rivalIdx !== -1) {
            modRegion.rivalPresences[rivalIdx].influenceLevel = currentRivalInfluence;
          } else if (currentRivalInfluence > 0.001) {
            modRegion.rivalPresences.push({ rivalId: rival.id, influenceLevel: currentRivalInfluence });
          }
          modRegion.rivalPresences = modRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);

          if (actualRivalGainThisTurn > 0.001) {
             if ((!rivalDataForRegion || rivalDataForRegion.influenceLevel === 0) && currentRivalInfluence > 0) {
                 turnEventsSummary += ` ${rival.name} establishes a presence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
             } else if (rivalDataForRegion && currentRivalInfluence > rivalDataForRegion.influenceLevel && currentRivalInfluence > 0.05 && rivalDataForRegion.influenceLevel <= 0.05) { // Log significant increase from low base
                 turnEventsSummary += ` ${rival.name} strengthens its influence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
             }
          }
          
          if (rival.personality === 'CautiousConsolidator' && currentRivalInfluence > 0.5 && modRegion.adoptionLevel > 0.05 && Math.random() < (RIVAL_COUNTER_RESISTANCE_CHANCE * rival.aggressiveness)) {
            const prevResistance = modRegion.resistanceLevel;
            modRegion.resistanceLevel = Math.min(0.95, modRegion.resistanceLevel + RIVAL_COUNTER_RESISTANCE_AMOUNT);
            if (modRegion.resistanceLevel > prevResistance + 0.001) {
              turnEventsSummary += ` ${rival.name} stirs dissent against ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
            }
          } else if (rival.personality === 'ZealousPurifier' && currentRivalInfluence > 0.3) {
             if (modRegion.adoptionLevel > 0.01 && Math.random() < 0.3 * rival.aggressiveness) {
                 const reduction = Math.min(modRegion.adoptionLevel, 0.02 + Math.random() * 0.03);
                 modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel - reduction);
                 turnEventsSummary += ` ${rival.name} actively suppresses ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}, reducing its influence.`;
             }
             modRegion.rivalPresences.forEach(otherRivalPresence => {
                 if (otherRivalPresence.rivalId !== rival.id && otherRivalPresence.influenceLevel > 0.01 && Math.random() < 0.2 * rival.aggressiveness) {
                     const reduction = Math.min(otherRivalPresence.influenceLevel, 0.02 + Math.random() * 0.02);
                     otherRivalPresence.influenceLevel = Math.max(0, otherRivalPresence.influenceLevel - reduction);
                     const otherRivalDetails = initialRivalMovementsData.find(r => r.id === otherRivalPresence.rivalId);
                     if (otherRivalDetails) {
                        turnEventsSummary += ` ${rival.name} purges ${otherRivalDetails.name}'s influence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
                     }
                 }
             });
             modRegion.rivalPresences = modRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
          } else if (rival.personality === 'IsolationistDefender' && parentCountry.id === rival.startingCountryId && modRegion.adoptionLevel > 0.05 && Math.random() < (0.4 * rival.aggressiveness) ) {
             const prevResistance = modRegion.resistanceLevel;
             modRegion.resistanceLevel = Math.min(0.98, modRegion.resistanceLevel + (RIVAL_COUNTER_RESISTANCE_AMOUNT * 1.5));
             if (modRegion.resistanceLevel > prevResistance + 0.001) {
              turnEventsSummary += ` ${rival.name} fiercely defends ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''} against ${currentMovementName}.`;
            }
          }
          modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel);
          return modRegion;
        };

        if (modCountryForRival.subRegions && modCountryForRival.subRegions.length > 0) {
           modCountryForRival.subRegions = modCountryForRival.subRegions.map(sr => applyRivalSpreadToRegion(sr, true, modCountryForRival) as SubRegion);
        } else {
           modCountryForRival = applyRivalSpreadToRegion(modCountryForRival, false, undefined) as Country;
        }
        return modCountryForRival;
      });

      // Inter-country Spread for Rivals
      let attemptNewCountrySpread = false;
      let newCountrySpreadChance = 0;
      let newCountryInitialInfluence = 0;

      switch (rival.personality) {
        case 'AggressiveExpansionist': {
            const hasStrongPresenceSomewhere = countriesAfterRivalTurns.some(c =>
                (c.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD)) ||
                (c.subRegions && c.subRegions.some(sr => sr.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD)))
            );
            if (hasStrongPresenceSomewhere) {
                attemptNewCountrySpread = true;
                newCountrySpreadChance = RIVAL_AGGRESSIVE_SPREAD_NEW_COUNTRY_CHANCE + rival.aggressiveness * 0.02;
                newCountryInitialInfluence = RIVAL_AGGRESSIVE_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT + Math.random() * 0.01;
            }
            break;
        }
        case 'CautiousConsolidator': {
            const dominatesACountry = countriesAfterRivalTurns.some(c => {
                let countryTotalRivalInfluence = 0;
                let countryTotalUnits = 0;
                if (c.subRegions && c.subRegions.length > 0) {
                    c.subRegions.forEach(sr => {
                        const rData = sr.rivalPresences.find(rp => rp.rivalId === rival.id);
                        if (rData) countryTotalRivalInfluence += rData.influenceLevel;
                        countryTotalUnits++;
                    });
                } else {
                    const rData = c.rivalPresences.find(rp => rp.rivalId === rival.id);
                    if (rData) countryTotalRivalInfluence += rData.influenceLevel;
                    countryTotalUnits++;
                }
                return countryTotalUnits > 0 && (countryTotalRivalInfluence / countryTotalUnits) > RIVAL_CAUTIOUS_MIN_COUNTRY_DOMINANCE_FOR_NEW_COUNTRY_SPREAD;
            });
            if (dominatesACountry) {
                attemptNewCountrySpread = true;
                newCountrySpreadChance = RIVAL_CAUTIOUS_SPREAD_NEW_COUNTRY_CHANCE + rival.aggressiveness * 0.005; 
                newCountryInitialInfluence = RIVAL_CAUTIOUS_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT + Math.random() * 0.005; 
            }
            break;
        }
        case 'OpportunisticInfiltrator':
             attemptNewCountrySpread = true; 
             newCountrySpreadChance = 0.01 + rival.aggressiveness * 0.015; 
             newCountryInitialInfluence = 0.008 + Math.random() * 0.007; 
             break;
        case 'ZealousPurifier':
             attemptNewCountrySpread = true;
             newCountrySpreadChance = 0.012 + rival.aggressiveness * 0.018; 
             newCountryInitialInfluence = 0.01 + Math.random() * 0.01;
             break;
        case 'IsolationistDefender':
             if (Math.random() < 0.001 * rival.aggressiveness) {
                attemptNewCountrySpread = true;
                newCountrySpreadChance = 0.001 * rival.aggressiveness;
                newCountryInitialInfluence = 0.001 + Math.random() * 0.002;
             }
            break;
      }

      if (attemptNewCountrySpread && Math.random() < newCountrySpreadChance) {
        const uninfluencedOrWeaklyInfluencedCountries = countriesAfterRivalTurns.filter(uc => {
            let rivalPresenceInTargetCountry = 0;
            if (uc.subRegions && uc.subRegions.length > 0) {
                rivalPresenceInTargetCountry = uc.subRegions.reduce((sum, sr) => sum + (sr.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0), 0) / uc.subRegions.length;
            } else {
                rivalPresenceInTargetCountry = uc.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0;
            }
            return rivalPresenceInTargetCountry < 0.001; 
        });

        if (uninfluencedOrWeaklyInfluencedCountries.length > 0) {
            let targetCountryToModify: Country | undefined = deepClone(uninfluencedOrWeaklyInfluencedCountries[Math.floor(Math.random() * uninfluencedOrWeaklyInfluencedCountries.length)]);
            if (targetCountryToModify) {
                let targetSpreadRegion: SubRegion | Country;
                let isTargetSubRegion = false;
                if (targetCountryToModify.subRegions && targetCountryToModify.subRegions.length > 0) {
                    const randomSubRegionIndex = Math.floor(Math.random() * targetCountryToModify.subRegions.length);
                    targetSpreadRegion = targetCountryToModify.subRegions[randomSubRegionIndex];
                    isTargetSubRegion = true;
                } else {
                    targetSpreadRegion = targetCountryToModify;
                }

                let currentRivalInfluenceInTarget = targetSpreadRegion.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0;
                let playerAdoptionInTarget = targetSpreadRegion.adoptionLevel;
                let otherRivalsTotalInTarget = targetSpreadRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((s, rp) => s + rp.influenceLevel, 0);
                let actualInitialGainForNewCountry = 0;

                const totalSpaceOccupiedByOthersAndPlayer = playerAdoptionInTarget + otherRivalsTotalInTarget + currentRivalInfluenceInTarget;
                const emptySpace = Math.max(0, 1.0 - totalSpaceOccupiedByOthersAndPlayer);
                actualInitialGainForNewCountry = Math.min(newCountryInitialInfluence, emptySpace);
                
                let remainingGain = newCountryInitialInfluence - actualInitialGainForNewCountry;
                const totalInfluenceToTakeFrom = playerAdoptionInTarget + otherRivalsTotalInTarget;

                if (remainingGain > 0 && totalInfluenceToTakeFrom > 0) {
                   const influenceTaken = Math.min(remainingGain, totalInfluenceToTakeFrom);
                   actualInitialGainForNewCountry += influenceTaken;
                   if (playerAdoptionInTarget > 0) {
                       const playerProportion = totalInfluenceToTakeFrom > 0 ? playerAdoptionInTarget / totalInfluenceToTakeFrom : 0;
                       targetSpreadRegion.adoptionLevel = Math.max(0, playerAdoptionInTarget - (playerProportion * influenceTaken));
                   }
                   targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.map(orp => {
                       if (orp.rivalId === rival.id) return orp;
                       if(otherRivalsTotalInTarget > 0) {
                           const otherRivalProp = totalInfluenceToTakeFrom > 0 ? orp.influenceLevel / totalInfluenceToTakeFrom : 0;
                           return {...orp, influenceLevel: Math.max(0, orp.influenceLevel - (otherRivalProp * influenceTaken))};
                       }
                       return orp;
                   }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === rival.id);
                }
                
                const rivalIdx = targetSpreadRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
                if (rivalIdx !== -1) {
                    targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel = Math.min(1, (targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel || 0) + actualInitialGainForNewCountry);
                } else if (actualInitialGainForNewCountry > 0.001) {
                    targetSpreadRegion.rivalPresences.push({rivalId: rival.id, influenceLevel: actualInitialGainForNewCountry});
                }
                targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
                targetSpreadRegion.adoptionLevel = Math.max(0, targetSpreadRegion.adoptionLevel);

                if (actualInitialGainForNewCountry > 0.001) {
                    if (isTargetSubRegion && targetCountryToModify.subRegions) {
                        targetCountryToModify.subRegions = targetCountryToModify.subRegions.map(sr => sr.id === (targetSpreadRegion as SubRegion).id ? targetSpreadRegion as SubRegion : sr);
                    } else {
                         targetCountryToModify = targetSpreadRegion as Country;
                    }
                    // Update the main array
                    countriesAfterRivalTurns = countriesAfterRivalTurns.map(c => c.id === targetCountryToModify!.id ? targetCountryToModify! : c);
                    turnEventsSummary += ` ${rival.name} expands its influence into ${targetSpreadRegion.name}${isTargetSubRegion ? ` in ${targetCountryToModify.name}`:''}.`;
                }
            }
        }
      }
    });

    // 5. Final Normalization and Country Update
    let finalCountries = countriesAfterRivalTurns.map(country => {
        let clonedCountry : Country = deepClone(country); 
        const normalizeRegionInfluence = (region: SubRegion | Country): SubRegion | Country => {
            let totalInfluence = region.adoptionLevel + region.rivalPresences.reduce((sum, rp) => sum + rp.influenceLevel, 0);
            if (totalInfluence > 1.001) { 
                const excess = totalInfluence - 1.0;
                const playerShare = totalInfluence > 0 ? region.adoptionLevel / totalInfluence : 0;
                region.adoptionLevel = Math.max(0, region.adoptionLevel - excess * playerShare);
                
                region.rivalPresences = region.rivalPresences.map(rp => {
                    const rivalShare = totalInfluence > 0 ? rp.influenceLevel / totalInfluence : 0;
                    return { ...rp, influenceLevel: Math.max(0, rp.influenceLevel - excess * rivalShare) };
                }).filter(rp => rp.influenceLevel > 0.001);
                region.adoptionLevel = Math.max(0, region.adoptionLevel); 
            } else if (totalInfluence < 0) {
                region.adoptionLevel = 0;
                region.rivalPresences = [];
            }
            return region;
        };
        if (clonedCountry.subRegions && clonedCountry.subRegions.length > 0) {
            clonedCountry.subRegions = clonedCountry.subRegions.map(sr => normalizeRegionInfluence(sr) as SubRegion);
            // Recalculate country-level stats from sub-regions
            clonedCountry.adoptionLevel = clonedCountry.subRegions.reduce((sum, sr) => sum + sr.adoptionLevel, 0) / (clonedCountry.subRegions.length || 1);
            clonedCountry.resistanceLevel = clonedCountry.subRegions.reduce((sum, sr) => sum + sr.resistanceLevel, 0) / (clonedCountry.subRegions.length || 1);
            
            const countryLevelRivalPresenceMap = new Map<string, { totalInfluence: number, count: number, maxInfluence: number }>();
            clonedCountry.subRegions.forEach(sr => {
                sr.rivalPresences.forEach(rp => {
                    const current = countryLevelRivalPresenceMap.get(rp.rivalId) || { totalInfluence: 0, count: 0, maxInfluence: 0 };
                    current.totalInfluence += rp.influenceLevel;
                    current.count++;
                    current.maxInfluence = Math.max(current.maxInfluence, rp.influenceLevel);
                    countryLevelRivalPresenceMap.set(rp.rivalId, current);
                });
            });
            clonedCountry.rivalPresences = Array.from(countryLevelRivalPresenceMap.entries()).map(([rivalId, data]) => ({
                rivalId,
                influenceLevel: data.maxInfluence 
            })).filter(rp => rp.influenceLevel > 0.001);
        } else {
            clonedCountry = normalizeRegionInfluence(clonedCountry) as Country;
        }
        return clonedCountry;
    });
    setCountries(finalCountries);
    setRecentEvents(turnEventsSummary);

    // 6. Win/Loss Check
    let isGameOver = false;
    let newGameOverTitle = "";
    let newGameOverDescription = "";
    const playerGlobalAdoption = calculateGlobalAdoptionRate(finalCountries);
    setMaxPlayerAdoptionEver(prevMax => Math.max(prevMax, playerGlobalAdoption));
    
    const currentRivalGlobalInfluences = rivalMovements.map(rival => ({
      id: rival.id,
      name: rival.name,
      influence: calculateRivalGlobalInfluence(rival.id, finalCountries),
    }));
    
    const allRivalsSuppressed = currentRivalGlobalInfluences.every(r => r.influence < WIN_RIVAL_MAX_GLOBAL_INFLUENCE);
    if (playerGlobalAdoption >= WIN_PLAYER_GLOBAL_ADOPTION && allRivalsSuppressed) {
      isGameOver = true;
      newGameOverTitle = "Global Harmony Achieved!";
      newGameOverDescription = `The ${currentMovementName} has become the guiding light for the world, achieving ${(playerGlobalAdoption * 100).toFixed(0)}% global adoption. Rival ideologies have diminished, paving the way for a new era of unity.`;
    }
    if (!isGameOver) {
      const dominantRival = currentRivalGlobalInfluences.find(r => r.influence >= LOSE_RIVAL_DOMINANCE_THRESHOLD);
      if (dominantRival) {
        isGameOver = true;
        newGameOverTitle = "Rival Ascendancy";
        newGameOverDescription = `${dominantRival.name} has achieved global dominance with ${(dominantRival.influence * 100).toFixed(0)}% influence, overshadowing your movement. The world follows a different path.`;
      }
    }
    if (!isGameOver) {
       const currentIPVal = influencePoints + newPoints;
      if (currentIPVal <= 0 && ipZeroStreak + (currentIPVal <=0 ? 1:0) >= LOSE_IP_ZERO_STREAK_TURNS) {
         isGameOver = true;
         newGameOverTitle = "Economic Collapse";
         newGameOverDescription = `The ${currentMovementName} has run out of resources. With no Influence Points for ${LOSE_IP_ZERO_STREAK_TURNS} consecutive days, your movement has dissolved.`;
      }
      if (playerGlobalAdoption < LOSE_PLAYER_COLLAPSE_ADOPTION && maxPlayerAdoptionEver >= LOSE_PLAYER_MIN_PEAK_ADOPTION && currentTurn > 1) {
        isGameOver = true;
        newGameOverTitle = "Cultural Regression";
        newGameOverDescription = `Despite initial success, the ${currentMovementName} has faded into obscurity. Global adoption fell to ${(playerGlobalAdoption * 100).toFixed(1)}%, and the world's attention has moved on.`;
      }
    }

    if (isGameOver) {
      setGameOver(true);
      setGameOverTitle(newGameOverTitle);
      setGameOverDescription(newGameOverDescription);
      showToast(newGameOverTitle, "The game has concluded.", newGameOverTitle.includes("Achieved") || newGameOverTitle.includes("Harmony") ? "default" : "destructive", 10000);
    }

    if (!newPendingInteractiveEvent && !isGameOver) { // Avoid double toast if interactive event popped up
      showToast(`Day ${nextTurn}`, `The ${currentMovementName} progresses...`);
    }
  }, [
    currentTurn, countries, initialSelectedStartCountryId, initialSelectedMovementId, evolvedItemIds, activeGlobalEvents, 
    allPotentialEvents, toast, pendingInteractiveEvent, selectEventOption, calculateGlobalAdoptionRate, rivalMovements, 
    influencePoints, gameOver, calculateRivalGlobalInfluence, ipZeroStreak, maxPlayerAdoptionEver, currentMovementName, 
    allEvolutionItems, allCulturalMovements, initialRivalMovementsData, showToast, addRecentEventEntry // Added showToast and addRecentEventEntry
  ]);

  const performDiplomaticAction = useCallback((rivalId: string, newStance: DiplomaticStance) => {
    const rival = rivalMovements.find(r => r.id === rivalId);
    if (!rival) return;

    // DIPLOMACY_STANCE_CHANGE_COST is in gameConstants, used by page.tsx
    // For now, assume page.tsx passes the cost or handles it.
    // If this hook needs to know the cost, it should be passed in or imported.
    // For this example, let's say cost is checked by the caller.

    setRivalMovements(prevRivals =>
      prevRivals.map(r =>
        r.id === rivalId ? { ...r, playerStance: newStance } : r
      )
    );

    const stanceChangeMessage = `Your diplomatic stance with ${rival.name} has changed to ${newStance}.`;
    addRecentEventEntry(`DIPLOMACY: ${stanceChangeMessage}`);
    showToast("Diplomacy Update", stanceChangeMessage);
  }, [rivalMovements, showToast, addRecentEventEntry]);


  return {
    influencePoints,
    evolvedItemIds,
    countries,
    rivalMovements,
    gameStarted,
    currentTurn,
    recentEvents,
    activeGlobalEvents,
    pendingInteractiveEvent,
    isEventModalOpen,
    gameOver,
    gameOverTitle,
    gameOverDescription,
    startGame,
    evolveItem,
    collectInfluencePoints,
    selectEventOption,
    processNextTurn: processNextTurnInHook,
    performDiplomaticAction,
    getGlobalAdoptionRate: () => calculateGlobalAdoptionRate(countries),
  };
}
