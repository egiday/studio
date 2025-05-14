
'use client';

import type { GlobalEvent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CalendarClock } from 'lucide-react';
import React from 'react';

interface GlobalEventsDisplayProps {
  activeEvents: GlobalEvent[];
  currentTurn: number;
}

export function GlobalEventsDisplay({ activeEvents, currentTurn }: GlobalEventsDisplayProps) {
  if (!activeEvents || activeEvents.length === 0) {
    return null; // Don't render if no active events
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><AlertCircle className="mr-2 h-6 w-6 text-primary" />Global Events</CardTitle>
        <CardDescription>Current world-shaping events.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[150px] pr-3"> {/* Adjust height as needed */}
          {activeEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No major global events currently active.</p>
          ) : (
            <ul className="space-y-3">
              {activeEvents.map((event) => {
                const turnsRemaining = (event.turnStart + event.duration) - currentTurn;
                return (
                  <li key={event.id} className="p-3 bg-muted/50 rounded-md border border-border">
                    <h4 className="font-semibold text-sm text-accent-foreground">{event.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                    <p className="text-xs text-primary mt-1 font-medium flex items-center">
                      <CalendarClock className="mr-1.5 h-3 w-3" /> 
                      {turnsRemaining > 1 ? `${turnsRemaining} days remaining` : turnsRemaining === 1 ? `Last day` : 'Concluding soon'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
