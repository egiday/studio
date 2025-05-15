
'use client';

import type { CulturalMovement, Country } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Play, Pause, Flag, BarChart3, AlertTriangle, SunMedium } from 'lucide-react'; // Added Pause
import React from 'react';

interface ControlPanelProps {
  movements: CulturalMovement[];
  countries: Country[];
  selectedMovementId?: string;
  selectedCountryId?: string;
  influencePoints: number;
  onMovementChange: (movementId: string) => void;
  onCountryChange: (countryId: string) => void;
  onStartGame: () => void;
  currentTurn: number;
  onToggleAutoplay: () => void; // Changed from onNextTurn
  isAutoplayActive: boolean;    // New prop
  gameStarted: boolean;
  isEventPending?: boolean;
  gameOver?: boolean;
}

export function ControlPanel({
  movements,
  countries: systems,
  selectedMovementId,
  selectedCountryId: selectedSystemId,
  influencePoints,
  onMovementChange,
  onCountryChange: onSystemChange,
  onStartGame,
  currentTurn,
  onToggleAutoplay, // Changed from onNextTurn
  isAutoplayActive,   // New prop
  gameStarted,
  isEventPending,
  gameOver,
}: ControlPanelProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-primary" />Mission Control</CardTitle>
        <CardDescription>Setup and manage your cultural expansion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!gameStarted ? (
          <>
            <div>
              <label htmlFor="cultural-movement" className="block text-sm font-medium mb-1">Cultural Movement</label>
              <Select onValueChange={onMovementChange} value={selectedMovementId}>
                <SelectTrigger id="cultural-movement" className="w-full">
                  <SelectValue placeholder="Select a movement" />
                </SelectTrigger>
                <SelectContent>
                  {movements.map((movement) => (
                    <SelectItem key={movement.id} value={movement.id}>
                      <div className="flex items-center">
                        <movement.icon className="mr-2 h-4 w-4" />
                        {movement.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="starting-system" className="block text-sm font-medium mb-1">Home System</label>
              <Select onValueChange={onSystemChange} value={selectedSystemId}>
                <SelectTrigger id="starting-system" className="w-full">
                  <SelectValue placeholder="Select home system" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((system) => (
                    <SelectItem key={system.id} value={system.id}>
                       <div className="flex items-center">
                        <SunMedium className="mr-2 h-4 w-4 text-muted-foreground" />
                        {system.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={onStartGame}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!selectedMovementId || !selectedSystemId || gameOver}
            >
              <Play className="mr-2 h-5 w-5" /> Launch Movement
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={onToggleAutoplay}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isEventPending || gameOver}
            >
              {isAutoplayActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isAutoplayActive ? 'Pause Autoplay' : 'Start Autoplay'} (Day: {currentTurn})
            </Button>
            {isEventPending && !gameOver && (
              <p className="text-xs text-destructive text-center flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 mr-1.5" /> Resolve galactic event before proceeding.
              </p>
            )}
             {gameOver && (
              <p className="text-xs text-primary text-center font-semibold">
                The game has concluded.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <div className="flex items-center text-lg font-semibold">
            <Coins className="mr-2 h-6 w-6 text-secondary" />
            Influence Points:
          </div>
          <span className="text-xl font-bold text-primary">{influencePoints}</span>
        </div>

        {selectedMovementId && (
          <div className="text-sm text-muted-foreground">
            Current Movement: {movements.find(m => m.id === selectedMovementId)?.name}
          </div>
        )}
        {selectedSystemId && gameStarted && (
           <div className="text-sm text-muted-foreground">
            Home System: {systems.find(s => s.id === selectedSystemId)?.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
