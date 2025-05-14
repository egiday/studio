
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { WorldMap } from '@/components/game/WorldMap';
import { ControlPanel } from '@/components/game/ControlPanel';
import { EvolutionPanel } from '@/components/game/EvolutionPanel';
import { NewsFeed } from '@/components/game/NewsFeed';
import { AnalyticsDashboard } from '@/components/game/AnalyticsDashboard';
import { CULTURAL_MOVEMENTS, EVOLUTION_CATEGORIES, EVOLUTION_ITEMS, INITIAL_COUNTRIES, STARTING_INFLUENCE_POINTS } from '@/config/gameData';
import type { Country, EvolutionItem } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

const BASE_IP_PER_TURN = 2;
const ADOPTION_IP_MULTIPLIER = 5; 

export default function GamePage() {
  const [selectedMovementId, setSelectedMovementId] = useState<string | undefined>(undefined);
  const [selectedStartCountryId, setSelectedStartCountryId] = useState<string | undefined>(undefined);
  const [influencePoints, setInfluencePoints] = useState(STARTING_INFLUENCE_POINTS);
  const [evolvedItemIds, setEvolvedItemIds] = useState<Set<string>>(new Set());
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [recentEvents, setRecentEvents] = useState("The cultural movement is just beginning.");

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
        c.id === selectedStartCountryId ? { ...c, adoptionLevel: 0.05, resistanceLevel: c.resistanceLevel > 0 ? c.resistanceLevel * 0.8 : 0.05 } : c // Slightly reduce resistance in starting country
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

  const handleNextTurn = () => {
    setCurrentTurn(prev => prev + 1);
    
    let pointsFromAdoption = 0;
    countries.forEach(country => {
      if (country.adoptionLevel > 0) {
        pointsFromAdoption += country.adoptionLevel * country.economicDevelopment * ADOPTION_IP_MULTIPLIER;
      }
    });
    
    const evolvedIpBoost = evolvedItemIds.size * 0.5; 
    const newPoints = Math.floor(BASE_IP_PER_TURN + pointsFromAdoption + evolvedIpBoost);
    
    setInfluencePoints(prev => prev + newPoints);
    
    let newRecentEventsSummary = `Day ${currentTurn + 1}: The ${currentMovementName} continues to grow. ${newPoints} IP generated.`;

    const currentGlobalAdoptionForSpread = countries.reduce((sum, c) => sum + c.adoptionLevel, 0) / (countries.length || 1);
    const hasResistanceManagement = evolvedItemIds.has('adapt_resistance_mgmt');

    setCountries(prevCountries => 
      prevCountries.map(country => {
        let newAdoptionLevel = country.adoptionLevel;
        let newResistanceLevel = country.resistanceLevel;

        // Resistance Management Trait: Passive decrease
        if (hasResistanceManagement && newAdoptionLevel > 0 && newResistanceLevel > 0.05) {
            newResistanceLevel = Math.max(0.05, newResistanceLevel - 0.01); // Decrease but not below a minimum
        }

        // Resistance Fights Back
        if (newAdoptionLevel > 0.3 && newAdoptionLevel < 0.9) {
            let resistanceIncreaseFactor = (0.005 * (1 - country.culturalOpenness)) * (newAdoptionLevel - 0.2);
            if (hasResistanceManagement) {
                resistanceIncreaseFactor *= 0.3; // Resistance Management reduces this increase
            }
            if (Math.random() < 0.3) { // Chance for resistance to increase
                const previousResistance = newResistanceLevel;
                newResistanceLevel = Math.min(0.9, newResistanceLevel + resistanceIncreaseFactor);
                if (newResistanceLevel > previousResistance + 0.01) {
                     newRecentEventsSummary += ` ${country.name} shows increased opposition to ${currentMovementName}.`;
                }
            }
        }


        if (country.adoptionLevel >= 1) { 
          return { ...country, adoptionLevel: 1, resistanceLevel: Math.max(0.01, newResistanceLevel - 0.05) }; // Culture fully adopted, resistance slowly fades
        }

        const internetFactor = country.internetPenetration * 0.02;
        const opennessFactor = country.culturalOpenness * 0.02;
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
          // Resistance slows growth
          spreadIncrease *= (1 - newResistanceLevel * 0.75); 

        } else {
          const baseChanceToStart = 0.005; 
          const globalInfluenceFactor = currentGlobalAdoptionForSpread * 0.1;
          
          let chance = baseChanceToStart + 
                       (internetFactor / 2) + 
                       (opennessFactor / 2) + 
                       globalInfluenceFactor + 
                       (evolvedTraitsSpreadBonus / 2);
          
          chance *= (1 - newResistanceLevel * 0.9); // Higher resistance makes it much harder to start

          if (Math.random() < chance) {
            spreadIncrease = 0.005 + (opennessFactor / 4); 
            if (spreadIncrease > 0) {
                 newRecentEventsSummary += ` Whispers of the ${currentMovementName} reach ${country.name}.`;
            }
          }
        }
        
        newAdoptionLevel = Math.min(1, country.adoptionLevel + spreadIncrease);
        newAdoptionLevel = Math.max(0, newAdoptionLevel);


        if (spreadIncrease > 0 && country.adoptionLevel === 0 && newAdoptionLevel > 0 && 
            newAdoptionLevel > 0.01 && Math.random() < 0.5) {
           // Handled by the "Whispers reach" message.
        } else if (spreadIncrease > 0 && country.adoptionLevel > 0 && newAdoptionLevel > country.adoptionLevel && 
            newAdoptionLevel > 0.1 && country.adoptionLevel <= 0.1 && Math.random() < 0.3) {
           newRecentEventsSummary += ` ${country.name} shows growing interest in the ${currentMovementName}.`;
        }
        
        return { ...country, adoptionLevel: newAdoptionLevel, resistanceLevel: newResistanceLevel };
      })
    );
    setRecentEvents(newRecentEventsSummary);
    toast({ title: `Day ${currentTurn + 1}`, description: `The ${currentMovementName} progresses...` });
  };
  

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
