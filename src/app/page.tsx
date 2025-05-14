
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { WorldMap } from '@/components/game/WorldMap';
import { ControlPanel } from '@/components/game/ControlPanel';
import { EvolutionPanel } from '@/components/game/EvolutionPanel';
import { NewsFeed } from '@/components/game/NewsFeed';
import { AnalyticsDashboard } from '@/components/game/AnalyticsDashboard';
import { GlobalEventsDisplay } from '@/components/game/GlobalEventsDisplay'; // New Import
import { CULTURAL_MOVEMENTS, EVOLUTION_CATEGORIES, EVOLUTION_ITEMS, INITIAL_COUNTRIES, STARTING_INFLUENCE_POINTS, POTENTIAL_GLOBAL_EVENTS } from '@/config/gameData';
import type { Country, EvolutionItem, GlobalEvent, GlobalEventEffectProperty } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

const BASE_IP_PER_TURN = 2;
const ADOPTION_IP_MULTIPLIER = 5; 

export default function GamePage() {
  const [selectedMovementId, setSelectedMovementId] = useState<string | undefined>(undefined);
  const [selectedStartCountryId, setSelectedStartCountryId] = useState<string | undefined>(undefined);
  const [influencePoints, setInfluencePoints] = useState(STARTING_INFLUENCE_POINTS);
  const [evolvedItemIds, setEvolvedItemIds] = useState<Set<string>>(new Set());
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES.map(c => ({...c}))); // Ensure deep copy for modification
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [recentEvents, setRecentEvents] = useState("The cultural movement is just beginning.");
  const [activeGlobalEvents, setActiveGlobalEvents] = useState<GlobalEvent[]>([]);
  const [allPotentialEvents, setAllPotentialEvents] = useState<GlobalEvent[]>(POTENTIAL_GLOBAL_EVENTS.map(e => ({...e, hasBeenTriggered: false})));


  const { toast } = useToast();

  const currentMovementName = CULTURAL_MOVEMENTS.find(m => m.id === selectedMovementId)?.name || "Unnamed Movement";
  const globalAdoptionRate = countries.reduce((sum, country) => sum + country.adoptionLevel, 0) / (countries.length || 1);


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
      setCountries(prevCountries => prevCountries.map(c => 
        c.id === selectedStartCountryId ? { ...c, adoptionLevel: 0.05, resistanceLevel: c.resistanceLevel > 0 ? c.resistanceLevel * 0.8 : 0.05 } : c
      ));
      const movement = CULTURAL_MOVEMENTS.find(m=>m.id===selectedMovementId)?.name;
      const country = INITIAL_COUNTRIES.find(c=>c.id===selectedStartCountryId)?.name;
      toast({ title: "Revolution Started!", description: `The ${movement} movement has begun in ${country}.` });
      setRecentEvents(`The ${movement} movement has begun in ${country}. Initial adoption is low.`);
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
        setRecentEvents(`${item.name} was adopted, strengthening the ${currentMovementName}.`);
      } else {
        toast({ title: "Evolution Failed", description: `Prerequisites for ${item.name} not met.`, variant: "destructive" });
      }
    } else if (item && influencePoints < item.cost) {
        toast({ title: "Evolution Failed", description: `Not enough Influence Points for ${item.name}.`, variant: "destructive" });
    }
  };

  const handleCollectInfluence = (points: number) => {
    setInfluencePoints(prev => prev + points);
    toast({ title: "Influence Gained!", description: `Collected ${points} Influence Points.`});
  };

  const getCountryModifiers = useCallback((countryId: string, currentActiveEvents: GlobalEvent[]): Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> => {
    const modifiers: Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> = {
      culturalOpenness: { additive: 0, multiplicative: 1 },
      economicDevelopment: { additive: 0, multiplicative: 1 },
      resistanceLevel: { additive: 0, multiplicative: 1 },
      adoptionRateModifier: { additive: 0, multiplicative: 1 }, // Multiplicative is primary here
      ipBonus: { additive: 0, multiplicative: 1 }, // Not typically modified per country per turn this way
    };

    currentActiveEvents.forEach(event => {
      event.effects.forEach(effect => {
        if (effect.targetType === 'global' || (effect.targetType === 'country' && effect.countryId === countryId)) {
          if (effect.property !== 'ipBonus') { // IP bonus is handled at event activation
            if (effect.isMultiplier) {
              modifiers[effect.property].multiplicative *= effect.value;
            } else {
              modifiers[effect.property].additive += effect.value;
            }
          }
        }
      });
    });
    return modifiers;
  }, []);


  const handleNextTurn = useCallback(() => {
    const nextTurn = currentTurn + 1;
    setCurrentTurn(nextTurn);
    
    let newRecentEventsSummary = `Day ${nextTurn}: The ${currentMovementName} continues to grow.`;
    let ipFromEventsThisTurn = 0;

    // 1. Update Active Global Events
    const stillActiveEvents: GlobalEvent[] = [];
    let newActiveGlobalEvents = [...activeGlobalEvents];

    allPotentialEvents.forEach((event, index) => {
      if (!event.hasBeenTriggered && event.turnStart === nextTurn) {
        const updatedEvent = { ...event, hasBeenTriggered: true };
        newActiveGlobalEvents.push(updatedEvent);
        setAllPotentialEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
        
        newRecentEventsSummary += ` NEWS: ${event.name} has begun! ${event.description}`;
        toast({ title: "Global Event!", description: `${event.name} has started.`});

        event.effects.forEach(effect => {
          if (effect.property === 'ipBonus') {
            ipFromEventsThisTurn += effect.value;
          }
        });
      }
    });
    
    newActiveGlobalEvents.forEach(event => {
      if (nextTurn < event.turnStart + event.duration) {
        stillActiveEvents.push(event);
      } else {
        newRecentEventsSummary += ` NEWS: ${event.name} has concluded.`;
        toast({ title: "Global Event Over", description: `${event.name} has ended.`});
      }
    });
    setActiveGlobalEvents(stillActiveEvents);

    // 2. Calculate IP
    let pointsFromAdoption = 0;
    countries.forEach(country => {
      if (country.adoptionLevel > 0) {
        const countryModifiers = getCountryModifiers(country.id, stillActiveEvents);
        const effectiveEconDev = Math.max(0, country.economicDevelopment + countryModifiers.economicDevelopment.additive) * countryModifiers.economicDevelopment.multiplicative;
        pointsFromAdoption += country.adoptionLevel * effectiveEconDev * ADOPTION_IP_MULTIPLIER;
      }
    });
    
    const evolvedIpBoost = evolvedItemIds.size * 0.5; 
    const newPoints = Math.floor(BASE_IP_PER_TURN + pointsFromAdoption + evolvedIpBoost + ipFromEventsThisTurn);
    setInfluencePoints(prev => prev + newPoints);
    newRecentEventsSummary += ` ${newPoints} IP generated.`;

    // 3. Update Countries
    const currentGlobalAdoptionForSpread = countries.reduce((sum, c) => sum + c.adoptionLevel, 0) / (countries.length || 1);
    const hasResistanceManagement = evolvedItemIds.has('adapt_resistance_mgmt');

    setCountries(prevCountries => 
      prevCountries.map(country => {
        const countryModifiers = getCountryModifiers(country.id, stillActiveEvents);
        
        let baseCulturalOpenness = country.culturalOpenness;
        let effectiveCulturalOpenness = Math.max(0, Math.min(1, (baseCulturalOpenness + countryModifiers.culturalOpenness.additive) * countryModifiers.culturalOpenness.multiplicative));

        let newAdoptionLevel = country.adoptionLevel;
        let newResistanceLevel = Math.max(0, Math.min(1, (country.resistanceLevel + countryModifiers.resistanceLevel.additive) * countryModifiers.resistanceLevel.multiplicative));


        if (hasResistanceManagement && newAdoptionLevel > 0 && newResistanceLevel > 0.05) {
            newResistanceLevel = Math.max(0.05, newResistanceLevel - 0.01); 
        }

        if (newAdoptionLevel > 0.3 && newAdoptionLevel < 0.9) {
            let resistanceIncreaseFactor = (0.005 * (1 - effectiveCulturalOpenness)) * (newAdoptionLevel - 0.2);
            if (hasResistanceManagement) {
                resistanceIncreaseFactor *= 0.3; 
            }
            if (Math.random() < 0.3) { 
                const previousResistance = newResistanceLevel;
                newResistanceLevel = Math.min(0.9, newResistanceLevel + resistanceIncreaseFactor);
                if (newResistanceLevel > previousResistance + 0.005) { // Threshold to avoid spamming
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
          
          if (country.id === selectedStartCountryId) {
            spreadIncrease *= 1.5; 
          } else {
            spreadIncrease *= 0.7; 
          }
          spreadIncrease *= (1 - newResistanceLevel * 0.75); 
        } else {
          const baseChanceToStart = 0.005; 
          const globalInfluenceFactor = currentGlobalAdoptionForSpread * 0.1;
          
          let chance = baseChanceToStart + (internetFactor / 2) + (opennessFactor / 2) + globalInfluenceFactor + (evolvedTraitsSpreadBonus / 2);
          chance *= (1 - newResistanceLevel * 0.9); 

          if (Math.random() < chance) {
            spreadIncrease = 0.005 + (opennessFactor / 4); 
            if (spreadIncrease > 0) {
                 newRecentEventsSummary += ` Whispers of ${currentMovementName} reach ${country.name}.`;
            }
          }
        }
        
        // Apply adoption rate modifier from events
        spreadIncrease *= countryModifiers.adoptionRateModifier.multiplicative;
        spreadIncrease += countryModifiers.adoptionRateModifier.additive; // Though additive is less common for rates

        newAdoptionLevel = Math.min(1, country.adoptionLevel + spreadIncrease);
        newAdoptionLevel = Math.max(0, newAdoptionLevel);

        if (spreadIncrease > 0 && country.adoptionLevel === 0 && newAdoptionLevel > 0 && newAdoptionLevel > 0.01 && Math.random() < 0.5) {
           // Covered by "Whispers reach"
        } else if (spreadIncrease > 0 && country.adoptionLevel > 0 && newAdoptionLevel > country.adoptionLevel && newAdoptionLevel > 0.1 && country.adoptionLevel <= 0.1 && Math.random() < 0.3) {
           newRecentEventsSummary += ` ${country.name} shows growing interest in ${currentMovementName}.`;
        }
        
        return { ...country, adoptionLevel: newAdoptionLevel, resistanceLevel: newResistanceLevel, culturalOpenness: baseCulturalOpenness }; // Return baseOpenness, effectiveOpenness was for calc
      })
    );
    setRecentEvents(newRecentEventsSummary);
    toast({ title: `Day ${nextTurn}`, description: `The ${currentMovementName} progresses...` });
  }, [currentTurn, currentMovementName, countries, selectedStartCountryId, evolvedItemIds, activeGlobalEvents, getCountryModifiers, allPotentialEvents, toast]);
  

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <div className="md:w-2/3 lg:w-3/4 h-full min-h-[400px] md:min-h-0">
          <WorldMap
            countries={countries}
            onCountrySelect={setSelectedStartCountryId}
            onCollectInfluence={handleCollectInfluence}
            selectedCountryId={selectedStartCountryId}
          />
        </div>
        <ScrollArea className="md:w-1/3 lg:w-1/4 h-full md:max-h-full">
          <div className="space-y-4 p-1">
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
            />
            {gameStarted && (
              <>
                <EvolutionPanel
                  categories={EVOLUTION_CATEGORIES}
                  items={EVOLUTION_ITEMS}
                  onEvolve={handleEvolve}
                  influencePoints={influencePoints}
                  evolvedItemIds={evolvedItemIds}
                />
                <GlobalEventsDisplay activeEvents={activeGlobalEvents} currentTurn={currentTurn} />
                <NewsFeed
                  culturalMovementName={currentMovementName}
                  globalAdoptionRate={globalAdoptionRate}
                  recentEventsSummary={recentEvents}
                  currentTurn={currentTurn}
                />
                <AnalyticsDashboard
                  countries={countries}
                  influencePoints={influencePoints}
                  evolvedItemIds={evolvedItemIds}
                  evolutionItems={EVOLUTION_ITEMS}
                  currentTurn={currentTurn}
                />
              </>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
