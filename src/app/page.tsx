
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
import { CULTURAL_MOVEMENTS, EVOLUTION_CATEGORIES, EVOLUTION_ITEMS, INITIAL_COUNTRIES, STARTING_INFLUENCE_POINTS, POTENTIAL_GLOBAL_EVENTS, RIVAL_MOVEMENTS } from '@/config/gameData';
import type { Country, SubRegion, EvolutionItem, GlobalEvent, GlobalEventEffectProperty, GlobalEventOption, RivalMovement, RivalPresence } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, AlertCircle, Newspaper, Info as InfoIcon } from 'lucide-react';

const BASE_IP_PER_TURN = 2;
const ADOPTION_IP_MULTIPLIER = 5;
const RIVAL_SPREAD_PENALTY = 0.15; // Player's spread is 15% less effective in regions with rival presence

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
  const [rivalMovements, setRivalMovements] = useState<RivalMovement[]>(RIVAL_MOVEMENTS);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [recentEvents, setRecentEvents] = useState("The cultural movement is just beginning.");

  const [activeGlobalEvents, setActiveGlobalEvents] = useState<GlobalEvent[]>([]);
  const [allPotentialEvents, setAllPotentialEvents] = useState<GlobalEvent[]>(POTENTIAL_GLOBAL_EVENTS.map(e => ({ ...e, hasBeenTriggered: false })));

  const [pendingInteractiveEvent, setPendingInteractiveEvent] = useState<GlobalEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const { toast } = useToast();

  const currentMovementName = CULTURAL_MOVEMENTS.find(m => m.id === selectedMovementId)?.name || "Unnamed Movement";

  const calculateGlobalAdoptionRate = useCallback(() => {
    let totalPlayerAdoption = 0;
    let numReportingUnits = 0; // Could be countries or subregions
    countries.forEach(country => {
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
  }, [countries]);
  const globalAdoptionRate = calculateGlobalAdoptionRate();


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

      // Player Start
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

      // Rival Start
      rivalMovements.forEach(rival => {
        setCountries(prevCountries => prevCountries.map(c => {
          if (c.id === rival.startingCountryId) {
            const rivalPresenceObj: RivalPresence = { rivalId: rival.id, influenceLevel: 0.05 };
            if (c.subRegions && c.subRegions.length > 0) {
              const targetSubRegionIndex = c.subRegions.findIndex(sr => sr.name.includes("Citadel") || sr.name.includes("Capital")) // Prefer capitals/citadels
              const actualIndex = targetSubRegionIndex !== -1 ? targetSubRegionIndex : 0;

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
      ipBonus: { additive: 0, multiplicative: 1 }, // Though ipBonus is typically handled directly
    };

    currentActiveEvents.forEach(event => {
      event.effects.forEach(effect => {
        if (effect.targetType === 'global' || (effect.targetType === 'country' && effect.countryId === countryId)) {
          if (effect.property !== 'ipBonus') { 
             if (modifiers[effect.property]) { 
                if (effect.isMultiplier) {
                  modifiers[effect.property].multiplicative *= effect.value;
                } else {
                  modifiers[effect.property].additive += effect.value;
                }
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
      toast({ title: "Action Required", description: "Please respond to the active global event.", variant: "destructive" });
      setIsEventModalOpen(true);
      return;
    }

    const nextTurn = currentTurn + 1;
    setCurrentTurn(nextTurn);

    let newRecentEventsSummary = `Day ${nextTurn}: The ${currentMovementName} continues its journey.`;
    let ipFromNonInteractiveEventsThisTurn = 0;

    // Event Processing - Stage 1: Trigger new events
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
    
    // Event Processing - Stage 2: Manage active events (including newly triggered non-interactive ones)
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
        return nonExpiredActiveEvents;
    });


    // Player IP Generation
    let pointsFromAdoptionThisTurn = 0;
    countries.forEach(country => {
      const countryModifiers = getCountryModifiers(country.id, activeGlobalEvents); 
      if (country.subRegions && country.subRegions.length > 0) {
        country.subRegions.forEach(sr => {
          if (sr.adoptionLevel > 0) {
            const effectiveEconDev = Math.max(0, (sr.economicDevelopment + countryModifiers.economicDevelopment.additive) * countryModifiers.economicDevelopment.multiplicative);
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
    setInfluencePoints(prev => prev + newPoints);
    newRecentEventsSummary += ` ${newPoints} IP generated.`;

    const currentGlobalAdoptionForSpreadCalc = calculateGlobalAdoptionRate();
    const hasResistanceManagement = evolvedItemIds.has('adapt_resistance_mgmt');

    // Player Cultural Spread & Resistance
    let updatedCountries = countries.map(country => {
      const countryModifiers = getCountryModifiers(country.id, activeGlobalEvents); 
      let updatedCountry = { ...country };

      if (updatedCountry.subRegions && updatedCountry.subRegions.length > 0) {
        let totalSubRegionAdoption = 0;
        let totalSubRegionResistance = 0;

        updatedCountry.subRegions = updatedCountry.subRegions.map(sr => {
          let currentSubRegion = { ...sr };
          const srInternetPenetration = currentSubRegion.internetPenetration ?? country.internetPenetration;
          const srCulturalOpenness = currentSubRegion.culturalOpenness ?? country.culturalOpenness;
          
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
                newRecentEventsSummary += ` ${currentSubRegion.name} in ${country.name} shows increased opposition.`;
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
            
            if (country.id === selectedStartCountryId && country.subRegions && country.subRegions[0].id === sr.id && sr.adoptionLevel > 0.04) {
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
            // Message already handled
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
                newRecentEventsSummary += ` ${country.name} shows increased opposition.`;
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
          // Covered by initial spread message
        } else if (spreadIncrease > 0 && country.adoptionLevel > 0 && newAdoptionLevel > country.adoptionLevel && newAdoptionLevel > 0.1 && country.adoptionLevel <= 0.1 && Math.random() < 0.3) {
          newRecentEventsSummary += ` ${country.name} shows growing interest in ${currentMovementName}.`;
        }
        updatedCountry.adoptionLevel = newAdoptionLevel;
        updatedCountry.resistanceLevel = newResistanceLevel;
      }
      return updatedCountry;
    });

    // Rival AI Turn
    rivalMovements.forEach(rival => {
      updatedCountries = updatedCountries.map(country => {
        let modCountry = {...country};
        
        const countryCulturalOpenness = modCountry.culturalOpenness; // For fallback

        if (modCountry.subRegions && modCountry.subRegions.length > 0) {
          modCountry.subRegions = modCountry.subRegions.map(sr => {
            let modSr = {...sr};
            const srRival = modSr.rivalPresence?.rivalId === rival.id ? modSr.rivalPresence : null;
            const srCulturalOpenness = modSr.culturalOpenness ?? countryCulturalOpenness;

            if (srRival) { // Rival already present in sub-region
              const rivalSpreadChance = 0.15 + rival.aggressiveness * 0.15;
              if (Math.random() < rivalSpreadChance && srRival.influenceLevel < 0.95) {
                const oldInfluence = srRival.influenceLevel;
                const increase = (0.015 + Math.random() * 0.03) * (1 - srCulturalOpenness * 0.4);
                modSr.rivalPresence = { ...srRival, influenceLevel: Math.min(0.95, srRival.influenceLevel + increase) };
                if (modSr.rivalPresence.influenceLevel > oldInfluence + 0.005) { 
                    newRecentEventsSummary += ` The ${rival.name} strengthens its grip on ${sr.name}, ${country.name}.`;
                }
              }
            } else if (!modSr.rivalPresence && Math.random() < (0.01 * rival.aggressiveness)) { 
                const neighborInfluenced = modCountry.subRegions?.some(s => s.rivalPresence?.rivalId === rival.id && s.rivalPresence.influenceLevel > 0.05);
                if(neighborInfluenced) { 
                    modSr.rivalPresence = { rivalId: rival.id, influenceLevel: 0.01 + Math.random() * 0.02 };
                    newRecentEventsSummary += ` ${rival.name} establishes a foothold in ${sr.name}, ${country.name}.`;
                }
            }
            return modSr;
          });
        } else { // Country without sub-regions (rival operates at country level)
            const countryRival = modCountry.rivalPresence?.rivalId === rival.id ? modCountry.rivalPresence : null;
            if (countryRival) { 
               const rivalSpreadChance = 0.15 + rival.aggressiveness * 0.15;
                if (Math.random() < rivalSpreadChance && countryRival.influenceLevel < 0.95) {
                    const oldInfluence = countryRival.influenceLevel;
                    const increase = (0.015 + Math.random() * 0.03) * (1 - countryCulturalOpenness * 0.4);
                    modCountry.rivalPresence = { ...countryRival, influenceLevel: Math.min(0.95, countryRival.influenceLevel + increase) };
                     if (modCountry.rivalPresence.influenceLevel > oldInfluence + 0.005) {
                        newRecentEventsSummary += ` The ${rival.name} strengthens its grip on ${country.name}.`;
                    }
                }
            } else if (!countryRival && country.id !== rival.startingCountryId && Math.random() < (0.004 * rival.aggressiveness)) { 
                const sourceCountry = updatedCountries.find(c => 
                    (c.rivalPresence?.rivalId === rival.id && c.rivalPresence.influenceLevel > 0.1) ||
                    c.subRegions?.some(sr => sr.rivalPresence?.rivalId === rival.id && sr.rivalPresence.influenceLevel > 0.1)
                );
                if (sourceCountry) { 
                    modCountry.rivalPresence = { rivalId: rival.id, influenceLevel: 0.01 + Math.random() * 0.02 };
                    newRecentEventsSummary += ` ${rival.name} establishes a foothold in ${country.name}.`;
                }
            }
        }
        
        // Recalculate country-level rival presence if subregions exist (for display/overview, primary logic is sub-region)
        if (modCountry.subRegions && modCountry.subRegions.length > 0) {
            const mainRivalInSubRegions = modCountry.subRegions
                .filter(sr => sr.rivalPresence?.rivalId === rival.id)
                .map(sr => sr.rivalPresence!.influenceLevel);
            
            if (mainRivalInSubRegions.length > 0) {
                modCountry.rivalPresence = { // This will just take the *first* rival found if multiple are present.
                    rivalId: rival.id, // Needs to be the ID of the rival being processed in the outer loop.
                    influenceLevel: mainRivalInSubRegions.reduce((sum, lvl) => sum + lvl, 0) / mainRivalInSubRegions.length,
                };
            } else if (modCountry.rivalPresence?.rivalId === rival.id) { 
                 modCountry.rivalPresence = null;
            }
        }
        return modCountry;
      });
    });


    setCountries(updatedCountries);
    setRecentEvents(newRecentEventsSummary);

    if (!pendingInteractiveEvent) {
      // Defer the "Next Day" toast to avoid issues during render.
      setTimeout(() => {
        toast({ title: `Day ${nextTurn}`, description: `The ${currentMovementName} progresses...` });
      }, 0);
    }
  }, [currentTurn, currentMovementName, countries, selectedStartCountryId, evolvedItemIds, activeGlobalEvents, getCountryModifiers, allPotentialEvents, toast, pendingInteractiveEvent, handleEventOptionSelected, calculateGlobalAdoptionRate, rivalMovements]);


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
          />
          {gameStarted && (
            <ScrollArea className="flex-grow min-h-0">
              <div className="space-y-4 p-1">
                <Tabs defaultValue="evolution" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto mb-2">
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
                      globalAdoptionRate={globalAdoptionRate}
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
          // Closing the modal without a choice might require default handling or simply keeping it open.
          // For now, interaction is primary way to close.
        }}
        onOptionSelect={handleEventOptionSelected}
      />
    </div>
  );
}

