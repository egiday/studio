
'use client';

import type { Country, EvolutionItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Zap, Lightbulb, Info, CalendarDays, ShieldAlert } from 'lucide-react';
import React from 'react';

interface AnalyticsDashboardProps {
  countries: Country[];
  influencePoints: number;
  evolvedItemIds: Set<string>;
  evolutionItems: EvolutionItem[];
  currentTurn: number;
}

export function AnalyticsDashboard({
  countries,
  influencePoints,
  evolvedItemIds,
  evolutionItems,
  currentTurn,
}: AnalyticsDashboardProps) {
  const globalAdoptionRate = countries.reduce((sum, country) => sum + country.adoptionLevel, 0) / (countries.length || 1);
  
  const topCountries = [...countries]
    .sort((a, b) => b.adoptionLevel - a.adoptionLevel)
    .slice(0, 3);

  const highestResistanceCountry = countries.length > 0 
    ? countries.reduce((max, country) => country.resistanceLevel > max.resistanceLevel ? country : max, countries[0])
    : null;

  const numEvolvedTraits = evolvedItemIds.size;
  const totalPossibleTraits = evolutionItems.length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Info className="mr-2 h-6 w-6 text-primary" />Analytics Dashboard</CardTitle>
        <CardDescription>Overview of your cultural movement's progress.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="mr-2 h-4 w-4" /> Global Adoption
            </span>
            <span className="text-sm font-semibold text-primary">{(globalAdoptionRate * 100).toFixed(1)}%</span>
          </div>
          <Progress value={globalAdoptionRate * 100} className="h-2" />
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" /> Top Influenced Countries
          </h4>
          <ul className="space-y-1 text-xs">
            {topCountries.map(country => (
              <li key={country.id} className="flex justify-between items-center p-1 bg-muted/50 rounded-sm">
                <span>{country.name}</span>
                <span className="font-medium">{(country.adoptionLevel * 100).toFixed(1)}%</span>
              </li>
            ))}
            {topCountries.length === 0 && <p className="text-xs text-muted-foreground">No countries influenced yet.</p>}
          </ul>
        </div>

        {highestResistanceCountry && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center">
              <ShieldAlert className="mr-2 h-4 w-4 text-destructive" /> Highest Resistance
            </h4>
            <div className="flex justify-between items-center p-1 bg-muted/50 rounded-sm text-xs">
              <span>{highestResistanceCountry.name}</span>
              <span className="font-medium text-destructive">{(highestResistanceCountry.resistanceLevel * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-2 bg-muted/50 rounded-md">
            <div className="flex items-center text-muted-foreground mb-1">
              <Zap className="mr-1.5 h-4 w-4" /> IP
            </div>
            <span className="text-lg font-bold text-primary">{influencePoints}</span>
          </div>
          <div className="p-2 bg-muted/50 rounded-md">
            <div className="flex items-center text-muted-foreground mb-1">
              <Lightbulb className="mr-1.5 h-4 w-4" /> Evolved Traits
            </div>
            <span className="text-lg font-bold text-primary">{numEvolvedTraits} / {totalPossibleTraits}</span>
          </div>
        </div>
         <div className="flex items-center justify-start p-2 bg-muted/50 rounded-md text-sm">
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Current Day:</span>
            <span className="ml-1.5 font-semibold text-primary">{currentTurn}</span>
        </div>
      </CardContent>
    </Card>
  );
}
