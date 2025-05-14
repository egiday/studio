
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
import type { Country, SubRegion, EvolutionItem, GlobalEvent, GlobalEventEffectProperty, GlobalEventOption, RivalMovement, RivalPresence, DiplomaticStance } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, AlertCircle, Newspaper, Info as InfoIcon, Handshake, Trophy, Skull } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const BASE_IP_PER_TURN = 2;
const ADOPTION_IP_MULTIPLIER = 5;
const RIVAL_SPREAD_PENALTY = 0.15;
const RIVAL_COUNTER_RESISTANCE_CHANCE = 0.15;
const RIVAL_COUNTER_RESISTANCE_AMOUNT = 0.03;
const DIPLOMACY_STANCE_CHANGE_COST = 10;

// Win/Loss Condition Thresholds
const WIN_PLAYER_GLOBAL_ADOPTION = 0.70;
const WIN_RIVAL_MAX_GLOBAL_INFLUENCE = 0.15;
const LOSE_RIVAL_DOMINANCE_THRESHOLD = 0.60;
const LOSE_PLAYER_COLLAPSE_ADOPTION = 0.05;
const LOSE_PLAYER_MIN_PEAK_ADOPTION = 0.20;
const LOSE_IP_ZERO_STREAK_TURNS = 3;


export default function GamePage() {
  const [selectedMovementId, setSelectedMovementId] = useState<string | undefined>(undefined);
  const [selectedStartCountryId, setSelectedStartCountryId] = useState<string | undefined>(undefined);
  const [influencePoints, setInfluencePoints] = useState(STARTING_INFLUENCE_POINTS);
  const [evolvedItemIds, setEvolvedItemIds] = useState<Set<string>>(new Set());
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES.map(c => ({
    ...c,
    subRegions: c.subRegions ? c.subRegions.map(sr => ({ ...sr, rivalPresence: sr.rivalPresence || null })) : undefined,
    rivalPresence: c.rivalPresence || null,
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
          if (sr.rivalPresence && sr.rivalPresence.rivalId === rivalId) {
            totalRivalInfluence += sr.rivalPresence.influenceLevel;
          }
          numReportingUnits++;
        });
      } else {
        if (country.rivalPresence && country.rivalPresence.rivalId === rivalId) {
          totalRivalInfluence += country.rivalPresence.influenceLevel;
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

      setCountries(prevCountries => prevCountries.map(c => {
        if (c.id === selectedStartCountryId) {
          if (c.subRegions && c.subRegions.length > 0) {
            const updatedSubRegions = c.subRegions.map((sr, index) =>
              index === 0 ? { ...sr, adoptionLevel: 0.05, resistanceLevel: Math.max(0.01, sr.resistanceLevel * 0.8) } : sr
            );
            const newCountryAdoption = updatedSubRegions.reduce((sum, sr) => sum + sr.adoptionLevel, 0) / updatedSubRegions.length;
            initialEventsSummary += ` The ${currentMovementName} takes root in ${updatedSubRegions[0].name}, ${c.name}.`;
            return { ...c, subRegions: updatedSubRegions, adoptionLevel: newCountryAdoption };
          } else {
            initialEventsSummary += ` The ${currentMovementName} takes root in ${c.name}.`;
            return { ...c, adoptionLevel: 0.05, resistanceLevel: Math.max(0.01, c.resistanceLevel * 0.8) };
          }
        }
        return c;
      }));

      rivalMovements.forEach(rival => {
        setCountries(prevCountries => prevCountries.map(c => {
          if (c.id === rival.startingCountryId) {
            const rivalPresenceObj: RivalPresence = { rivalId: rival.id, influenceLevel: 0.05 };
            if (c.subRegions && c.subRegions.length > 0) {
              const targetSubRegionIndex = c.subRegions.findIndex(sr => sr.name.includes("Citadel") || sr.name.includes("Capital") || sr.name.includes("Nexus"))
              const actualIndex = targetSubRegionIndex !== -1 ? targetSubRegionIndex : Math.floor(Math.random() * c.subRegions.length);

              const updatedSubRegions = c.subRegions.map((sr, index) =>
                index === actualIndex ? { ...sr, rivalPresence: rivalPresenceObj } : sr
              );
              initialEventsSummary += ` The ${rival.name} begins to stir in ${updatedSubRegions[actualIndex].name}, ${c.name}.`;
              return { ...c, subRegions: updatedSubRegions };
            } else {
              initialEventsSummary += ` The ${rival.name} begins to stir in ${c.name}.`;
              return { ...c, rivalPresence: rivalPresenceObj };
            }
          }
          return c;
        }));
      });

      const movement = CULTURAL_MOVEMENTS.find(m => m.id === selectedMovementId)?.name;
      const countryName = INITIAL_COUNTRIES.find(c => c.id === selectedStartCountryId)?.name;
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
      effects: chosenOption.effects,
      chosenOptionId: optionId,
      hasBeenTriggered: true,
    };

    const hasOngoingEffects = chosenOption.effects.some(eff => eff.property !== 'ipBonus');
    if (hasOngoingEffects) {
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
            newlyTriggeredNonInteractiveEvents.push(eventToProcess);
            newRecentEventsSummary += ` NEWS: ${eventToProcess.name} has begun! ${eventToProcess.description}`;
            const toastMessage = `${eventToProcess.name} has started.`;
            setTimeout(() => toast({ title: "Global Event!", description: toastMessage }), 0);
            eventToProcess.effects.forEach(effect => {
              if (effect.property === 'ipBonus') {
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
            if (nextTurn < event.turnStart + event.duration) {
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
      const countryModifiers = getCountryModifiers(country.id, currentActiveGlobalEvents);
      if (country.subRegions && country.subRegions.length > 0) {
        country.subRegions.forEach(sr => {
          if (sr.adoptionLevel > 0) {
            const srEconDev = sr.economicDevelopment ?? country.economicDevelopment;
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
    newRecentEventsSummary += ` ${newPoints} IP generated.`;

    const currentGlobalAdoptionForSpreadCalc = calculateGlobalAdoptionRate(countries);
    const hasResistanceManagement = evolvedItemIds.has('adapt_resistance_mgmt');

    let updatedCountries = countries.map(country => {
      const countryModifiers = getCountryModifiers(country.id, currentActiveGlobalEvents);
      let updatedCountry = { ...country };

      if (updatedCountry.subRegions && updatedCountry.subRegions.length > 0) {
        let totalSubRegionAdoption = 0;
        let totalSubRegionResistance = 0;

        updatedCountry.subRegions = updatedCountry.subRegions.map(sr => {
          let currentSubRegion = { ...sr };
          const srInternetPenetration = sr.internetPenetration ?? country.internetPenetration;
          const srCulturalOpenness = sr.culturalOpenness ?? country.culturalOpenness;

          let effectiveCulturalOpenness = Math.max(0, Math.min(1, (srCulturalOpenness + countryModifiers.culturalOpenness.additive) * countryModifiers.culturalOpenness.multiplicative));
          let newAdoptionLevel = currentSubRegion.adoptionLevel;
          let newResistanceLevel = Math.max(0, Math.min(1, (currentSubRegion.resistanceLevel + countryModifiers.resistanceLevel.additive) * countryModifiers.resistanceLevel.multiplicative));

          if (hasResistanceManagement && newAdoptionLevel > 0 && newResistanceLevel > 0.05) {
            newResistanceLevel = Math.max(0.01, newResistanceLevel - 0.01);
          }

          if (newAdoptionLevel > 0.3 && newAdoptionLevel < 0.9) {
            let resistanceIncreaseFactor = (0.005 * (1 - effectiveCulturalOpenness)) * (newAdoptionLevel - 0.2);
            if (hasResistanceManagement) resistanceIncreaseFactor *= 0.3;
            if (Math.random() < 0.3) {
              const previousResistance = newResistanceLevel;
              newResistanceLevel = Math.min(0.9, newResistanceLevel + resistanceIncreaseFactor);
              if (newResistanceLevel > previousResistance + 0.001) {
                newRecentEventsSummary += ` ${currentSubRegion.name} in ${country.name} shows increased opposition to ${currentMovementName}.`;
              }
            }
          }

          if (newAdoptionLevel >= 1) {
            totalSubRegionAdoption += 1;
            totalSubRegionResistance += Math.max(0.01, newResistanceLevel - 0.05);
            return { ...currentSubRegion, adoptionLevel: 1, resistanceLevel: Math.max(0.01, newResistanceLevel - 0.05) };
          }

          const internetFactor = srInternetPenetration * 0.02;
          const opennessFactor = effectiveCulturalOpenness * 0.02;
          const evolvedTraitsSpreadBonus = (evolvedItemIds.size / (EVOLUTION_ITEMS.length || 1)) * 0.03;
          let spreadIncrease = 0;

          if (newAdoptionLevel > 0) {
            const internalGrowthRate = 0.01;
            spreadIncrease = internalGrowthRate + internetFactor + opennessFactor + evolvedTraitsSpreadBonus;

            const isStartingSubRegion = country.id === selectedStartCountryId &&
                                        country.subRegions &&
                                        country.subRegions.length > 0 &&
                                        country.subRegions[0].id === sr.id;

            if (isStartingSubRegion && sr.adoptionLevel > 0.04) {
                spreadIncrease *= 1.2;
            } else {
                 spreadIncrease *= 0.8;
            }
            spreadIncrease *= (1 - newResistanceLevel * 0.75);
          } else {
            const baseChanceToStart = 0.005;
            const globalInfluenceFactor = currentGlobalAdoptionForSpreadCalc * 0.1;
            let chance = baseChanceToStart + (internetFactor / 2) + (opennessFactor / 2) + globalInfluenceFactor + (evolvedTraitsSpreadBonus / 2);
            chance *= (1 - newResistanceLevel * 0.9);
            if (Math.random() < chance) {
              spreadIncrease = 0.005 + (opennessFactor / 4);
              if (spreadIncrease > 0) {
                 newRecentEventsSummary += ` Whispers of ${currentMovementName} reach ${currentSubRegion.name} in ${country.name}.`;
              }
            }
          }

          spreadIncrease *= countryModifiers.adoptionRateModifier.multiplicative;
          spreadIncrease += countryModifiers.adoptionRateModifier.additive;

          if (currentSubRegion.rivalPresence && currentSubRegion.rivalPresence.influenceLevel > 0.01) {
            spreadIncrease *= (1 - (RIVAL_SPREAD_PENALTY + currentSubRegion.rivalPresence.influenceLevel * 0.1));
          }

          newAdoptionLevel = Math.min(1, newAdoptionLevel + spreadIncrease);
          newAdoptionLevel = Math.max(0, newAdoptionLevel);

          if (spreadIncrease > 0 && currentSubRegion.adoptionLevel === 0 && newAdoptionLevel > 0.005 && Math.random() < 0.5) {
          } else if (spreadIncrease > 0 && currentSubRegion.adoptionLevel > 0 && newAdoptionLevel > currentSubRegion.adoptionLevel && newAdoptionLevel > 0.1 && currentSubRegion.adoptionLevel <= 0.1 && Math.random() < 0.3) {
            newRecentEventsSummary += ` ${currentSubRegion.name} in ${country.name} shows growing interest in ${currentMovementName}.`;
          }

          totalSubRegionAdoption += newAdoptionLevel;
          totalSubRegionResistance += newResistanceLevel;
          return { ...currentSubRegion, adoptionLevel: newAdoptionLevel, resistanceLevel: newResistanceLevel };
        });

        updatedCountry.adoptionLevel = totalSubRegionAdoption / updatedCountry.subRegions.length;
        updatedCountry.resistanceLevel = totalSubRegionResistance / updatedCountry.subRegions.length;

      } else {
        let baseCulturalOpenness = country.culturalOpenness;
        let effectiveCulturalOpenness = Math.max(0, Math.min(1, (baseCulturalOpenness + countryModifiers.culturalOpenness.additive) * countryModifiers.culturalOpenness.multiplicative));
        let newAdoptionLevel = country.adoptionLevel;
        let newResistanceLevel = Math.max(0, Math.min(1, (country.resistanceLevel + countryModifiers.resistanceLevel.additive) * countryModifiers.resistanceLevel.multiplicative));

        if (hasResistanceManagement && newAdoptionLevel > 0 && newResistanceLevel > 0.05) {
          newResistanceLevel = Math.max(0.01, newResistanceLevel - 0.01);
        }
        if (newAdoptionLevel > 0.3 && newAdoptionLevel < 0.9) {
          let resistanceIncreaseFactor = (0.005 * (1 - effectiveCulturalOpenness)) * (newAdoptionLevel - 0.2);
          if (hasResistanceManagement) resistanceIncreaseFactor *= 0.3;
          if (Math.random() < 0.3) {
            const previousResistance = newResistanceLevel;
            newResistanceLevel = Math.min(0.9, newResistanceLevel + resistanceIncreaseFactor);
             if (newResistanceLevel > previousResistance + 0.001) {
                newRecentEventsSummary += ` ${country.name} shows increased opposition to ${currentMovementName}.`;
            }
          }
        }
        if (country.adoptionLevel >= 1) {
          return { ...country, adoptionLevel: 1, resistanceLevel: Math.max(0.01, newResistanceLevel - 0.05) };
        }
        const internetFactor = country.internetPenetration * 0.02;
        const opennessFactor = effectiveCulturalOpenness * 0.02;
        const evolvedTraitsSpreadBonus = (evolvedItemIds.size / (EVOLUTION_ITEMS.length || 1)) * 0.03;
        let spreadIncrease = 0;
        if (country.adoptionLevel > 0) {
          const internalGrowthRate = 0.01;
          spreadIncrease = internalGrowthRate + internetFactor + opennessFactor + evolvedTraitsSpreadBonus;
          if (country.id === selectedStartCountryId) spreadIncrease *= 1.5;
          else spreadIncrease *= 0.7;
          spreadIncrease *= (1 - newResistanceLevel * 0.75);
        } else {
          const baseChanceToStart = 0.005;
          const globalInfluenceFactor = currentGlobalAdoptionForSpreadCalc * 0.1;
          let chance = baseChanceToStart + (internetFactor / 2) + (opennessFactor / 2) + globalInfluenceFactor + (evolvedTraitsSpreadBonus / 2);
          chance *= (1 - newResistanceLevel * 0.9);
          if (Math.random() < chance) {
            spreadIncrease = 0.005 + (opennessFactor / 4);
            if (spreadIncrease > 0) {
              newRecentEventsSummary += ` Whispers of ${currentMovementName} reach ${country.name}.`;
            }
          }
        }
        spreadIncrease *= countryModifiers.adoptionRateModifier.multiplicative;
        spreadIncrease += countryModifiers.adoptionRateModifier.additive;

        if (country.rivalPresence && country.rivalPresence.influenceLevel > 0.01) {
            spreadIncrease *= (1 - (RIVAL_SPREAD_PENALTY + country.rivalPresence.influenceLevel * 0.1));
        }

        newAdoptionLevel = Math.min(1, country.adoptionLevel + spreadIncrease);
        newAdoptionLevel = Math.max(0, newAdoptionLevel);

        if (spreadIncrease > 0 && country.adoptionLevel === 0 && newAdoptionLevel > 0.005 && Math.random() < 0.5) {
        } else if (spreadIncrease > 0 && country.adoptionLevel > 0 && newAdoptionLevel > country.adoptionLevel && newAdoptionLevel > 0.1 && country.adoptionLevel <= 0.1 && Math.random() < 0.3) {
          newRecentEventsSummary += ` ${country.name} shows growing interest in ${currentMovementName}.`;
        }
        updatedCountry.adoptionLevel = newAdoptionLevel;
        updatedCountry.resistanceLevel = newResistanceLevel;
      }
      return updatedCountry;
    });

    rivalMovements.forEach(rival => {
      updatedCountries = updatedCountries.map(country => {
        let modCountry = {...country};
        const countryCulturalOpenness = modCountry.culturalOpenness;

        if (modCountry.subRegions && modCountry.subRegions.length > 0) {
           modCountry.subRegions = modCountry.subRegions.map(sr => {
            let modSr = {...sr};
            const srRivalPresence = modSr.rivalPresence?.rivalId === rival.id ? modSr.rivalPresence : null;
            const srCulturalOpenness = sr.culturalOpenness ?? countryCulturalOpenness;
            const srPlayerAdoption = modSr.adoptionLevel;
            let srPlayerResistance = modSr.resistanceLevel;

            const baseGain = (0.02 + Math.random() * 0.03) * rival.aggressiveness;
            const resistanceFactor = (1 - srCulturalOpenness * 0.35);
            const playerPresencePenalty = srPlayerAdoption * 0.20;

            if (rival.personality === 'AggressiveExpansionist') {
              if (srRivalPresence) {
                if (Math.random() < (0.35 + rival.aggressiveness * 0.35) && srRivalPresence.influenceLevel < 0.95) {
                  const increase = baseGain * resistanceFactor * (1 - playerPresencePenalty);
                  modSr.rivalPresence = { ...srRivalPresence, influenceLevel: Math.min(0.95, srRivalPresence.influenceLevel + increase) };
                  if (increase > 0.001) newRecentEventsSummary += ` ${rival.name} intensifies efforts in ${sr.name}, ${country.name}.`;
                }
              } else {
                const neighborInfluenced = modCountry.subRegions?.some(s => s.rivalPresence?.rivalId === rival.id && s.rivalPresence.influenceLevel > (0.04 + (1-rival.aggressiveness)*0.1) );
                if (neighborInfluenced && Math.random() < (0.025 + rival.aggressiveness * 0.20)) {
                  const initialInfluence = (0.015 + Math.random() * 0.035) * resistanceFactor * (1 - playerPresencePenalty);
                  if(initialInfluence > 0) {
                    modSr.rivalPresence = { rivalId: rival.id, influenceLevel: Math.max(0.005, initialInfluence) };
                    newRecentEventsSummary += ` ${rival.name} makes a push into ${sr.name}, ${country.name}.`;
                  }
                }
              }
            } else if (rival.personality === 'CautiousConsolidator') {
              if (srRivalPresence) {
                if (Math.random() < (0.65 + rival.aggressiveness * 0.25) && srRivalPresence.influenceLevel < 0.98) {
                  const increase = baseGain * resistanceFactor * (1 - playerPresencePenalty * 0.4);
                  modSr.rivalPresence = { ...srRivalPresence, influenceLevel: Math.min(0.98, srRivalPresence.influenceLevel + increase) };
                  if (increase > 0.001 && srRivalPresence.influenceLevel < 0.8) newRecentEventsSummary += ` ${rival.name} fortifies its position in ${sr.name}, ${country.name}.`;
                }
                if (srRivalPresence.influenceLevel > 0.5 && srPlayerAdoption > 0.05 && Math.random() < (RIVAL_COUNTER_RESISTANCE_CHANCE * rival.aggressiveness) ) {
                    modSr.resistanceLevel = Math.min(0.95, srPlayerResistance + RIVAL_COUNTER_RESISTANCE_AMOUNT);
                    if (modSr.resistanceLevel > srPlayerResistance + 0.001) {
                         newRecentEventsSummary += ` ${rival.name} stirs dissent against ${currentMovementName} in ${sr.name}, ${country.name}.`;
                    }
                }

              } else {
                const dominantInCountry = (modCountry.subRegions?.filter(s => s.rivalPresence?.rivalId === rival.id && s.rivalPresence.influenceLevel > 0.55).length ?? 0) / (modCountry.subRegions?.length ?? 1) > 0.45;
                const neighborStronglyInfluenced = modCountry.subRegions?.some(s => s.rivalPresence?.rivalId === rival.id && s.rivalPresence.influenceLevel > 0.25);

                if (dominantInCountry && neighborStronglyInfluenced && Math.random() < (0.025 + rival.aggressiveness * 0.06)) {
                   const initialInfluence = (0.008 + Math.random() * 0.02) * resistanceFactor * (1 - playerPresencePenalty);
                   if(initialInfluence > 0) {
                    modSr.rivalPresence = { rivalId: rival.id, influenceLevel: Math.max(0.005, initialInfluence) };
                    newRecentEventsSummary += ` ${rival.name} carefully expands to ${sr.name}, ${country.name}.`;
                   }
                }
              }
            }
            return modSr;
          });
        } else {
            const countryRivalPresence = modCountry.rivalPresence?.rivalId === rival.id ? modCountry.rivalPresence : null;
            const playerAdoption = modCountry.adoptionLevel;
            let playerResistance = modCountry.resistanceLevel;
            const baseGainCountry = (0.02 + Math.random() * 0.03) * rival.aggressiveness;
            const resistanceFactorCountry = (1 - countryCulturalOpenness * 0.35);
            const playerPresencePenaltyCountry = playerAdoption * 0.20;

            if (rival.personality === 'AggressiveExpansionist') {
              if (countryRivalPresence) {
                if (Math.random() < (0.35 + rival.aggressiveness * 0.35) && countryRivalPresence.influenceLevel < 0.95) {
                  const increase = baseGainCountry * resistanceFactorCountry * (1 - playerPresencePenaltyCountry);
                  modCountry.rivalPresence = { ...countryRivalPresence, influenceLevel: Math.min(0.95, countryRivalPresence.influenceLevel + increase) };
                   if (increase > 0.001) newRecentEventsSummary += ` ${rival.name} intensifies efforts in ${country.name}.`;
                }
              } else if (modCountry.id !== rival.startingCountryId) {
                 const sourceCountryStrong = updatedCountries.some(c =>
                    (c.rivalPresence?.rivalId === rival.id && c.rivalPresence.influenceLevel > (0.18 + (1-rival.aggressiveness)*0.2)) ||
                    c.subRegions?.some(sr => sr.rivalPresence?.rivalId === rival.id && sr.rivalPresence.influenceLevel > (0.18 + (1-rival.aggressiveness)*0.2))
                );
                if (sourceCountryStrong && Math.random() < (0.01 + rival.aggressiveness * 0.02)) {
                    const initialInfluence = (0.015 + Math.random() * 0.035) * resistanceFactorCountry * (1 - playerPresencePenaltyCountry);
                    if(initialInfluence > 0) {
                        modCountry.rivalPresence = { rivalId: rival.id, influenceLevel: Math.max(0.005, initialInfluence) };
                        newRecentEventsSummary += ` ${rival.name} launches an offensive into ${country.name}!`;
                    }
                }
              }
            } else if (rival.personality === 'CautiousConsolidator') {
              if (countryRivalPresence) {
                 if (Math.random() < (0.65 + rival.aggressiveness * 0.25) && countryRivalPresence.influenceLevel < 0.98) {
                    const increase = baseGainCountry * resistanceFactorCountry * (1 - playerPresencePenaltyCountry * 0.4);
                    modCountry.rivalPresence = { ...countryRivalPresence, influenceLevel: Math.min(0.98, countryRivalPresence.influenceLevel + increase) };
                    if (increase > 0.001 && countryRivalPresence.influenceLevel < 0.8) newRecentEventsSummary += ` ${rival.name} fortifies its position in ${country.name}.`;
                }
                if (countryRivalPresence.influenceLevel > 0.5 && playerAdoption > 0.05 && Math.random() < (RIVAL_COUNTER_RESISTANCE_CHANCE * rival.aggressiveness) ) {
                    modCountry.resistanceLevel = Math.min(0.95, playerResistance + RIVAL_COUNTER_RESISTANCE_AMOUNT);
                     if (modCountry.resistanceLevel > playerResistance + 0.001) {
                         newRecentEventsSummary += ` ${rival.name} stirs dissent against ${currentMovementName} in ${country.name}.`;
                    }
                }
              } else if (modCountry.id !== rival.startingCountryId) {
                const sourceCountryDominant = updatedCountries.some(c =>
                    (c.rivalPresence?.rivalId === rival.id && c.rivalPresence.influenceLevel > 0.65) ||
                    c.subRegions?.some(sr => sr.rivalPresence?.rivalId === rival.id && sr.rivalPresence.influenceLevel > 0.65)
                );
                 if (sourceCountryDominant && Math.random() < (0.0035 + rival.aggressiveness * 0.006)) {
                    const initialInfluence = (0.008 + Math.random() * 0.02) * resistanceFactorCountry * (1 - playerPresencePenaltyCountry);
                     if(initialInfluence > 0) {
                        modCountry.rivalPresence = { rivalId: rival.id, influenceLevel: Math.max(0.005, initialInfluence) };
                        newRecentEventsSummary += ` ${rival.name} cautiously establishes a presence in ${country.name}.`;
                    }
                }
              }
            }
        }

        if (modCountry.subRegions && modCountry.subRegions.length > 0) {
            const rivalInfluencesInSubRegions = modCountry.subRegions
                .map(sr => sr.rivalPresence)
                .filter(rp => rp?.rivalId === rival.id) as RivalPresence[];

            if (rivalInfluencesInSubRegions.length > 0) {
                const averageInfluence = rivalInfluencesInSubRegions.reduce((sum, rp) => sum + rp.influenceLevel, 0) / rivalInfluencesInSubRegions.length;
                const otherRivalsPresent = modCountry.subRegions.some(sr => sr.rivalPresence && sr.rivalPresence.rivalId !== rival.id && sr.rivalPresence.influenceLevel > averageInfluence);
                if (!otherRivalsPresent || averageInfluence > (modCountry.rivalPresence?.influenceLevel ?? 0) ) {
                     modCountry.rivalPresence = {
                        rivalId: rival.id,
                        influenceLevel: averageInfluence,
                    };
                }
            } else if (modCountry.rivalPresence?.rivalId === rival.id) {
                 const strongestOtherRival = modCountry.subRegions
                    .map(sr => sr.rivalPresence)
                    .filter(rp => rp && rp.rivalId !== rival.id)
                    .sort((a,b) => (b?.influenceLevel ?? 0) - (a?.influenceLevel ?? 0))[0];

                if(strongestOtherRival) {
                    modCountry.rivalPresence = strongestOtherRival;
                } else {
                    modCountry.rivalPresence = null;
                }
            }
        }
        return modCountry;
      });
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

    // Player Win Condition
    const allRivalsSuppressed = rivalGlobalInfluences.every(r => r.influence < WIN_RIVAL_MAX_GLOBAL_INFLUENCE);
    if (playerGlobalAdoption >= WIN_PLAYER_GLOBAL_ADOPTION && allRivalsSuppressed) {
      isGameOver = true;
      newGameOverTitle = "Global Harmony Achieved!";
      newGameOverDescription = `The ${currentMovementName} has become the guiding light for the world, achieving ${(playerGlobalAdoption * 100).toFixed(0)}% global adoption. Rival ideologies have diminished, paving the way for a new era of unity.`;
    }

    if (!isGameOver) {
      // Rival Dominance (Lose Condition)
      const dominantRival = rivalGlobalInfluences.find(r => r.influence >= LOSE_RIVAL_DOMINANCE_THRESHOLD);
      if (dominantRival) {
        isGameOver = true;
        newGameOverTitle = "Rival Ascendancy";
        newGameOverDescription = `${dominantRival.name} has achieved global dominance with ${(dominantRival.influence * 100).toFixed(0)}% influence, overshadowing your movement. The world follows a different path.`;
      }
    }

    if (!isGameOver) {
      // Player Collapse - IP (Lose Condition)
      if (influencePoints + newPoints <= 0 && ipZeroStreak + 1 >= LOSE_IP_ZERO_STREAK_TURNS) {
         isGameOver = true;
         newGameOverTitle = "Economic Collapse";
         newGameOverDescription = `The ${currentMovementName} has run out of resources. With no Influence Points for ${LOSE_IP_ZERO_STREAK_TURNS} consecutive days, your movement has dissolved.`;
      } else if (influencePoints + newPoints > 0) {
        setIpZeroStreak(0);
      }

      // Player Collapse - Adoption (Lose Condition)
      if (maxPlayerAdoptionEver >= LOSE_PLAYER_MIN_PEAK_ADOPTION && playerGlobalAdoption < LOSE_PLAYER_COLLAPSE_ADOPTION) {
        isGameOver = true;
        newGameOverTitle = "Cultural Regression";
        newGameOverDescription = `Despite initial success, the ${currentMovementName} has faded into obscurity. Global adoption fell to ${(playerGlobalAdoption * 100).toFixed(1)}%, and the world's attention has moved on.`;
      }
    }

    if (isGameOver) {
      setGameOver(true);
      setGameOverTitle(newGameOverTitle);
      setGameOverDescription(newGameOverDescription);
      setTimeout(() => { // Ensure toast appears after state update for modal
        toast({
          title: newGameOverTitle,
          description: "The game has concluded.",
          variant: newGameOverTitle.includes("Achieved") ? "default" : "destructive",
          duration: 10000,
        });
      }, 0);
    }
    // --- END WIN/LOSS CHECKS ---


    if (!pendingInteractiveEvent && !isGameOver) {
      setTimeout(() => {
        toast({ title: `Day ${nextTurn}`, description: `The ${currentMovementName} progresses...` });
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, currentMovementName, countries, selectedStartCountryId, evolvedItemIds, activeGlobalEvents, getCountryModifiers, allPotentialEvents, toast, pendingInteractiveEvent, handleEventOptionSelected, calculateGlobalAdoptionRate, rivalMovements, influencePoints, gameOver, calculateRivalGlobalInfluence, ipZeroStreak, maxPlayerAdoptionEver, currentMovementName]);

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
            countries={INITIAL_COUNTRIES}
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
