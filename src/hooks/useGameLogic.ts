
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Country, SubRegion, EvolutionItem, GlobalEvent, GlobalEventEffectProperty, GlobalEventOption, RivalMovement, DiplomaticStance, CulturalMovement, ResistanceArchetype, RivalPresence, AIPersonalityType } from '@/types';
import { useToast } from "@/hooks/use-toast";
import * as GameConstants from '@/config/gameConstants';
import type { EVOLUTION_ITEMS as AllEvolutionItemsType, INITIAL_COUNTRIES as AllInitialCountriesType, CULTURAL_MOVEMENTS as AllCulturalMovementsType, RIVAL_MOVEMENTS as AllRivalMovementsType, POTENTIAL_GLOBAL_EVENTS as AllPotentialEventsType } from '@/config/gameData';
import { calculateGlobalAdoptionRate, calculateRivalGlobalInfluence, getCountryModifiers, deepClone, getRegionStat } from '@/lib/game-logic-utils';
import { processRivalTurns } from '@/game-logic/rival-ai';


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
  
  const [rivalMovements, setRivalMovements] = useState<RivalMovement[]>(
    initialRivalMovementsData.map(r => ({
      ...r,
      playerStance: r.playerStance || 'Hostile',
      influencePoints: r.influencePoints || 20, // Ensure IP is initialized
      evolvedItemIds: r.evolvedItemIds || new Set(), // Ensure evolvedItemIds is a Set
    }))
  );

  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  
  const recentEventsRef = useRef("The cultural movement is just beginning.");
  const [recentEventsDisplay, setRecentEventsDisplay] = useState(recentEventsRef.current);

  const addRecentEventEntry = useCallback((entry: string) => {
    recentEventsRef.current = `${recentEventsRef.current} ${entry}`;
  }, []);


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
  
  const showToast = useCallback((title: string, description: string, variant?: "default" | "destructive", duration?: number) => {
    setTimeout(() => {
        toast({ title, description, variant, duration });
    }, 0);
  }, [toast]);

  const currentMovement = allCulturalMovements.find(m => m.id === initialSelectedMovementId);
  const currentMovementName = currentMovement?.name || "Unnamed Movement";


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

      let initialCountriesWithRivals = initialCountriesData.map(c => deepClone({ 
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
      
      const currentRivalMovementsConfig = initialRivalMovementsData.map(r => ({
        ...r, 
        playerStance: r.playerStance || 'Hostile',
        influencePoints: r.influencePoints || 20,
        evolvedItemIds: new Set(r.evolvedItemIds || []), // Ensure it's a Set
      }));

      currentRivalMovementsConfig.forEach(rival => {
        initialCountriesWithRivals = initialCountriesWithRivals.map(c => {
          let countryUpdate: Country = deepClone(c); 
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
      recentEventsRef.current = initialEventsSummary || `The ${movement} movement has begun in ${countryName}. Initial adoption is low.`;
      setRecentEventsDisplay(recentEventsRef.current);
    }
  }, [initialSelectedMovementId, initialSelectedStartCountryId, initialCountriesData, initialRivalMovementsData, initialPotentialEventsData, startingInfluencePoints, allCulturalMovements, currentMovementName, showToast, addRecentEventEntry]);

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
      hasBeenTriggered: true, 
    };
    
    const hasOngoingEffects = chosenOption.effects.some(eff => eff.property !== 'ipBonus' || eff.targetType !== 'global');
    
    if (hasOngoingEffects && resolvedEvent.duration > 0) { 
        setActiveGlobalEvents(prev => [...prev, resolvedEvent]);
    }

    const eventMessage = `EVENT: ${eventWithNoChoice.name} - You chose: "${chosenOption.text}". ${chosenOption.description}`;
    addRecentEventEntry(eventMessage);
    setTimeout(()=> showToast(`Event Choice: ${eventWithNoChoice.name}`, `You selected: ${chosenOption.text}. ${ipFromChoice !== 0 ? `IP change: ${ipFromChoice}.` : ''}`),0);

    setPendingInteractiveEvent(null);
    setIsEventModalOpen(false);
  }, [showToast, addRecentEventEntry]);

  const processNextTurn = useCallback(() => {
    if (pendingInteractiveEvent) {
      showToast("Action Required", "Please respond to the active global event.", "destructive");
      setIsEventModalOpen(true);
      return;
    }
    if (gameOver) return;

    const nextTurn = currentTurn + 1;
    setCurrentTurn(nextTurn);

    recentEventsRef.current = `Day ${nextTurn}: The ${currentMovementName} continues its journey.`;
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
            newPendingInteractiveEvent = eventToProcess; 
            addRecentEventEntry(` ATTENTION: ${eventToProcess.name} requires your decision! ${eventToProcess.description}`);
            setTimeout(() => showToast("Interactive Event!", `${eventToProcess.name} needs your input.`),0);
          } else {
            if (eventToProcess.duration > 0) { 
               newlyTriggeredNonInteractiveEventsForThisTurn.push(eventToProcess);
            }
            addRecentEventEntry(` NEWS: ${eventToProcess.name} has begun! ${eventToProcess.description}`);
            setTimeout(() => showToast("Global Event!", `${eventToProcess.name} has started.`),0);
            eventToProcess.effects.forEach(effect => {
              if (effect.property === 'ipBonus' && effect.targetType === 'global') {
                ipFromNonInteractiveEventsThisTurn += effect.value;
              }
            });
          }
          return eventToProcess; 
        }
        return event;
      })
    );
    
    if(newPendingInteractiveEvent){
        setPendingInteractiveEvent(newPendingInteractiveEvent);
        setIsEventModalOpen(true);
        setRecentEventsDisplay(recentEventsRef.current);
        return;
    }
    
    currentActiveGlobalEventsList = [...currentActiveGlobalEventsList, ...newlyTriggeredNonInteractiveEventsForThisTurn];
    const nonExpiredActiveEventsForNextState: GlobalEvent[] = [];
    currentActiveGlobalEventsList.forEach(event => {
        if (event.duration > 0 && (event.turnStart + event.duration) > nextTurn) { // Corrected condition
          nonExpiredActiveEventsForNextState.push(event);
        } else if (event.duration > 0 && (event.turnStart + event.duration) <= nextTurn) { // Event concluded this turn
          addRecentEventEntry(` NEWS: ${event.name} has concluded.`);
          setTimeout(() => showToast("Global Event Over", `${event.name} has ended.`),0);
        } else if (event.duration <= 0 && event.hasBeenTriggered) { // One-time event already processed
          // Do nothing, it was already handled
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
            const srEconDev = getRegionStat(sr, country, 'economicDevelopment');
            const effectiveEconDev = Math.max(0, (srEconDev + countryModifiers.economicDevelopment.additive) * countryModifiers.economicDevelopment.multiplicative);
            pointsFromAdoptionThisTurn += sr.adoptionLevel * effectiveEconDev * GameConstants.ADOPTION_IP_MULTIPLIER;
          }
        });
      } else {
        if (country.adoptionLevel > 0) {
          const effectiveEconDev = Math.max(0, (country.economicDevelopment + countryModifiers.economicDevelopment.additive) * countryModifiers.economicDevelopment.multiplicative);
          pointsFromAdoptionThisTurn += country.adoptionLevel * effectiveEconDev * GameConstants.ADOPTION_IP_MULTIPLIER;
        }
      }
    });
    const evolvedIpBoost = evolvedItemIds.size * GameConstants.EVOLVED_IP_BOOST_PER_ITEM; 
    const newPoints = Math.floor(GameConstants.BASE_IP_PER_TURN + pointsFromAdoptionThisTurn + evolvedIpBoost + ipFromNonInteractiveEventsThisTurn);
    setInfluencePoints(prev => {
      const updatedIP = prev + newPoints;
      if (updatedIP <= 0) {
        setIpZeroStreak(currentStreak => currentStreak + 1);
      } else {
        setIpZeroStreak(0);
      }
      return updatedIP;
    });
    addRecentEventEntry(` ${newPoints} IP generated.`);

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

        if (newResistanceLevel >= GameConstants.RESISTANCE_ARCHETYPE_ACTIVATION_THRESHOLD && !currentRegion.resistanceArchetype) {
          currentRegion.resistanceArchetype = GameConstants.RESISTANCE_ARCHETYPES_LIST[Math.floor(Math.random() * GameConstants.RESISTANCE_ARCHETYPES_LIST.length)];
          addRecentEventEntry(` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''} now exhibits ${currentRegion.resistanceArchetype?.replace(/([A-Z])/g, ' $1').trim()} behavior.`);
        }

        let archetypeResistanceFactor = 1.0;
        let archetypeSpreadDebuff = 0;
        if (currentRegion.resistanceArchetype === 'TraditionalistGuardians') {
          archetypeResistanceFactor = 1.2;
          archetypeSpreadDebuff = effectiveCulturalOpenness < 0.4 ? 0.1 : 0;
           if (hasResistanceManagement) archetypeResistanceFactor = 1.1; 
        } else if (currentRegion.resistanceArchetype === 'AuthoritarianSuppressors') {
          archetypeResistanceFactor = 1.1; 
        }


        if (hasResistanceManagement && currentAdoptionLevel > 0 && newResistanceLevel > 0.05) {
          newResistanceLevel = Math.max(0.01, newResistanceLevel - (0.01 / archetypeResistanceFactor));
        }
        
        if (currentAdoptionLevel > 0.3 && currentAdoptionLevel < 0.9) { 
          let resistanceIncreaseFactor = (0.005 * (1 - effectiveCulturalOpenness)) * (currentAdoptionLevel - 0.2);
          if (hasResistanceManagement) resistanceIncreaseFactor *= 0.3; 
          resistanceIncreaseFactor *= archetypeResistanceFactor;
          if(currentRegion.resistanceArchetype === 'CounterCulturalRebels') resistanceIncreaseFactor *= 1.5;

          if (Math.random() < 0.3) { 
            const previousResistance = newResistanceLevel;
            newResistanceLevel = Math.min(0.9, newResistanceLevel + resistanceIncreaseFactor);
            if (newResistanceLevel > previousResistance + 0.001){
               addRecentEventEntry(` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}`:''} shows increased opposition to ${currentMovementName}.`);
            }
          }
        }
        currentRegion.resistanceLevel = newResistanceLevel;

        let potentialPlayerSpreadIncrease = 0;
        if (currentAdoptionLevel > 0) { 
          const internalGrowthRate = 0.01;
          potentialPlayerSpreadIncrease = internalGrowthRate + (regionInternetPenetration * 0.02) + (effectiveCulturalOpenness * 0.02) + ((evolvedItemIds.size / (allEvolutionItems.length || 1)) * 0.03) + (regionEducationLevel * 0.01);
          const isStartingRegion = parentCountry.id === initialSelectedStartCountryId && (!isSubRegion || (isSubRegion && parentCountry.subRegions && parentCountry.subRegions.length > 0 && parentCountry.subRegions[0].id === (currentRegion as SubRegion).id));
          potentialPlayerSpreadIncrease *= (isStartingRegion && currentAdoptionLevel > 0.04) ? 1.2 : 0.8; 
          potentialPlayerSpreadIncrease *= (1 - (newResistanceLevel * 0.75 + archetypeSpreadDebuff)); 
        } else { 
          const baseChanceToStart = 0.005;
          const globalInfluenceFactor = currentGlobalAdoptionForSpreadCalc * 0.1;
          let chance = baseChanceToStart + (regionInternetPenetration * 0.01) + (effectiveCulturalOpenness * 0.01) + globalInfluenceFactor + ((evolvedItemIds.size / (allEvolutionItems.length || 1)) * 0.015) + (regionEducationLevel * 0.005);
          chance *= (1 - (newResistanceLevel * 0.9 + archetypeSpreadDebuff)); 
          if (Math.random() < chance) {
            potentialPlayerSpreadIncrease = 0.005 + (effectiveCulturalOpenness * 0.005);
          }
        }
        potentialPlayerSpreadIncrease = Math.max(0, potentialPlayerSpreadIncrease * regionModifiers.adoptionRateModifier.multiplicative + regionModifiers.adoptionRateModifier.additive);
        const strongestRivalInfluenceInRegion = currentRegion.rivalPresences.reduce((max, rp) => Math.max(max, rp.influenceLevel), 0);
        if (strongestRivalInfluenceInRegion > 0.01) {
          potentialPlayerSpreadIncrease *= (1 - (GameConstants.RIVAL_SPREAD_PENALTY_ON_PLAYER + strongestRivalInfluenceInRegion * 0.1));
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

            if (region.adoptionLevel === 0 && currentAdoptionLevel > 0.005 && potentialPlayerSpreadIncrease > 0) { 
                 addRecentEventEntry(` Whispers of ${currentMovementName} reach ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`);
            } else if (region.adoptionLevel > 0 && currentAdoptionLevel > region.adoptionLevel && currentAdoptionLevel > 0.1 && region.adoptionLevel <= 0.1 && Math.random() < 0.3) {
                addRecentEventEntry(` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}`:''} shows growing interest in ${currentMovementName}.`);
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
      // Recalculate country-level adoption/resistance if subRegions exist
      if (currentCountryState.subRegions && currentCountryState.subRegions.length > 0) {
        currentCountryState.adoptionLevel = currentCountryState.subRegions.reduce((sum, sr) => sum + sr.adoptionLevel, 0) / (currentCountryState.subRegions.length || 1);
        currentCountryState.resistanceLevel = currentCountryState.subRegions.reduce((sum, sr) => sum + sr.resistanceLevel, 0) / (currentCountryState.subRegions.length || 1);
         const countryLevelRivalPresenceMap = new Map<string, { totalInfluence: number; count: number, maxInfluence: number }>();
          currentCountryState.subRegions.forEach(sr => {
              sr.rivalPresences.forEach(rp => {
                  const current = countryLevelRivalPresenceMap.get(rp.rivalId) || { totalInfluence: 0, count: 0, maxInfluence: 0 };
                  current.totalInfluence += rp.influenceLevel;
                  current.count++;
                  current.maxInfluence = Math.max(current.maxInfluence, rp.influenceLevel);
                  countryLevelRivalPresenceMap.set(rp.rivalId, current);
              });
          });
          currentCountryState.rivalPresences = Array.from(countryLevelRivalPresenceMap.entries()).map(([rivalId, data]) => ({
              rivalId,
              influenceLevel: data.maxInfluence 
          })).filter(rp => rp.influenceLevel > 0.001);
      }
      return currentCountryState;
    });

    // 4. Rival Turns
    const rivalProcessingResult = processRivalTurns({
      rivalMovementsState: rivalMovements,
      countriesState: countriesAfterPlayerSpread, // Pass player-updated countries
      currentMovementName: currentMovementName,
      initialRivalMovementsData: initialRivalMovementsData, 
      allEvolutionItems: allEvolutionItems, // Pass all evolution items
      addRecentEventEntry: addRecentEventEntry,
    });
    let countriesAfterRivalTurns = rivalProcessingResult.updatedCountries;
    let updatedRivalsFromAITurn = rivalProcessingResult.updatedRivalMovements;
    setRivalMovements(updatedRivalsFromAITurn);


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
            // Recalculate country-level stats from sub-regions AFTER normalization
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
    

    // 6. Win/Loss Check
    let isGameOver = false;
    let newGameOverTitle = "";
    let newGameOverDescription = "";
    const playerGlobalAdoption = calculateGlobalAdoptionRate(finalCountries);
    setMaxPlayerAdoptionEver(prevMax => Math.max(prevMax, playerGlobalAdoption));
    
    const currentRivalGlobalInfluences = updatedRivalsFromAITurn.map(rival => ({ // Use updated rivals for influence check
      id: rival.id,
      name: rival.name,
      influence: calculateRivalGlobalInfluence(rival.id, finalCountries),
    }));
    
    const allRivalsSuppressed = currentRivalGlobalInfluences.every(r => r.influence < GameConstants.WIN_RIVAL_MAX_GLOBAL_INFLUENCE);
    if (playerGlobalAdoption >= GameConstants.WIN_PLAYER_GLOBAL_ADOPTION && allRivalsSuppressed) {
      isGameOver = true;
      newGameOverTitle = "Global Harmony Achieved!";
      newGameOverDescription = `The ${currentMovementName} has become the guiding light for the galaxy, achieving ${(playerGlobalAdoption * 100).toFixed(0)}% global adoption. Rival ideologies have diminished, paving the way for a new era of unity.`;
    }
    if (!isGameOver) {
      const dominantRival = currentRivalGlobalInfluences.find(r => r.influence >= GameConstants.LOSE_RIVAL_DOMINANCE_THRESHOLD);
      if (dominantRival) {
        isGameOver = true;
        newGameOverTitle = "Rival Ascendancy";
        newGameOverDescription = `${dominantRival.name} has achieved galactic dominance with ${(dominantRival.influence * 100).toFixed(0)}% influence, overshadowing your movement. The galaxy follows a different path.`;
      }
    }
    if (!isGameOver) {
       const currentIPVal = influencePoints + newPoints; 
      if (currentIPVal <= 0 && ipZeroStreak + (currentIPVal <=0 ? 1:0) >= GameConstants.LOSE_IP_ZERO_STREAK_TURNS) {
         isGameOver = true;
         newGameOverTitle = "Economic Collapse";
         newGameOverDescription = `The ${currentMovementName} has run out of resources. With no Influence Points for ${GameConstants.LOSE_IP_ZERO_STREAK_TURNS} consecutive days, your movement has dissolved.`;
      }
      if (playerGlobalAdoption < GameConstants.LOSE_PLAYER_COLLAPSE_ADOPTION && maxPlayerAdoptionEver >= GameConstants.LOSE_PLAYER_MIN_PEAK_ADOPTION && currentTurn > 1) {
        isGameOver = true;
        newGameOverTitle = "Cultural Regression";
        newGameOverDescription = `Despite initial success, the ${currentMovementName} has faded into obscurity. Global adoption fell to ${(playerGlobalAdoption * 100).toFixed(1)}%, and the galaxy's attention has moved on.`;
      }
    }

    if (isGameOver) {
      setGameOver(true);
      setGameOverTitle(newGameOverTitle);
      setGameOverDescription(newGameOverDescription);
      showToast(newGameOverTitle, "The game has concluded.", newGameOverTitle.includes("Achieved") || newGameOverTitle.includes("Harmony") ? "default" : "destructive", 10000);
    }

    if (!newPendingInteractiveEvent && !isGameOver) { 
      setTimeout(()=> showToast(`Day ${nextTurn}`, `The ${currentMovementName} progresses...`),0);
    }
    setRecentEventsDisplay(recentEventsRef.current);

  }, [
    currentTurn, countries, initialSelectedStartCountryId, evolvedItemIds, activeGlobalEvents, 
    allPotentialEvents, pendingInteractiveEvent, 
    rivalMovements, influencePoints, gameOver, ipZeroStreak, maxPlayerAdoptionEver, currentMovementName, 
    allEvolutionItems, allCulturalMovements, initialRivalMovementsData, showToast, addRecentEventEntry, initialSelectedMovementId, 
    selectEventOption, startGame, initialPotentialEventsData // Added initialPotentialEventsData
  ]);

  const performDiplomaticAction = useCallback((rivalId: string, newStance: DiplomaticStance) => {
    const rival = rivalMovements.find(r => r.id === rivalId);
    if (!rival) {
        showToast("Diplomacy Error", "Rival not found.", "destructive");
        return;
    }
    if (influencePoints < GameConstants.DIPLOMACY_STANCE_CHANGE_COST) {
        showToast("Diplomacy Failed", `Not enough IP. Costs ${GameConstants.DIPLOMACY_STANCE_CHANGE_COST} IP.`, "destructive");
        return;
    }
    
    setInfluencePoints(prev => prev - GameConstants.DIPLOMACY_STANCE_CHANGE_COST);
    setRivalMovements(prevRivals =>
      prevRivals.map(r =>
        r.id === rivalId ? { ...r, playerStance: newStance } : r
      )
    );

    const stanceChangeMessage = `Your diplomatic stance with ${rival.name} has changed to ${newStance}.`;
    addRecentEventEntry(`DIPLOMACY: ${stanceChangeMessage}`);
    showToast("Diplomacy Update", stanceChangeMessage);
  }, [rivalMovements, influencePoints, showToast, addRecentEventEntry]);


  useEffect(() => {
    setRecentEventsDisplay(recentEventsRef.current);
  }, [currentTurn]);


  return {
    influencePoints,
    evolvedItemIds,
    countries,
    rivalMovements,
    gameStarted,
    currentTurn,
    recentEvents: recentEventsDisplay, 
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
    processNextTurn,
    performDiplomaticAction,
    getGlobalAdoptionRate: () => calculateGlobalAdoptionRate(countries),
  };
}
