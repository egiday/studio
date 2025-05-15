
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { WorldMap } from '@/components/game/WorldMap';
import { ControlPanel } from '@/components/game/ControlPanel';
import { EvolutionPanel } from '@/components/game/EvolutionPanel';
import { NewsFeed } from '@/components/game/NewsFeed';
import { AnalyticsDashboard } from '@/components/game/AnalyticsDashboard';
import { GlobalEventsDisplay } from '@/components/game/GlobalEventsDisplay';
import { InteractiveEventModal } from '@/components/game/InteractiveEventModal';
import { DiplomacyPanel } from '@/components/game/DiplomacyPanel';
import { CULTURAL_MOVEMENTS, EVOLUTION_CATEGORIES, EVOLUTION_ITEMS, INITIAL_COUNTRIES, STARTING_INFLUENCE_POINTS, POTENTIAL_GLOBAL_EVENTS, RIVAL_MOVEMENTS } from '@/config/gameData';
import type { Country, SubRegion, EvolutionItem, GlobalEvent, GlobalEventEffectProperty, GlobalEventOption, RivalMovement, DiplomaticStance, RivalPresence, ResistanceArchetype } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, AlertCircle, Newspaper, Info as InfoIcon, Handshake, Trophy, Skull, ShieldQuestion } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const BASE_IP_PER_TURN = 1;
const ADOPTION_IP_MULTIPLIER = 5;
const RIVAL_SPREAD_PENALTY_ON_PLAYER = 0.15;
const PLAYER_SPREAD_PENALTY_ON_RIVAL = 0.15;
const RIVAL_COUNTER_RESISTANCE_CHANCE = 0.40; // Slightly increased
const RIVAL_COUNTER_RESISTANCE_AMOUNT = 0.03;
const DIPLOMACY_STANCE_CHANGE_COST = 25;

// Win/Loss Condition Thresholds
const WIN_PLAYER_GLOBAL_ADOPTION = 0.70;
const WIN_RIVAL_MAX_GLOBAL_INFLUENCE = 0.15;
const LOSE_RIVAL_DOMINANCE_THRESHOLD = 0.60;
const LOSE_PLAYER_COLLAPSE_ADOPTION = 0.05;
const LOSE_PLAYER_MIN_PEAK_ADOPTION = 0.20;
const LOSE_IP_ZERO_STREAK_TURNS = 3;

const RESISTANCE_ARCHETYPE_ACTIVATION_THRESHOLD = 0.15;
const RESISTANCE_ARCHETYPES: ResistanceArchetype[] = ['TraditionalistGuardians', 'CounterCulturalRebels', 'AuthoritarianSuppressors'];


