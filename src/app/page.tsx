'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { WorldMap } from '@/components/game/WorldMap';
import { ControlPanel } from '@/components/game/ControlPanel';
import { EvolutionPanel } from '@/components/game/EvolutionPanel';
import { NewsFeed } from '@/components/game/NewsFeed';
import { CULTURAL_MOVEMENTS, EVOLUTION_CATEGORIES, EVOLUTION_ITEMS, INITIAL_COUNTRIES, STARTING_INFLUENCE_POINTS } from '@/config/gameData';
import type { Country, EvolutionItem } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

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
      // Initialize starting country adoption
      setCountries(prevCountries => prevCountries.map(c => 
        c.id === selectedStartCountryId ? { ...c, adoptionLevel: 0.05 } : c
      ));
      toast({ title: "Revolution Started!", description: `The ${CULTURAL_MOVEMENTS.find(m=>m.id===selectedMovementId)?.name} movement has begun in ${INITIAL_COUNTRIES.find(c=>c.id===selectedStartCountryId)?.name}.` });
      setRecentEvents(`The ${CULTURAL_MOVEMENTS.find(m=>m.id===selectedMovementId)?.name} movement has begun in ${INITIAL_COUNTRIES.find(c=>c.id===selectedStartCountryId)?.name}. Initial adoption is low.`);
    }
  };

  const handleEvolve = (itemId: string) => {
    const item = EVOLUTION_ITEMS.find(i => i.id === itemId);
    if (item && influencePoints >= item.cost && !evolvedItemIds.has(itemId)) {
      // Check prerequisites
      const canEvolve = !item.prerequisites || item.prerequisites.every(prereqId => evolvedItemIds.has(prereqId));
      if (canEvolve) {
        setInfluencePoints(prev => prev - item.cost);
        setEvolvedItemIds(prev => new Set(prev).add(itemId));
        toast({ title: "Evolution Unlocked!", description: `${item.name} has been evolved.` });
        setRecentEvents(`${item.name} was adopted, strengthening the movement.`);
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
    // Simple spread simulation:
    // Increase adoption in countries, especially the starting one or ones with evolved traits.
    // Add some random influence points.
    const newPoints = Math.floor(Math.random() * (evolvedItemIds.size + 1) * 2) + 5; // More points if more evolved
    setInfluencePoints(prev => prev + newPoints);
    
    let newRecentEventsSummary = `Day ${currentTurn + 1}: The movement continues to grow. ${newPoints} IP gained.`;

    setCountries(prevCountries => 
      prevCountries.map(country => {
        let newAdoptionLevel = country.adoptionLevel;
        if (country.adoptionLevel > 0 && country.adoptionLevel < 1) {
          const baseSpreadRate = 0.01;
          const internetFactor = country.internetPenetration * 0.02;
          const opennessFactor = country.culturalOpenness * 0.02;
          const evolvedTraitsFactor = (evolvedItemIds.size / EVOLUTION_ITEMS.length) * 0.05;
          
          let spreadIncrease = baseSpreadRate + internetFactor + opennessFactor + evolvedTraitsFactor;
          
          // Bonus for starting country
          if (country.id === selectedStartCountryId) {
            spreadIncrease *= 1.5;
          }

          newAdoptionLevel = Math.min(1, country.adoptionLevel + spreadIncrease);
          
          if (newAdoptionLevel > country.adoptionLevel && newAdoptionLevel > 0.1 && Math.random() < 0.3) {
            newRecentEventsSummary += ` ${country.name} sees growing interest.`;
          }
        }
        return { ...country, adoptionLevel: newAdoptionLevel };
      })
    );
    setRecentEvents(newRecentEventsSummary);
    toast({ title: `Day ${currentTurn + 1}`, description: "The movement progresses..." });
  };
  
  const globalAdoptionRate = countries.reduce((sum, country) => sum + country.adoptionLevel, 0) / countries.length;
  const currentMovementName = CULTURAL_MOVEMENTS.find(m => m.id === selectedMovementId)?.name || "Unnamed Movement";

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
              </>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
