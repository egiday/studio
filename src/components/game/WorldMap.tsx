'use client';

import type { Country } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface WorldMapProps {
  countries: Country[];
  onCountrySelect: (countryId: string) => void;
  onCollectInfluence: (points: number) => void;
  selectedCountryId?: string;
}

// Simplified representation of country positions on a generic map
const countryPositions: Record<string, { top: string; left: string }> = {
  usa: { top: '30%', left: '20%' },
  china: { top: '35%', left: '70%' },
  india: { top: '45%', left: '65%' },
  brazil: { top: '60%', left: '30%' },
  nigeria: { top: '55%', left: '50%' },
  germany: { top: '30%', left: '52%' },
};

export function WorldMap({ countries, onCountrySelect, onCollectInfluence, selectedCountryId }: WorldMapProps) {
  const [showInfluenceBubble, setShowInfluenceBubble] = useState(true);

  const handleCollect = () => {
    const points = Math.floor(Math.random() * 5) + 1; // Collect 1-5 points
    onCollectInfluence(points);
    setShowInfluenceBubble(false);
    setTimeout(() => setShowInfluenceBubble(true), 5000); // Respawn bubble after 5s
  };
  
  const getCountryColor = (adoptionLevel: number) => {
    if (adoptionLevel > 0.75) return 'bg-primary/70';
    if (adoptionLevel > 0.5) return 'bg-primary/50';
    if (adoptionLevel > 0.25) return 'bg-primary/30';
    if (adoptionLevel > 0) return 'bg-primary/10';
    return 'bg-muted/30';
  };

  return (
    <Card className="h-full shadow-xl flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center"><Globe className="mr-2 h-6 w-6 text-primary" /> World Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow relative overflow-hidden p-0">
        <Image
          src="https://placehold.co/1200x800.png"
          alt="World Map"
          layout="fill"
          objectFit="cover"
          data-ai-hint="world map political"
          className="opacity-50"
        />
        {countries.map((country) => (
          countryPositions[country.id] && (
            <Button
              key={country.id}
              variant="outline"
              size="sm"
              className={`absolute p-2 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 rounded-lg shadow-lg
                          ${getCountryColor(country.adoptionLevel)}
                          ${selectedCountryId === country.id ? 'border-secondary ring-2 ring-secondary' : 'border-primary/50 hover:border-primary'}`}
              style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
              onClick={() => onCountrySelect(country.id)}
              aria-label={`Select ${country.name}`}
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold">{country.name}</span>
                <span className="text-xs opacity-80">{(country.adoptionLevel * 100).toFixed(0)}%</span>
              </div>
            </Button>
          )
        ))}
        {showInfluenceBubble && (
          <Button
            variant="default"
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-12 h-12 shadow-xl animate-pulse bg-secondary hover:bg-secondary/90"
            onClick={handleCollect}
            aria-label="Collect Influence Points"
          >
            <Zap className="w-6 h-6 text-secondary-foreground" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
