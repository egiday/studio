
'use client';

import type { CulturalMovement, Country } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Play, Flag, BarChart3, AlertTriangle } from 'lucide-react';
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
  onNextTurn: () => void;
  gameStarted: boolean;
  isEventPending?: boolean;
  gameOver?: boolean; // New prop
}

export function ControlPanel({
  movements,
  countries,
  selectedMovementId,
  selectedCountryId,
  influencePoints,
  onMovementChange,
  onCountryChange,
  onStartGame,
  currentTurn,
  onNextTurn,
  gameStarted,
  isEventPending,
  gameOver, // Destructure new prop
}: ControlPanelProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-primary" />Control Panel</CardTitle>
        <CardDescription>Setup and manage your cultural revolution.</CardDescription>
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
              <label htmlFor="starting-country" className="block text-sm font-medium mb-1">Starting Country</label>
              <Select onValueChange={onCountryChange} value={selectedCountryId}>
                <SelectTrigger id="starting-country" className="w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={onStartGame}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!selectedMovementId || !selectedCountryId || gameOver}
            >
              <Play className="mr-2 h-5 w-5" /> Start Revolution
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={onNextTurn}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isEventPending || gameOver} // Disable if an event is pending or game is over
            >
              Next Day (Turn: {currentTurn})
            </Button>
            {isEventPending && !gameOver && (
              <p className="text-xs text-destructive text-center flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 mr-1.5" /> Resolve global event before proceeding.
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
        {selectedCountryId && gameStarted && (
           <div className="text-sm text-muted-foreground">
            Origin: {countries.find(c => c.id === selectedCountryId)?.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