export default function GamePage() {
  const [selectedMovementId, setSelectedMovementId] = useState<string | undefined>(undefined);
  const [selectedStartCountryId, setSelectedStartCountryId] = useState<string | undefined>(undefined);
  const [influencePoints, setInfluencePoints] = useState(STARTING_INFLUENCE_POINTS);
  const [evolvedItemIds, setEvolvedItemIds] = useState<Set<string>>(new Set());
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES.map(c => ({
    ...c,
    resistanceArchetype: c.resistanceArchetype || null,
    subRegions: c.subRegions ? c.subRegions.map(sr => ({ ...sr, rivalPresences: sr.rivalPresences || [], resistanceArchetype: sr.resistanceArchetype || null })) : undefined,
    rivalPresences: c.rivalPresences || [],
  })));
  const [rivalMovements, setRivalMovements] = useState<RivalMovement[]>(RIVAL_MOVEMENTS.map(r => ({...r, playerStance: r.playerStance || 'Hostile'})));
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [recentEvents, setRecentEvents] = useState("The cultural movement is just beginning.");

  const [activeGlobalEvents, setActiveGlobalEvents] = useState<GlobalEvent[]>([]);
  const [allPotentialEvents, setAllPotentialEvents] = useState<GlobalEvent[]>(POTENTIAL_GLOBAL_EVENTS.map(e => ({ ...e, hasBeenTriggered: false })));

  const [pendingInteractiveEvent, setPendingInteractiveEvent] = useState<GlobalEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [gameOver, setGameOver] = useState(false);
  const [gameOverTitle, setGameOverTitle] = useState("");
  const [gameOverDescription, setGameOverDescription] = useState("");
  const [maxPlayerAdoptionEver, setMaxPlayerAdoptionEver] = useState(0);
  const [ipZeroStreak, setIpZeroStreak] = useState(0);


  const { toast } = useToast();

  const currentMovementName = CULTURAL_MOVEMENTS.find(m => m.id === selectedMovementId)?.name || "Unnamed Movement";

  const calculateGlobalAdoptionRate = useCallback((currentCountries: Country[]): number => {
    let totalPlayerAdoption = 0;
    let numReportingUnits = 0; // Counts sub-regions if they exist, otherwise countries
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
    let numReportingUnits = 0; // Counts sub-regions if they exist, otherwise countries
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


  const handleMovementChange = (movementId: string) => {
    setSelectedMovementId(movementId);
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedStartCountryId(countryId);
  };

  const handleStartGame = () => {
    if (selectedMovementId && selectedStartCountryId) {
      setGameStarted(true);
      setCurrentTurn(1);
      let initialEventsSummary = "";

      let initialCountriesWithRivals = INITIAL_COUNTRIES.map(c => ({
        ...c,
        adoptionLevel: 0, // Reset adoption levels
        resistanceLevel: c.resistanceLevel || 0.1, // Reset resistance or use initial
        resistanceArchetype: null,
        rivalPresences: [], // Ensure it's an empty array
        subRegions: c.subRegions ? c.subRegions.map(sr => ({
          ...sr,
          adoptionLevel: 0, // Reset sub-region adoption
          resistanceLevel: sr.resistanceLevel || 0.1,
          resistanceArchetype: null,
          rivalPresences: [] // Ensure empty array
        })) : undefined,
      }));


      initialCountriesWithRivals = initialCountriesWithRivals.map(c => {
        let countryUpdate = {...c};
        if (c.id === selectedStartCountryId) {
          if (countryUpdate.subRegions && countryUpdate.subRegions.length > 0) {
            const updatedSubRegions = countryUpdate.subRegions.map((sr, index) =>
              index === 0 ? { ...sr, adoptionLevel: 0.05, resistanceLevel: Math.max(0.01, sr.resistanceLevel * 0.8) } : sr
            );
            const newCountryAdoption = updatedSubRegions.reduce((sum, sr) => sum + sr.adoptionLevel, 0) / updatedSubRegions.length;
            initialEventsSummary += ` The ${currentMovementName} takes root in ${updatedSubRegions[0].name}, ${c.name}.`;
            countryUpdate = { ...countryUpdate, subRegions: updatedSubRegions, adoptionLevel: newCountryAdoption };
          } else {
            initialEventsSummary += ` The ${currentMovementName} takes root in ${c.name}.`;
            countryUpdate = { ...countryUpdate, adoptionLevel: 0.05, resistanceLevel: Math.max(0.01, c.resistanceLevel * 0.8) };
          }
        }
        return countryUpdate;
      });

      rivalMovements.forEach(rival => {
        initialCountriesWithRivals = initialCountriesWithRivals.map(c => {
          let countryUpdate: Country = JSON.parse(JSON.stringify(c)); // Use the latest state of countryUpdate
          if (c.id === rival.startingCountryId) {
            const rivalPresenceObj: RivalPresence = { rivalId: rival.id, influenceLevel: 0.05 };
            if (countryUpdate.subRegions && countryUpdate.subRegions.length > 0) {
               const targetSubRegionIndex = countryUpdate.subRegions.findIndex(sr => sr.name.includes("Citadel") || sr.name.includes("Capital") || sr.name.includes("Nexus"))
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


      const movement = CULTURAL_MOVEMENTS.find(m => m.id === selectedMovementId)?.name;
      const countryName = INITIAL_COUNTRIES.find(c => c.id === selectedStartCountryId)?.name; // Use INITIAL_COUNTRIES for name lookup
      toast({ title: "Revolution Started!", description: `The ${movement} movement has begun in ${countryName}.` });
      setRecentEvents(initialEventsSummary || `The ${movement} movement has begun in ${countryName}. Initial adoption is low.`);
    }
  };

  const handleEvolve = (itemId: string) => {
    const item = EVOLUTION_ITEMS.find(i => i.id === itemId);
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
  };

  const handleCollectInfluence = (points: number) => {
    setInfluencePoints(prev => prev + points);
    toast({ title: "Influence Gained!", description: `Collected ${points} Influence Points.` });
  };

  const getCountryModifiers = useCallback((countryId: string, currentActiveEvents: GlobalEvent[]): Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> => {
    const modifiers: Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> = {
      culturalOpenness: { additive: 0, multiplicative: 1 },
      economicDevelopment: { additive: 0, multiplicative: 1 },
      resistanceLevel: { additive: 0, multiplicative: 1 },
      adoptionRateModifier: { additive: 0, multiplicative: 1 },
      ipBonus: { additive: 0, multiplicative: 1 },
    };

    currentActiveEvents.forEach(event => {
      event.effects.forEach(effect => {
        if (effect.targetType === 'global' || (effect.targetType === 'country' && effect.countryId === countryId)) {
          const prop = effect.property as GlobalEventEffectProperty;
          if (modifiers[prop]) {
             if (effect.isMultiplier) {
                modifiers[prop]!.multiplicative *= effect.value;
             } else {
                modifiers[prop]!.additive += effect.value;
             }
          }
        }
      });
    });
    return modifiers;
  }, []);

  const handleEventOptionSelected = useCallback((eventWithNoChoice: GlobalEvent, optionId: string) => {
    const chosenOption = eventWithNoChoice.options?.find(opt => opt.id === optionId);
    if (!chosenOption) return;

    let ipFromChoice = 0;
    chosenOption.effects.forEach(effect => {
      if (effect.property === 'ipBonus') {
        ipFromChoice += effect.value;
      }
    });
    if (ipFromChoice !== 0) {
      setInfluencePoints(prev => prev + ipFromChoice);
    }

    const resolvedEvent: GlobalEvent = {
      ...eventWithNoChoice,
      effects: chosenOption.effects, // Option effects replace base event effects
      chosenOptionId: optionId,
      hasBeenTriggered: true, // Ensure it's marked as triggered
    };

    const hasOngoingEffects = chosenOption.effects.some(eff => eff.property !== 'ipBonus');
    if (hasOngoingEffects && resolvedEvent.duration > 0) { // Only add if there are ongoing effects and duration > 0
        setActiveGlobalEvents(prev => [...prev, resolvedEvent]);
    }


    const eventMessage = `EVENT: ${eventWithNoChoice.name} - You chose: "${chosenOption.text}". ${chosenOption.description}`;
    setRecentEvents(prev => `${prev} ${eventMessage}`);
    setTimeout(() => { // Defer toast
        toast({ title: `Event Choice: ${eventWithNoChoice.name}`, description: `You selected: ${chosenOption.text}. ${ipFromChoice !== 0 ? `IP change: ${ipFromChoice}.` : ''}` });
    }, 0);

    setPendingInteractiveEvent(null);
    setIsEventModalOpen(false);
  }, [toast]);


  const handleNextTurn = useCallback(() => {
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

    // Process event activations
    const newlyTriggeredNonInteractiveEvents: GlobalEvent[] = [];
    setAllPotentialEvents(prevAllEvents =>
      prevAllEvents.map(event => {
        if (!event.hasBeenTriggered && event.turnStart === nextTurn) {
          const eventToProcess = { ...event, hasBeenTriggered: true }; // Mark as triggered immediately
          if (eventToProcess.options && eventToProcess.options.length > 0) { // Interactive event
            setPendingInteractiveEvent(eventToProcess);
            setIsEventModalOpen(true);
            newRecentEventsSummary += ` ATTENTION: ${eventToProcess.name} requires your decision! ${eventToProcess.description}`;
            const toastMessage = `${eventToProcess.name} needs your input.`;
            setTimeout(() => toast({ title: "Interactive Event!", description: toastMessage }), 0); // Defer toast
          } else { // Non-interactive event
            if (eventToProcess.duration > 0) { // Only add if duration is positive
               newlyTriggeredNonInteractiveEvents.push(eventToProcess);
            }
            newRecentEventsSummary += ` NEWS: ${eventToProcess.name} has begun! ${eventToProcess.description}`;
            const toastMessage = `${eventToProcess.name} has started.`;
            setTimeout(() => toast({ title: "Global Event!", description: toastMessage }), 0); // Defer toast
            // Apply immediate IP bonus from non-interactive event
            eventToProcess.effects.forEach(effect => {
              if (effect.property === 'ipBonus') {
                ipFromNonInteractiveEventsThisTurn += effect.value;
              }
            });
          }
          return eventToProcess; // Return the modified event (marked as triggered)
        }
        return event; // Return unchanged event
      })
    );

    let currentActiveGlobalEvents = activeGlobalEvents; // To use in current turn calculations
    // Update activeGlobalEvents state based on newly triggered and expired events
    setActiveGlobalEvents(prevActiveEvents => {
        const currentEventsForTurn = [...prevActiveEvents, ...newlyTriggeredNonInteractiveEvents];
        const nonExpiredActiveEvents: GlobalEvent[] = [];
        currentEventsForTurn.forEach(event => {
            if (nextTurn < event.turnStart + event.duration) {
              nonExpiredActiveEvents.push(event);
            } else {
              newRecentEventsSummary += ` NEWS: ${event.name} has concluded.`;
              const toastMessage = `${event.name} has ended.`;
              setTimeout(() => toast({ title: "Global Event Over", description: toastMessage }), 0); // Defer toast
            }
        });
        currentActiveGlobalEvents = nonExpiredActiveEvents; // Update for current turn use
        return nonExpiredActiveEvents; // Set state for next render
    });


    // IP Generation
    let pointsFromAdoptionThisTurn = 0;
    countries.forEach(country => {
      const countryModifiers = getCountryModifiers(country.id, currentActiveGlobalEvents);
      if (country.subRegions && country.subRegions.length > 0) {
        country.subRegions.forEach(sr => {
          if (sr.adoptionLevel > 0) {
            // Use sub-region specific economic development if available, else country's
            const srEconDev = sr.economicDevelopment ?? country.economicDevelopment;
            const effectiveEconDev = Math.max(0, (srEconDev + countryModifiers.economicDevelopment.additive) * countryModifiers.economicDevelopment.multiplicative);
            pointsFromAdoptionThisTurn += sr.adoptionLevel * effectiveEconDev * ADOPTION_IP_MULTIPLIER;
          }
        });
      } else { // No sub-regions, calculate at country level
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
    newRecentEventsSummary += ` ${newPoints} IP generated.`;

    // Player Cultural Spread & Resistance
    const currentGlobalAdoptionForSpreadCalc = calculateGlobalAdoptionRate(countries);
    const hasResistanceManagement = evolvedItemIds.has('adapt_resistance_mgmt');

    let updatedCountries = countries.map(country => {
      // Deep clone country to avoid state mutation issues
      let currentCountryState: Country = JSON.parse(JSON.stringify(country));
      const countryModifiers = getCountryModifiers(currentCountryState.id, currentActiveGlobalEvents);

      const applySpreadAndResistanceToRegion = (region: SubRegion | Country, isSubRegion: boolean, parentCountryForSR?: Country) => {
        let currentRegion = { ...region }; // Shallow copy for this region
        const parentCountry = isSubRegion ? parentCountryForSR! : currentRegion as Country;

        const regionInternetPenetration = (isSubRegion ? (currentRegion as SubRegion).internetPenetration : parentCountry.internetPenetration) ?? parentCountry.internetPenetration;
        const regionCulturalOpenness = (isSubRegion ? (currentRegion as SubRegion).culturalOpenness : parentCountry.culturalOpenness) ?? parentCountry.culturalOpenness;
        const regionEducationLevel = (isSubRegion ? (currentRegion as SubRegion).educationLevel : parentCountry.educationLevel) ?? parentCountry.educationLevel;


        let effectiveCulturalOpenness = Math.max(0, Math.min(1, (regionCulturalOpenness + countryModifiers.culturalOpenness.additive) * countryModifiers.culturalOpenness.multiplicative));
        let newResistanceLevel = Math.max(0, Math.min(1, (currentRegion.resistanceLevel + countryModifiers.resistanceLevel.additive) * countryModifiers.resistanceLevel.multiplicative));
        let currentAdoptionLevel = currentRegion.adoptionLevel;

        // Resistance Archetype Activation & Effects
        if (newResistanceLevel >= RESISTANCE_ARCHETYPE_ACTIVATION_THRESHOLD && !currentRegion.resistanceArchetype) {
          currentRegion.resistanceArchetype = RESISTANCE_ARCHETYPES[Math.floor(Math.random() * RESISTANCE_ARCHETYPES.length)];
          newRecentEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''} now exhibits ${currentRegion.resistanceArchetype} behavior.`;
        }

        let archetypeResistanceFactor = 1.0;
        let archetypeSpreadDebuff = 0;
        if (currentRegion.resistanceArchetype === 'TraditionalistGuardians') {
          archetypeResistanceFactor = 1.2;
          archetypeSpreadDebuff = effectiveCulturalOpenness < 0.4 ? 0.1 : 0; // More effective in less open areas
        } else if (currentRegion.resistanceArchetype === 'AuthoritarianSuppressors') {
          archetypeResistanceFactor = 1.1; // General resistance boost
        }

        if (hasResistanceManagement && currentAdoptionLevel > 0 && newResistanceLevel > 0.05) {
          newResistanceLevel = Math.max(0.01, newResistanceLevel - (0.01 / archetypeResistanceFactor));
        }

        // Resistance increases due to player adoption
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

        // Player Cultural Spread
        let potentialPlayerSpreadIncrease = 0;
        if (currentAdoptionLevel > 0) {
          const internalGrowthRate = 0.01;
          potentialPlayerSpreadIncrease = internalGrowthRate + (regionInternetPenetration * 0.02) + (effectiveCulturalOpenness * 0.02) + ((evolvedItemIds.size / (EVOLUTION_ITEMS.length || 1)) * 0.03) + (regionEducationLevel * 0.01);

          const isStartingRegion = parentCountry.id === selectedStartCountryId &&
                                   (!isSubRegion || (isSubRegion && parentCountry.subRegions && parentCountry.subRegions.length > 0 && parentCountry.subRegions[0].id === currentRegion.id));
          potentialPlayerSpreadIncrease *= (isStartingRegion && currentAdoptionLevel > 0.04) ? 1.2 : 0.8;
          potentialPlayerSpreadIncrease *= (1 - (newResistanceLevel * 0.75 + archetypeSpreadDebuff));
        } else {
          const baseChanceToStart = 0.005;
          const globalInfluenceFactor = currentGlobalAdoptionForSpreadCalc * 0.1;
          let chance = baseChanceToStart + (regionInternetPenetration * 0.01) + (effectiveCulturalOpenness * 0.01) + globalInfluenceFactor + ((evolvedItemIds.size / (EVOLUTION_ITEMS.length || 1)) * 0.015) + (regionEducationLevel * 0.005);
          chance *= (1 - (newResistanceLevel * 0.9 + archetypeSpreadDebuff));
          if (Math.random() < chance) {
            potentialPlayerSpreadIncrease = 0.005 + (effectiveCulturalOpenness * 0.005);
            if (potentialPlayerSpreadIncrease > 0 && currentAdoptionLevel === 0) {
               newRecentEventsSummary += ` Whispers of ${currentMovementName} reach ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
            }
          }
        }
        potentialPlayerSpreadIncrease = Math.max(0, potentialPlayerSpreadIncrease * countryModifiers.adoptionRateModifier.multiplicative + countryModifiers.adoptionRateModifier.additive);

        // Penalty from rivals
        const strongestRivalInfluenceInRegion = currentRegion.rivalPresences.reduce((max, rp) => Math.max(max, rp.influenceLevel), 0);
        if (strongestRivalInfluenceInRegion > 0.01) {
          potentialPlayerSpreadIncrease *= (1 - (RIVAL_SPREAD_PENALTY_ON_PLAYER + strongestRivalInfluenceInRegion * 0.1));
        }
        potentialPlayerSpreadIncrease = Math.max(0, potentialPlayerSpreadIncrease);


        // --- ZERO-SUM LOGIC FOR PLAYER SPREAD ---
        if (potentialPlayerSpreadIncrease > 0) {
          let currentRivalsTotalInfluence = currentRegion.rivalPresences.reduce((sum, rp) => sum + rp.influenceLevel, 0);
          let currentTotalInfluenceInRegion = currentAdoptionLevel + currentRivalsTotalInfluence;

          let actualPlayerGain = 0;

          // 1. Gain from empty space
          const emptySpace = Math.max(0, 1.0 - currentTotalInfluenceInRegion);
          const gainFromEmptySpace = Math.min(potentialPlayerSpreadIncrease, emptySpace);
          actualPlayerGain += gainFromEmptySpace;

          let remainingSpreadToGain = potentialPlayerSpreadIncrease - gainFromEmptySpace;

          // 2. Gain from rivals (if any spread remaining and rivals have influence)
          if (remainingSpreadToGain > 0 && currentRivalsTotalInfluence > 0) {
            const influenceTakenFromRivalsThisTurn = Math.min(remainingSpreadToGain, currentRivalsTotalInfluence);
            actualPlayerGain += influenceTakenFromRivalsThisTurn;

            // Reduce rivals' influence proportionally
            currentRegion.rivalPresences = currentRegion.rivalPresences.map(rp => {
              const proportionOfRivalInfluence = rp.influenceLevel / currentRivalsTotalInfluence;
              const reductionAmount = currentRivalsTotalInfluence > 0 ? proportionOfRivalInfluence * influenceTakenFromRivalsThisTurn : 0;
              return {
                ...rp,
                influenceLevel: Math.max(0, rp.influenceLevel - reductionAmount),
              };
            }).filter(rp => rp.influenceLevel > 0.001); // Remove negligible rivals
          }
          currentAdoptionLevel = Math.min(1, currentAdoptionLevel + actualPlayerGain);
        }
        // --- END ZERO-SUM LOGIC FOR PLAYER SPREAD ---

        if (potentialPlayerSpreadIncrease > 0 && region.adoptionLevel === 0 && currentAdoptionLevel > 0.005 && Math.random() < 0.5) {
          // Initial spread already logged as "Whispers..."
        } else if (potentialPlayerSpreadIncrease > 0 && region.adoptionLevel > 0 && currentAdoptionLevel > region.adoptionLevel && currentAdoptionLevel > 0.1 && region.adoptionLevel <= 0.1 && Math.random() < 0.3) {
          newRecentEventsSummary += ` ${currentRegion.name}${isSubRegion ? ` in ${parentCountry.name}`:''} shows growing interest in ${currentMovementName}.`;
        }
        currentRegion.adoptionLevel = currentAdoptionLevel;
        return currentRegion;
      };

      if (currentCountryState.subRegions && currentCountryState.subRegions.length > 0) {
        currentCountryState.subRegions = currentCountryState.subRegions.map(sr => applySpreadAndResistanceToRegion(sr, true, currentCountryState) as SubRegion);
        // Aggregate country stats from sub-regions
        currentCountryState.adoptionLevel = currentCountryState.subRegions.reduce((sum, sr) => sum + sr.adoptionLevel, 0) / (currentCountryState.subRegions.length || 1);
        currentCountryState.resistanceLevel = currentCountryState.subRegions.reduce((sum, sr) => sum + sr.resistanceLevel, 0) / (currentCountryState.subRegions.length || 1);
        currentCountryState.resistanceArchetype = currentCountryState.subRegions.find(sr => sr.resistanceArchetype)?.resistanceArchetype || null;
      } else {
        currentCountryState = applySpreadAndResistanceToRegion(currentCountryState, false) as Country;
      }
      return currentCountryState;
    });

    // Rival Turns
    rivalMovements.forEach(rival => {
      updatedCountries = updatedCountries.map(country => {
        let modCountryForRival: Country = JSON.parse(JSON.stringify(country)); // Deep clone for this rival's processing of this country

        const applyRivalSpreadToRegion = (region: SubRegion | Country, isSubRegion: boolean, parentCountryForSR?: Country): SubRegion | Country => {
          let modRegion = { ...region }; // Shallow copy for this region
          const parentCountry = isSubRegion ? parentCountryForSR! : modRegion as Country;

          const regionCulturalOpenness = (isSubRegion ? (modRegion as SubRegion).culturalOpenness : parentCountry.culturalOpenness) ?? parentCountry.culturalOpenness;
          const regionPlayerAdoption = modRegion.adoptionLevel; // Player's current adoption in this region

          let rivalDataForRegion = modRegion.rivalPresences.find(rp => rp.rivalId === rival.id);
          let currentRivalInfluence = rivalDataForRegion ? rivalDataForRegion.influenceLevel : 0;
          let potentialRivalGain = 0;

          // Personality-driven gain calculation
          if (rival.personality === 'AggressiveExpansionist') {
            if (currentRivalInfluence > 0 || Math.random() < 0.02 * rival.aggressiveness * 1.5) {
                const baseGain = (0.022 + Math.random() * 0.038) * rival.aggressiveness;
                const opennessFactor = (1 - regionCulturalOpenness * 0.35);
                const playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.5)); // Reduced penalty slightly
                potentialRivalGain = baseGain * opennessFactor * playerPresencePenaltyFactor;
            }
          } else if (rival.personality === 'CautiousConsolidator') {
             if (currentRivalInfluence > 0) {
                const baseGain = (0.018 + Math.random() * 0.028) * rival.aggressiveness;
                const opennessFactor = (1 - regionCulturalOpenness * 0.55);
                const playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.3)); // Reduced penalty slightly
                potentialRivalGain = baseGain * opennessFactor * playerPresencePenaltyFactor;
             }
          }
          potentialRivalGain = Math.max(0, potentialRivalGain);

          // --- ZERO-SUM LOGIC FOR RIVAL SPREAD ---
          if (potentialRivalGain > 0) {
            let otherRivalsTotalInfluence = modRegion.rivalPresences
              .filter(rp => rp.rivalId !== rival.id)
              .reduce((sum, rp) => sum + rp.influenceLevel, 0);
            // Total influence *excluding* the current acting rival
            let currentTotalInfluenceInRegionExcludingActor = regionPlayerAdoption + otherRivalsTotalInfluence;

            let actualRivalGain = 0;
            // 1. Gain from empty space (1.0 - player - other rivals - current rival's existing influence)
            const totalSpaceOccupied = regionPlayerAdoption + otherRivalsTotalInfluence + currentRivalInfluence;
            const emptySpace = Math.max(0, 1.0 - totalSpaceOccupied);
            const gainFromEmptySpace = Math.min(potentialRivalGain, emptySpace);
            actualRivalGain += gainFromEmptySpace;

            let remainingGainForRival = potentialRivalGain - gainFromEmptySpace;

            // 2. Gain from player and other rivals
            const totalInfluenceToTakeFrom = regionPlayerAdoption + otherRivalsTotalInfluence;
            if (remainingGainForRival > 0 && totalInfluenceToTakeFrom > 0) {
              const influenceTakenThisTurn = Math.min(remainingGainForRival, totalInfluenceToTakeFrom);
              actualRivalGain += influenceTakenThisTurn;

              // Reduce player adoption
              if (regionPlayerAdoption > 0) {
                const playerProportion = regionPlayerAdoption / totalInfluenceToTakeFrom;
                const reductionFromPlayer = playerProportion * influenceTakenThisTurn;
                modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel - reductionFromPlayer);
              }

              // Reduce other rivals' influence
              modRegion.rivalPresences = modRegion.rivalPresences.map(rp => {
                if (rp.rivalId === rival.id) return rp; // Don't reduce self
                if (otherRivalsTotalInfluence > 0) {
                    const otherRivalProportion = rp.influenceLevel / totalInfluenceToTakeFrom;
                    const reductionFromOtherRival = otherRivalProportion * influenceTakenThisTurn;
                    return { ...rp, influenceLevel: Math.max(0, rp.influenceLevel - reductionFromOtherRival) };
                }
                return rp;
              }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === rival.id);
            }
            currentRivalInfluence = Math.min(1, currentRivalInfluence + actualRivalGain);
          }
          // --- END ZERO-SUM LOGIC FOR RIVAL SPREAD ---


          // Update or add rival presence for the current rival
          const rivalIdx = modRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
          if (rivalIdx !== -1) {
            modRegion.rivalPresences[rivalIdx].influenceLevel = currentRivalInfluence;
          } else if (currentRivalInfluence > 0.001) {
            modRegion.rivalPresences.push({ rivalId: rival.id, influenceLevel: currentRivalInfluence });
          }
          modRegion.rivalPresences = modRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);


          if (potentialRivalGain > 0.001 && (!rivalDataForRegion || rivalDataForRegion.influenceLevel === 0) && currentRivalInfluence > 0) {
            newRecentEventsSummary += ` ${rival.name} establishes a presence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
          } else if (potentialRivalGain > 0.001 && rivalDataForRegion && currentRivalInfluence > rivalDataForRegion.influenceLevel) {
            newRecentEventsSummary += ` ${rival.name} strengthens its influence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
          }

          // Cautious Consolidator increases player resistance
          if (rival.personality === 'CautiousConsolidator' && currentRivalInfluence > 0.5 && modRegion.adoptionLevel > 0.05 && Math.random() < (RIVAL_COUNTER_RESISTANCE_CHANCE * rival.aggressiveness)) {
            const prevResistance = modRegion.resistanceLevel;
            modRegion.resistanceLevel = Math.min(0.95, modRegion.resistanceLevel + RIVAL_COUNTER_RESISTANCE_AMOUNT);
            if (modRegion.resistanceLevel > prevResistance + 0.001) {
              newRecentEventsSummary += ` ${rival.name} stirs dissent against ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
            }
          }
          return modRegion;
        };

        if (modCountryForRival.subRegions && modCountryForRival.subRegions.length > 0) {
           modCountryForRival.subRegions = modCountryForRival.subRegions.map(sr => applyRivalSpreadToRegion(sr, true, modCountryForRival) as SubRegion);
        } else {
           modCountryForRival = applyRivalSpreadToRegion(modCountryForRival, false) as Country;
        }
        return modCountryForRival;
      });

      // Inter-country spread logic for this rival
        let didInterCountrySpread = false;

        if (rival.personality === 'AggressiveExpansionist') {
            const hasStrongPresenceSomewhere = updatedCountries.some(c =>
                (c.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > 0.2)) ||
                (c.subRegions && c.subRegions.some(sr => sr.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > 0.2)))
            );

            if (hasStrongPresenceSomewhere && Math.random() < (0.015 + rival.aggressiveness * 0.035)) { // Slightly increased chance
                const uninfluencedCountries = updatedCountries.filter(uc =>
                    !uc.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > 0.001) &&
                    (!uc.subRegions || uc.subRegions.every(usr => !usr.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > 0.001)))
                );

                if (uninfluencedCountries.length > 0) {
                    const targetCountryMeta = uninfluencedCountries[Math.floor(Math.random() * uninfluencedCountries.length)];
                    let targetCountryToModify = updatedCountries.find(c => c.id === targetCountryMeta.id);

                    if (targetCountryToModify) {
                        targetCountryToModify = JSON.parse(JSON.stringify(targetCountryToModify)); // Deep clone

                        const initialSpreadAmount = 0.01 + Math.random() * 0.01;
                        let targetSpreadRegion: SubRegion | Country;
                        let isTargetSubRegion = false;

                        if (targetCountryToModify.subRegions && targetCountryToModify.subRegions.length > 0) {
                            const randomSubRegionIndex = Math.floor(Math.random() * targetCountryToModify.subRegions.length);
                            targetSpreadRegion = targetCountryToModify.subRegions[randomSubRegionIndex];
                            isTargetSubRegion = true;
                        } else {
                            targetSpreadRegion = targetCountryToModify;
                        }

                        // Apply initial spread with zero-sum logic
                        let currentRivalInfluenceInTarget = targetSpreadRegion.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0;
                        let playerAdoptionInTarget = targetSpreadRegion.adoptionLevel;
                        let otherRivalsTotalInTarget = targetSpreadRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((s, rp) => s + rp.influenceLevel, 0);

                        let actualInitialGain = 0;
                        const totalSpaceOccupied = playerAdoptionInTarget + otherRivalsTotalInTarget + currentRivalInfluenceInTarget;
                        const emptySpace = Math.max(0, 1.0 - totalSpaceOccupied);
                        actualInitialGain = Math.min(initialSpreadAmount, emptySpace);

                        let remainingGain = initialSpreadAmount - actualInitialGain;
                        const totalInfluenceToTakeFrom = playerAdoptionInTarget + otherRivalsTotalInTarget;

                        if (remainingGain > 0 && totalInfluenceToTakeFrom > 0) {
                           const influenceTaken = Math.min(remainingGain, totalInfluenceToTakeFrom);
                           actualInitialGain += influenceTaken;

                           if (playerAdoptionInTarget > 0) {
                               const playerProportion = playerAdoptionInTarget / totalInfluenceToTakeFrom;
                               targetSpreadRegion.adoptionLevel = Math.max(0, playerAdoptionInTarget - (playerProportion * influenceTaken));
                           }

                           targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.map(orp => {
                               if (orp.rivalId === rival.id) return orp;
                               if (otherRivalsTotalInTarget > 0) {
                                   const otherRivalProp = orp.influenceLevel / totalInfluenceToTakeFrom;
                                   return {...orp, influenceLevel: Math.max(0, orp.influenceLevel - (otherRivalProp * influenceTaken))};
                               }
                               return orp;
                           }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === rival.id);
                        }

                        const rivalIdx = targetSpreadRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
                        if (rivalIdx !== -1) {
                            targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel = Math.min(1, targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel + actualInitialGain);
                        } else if (actualInitialGain > 0.001) {
                            targetSpreadRegion.rivalPresences.push({rivalId: rival.id, influenceLevel: actualInitialGain});
                        }
                        targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);


                        if (isTargetSubRegion) {
                            targetCountryToModify.subRegions = targetCountryToModify.subRegions!.map(sr => sr.id === (targetSpreadRegion as SubRegion).id ? targetSpreadRegion as SubRegion : sr);
                        } else {
                            targetCountryToModify = targetSpreadRegion as Country;
                        }

                        updatedCountries = updatedCountries.map(c => c.id === targetCountryToModify!.id ? targetCountryToModify! : c);
                        didInterCountrySpread = true;
                        newRecentEventsSummary += ` ${rival.name} expands its influence into ${targetSpreadRegion.name}${isTargetSubRegion ? ` in ${targetCountryToModify.name}`:''}.`;
                    }
                }
            }
        } else if (rival.personality === 'CautiousConsolidator') {
            const dominatesACountry = updatedCountries.some(c => {
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
                return countryTotalUnits > 0 && (countryTotalRivalInfluence / countryTotalUnits) > 0.6;
            });

            if (dominatesACountry && Math.random() < (0.005 + rival.aggressiveness * 0.01)) { // Slightly increased chance
                 const uninfluencedCountries = updatedCountries.filter(uc =>
                    !uc.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > 0.001) &&
                    (!uc.subRegions || uc.subRegions.every(usr => !usr.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > 0.001)))
                );
                if (uninfluencedCountries.length > 0) {
                    const targetCountryMeta = uninfluencedCountries[Math.floor(Math.random() * uninfluencedCountries.length)];
                    let targetCountryToModify = updatedCountries.find(c => c.id === targetCountryMeta.id);
                     if (targetCountryToModify) {
                        targetCountryToModify = JSON.parse(JSON.stringify(targetCountryToModify)); // Deep clone

                        const initialSpreadAmount = 0.005 + Math.random() * 0.005;
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
                        const totalSpaceOccupied = playerAdoptionInTarget + otherRivalsTotalInTarget + currentRivalInfluenceInTarget;
                        const emptySpace = Math.max(0, 1.0 - totalSpaceOccupied);
                        actualInitialGain = Math.min(initialSpreadAmount, emptySpace);

                        let remainingGain = initialSpreadAmount - actualInitialGain;
                        const totalInfluenceToTakeFrom = playerAdoptionInTarget + otherRivalsTotalInTarget;

                        if (remainingGain > 0 && totalInfluenceToTakeFrom > 0) {
                           const influenceTaken = Math.min(remainingGain, totalInfluenceToTakeFrom);
                           actualInitialGain += influenceTaken;
                           if (playerAdoptionInTarget > 0) {
                               const playerProportion = playerAdoptionInTarget / totalInfluenceToTakeFrom;
                               targetSpreadRegion.adoptionLevel = Math.max(0, playerAdoptionInTarget - (playerProportion * influenceTaken));
                           }
                           targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.map(orp => {
                               if (orp.rivalId === rival.id) return orp;
                               if(otherRivalsTotalInTarget > 0) {
                                   const otherRivalProp = orp.influenceLevel / totalInfluenceToTakeFrom;
                                   return {...orp, influenceLevel: Math.max(0, orp.influenceLevel - (otherRivalProp * influenceTaken))};
                               }
                               return orp;
                           }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === rival.id);
                        }

                        const rivalIdx = targetSpreadRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
                        if (rivalIdx !== -1) {
                            targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel = Math.min(1, targetSpreadRegion.rivalPresences[rivalIdx].influenceLevel + actualInitialGain);
                        } else if (actualInitialGain > 0.001) {
                            targetSpreadRegion.rivalPresences.push({rivalId: rival.id, influenceLevel: actualInitialGain});
                        }
                         targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);

                        if (isTargetSubRegion) {
                            targetCountryToModify.subRegions = targetCountryToModify.subRegions!.map(sr => sr.id === (targetSpreadRegion as SubRegion).id ? targetSpreadRegion as SubRegion : sr);
                        } else {
                             targetCountryToModify = targetSpreadRegion as Country;
                        }
                        updatedCountries = updatedCountries.map(c => c.id === targetCountryToModify!.id ? targetCountryToModify! : c);
                        didInterCountrySpread = true;
                        newRecentEventsSummary += ` ${rival.name} cautiously establishes a presence in ${targetSpreadRegion.name}${isTargetSubRegion ? ` in ${targetCountryToModify.name}`:''}.`;
                    }
                }
            }
        }
    }); // End rivalMovements.forEach

    // Final normalization pass to ensure total influence in any region doesn't exceed 1.0 (should be mostly handled by zero-sum)
    updatedCountries = updatedCountries.map(country => {
        let clonedCountry : Country = JSON.parse(JSON.stringify(country)); // Deep clone for normalization
        const normalizeRegionInfluence = (region: SubRegion | Country) => {
            let totalInfluence = region.adoptionLevel + region.rivalPresences.reduce((sum, rp) => sum + rp.influenceLevel, 0);
            if (totalInfluence > 1.001) { // Allow for tiny floating point inaccuracies
                const excess = totalInfluence - 1.0;
                const playerShare = region.adoptionLevel / totalInfluence;
                region.adoptionLevel = Math.max(0, region.adoptionLevel - excess * playerShare);

                region.rivalPresences = region.rivalPresences.map(rp => {
                    const rivalShare = rp.influenceLevel / totalInfluence;
                    return { ...rp, influenceLevel: Math.max(0, rp.influenceLevel - excess * rivalShare) };
                }).filter(rp => rp.influenceLevel > 0.001);
                // Ensure no negative values after normalization
                region.adoptionLevel = Math.max(0, region.adoptionLevel);
            }
            return region;
        };

        if (clonedCountry.subRegions && clonedCountry.subRegions.length > 0) {
            clonedCountry.subRegions = clonedCountry.subRegions.map(sr => normalizeRegionInfluence(sr) as SubRegion);
        } else {
            clonedCountry = normalizeRegionInfluence(clonedCountry) as Country;
        }
        return clonedCountry;
    });


    setCountries(updatedCountries);
    setRecentEvents(newRecentEventsSummary);

    // --- WIN/LOSS CONDITION CHECKS ---
    let isGameOver = false;
    let newGameOverTitle = "";
    let newGameOverDescription = "";

    const playerGlobalAdoption = calculateGlobalAdoptionRate(updatedCountries);
    setMaxPlayerAdoptionEver(prevMax => Math.max(prevMax, playerGlobalAdoption));

    const rivalGlobalInfluences = rivalMovements.map(rival => ({
      id: rival.id,
      name: rival.name,
      influence: calculateRivalGlobalInfluence(rival.id, updatedCountries),
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
       const currentIP = influencePoints + newPoints;
      if (currentIP <= 0 && ipZeroStreak + (currentIP <=0 ? 1:0) >= LOSE_IP_ZERO_STREAK_TURNS) {
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
          variant: newGameOverTitle.includes("Achieved") ? "default" : "destructive",
          duration: 10000,
        });
      }, 0);
    }

    if (!pendingInteractiveEvent && !isGameOver) {
      setTimeout(() => { // Defer toast
        toast({ title: `Day ${nextTurn}`, description: `The ${currentMovementName} progresses...` });
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, countries, selectedStartCountryId, evolvedItemIds, activeGlobalEvents, getCountryModifiers, allPotentialEvents, toast, pendingInteractiveEvent, handleEventOptionSelected, calculateGlobalAdoptionRate, rivalMovements, influencePoints, gameOver, calculateRivalGlobalInfluence, ipZeroStreak, maxPlayerAdoptionEver, currentMovementName]);

  const handleDiplomaticAction = (rivalId: string, newStance: DiplomaticStance) => {
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
  };


  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <div className="md:w-2/3 lg:w-3/4 h-full min-h-[400px] md:min-h-0">
          <WorldMap
            countries={countries}
            rivalMovements={rivalMovements}
            onCountrySelect={setSelectedStartCountryId}
            onCollectInfluence={handleCollectInfluence}
            selectedCountryId={selectedStartCountryId}
          />
        </div>
        <div className="md:w-1/3 lg:w-1/4 flex flex-col space-y-4 overflow-hidden">
          <ControlPanel
            movements={CULTURAL_MOVEMENTS}
            countries={INITIAL_COUNTRIES} // Use INITIAL_COUNTRIES for selection list
            selectedMovementId={selectedMovementId}
            selectedCountryId={selectedStartCountryId}
            influencePoints={influencePoints}
            onMovementChange={handleMovementChange}
            onCountryChange={handleCountryChange}
            onStartGame={handleStartGame}
            currentTurn={currentTurn}
            onNextTurn={handleNextTurn}
            gameStarted={gameStarted}
            isEventPending={!!pendingInteractiveEvent}
            gameOver={gameOver}
          />
          {gameStarted && (
            <ScrollArea className="flex-grow min-h-0">
              <div className="space-y-4 p-1">
                <Tabs defaultValue="evolution" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 gap-1 h-auto mb-2">
                    <TabsTrigger value="evolution" className="px-2 py-1.5 text-xs h-auto">
                      <Lightbulb className="mr-1.5 h-4 w-4" /> Evolve
                    </TabsTrigger>
                    <TabsTrigger value="events" className="px-2 py-1.5 text-xs h-auto">
                      <AlertCircle className="mr-1.5 h-4 w-4" /> Events
                    </TabsTrigger>
                    <TabsTrigger value="news" className="px-2 py-1.5 text-xs h-auto">
                      <Newspaper className="mr-1.5 h-4 w-4" /> News
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="px-2 py-1.5 text-xs h-auto">
                      <InfoIcon className="mr-1.5 h-4 w-4" /> Stats
                    </TabsTrigger>
                    <TabsTrigger value="diplomacy" className="px-2 py-1.5 text-xs h-auto">
                      <Handshake className="mr-1.5 h-4 w-4" /> Diplomacy
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="evolution">
                    <EvolutionPanel
                      categories={EVOLUTION_CATEGORIES}
                      items={EVOLUTION_ITEMS}
                      onEvolve={handleEvolve}
                      influencePoints={influencePoints}
                      evolvedItemIds={evolvedItemIds}
                    />
                  </TabsContent>
                  <TabsContent value="events">
                    <GlobalEventsDisplay activeEvents={activeGlobalEvents} currentTurn={currentTurn} />
                  </TabsContent>
                  <TabsContent value="news">
                    <NewsFeed
                      culturalMovementName={currentMovementName}
                      globalAdoptionRate={calculateGlobalAdoptionRate(countries)}
                      recentEventsSummary={recentEvents}
                      currentTurn={currentTurn}
                    />
                  </TabsContent>
                  <TabsContent value="analytics">
                    <AnalyticsDashboard
                      countries={countries}
                      influencePoints={influencePoints}
                      evolvedItemIds={evolvedItemIds}
                      evolutionItems={EVOLUTION_ITEMS}
                      currentTurn={currentTurn}
                    />
                  </TabsContent>
                  <TabsContent value="diplomacy">
                    <DiplomacyPanel
                      rivalMovements={rivalMovements}
                      onDiplomaticAction={handleDiplomaticAction}
                      influencePoints={influencePoints}
                      diplomacyCost={DIPLOMACY_STANCE_CHANGE_COST}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
          {!gameStarted && <div className="flex-grow"></div>}
        </div>
      </main>
      <InteractiveEventModal
        event={pendingInteractiveEvent}
        isOpen={isEventModalOpen}
        onClose={() => {
          // If modal is closed without selection (e.g. Esc key),
          // For now, we don't force a choice. Player can try "Next Day" again.
          // setIsEventModalOpen(false); // This is handled by onOpenChange of AlertDialog
        }}
        onOptionSelect={handleEventOptionSelected}
      />
      {gameOver && (
        <AlertDialog open={gameOver} onOpenChange={(open) => { if(!open) setGameOver(false); /* For now, just close. True restart needed later */ }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                {gameOverTitle.includes("Achieved") ? <Trophy className="mr-2 h-6 w-6 text-primary" /> : <Skull className="mr-2 h-6 w-6 text-destructive" />}
                {gameOverTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {gameOverDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setGameOver(false)}>Acknowledge</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
