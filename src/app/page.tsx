
'use client';

import React, { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { WorldMap } from '@/components/game/WorldMap';
import { ControlPanel } from '@/components/game/ControlPanel';
import { EvolutionPanel } from '@/components/game/EvolutionPanel';
import { NewsFeed } from '@/components/game/NewsFeed';
import { AnalyticsDashboard } from '@/components/game/AnalyticsDashboard';
import { GlobalEventsDisplay } from '@/components/game/GlobalEventsDisplay';
import { InteractiveEventModal } from '@/components/game/InteractiveEventModal';
import { DiplomacyPanel } from '@/components/game/DiplomacyPanel';
import { CULTURAL_MOVEMENTS, EVOLUTION_ITEMS, INITIAL_COUNTRIES, POTENTIAL_GLOBAL_EVENTS, RIVAL_MOVEMENTS } from '@/config/gameData';
import { DIPLOMACY_STANCE_CHANGE_COST, STARTING_INFLUENCE_POINTS } from '@/config/gameConstants';
import type { Country, CulturalMovement } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, AlertCircle, Newspaper, Info as InfoIcon, Handshake, Trophy, Skull } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useGameLogic } from '@/hooks/useGameLogic';

export default function GamePage() {
  const [selectedMovementId, setSelectedMovementId] = useState<string | undefined>(undefined);
  const [selectedStartCountryId, setSelectedStartCountryId] = useState<string | undefined>(undefined);

  const {
    influencePoints,
    evolvedItemIds,
    countries,
    rivalMovements: gameLogicRivalMovements,
    gameStarted,
    currentTurn,
    recentEvents,
    activeGlobalEvents,
    pendingInteractiveEvent,
    isEventModalOpen,
    gameOver,
    gameOverTitle,
    gameOverDescription,
    isAutoplayActive, // New state from hook
    startGame,
    evolveItem,
    collectInfluencePoints,
    selectEventOption,
    processNextTurn, // Still needed if we allow manual advance when autoplay is off, or for the timer to call
    toggleAutoplay, // New function from hook
    performDiplomaticAction,
    getGlobalAdoptionRate,
  } = useGameLogic({
    initialCountriesData: INITIAL_COUNTRIES,
    initialRivalMovementsData: RIVAL_MOVEMENTS,
    initialPotentialEventsData: POTENTIAL_GLOBAL_EVENTS,
    startingInfluencePoints: STARTING_INFLUENCE_POINTS,
    allCulturalMovements: CULTURAL_MOVEMENTS,
    allEvolutionItems: EVOLUTION_ITEMS,
    selectedMovementId: selectedMovementId,
    selectedStartCountryId: selectedStartCountryId,
  });

  const handleMovementChange = (movementId: string) => {
    setSelectedMovementId(movementId);
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedStartCountryId(countryId);
  };

  const currentMovementName = CULTURAL_MOVEMENTS.find(m => m.id === selectedMovementId)?.name || "Unnamed Movement";


  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <div className="md:w-2/3 lg:w-3/4 h-full min-h-[400px] md:min-h-0">
          <WorldMap
            countries={countries}
            rivalMovements={gameLogicRivalMovements}
            onCountrySelect={handleCountryChange}
            onCollectInfluence={collectInfluencePoints}
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
            onStartGame={startGame}
            currentTurn={currentTurn}
            onToggleAutoplay={toggleAutoplay} // Pass toggle function
            isAutoplayActive={isAutoplayActive} // Pass autoplay state
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
                      onEvolve={evolveItem}
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
                      globalAdoptionRate={getGlobalAdoptionRate()}
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
                      rivalMovements={gameLogicRivalMovements}
                      onDiplomaticAction={performDiplomaticAction}
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
        onClose={() => { /* Modal closing handled by onOpenChange or by logic in hook */ }}
        onOptionSelect={selectEventOption}
      />
      {gameOver && (
        <AlertDialog open={gameOver} onOpenChange={(open) => { if(!open) { /* Game over ACK for now, future restart logic would go here */ } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                {gameOverTitle.includes("Achieved") || gameOverTitle.includes("Harmony") ? <Trophy className="mr-2 h-6 w-6 text-primary" /> : <Skull className="mr-2 h-6 w-6 text-destructive" />}
                {gameOverTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {gameOverDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => { /* Game over ACK for now */ }}>Acknowledge</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
