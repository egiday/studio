
'use client';

import type { Country, SubRegion } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, ChevronLeft } from 'lucide-react';
import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { subRegionPositions as SUB_REGION_LAYOUT_CONFIG } from '@/config/gameData'; // Renamed for clarity

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
  const [zoomedCountry, setZoomedCountry] = useState<Country | null>(null);

  const handleCollect = () => {
    const points = Math.floor(Math.random() * 5) + 1; // Collect 1-5 points
    onCollectInfluence(points);
    setShowInfluenceBubble(false);
    setTimeout(() => setShowInfluenceBubble(true), 5000); // Respawn bubble after 5s
  };
  
  const getCountryColor = (adoptionLevel: number) => {
    if (adoptionLevel > 0.75) return 'bg-primary/70 hover:bg-primary/80';
    if (adoptionLevel > 0.5) return 'bg-primary/50 hover:bg-primary/60';
    if (adoptionLevel > 0.25) return 'bg-primary/30 hover:bg-primary/40';
    if (adoptionLevel > 0) return 'bg-primary/10 hover:bg-primary/20';
    return 'bg-muted/30 hover:bg-muted/40';
  };

  const handleCountryClick = (country: Country) => {
    onCountrySelect(country.id); // For starting country selection
    if (country.subRegions && country.subRegions.length > 0) {
      setZoomedCountry(country);
    } else {
      setZoomedCountry(null); // Ensure zoom out if clicking a country without subregions
    }
  };

  const handleZoomOut = () => {
    setZoomedCountry(null);
  };

  const renderSubRegionTooltipContent = (subRegion: SubRegion) => (
    <div className="p-2 space-y-1 text-sm w-48">
      <p className="font-bold text-base mb-1">{subRegion.name}</p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <span className="font-medium">Adoption:</span><span className="text-right">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
        <span className="font-medium">Resistance:</span><span className="text-right">{(subRegion.resistanceLevel * 100).toFixed(0)}%</span>
        <span className="font-medium">Economy:</span><span className="text-right">{(subRegion.economicDevelopment * 100).toFixed(0)}%</span>
        <span className="font-medium">Openness:</span><span className="text-right">{(subRegion.culturalOpenness * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
  
  const renderCountryTooltipContent = (country: Country) => (
    <div className="p-2 space-y-1 text-sm w-48">
      <p className="font-bold text-base mb-1">{country.name}</p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <span className="font-medium">Adoption:</span><span className="text-right">{(country.adoptionLevel * 100).toFixed(0)}%</span>
        <span className="font-medium">Internet:</span><span className="text-right">{(country.internetPenetration * 100).toFixed(0)}%</span>
        <span className="font-medium">Education:</span><span className="text-right">{(country.educationLevel * 100).toFixed(0)}%</span>
        <span className="font-medium">Economy:</span><span className="text-right">{(country.economicDevelopment * 100).toFixed(0)}%</span>
        <span className="font-medium">Openness:</span><span className="text-right">{(country.culturalOpenness * 100).toFixed(0)}%</span>
        <span className="font-medium">Media Freedom:</span><span className="text-right">{(country.mediaFreedom * 100).toFixed(0)}%</span>
        <span className="font-medium">Resistance:</span><span className="text-right">{(country.resistanceLevel * 100).toFixed(0)}%</span>
      </div>
      {country.subRegions && country.subRegions.length > 0 && (
        <p className="text-xs italic mt-1">Click to view regions</p>
      )}
    </div>
  );

  return (
    <Card className="h-full shadow-xl flex flex-col">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-6 w-6 text-primary" /> 
          {zoomedCountry ? `${zoomedCountry.name} - Regions` : 'World Overview'}
        </CardTitle>
        {zoomedCountry && (
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to World
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow relative overflow-hidden p-0">
        <TooltipProvider delayDuration={100}>
          <Image
            src="https://placehold.co/1200x800/A9CCE3/2E4053.png?text=Political+World+Map"
            alt="World Map"
            layout="fill"
            objectFit="cover"
            data-ai-hint="world map political"
            className={cn("transition-opacity duration-300", zoomedCountry ? "opacity-20" : "opacity-60")}
          />

          {!zoomedCountry ? (
            countries.map((country) => (
              countryPositions[country.id] && (
                <Tooltip key={country.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        `absolute p-2 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 rounded-lg shadow-lg transition-colors`,
                        getCountryColor(country.adoptionLevel),
                        selectedCountryId === country.id ? 'border-secondary ring-2 ring-secondary' : 'border-primary/50 hover:border-primary'
                      )}
                      style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
                      onClick={() => handleCountryClick(country)}
                      aria-label={`Select ${country.name}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">{country.name}</span>
                        <span className="text-xs font-medium opacity-90">{(country.adoptionLevel * 100).toFixed(0)}%</span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    {renderCountryTooltipContent(country)}
                  </TooltipContent>
                </Tooltip>
              )
            ))
          ) : (
            // Render SubRegions
            zoomedCountry.subRegions?.map((subRegion, index) => {
              const layoutConfig = SUB_REGION_LAYOUT_CONFIG[zoomedCountry.id];
              let positionStyle = {};
              if (layoutConfig && layoutConfig.offsets[index]) {
                const baseTopPercent = parseFloat(layoutConfig.baseTop);
                const baseLeftPercent = parseFloat(layoutConfig.baseLeft);
                const offsetTopPercent = parseFloat(layoutConfig.offsets[index].top);
                const offsetLeftPercent = parseFloat(layoutConfig.offsets[index].left);
                positionStyle = {
                  top: `${baseTopPercent + offsetTopPercent}%`,
                  left: `${baseLeftPercent + offsetLeftPercent}%`,
                };
              } else { // Fallback positioning if config is missing
                  positionStyle = {
                    top: `${20 + index * 15}%`, // Simple stacking for fallback, increased spacing
                    left: '50%',
                  };
              }

              return (
                <Tooltip key={subRegion.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm" // keep sm for consistency, but p-2 makes it effectively larger
                      className={cn(
                        `absolute p-2 h-auto transform -translate-x-1/2 -translate-y-1/2 border rounded-md shadow-md transition-colors`,
                        getCountryColor(subRegion.adoptionLevel), 
                         'border-accent hover:border-accent/70 text-accent-foreground' 
                      )}
                      style={positionStyle}
                      aria-label={`View ${subRegion.name}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold">{subRegion.name}</span>
                        <span className="text-xs font-medium opacity-90">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    {renderSubRegionTooltipContent(subRegion)}
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}
        </TooltipProvider>
        {showInfluenceBubble && !zoomedCountry && ( // Only show bubble in world view
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
