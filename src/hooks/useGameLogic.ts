
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
  DIPLOMACY_STANCE_CHANGE_COST,
} from '@/config/gameConstants';
import type { EVOLUTION_ITEMS as AllEvolutionItemsType, INITIAL_COUNTRIES as AllInitialCountriesType, CULTURAL_MOVEMENTS as AllCulturalMovementsType, RIVAL_MOVEMENTS as AllRivalMovementsType, POTENTIAL_GLOBAL_EVENTS as AllPotentialEventsType } from '@/config/gameData';


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

  const currentMovementName = allCulturalMovements.find(m => m.id === initialSelectedMovementId)?.name || "Unnamed Movement";

  const calculateGlobalAdoptionRate = useCallback((currentCountries: Country[]): number => {
    let totalPlayerAdoption = 0;
    let numReportingUnits = 0;
    currentCountries.forEach(country => {
      if (country.subRegions && country.subRegions.length > 0) {
        country.subRegions.forEach(sr => {
          totalPlayerAdoption += sr.adoptionLevel;
          numReportingUnits++;
        });
      } else {
        totalPlayerAdoption += country.adoptionLevel;
        numReportingUnits++;
      }
    });
    return numReportingUnits > 0 ? totalPlayerAdoption / numReportingUnits : 0;
  }, []);

  const calculateRivalGlobalInfluence = useCallback((rivalId: string, currentCountries: Country[]): number => {
    let totalRivalInfluence = 0;
    let numReportingUnits = 0;
    currentCountries.forEach(country => {
      if (country.subRegions && country.subRegions.length > 0) {
        country.subRegions.forEach(sr => {
          const rivalData = sr.rivalPresences.find(rp => rp.rivalId === rivalId);
          if (rivalData) {
            totalRivalInfluence += rivalData.influenceLevel;
          }
          numReportingUnits++;
        });
      } else {
        const rivalData = country.rivalPresences.find(rp => rp.rivalId === rivalId);
        if (rivalData) {
          totalRivalInfluence += rivalData.influenceLevel;
        }
        numReportingUnits++;
      }
    });
    return numReportingUnits > 0 ? totalRivalInfluence / numReportingUnits : 0;
  }, []);

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

      let initialCountriesWithRivals = initialCountriesData.map(c => ({
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
        let countryUpdate: Country = JSON.parse(JSON.stringify(c));
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
      
      const currentRivalMovements = initialRivalMovementsData.map(r => ({...r, playerStance: r.playerStance || 'Hostile'}));
      currentRivalMovements.forEach(rival => {
        initialCountriesWithRivals = initialCountriesWithRivals.map(c => {
          let countryUpdate: Country = JSON.parse(JSON.stringify(c));
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
      setRivalMovements(currentRivalMovements);

      const movement = allCulturalMovements.find(m => m.id === initialSelectedMovementId)?.name;
      const countryName = initialCountriesData.find(c => c.id === initialSelectedStartCountryId)?.name;
      toast({ title: "Revolution Started!", description: `The ${movement} movement has begun in ${countryName}.` });
      setRecentEvents(initialEventsSummary || `The ${movement} movement has begun in ${countryName}. Initial adoption is low.`);
    }
  }, [initialSelectedMovementId, initialSelectedStartCountryId, initialCountriesData, initialRivalMovementsData, initialPotentialEventsData, startingInfluencePoints, allCulturalMovements, currentMovementName, toast]);

  const evolveItem = useCallback((itemId: string) => {
    const item = allEvolutionItems.find(i => i.id === itemId);
    if (item && influencePoints >= item.cost && !evolvedItemIds.has(itemId)) {
      const canEvolve = !item.prerequisites || item.prerequisites.every(prereqId => evolvedItemIds.has(prereqId));
      if (canEvolve) {
        setInfluencePoints(prev => prev - item.cost);
        setEvolvedItemIds(prev => new Set(prev).add(itemId));
        toast({ title: "Evolution Unlocked!", description: `${item.name} has been evolved.` });
        setRecentEvents(prev => `${prev} ${item.name} was adopted, strengthening the ${currentMovementName}.`);
      } else {
        toast({ title: "Evolution Failed", description: `Prerequisites for ${item.name} not met.`, variant: "destructive" });
      }
    } else if (item && influencePoints < item.cost) {
      toast({ title: "Evolution Failed", description: `Not enough Influence Points for ${item.name}.`, variant: "destructive" });
    }
  }, [influencePoints, evolvedItemIds, allEvolutionItems, currentMovementName, toast]);

  const collectInfluencePoints = useCallback((points: number) => {
    setInfluencePoints(prev => prev + points);
    toast({ title: "Influence Gained!", description: `Collected ${points} Influence Points.` });
  }, [toast]);

  const getCountryModifiers = useCallback((countryId: string, subRegionId: string | undefined, currentActiveEventsList: GlobalEvent[]): Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> => {
    const modifiers: Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> = {
      culturalOpenness: { additive: 0, multiplicative: 1 },
      economicDevelopment: { additive: 0, multiplicative: 1 },
      resistanceLevel: { additive: 0, multiplicative: 1 },
      adoptionRateModifier: { additive: 0, multiplicative: 1 },
      ipBonus: { additive: 0, multiplicative: 1 },
    };

    currentActiveEventsList.forEach(event => {
      event.effects.forEach(effect => {
        let applies = false;
        if (effect.targetType === 'global') {
            applies = true;
        } else if (effect.targetType === 'country' && effect.countryId === countryId && !subRegionId) { 
            applies = true;
        } else if (effect.targetType === 'subregion' && effect.countryId === countryId && effect.subRegionId === subRegionId) {
            applies = true;
        } else if (effect.targetType === 'country' && effect.countryId === countryId && subRegionId && !effect.subRegionId) { 
            applies = true;
        }


        if (applies) {
          const prop = effect.property as GlobalEventEffectProperty;
          if (modifiers[prop]) {
             if (effect.isMultiplier) {
                modifiers[prop]!.multiplicative *= effect.value;
             } else {
                modifiers[prop]!.additive += effect.value;
             }
          } else {
            // This case should ideally not happen if all GlobalEventEffectProperty are initialized
            console.warn(`Modifier for property '${prop}' not found in getCountryModifiers`);
          }
        }
      });
    });
    return modifiers;
  }, []);

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
    setRecentEvents(prev => `${prev} ${eventMessage}`);
    setTimeout(() => {
        toast({ title: `Event Choice: ${eventWithNoChoice.name}`, description: `You selected: ${chosenOption.text}. ${ipFromChoice !== 0 ? `IP change: ${ipFromChoice}.` : ''}` });
    }, 0);

    setPendingInteractiveEvent(null);
    setIsEventModalOpen(false);
  }, [toast]);

  const processNextTurnInHook = useCallback(() => {
    if (pendingInteractiveEvent) {
      setTimeout(() => {
        toast({ title: "Action Required", description: "Please respond to the active global event.", variant: "destructive" });
      },0);
      setIsEventModalOpen(true);
      return;
    }
    if (gameOver) return;

    const nextTurn = currentTurn + 1;
    setCurrentTurn(nextTurn);

    let newRecentEventsSummary = `Day ${nextTurn}: The ${currentMovementName} continues its journey.`;
    let ipFromNonInteractiveEventsThisTurn = 0;

    const newlyTriggeredNonInteractiveEvents: GlobalEvent[] = [];
    setAllPotentialEvents(prevAllEvents =>
      prevAllEvents.map(event => {
        if (!event.hasBeenTriggered && event.turnStart === nextTurn) {
          const eventToProcess = { ...event, hasBeenTriggered: true };
          if (eventToProcess.options && eventToProcess.options.length > 0) {
            setPendingInteractiveEvent(eventToProcess);
            setIsEventModalOpen(true);
            newRecentEventsSummary += ` ATTENTION: ${eventToProcess.name} requires your decision! ${eventToProcess.description}`;
            const toastMessage = `${eventToProcess.name} needs your input.`;
            setTimeout(() => toast({ title: "Interactive Event!", description: toastMessage }), 0);
          } else {
            if (eventToProcess.duration > 0) {
               newlyTriggeredNonInteractiveEvents.push(eventToProcess);
            }
            newRecentEventsSummary += ` NEWS: ${eventToProcess.name} has begun! ${eventToProcess.description}`;
            const toastMessage = `${eventToProcess.name} has started.`;
            setTimeout(() => toast({ title: "Global Event!", description: toastMessage }), 0);
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

    let currentActiveGlobalEvents = activeGlobalEvents;
    setActiveGlobalEvents(prevActiveEvents => {
        const currentEventsForTurn = [...prevActiveEvents, ...newlyTriggeredNonInteractiveEvents];
        const nonExpiredActiveEvents: GlobalEvent[] = [];
        currentEventsForTurn.forEach(event => {
            if (event.duration > 0 && nextTurn < event.turnStart + event.duration) { // Ensure duration is positive
              nonExpiredActiveEvents.push(event);
            } else {
              newRecentEventsSummary += ` NEWS: ${event.name} has concluded.`;
              const toastMessage = `${event.name} has ended.`;
              setTimeout(() => toast({ title: "Global Event Over", description: toastMessage }), 0);
            }
        });
        currentActiveGlobalEvents = nonExpiredActiveEvents; 
        return nonExpiredActiveEvents;
    });

    let pointsFromAdoptionThisTurn = 0;
    countries.forEach(country => {
      if (country.subRegions && country.subRegions.length > 0) {
        country.subRegions.forEach(sr => {
          if (sr.adoptionLevel > 0) {
            const srModifiers = getCountryModifiers(country.id, sr.id, currentActiveGlobalEvents);
            const srEconDev = sr.economicDevelopment ?? country.economicDevelopment; // Fallback to country if subregion econ dev undefined
            const effectiveEconDev = Math.max(0, (srEconDev + srModifiers.economicDevelopment.additive) * srModifiers.economicDevelopment.multiplicative);
            pointsFromAdoptionThisTurn += sr.adoptionLevel * effectiveEconDev * ADOPTION_IP_MULTIPLIER;
          }
        });
      } else {
        if (country.adoptionLevel > 0) {
          const countryModifiers = getCountryModifiers(country.id, undefined, currentActiveGlobalEvents);
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
    newRecentEventsSummary += ` ${newPoints} IP generated.`;

    const currentGlobalAdoptionForSpreadCalc = calculateGlobalAdoptionRate(countries);
    const hasResistanceManagement = evolvedItemIds.has('adapt_resistance_mgmt');

    let updatedCountriesPlayerSpread = countries.map(country => {
      let currentCountryState: Country = JSON.parse(JSON.stringify(country)); 

      const applySpreadAndResistanceToRegion = (region: SubRegion | Country, isSubRegion: boolean, parentCountryForSR?: Country) => {
        let currentRegion: SubRegion | Country = JSON.parse(JSON.stringify(region)); 
        const parentCountry = isSubRegion ? parentCountryForSR! : currentRegion as Country;
        
        const regionModifiers = getCountryModifiers(parentCountry.id, isSubRegion ? (currentRegion as SubRegion).id : undefined, currentActiveGlobalEvents);

        const regionInternetPenetration = (isSubRegion ? (currentRegion as SubRegion).internetPenetration : parentCountry.internetPenetration) ?? parentCountry.internetPenetration ?? 0.5;
        const regionCulturalOpenness = (isSubRegion ? (currentRegion as SubRegion).culturalOpenness : parentCountry.culturalOpenness) ?? parentCountry.culturalOpenness ?? 0.5;
        const regionEducationLevel = (isSubRegion ? (currentRegion as SubRegion).educationLevel : parentCountry.educationLevel) ?? parentCountry.educationLevel ?? 0.5;

        let effectiveCulturalOpenness = Math.max(0, Math.min(1, (regionCulturalOpenness + regionModifiers.culturalOpenness.additive) * regionModifiers.culturalOpenness.multiplicative));
        let newResistanceLevel = Math.max(0, Math.min(1, (currentRegion.resistanceLevel + regionModifiers.resistanceLevel.additive) * regionModifiers.resistanceLevel.multiplicative));
        let currentAdoptionLevel = currentRegion.adoptionLevel;

        if (newResistanceLevel >= RESISTANCE_ARCHETYPE_ACTIVATION_THRESHOLD && !currentRegion.resistanceArchetype) {
          currentRegion.resistanceArchetype = RESISTANCE_ARCHETYPES_LIST[Math.floor(Math.random() * RESISTANCE_ARCHETYPES_LIST.length)];
          newRecentEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''} now exhibits ${currentRegion.resistanceArchetype?.replace(/([A-Z])/g, ' $1').trim()} behavior.`;
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
               newRecentEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}`:''} shows increased opposition to ${currentMovementName}.`;
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

            if (region.adoptionLevel === 0 && currentAdoptionLevel > 0.005 && potentialPlayerSpreadIncrease > 0) {
                 newRecentEventsSummary += ` Whispers of ${currentMovementName} reach ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
            } else if (region.adoptionLevel > 0 && currentAdoptionLevel > region.adoptionLevel && currentAdoptionLevel > 0.1 && region.adoptionLevel <= 0.1 && Math.random() < 0.3) {
                newRecentEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}`:''} shows growing interest in ${currentMovementName}.`;
            }
        }
        currentRegion.adoptionLevel = Math.max(0, currentAdoptionLevel); // Ensure non-negative
        return currentRegion;
      };

      if (currentCountryState.subRegions && currentCountryState.subRegions.length > 0) {
        currentCountryState.subRegions = currentCountryState.subRegions.map(sr => applySpreadAndResistanceToRegion(sr, true, currentCountryState) as SubRegion);
      } else {
        currentCountryState = applySpreadAndResistanceToRegion(currentCountryState, false, undefined) as Country;
      }
      return currentCountryState;
    });

    let updatedCountriesAfterRivals = updatedCountriesPlayerSpread.map(c => JSON.parse(JSON.stringify(c)));

    rivalMovements.forEach(rival => {
      updatedCountriesAfterRivals = updatedCountriesAfterRivals.map(country => {
        let modCountryForRival: Country = JSON.parse(JSON.stringify(country)); 

        const applyRivalSpreadToRegion = (region: SubRegion | Country, isSubRegion: boolean, parentCountryForSR?: Country): SubRegion | Country => {
          let modRegion: SubRegion | Country = JSON.parse(JSON.stringify(region)); 
          const parentCountry = isSubRegion ? parentCountryForSR! : modRegion as Country;
          const regionCulturalOpenness = (isSubRegion ? (modRegion as SubRegion).culturalOpenness : parentCountry.culturalOpenness) ?? parentCountry.culturalOpenness ?? 0.5;
          const regionPlayerAdoption = modRegion.adoptionLevel;

          let rivalDataForRegion = modRegion.rivalPresences.find(rp => rp.rivalId === rival.id);
          let currentRivalInfluence = rivalDataForRegion ? rivalDataForRegion.influenceLevel : 0;
          
          let potentialRivalGain = 0;
          let actualRivalGain = 0;
          let baseGain = 0;
          let opennessFactor = 1;
          let playerPresencePenaltyFactor = 1;

          switch (rival.personality) {
            case 'AggressiveExpansionist':
              baseGain = (0.022 + Math.random() * 0.038) * rival.aggressiveness;
              opennessFactor = (1 - regionCulturalOpenness * 0.35); 
              playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.3)); 
              break;
            case 'CautiousConsolidator':
              if (currentRivalInfluence > 0) { 
                  baseGain = (0.025 + Math.random() * 0.028) * rival.aggressiveness; 
                  opennessFactor = (1 - regionCulturalOpenness * 0.55);
                  playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.5));
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

          if (potentialRivalGain > 0) {
            let otherRivalsTotalInfluence = modRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((sum, rp) => sum + rp.influenceLevel, 0);
            let totalOccupiedByPlayerAndOtherRivals = regionPlayerAdoption + otherRivalsTotalInfluence;
            let totalOccupiedSpace = currentRivalInfluence + totalOccupiedByPlayerAndOtherRivals;
            const emptySpace = Math.max(0, 1.0 - totalOccupiedSpace);
            const gainFromEmptySpace = Math.min(potentialRivalGain, emptySpace);
            actualRivalGain += gainFromEmptySpace;
            
            let remainingGainForRival = potentialRivalGain - gainFromEmptySpace;
            const totalInfluenceToTakeFrom = regionPlayerAdoption + otherRivalsTotalInfluence;

            if (remainingGainForRival > 0 && totalInfluenceToTakeFrom > 0) {
              const influenceTakenThisTurn = Math.min(remainingGainForRival, totalInfluenceToTakeFrom);
              actualRivalGain += influenceTakenThisTurn;
              
              if (regionPlayerAdoption > 0) {
                const playerProportion = totalInfluenceToTakeFrom > 0 ? regionPlayerAdoption / totalInfluenceToTakeFrom : 0;
                const reductionFromPlayer = playerProportion * influenceTakenThisTurn;
                modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel - reductionFromPlayer);
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
            currentRivalInfluence = Math.min(1, currentRivalInfluence + actualRivalGain);
          }

          const rivalIdx = modRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
          if (rivalIdx !== -1) {
            modRegion.rivalPresences[rivalIdx].influenceLevel = currentRivalInfluence;
          } else if (currentRivalInfluence > 0.001) {
            modRegion.rivalPresences.push({ rivalId: rival.id, influenceLevel: currentRivalInfluence });
          }
          modRegion.rivalPresences = modRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);

          if (actualRivalGain > 0.001) {
             if ((!rivalDataForRegion || rivalDataForRegion.influenceLevel === 0) && currentRivalInfluence > 0) {
                 newRecentEventsSummary += ` ${rival.name} establishes a presence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
             } else if (rivalDataForRegion && currentRivalInfluence > rivalDataForRegion.influenceLevel) {
                 newRecentEventsSummary += ` ${rival.name} strengthens its influence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
             }
          }
          
          if (rival.personality === 'CautiousConsolidator' && currentRivalInfluence > 0.5 && modRegion.adoptionLevel > 0.05 && Math.random() < (RIVAL_COUNTER_RESISTANCE_CHANCE * rival.aggressiveness)) {
            const prevResistance = modRegion.resistanceLevel;
            modRegion.resistanceLevel = Math.min(0.95, modRegion.resistanceLevel + RIVAL_COUNTER_RESISTANCE_AMOUNT);
            if (modRegion.resistanceLevel > prevResistance + 0.001) {
              newRecentEventsSummary += ` ${rival.name} stirs dissent against ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
            }
          } else if (rival.personality === 'ZealousPurifier' && currentRivalInfluence > 0.3) {
             if (modRegion.adoptionLevel > 0.01 && Math.random() < 0.3 * rival.aggressiveness) {
                 const reduction = Math.min(modRegion.adoptionLevel, 0.02 + Math.random() * 0.03);
                 modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel - reduction);
                 newRecentEventsSummary += ` ${rival.name} actively suppresses ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}, reducing its influence.`;
             }
             modRegion.rivalPresences.forEach(otherRivalPresence => {
                 if (otherRivalPresence.rivalId !== rival.id && otherRivalPresence.influenceLevel > 0.01 && Math.random() < 0.2 * rival.aggressiveness) {
                     const reduction = Math.min(otherRivalPresence.influenceLevel, 0.02 + Math.random() * 0.02);
                     otherRivalPresence.influenceLevel = Math.max(0, otherRivalPresence.influenceLevel - reduction);
                     const otherRivalDetails = rivalMovements.find(r => r.id === otherRivalPresence.rivalId);
                     if (otherRivalDetails) {
                        newRecentEventsSummary += ` ${rival.name} purges ${otherRivalDetails.name}'s influence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
                     }
                 }
             });
             modRegion.rivalPresences = modRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
          } else if (rival.personality === 'IsolationistDefender' && parentCountry.id === rival.startingCountryId && modRegion.adoptionLevel > 0.05 && Math.random() < (0.4 * rival.aggressiveness) ) {
             const prevResistance = modRegion.resistanceLevel;
             modRegion.resistanceLevel = Math.min(0.98, modRegion.resistanceLevel + (RIVAL_COUNTER_RESISTANCE_AMOUNT * 1.5));
             if (modRegion.resistanceLevel > prevResistance + 0.001) {
              newRecentEventsSummary += ` ${rival.name} fiercely defends ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''} against ${currentMovementName}.`;
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

      let attemptNewCountrySpread = false;
      let newCountrySpreadChance = 0;
      let newCountryInitialInfluence = 0;

      switch (rival.personality) {
        case 'AggressiveExpansionist': {
            const hasStrongPresenceSomewhere = updatedCountriesAfterRivals.some(c =>
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
            const dominatesACountry = updatedCountriesAfterRivals.some(c => {
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
             // Very low chance, typically won't spread.
             if (Math.random() < 0.001 * rival.aggressiveness) { // Extremely low base chance
                attemptNewCountrySpread = true;
                newCountrySpreadChance = 0.001 * rival.aggressiveness;
                newCountryInitialInfluence = 0.001 + Math.random() * 0.002;
             }
            break;
      }

      if (attemptNewCountrySpread && Math.random() < newCountrySpreadChance) {
        const uninfluencedOrWeaklyInfluencedCountries = updatedCountriesAfterRivals.filter(uc => {
            let rivalPresenceInTargetCountry = 0;
            if (uc.subRegions && uc.subRegions.length > 0) {
                rivalPresenceInTargetCountry = uc.subRegions.reduce((sum, sr) => sum + (sr.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0), 0) / uc.subRegions.length;
            } else {
                rivalPresenceInTargetCountry = uc.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0;
            }
            return rivalPresenceInTargetCountry < 0.001; 
        });

        if (uninfluencedOrWeaklyInfluencedCountries.length > 0) {
            let targetCountryToModify: Country | undefined = JSON.parse(JSON.stringify(uninfluencedOrWeaklyInfluencedCountries[Math.floor(Math.random() * uninfluencedOrWeaklyInfluencedCountries.length)]));
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
                let actualInitialGain = 0;

                const totalSpaceOccupiedByOthersAndPlayer = playerAdoptionInTarget + otherRivalsTotalInTarget + currentRivalInfluenceInTarget;
                const emptySpace = Math.max(0, 1.0 - totalSpaceOccupiedByOthersAndPlayer);
                actualInitialGain = Math.min(newCountryInitialInfluence, emptySpace);
                
                let remainingGain = newCountryInitialInfluence - actualInitialGain;
                const totalInfluenceToTakeFrom = playerAdoptionInTarget + otherRivalsTotalInTarget;

                if (remainingGain > 0 && totalInfluenceToTakeFrom > 0) {
                   const influenceTaken = Math.min(remainingGain, totalInfluenceToTakeFrom);
                   actualInitialGain += influenceTaken;
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
                    targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel = Math.min(1, (targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel || 0) + actualInitialGain);
                } else if (actualInitialGain > 0.001) {
                    targetSpreadRegion.rivalPresences.push({rivalId: rival.id, influenceLevel: actualInitialGain});
                }
                targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
                targetSpreadRegion.adoptionLevel = Math.max(0, targetSpreadRegion.adoptionLevel);

                if (actualInitialGain > 0.001) {
                    if (isTargetSubRegion && targetCountryToModify.subRegions) {
                        targetCountryToModify.subRegions = targetCountryToModify.subRegions.map(sr => sr.id === (targetSpreadRegion as SubRegion).id ? targetSpreadRegion as SubRegion : sr);
                    } else {
                         targetCountryToModify = targetSpreadRegion as Country;
                    }
                    updatedCountriesAfterRivals = updatedCountriesAfterRivals.map(c => c.id === targetCountryToModify!.id ? targetCountryToModify! : c);
                    newRecentEventsSummary += ` ${rival.name} expands its influence into ${targetSpreadRegion.name}${isTargetSubRegion ? ` in ${targetCountryToModify.name}`:''}.`;
                }
            }
        }
      }
    });

    let finalCountries = updatedCountriesAfterRivals.map(country => {
        let clonedCountry : Country = JSON.parse(JSON.stringify(country)); 
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
            } else if (totalInfluence < 0) { // Should not happen, but safety
                region.adoptionLevel = 0;
                region.rivalPresences = [];
            }
            return region;
        };
        if (clonedCountry.subRegions && clonedCountry.subRegions.length > 0) {
            clonedCountry.subRegions = clonedCountry.subRegions.map(sr => normalizeRegionInfluence(sr) as SubRegion);
        } else {
            clonedCountry = normalizeRegionInfluence(clonedCountry) as Country;
        }
        
        if (clonedCountry.subRegions && clonedCountry.subRegions.length > 0) {
            clonedCountry.adoptionLevel = clonedCountry.subRegions.reduce((sum, sr) => sum + sr.adoptionLevel, 0) / (clonedCountry.subRegions.length || 1);
            clonedCountry.resistanceLevel = clonedCountry.subRegions.reduce((sum, sr) => sum + sr.resistanceLevel, 0) / (clonedCountry.subRegions.length || 1);
            
            // Consolidate rival presences at country level for overview (strongest or average)
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
                // Using max influence in any sub-region for country-level display for now. Could be average too.
                influenceLevel: data.maxInfluence 
            })).filter(rp => rp.influenceLevel > 0.001);


        }
        return clonedCountry;
    });

    setCountries(finalCountries);
    setRecentEvents(newRecentEventsSummary);

    let isGameOver = false;
    let newGameOverTitle = "";
    let newGameOverDescription = "";
    const playerGlobalAdoption = calculateGlobalAdoptionRate(finalCountries);
    setMaxPlayerAdoptionEver(prevMax => Math.max(prevMax, playerGlobalAdoption));
    
    const rivalGlobalInfluences = rivalMovements.map(rival => ({
      id: rival.id,
      name: rival.name,
      influence: calculateRivalGlobalInfluence(rival.id, finalCountries),
    }));
    
    const allRivalsSuppressed = rivalGlobalInfluences.every(r => r.influence < WIN_RIVAL_MAX_GLOBAL_INFLUENCE);
    if (playerGlobalAdoption >= WIN_PLAYER_GLOBAL_ADOPTION && allRivalsSuppressed) {
      isGameOver = true;
      newGameOverTitle = "Global Harmony Achieved!";
      newGameOverDescription = `The ${currentMovementName} has become the guiding light for the world, achieving ${(playerGlobalAdoption * 100).toFixed(0)}% global adoption. Rival ideologies have diminished, paving the way for a new era of unity.`;
    }
    if (!isGameOver) {
      const dominantRival = rivalGlobalInfluences.find(r => r.influence >= LOSE_RIVAL_DOMINANCE_THRESHOLD);
      if (dominantRival) {
        isGameOver = true;
        newGameOverTitle = "Rival Ascendancy";
        newGameOverDescription = `${dominantRival.name} has achieved global dominance with ${(dominantRival.influence * 100).toFixed(0)}% influence, overshadowing your movement. The world follows a different path.`;
      }
    }
    if (!isGameOver) {
       const currentIPVal = influencePoints + newPoints; // Use the IP value for *this* turn's calculation
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
      setTimeout(() => {
        toast({
          title: newGameOverTitle,
          description: "The game has concluded.",
          variant: newGameOverTitle.includes("Achieved") || newGameOverTitle.includes("Harmony") ? "default" : "destructive",
          duration: 10000,
        });
      }, 0);
    }

    if (!pendingInteractiveEvent && !isGameOver) {
      setTimeout(() => {
        toast({ title: `Day ${nextTurn}`, description: `The ${currentMovementName} progresses...` });
      }, 0);
    }
  }, [
    currentTurn, countries, initialSelectedStartCountryId, initialSelectedMovementId, evolvedItemIds, activeGlobalEvents, getCountryModifiers, allPotentialEvents, toast,
    pendingInteractiveEvent, selectEventOption, calculateGlobalAdoptionRate, rivalMovements, influencePoints, gameOver,
    calculateRivalGlobalInfluence, ipZeroStreak, maxPlayerAdoptionEver, currentMovementName, allEvolutionItems, allCulturalMovements, initialCountriesData, initialRivalMovementsData, initialPotentialEventsData, startingInfluencePoints
  ]);

  const performDiplomaticAction = useCallback((rivalId: string, newStance: DiplomaticStance) => {
    const rival = rivalMovements.find(r => r.id === rivalId);
    if (!rival) return;

    if (influencePoints < DIPLOMACY_STANCE_CHANGE_COST) {
      toast({
        title: "Diplomatic Action Failed",
        description: `Not enough Influence Points. Cost: ${DIPLOMACY_STANCE_CHANGE_COST} IP.`,
        variant: "destructive",
      });
      return;
    }

    setInfluencePoints(prev => prev - DIPLOMACY_STANCE_CHANGE_COST);
    setRivalMovements(prevRivals =>
      prevRivals.map(r =>
        r.id === rivalId ? { ...r, playerStance: newStance } : r
      )
    );

    const stanceChangeMessage = `Your diplomatic stance with ${rival.name} has changed to ${newStance}.`;
    setRecentEvents(prev => `${prev} DIPLOMACY: ${stanceChangeMessage}`);
    toast({
      title: "Diplomacy Update",
      description: stanceChangeMessage,
    });
  }, [influencePoints, rivalMovements, toast]);


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

