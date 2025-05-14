
'use client';

import type { Country, SubRegion } from '@/types';
// import Image from 'next/image'; // No longer needed
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
import { subRegionPositions as SUB_REGION_LAYOUT_CONFIG, countryPositions } from '@/config/gameData';

interface WorldMapProps {
  countries: Country[];
  onCountrySelect: (countryId: string) => void;
  onCollectInfluence: (points: number) => void;
  selectedCountryId?: string;
}

export function WorldMap({ countries, onCountrySelect, onCollectInfluence, selectedCountryId }: WorldMapProps) {
  const [showInfluenceBubble, setShowInfluenceBubble] = useState(true);
  const [zoomedCountry, setZoomedCountry] = useState<Country | null>(null);

  const handleCollect = () => {
    const points = Math.floor(Math.random() * 5) + 1; // Collect 1-5 points
    onCollectInfluence(points);
    setShowInfluenceBubble(false);
    setTimeout(() => setShowInfluenceBubble(true), 5000); // Respawn bubble after 5s
  };

  const getRegionColor = (adoptionLevel: number) => { // Renamed for clarity
    if (adoptionLevel > 0.75) return 'bg-primary/80 hover:bg-primary/90 border-primary';
    if (adoptionLevel > 0.5) return 'bg-primary/60 hover:bg-primary/70 border-primary/70';
    if (adoptionLevel > 0.25) return 'bg-primary/40 hover:bg-primary/50 border-primary/50';
    if (adoptionLevel > 0) return 'bg-primary/20 hover:bg-primary/30 border-primary/30';
    return 'bg-muted/50 hover:bg-muted/60 border-muted-foreground/30';
  };

  const handleCountryClick = (country: Country) => {
    onCountrySelect(country.id);
    if (country.subRegions && country.subRegions.length > 0) {
      setZoomedCountry(country);
    } else {
      setZoomedCountry(null);
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
        <span className="font-medium">Media:</span><span className="text-right">{(country.mediaFreedom * 100).toFixed(0)}%</span>
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
      <CardContent className={cn(
        "flex-grow relative overflow-hidden p-4 bg-gradient-to-br from-background to-muted/30 transition-opacity duration-500",
        zoomedCountry ? "opacity-70" : "opacity-100" // Dim background slightly when zoomed
      )}>
        <TooltipProvider delayDuration={100}>
          {/* Background Image Removed */}

          {!zoomedCountry ? (
            countries.map((country) => (
              countryPositions[country.id] && (
                <Tooltip key={country.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        `absolute p-3 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-lg transition-all duration-300 hover:scale-105`,
                        getRegionColor(country.adoptionLevel),
                        selectedCountryId === country.id ? 'ring-2 ring-offset-2 ring-accent scale-105' : 'border-opacity-50',
                        'rounded-xl min-w-[100px]' // Abstract shape
                      )}
                      style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
                      onClick={() => handleCountryClick(country)}
                      aria-label={`Select ${country.name}`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="text-sm font-bold">{country.name}</span>
                        <span className="text-xs font-medium opacity-90">{(country.adoptionLevel * 100).toFixed(0)}% Adopted</span>
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
              let positionStyle = { top: '50%', left: '50%'}; // Default fallback
              if (layoutConfig && layoutConfig.offsets[index]) {
                const baseTopPercent = parseFloat(layoutConfig.baseTop);
                const baseLeftPercent = parseFloat(layoutConfig.baseLeft);
                const offsetTopPercent = parseFloat(layoutConfig.offsets[index].top);
                const offsetLeftPercent = parseFloat(layoutConfig.offsets[index].left);

                // Adjust offsets to be relative to the center of the "zoomed" view
                // This is a simplified approach. A real SVG map would handle this better.
                const viewCenterX = 50; 
                const viewCenterY = 50;
                const scaleFactor = 2.5; // How much to "spread out" subregions

                positionStyle = {
                  top: `${viewCenterY + offsetTopPercent * scaleFactor}%`,
                  left: `${viewCenterX + offsetLeftPercent * scaleFactor}%`,
                };

              } else { // Fallback positioning if config is missing
                  const angle = (index / (zoomedCountry.subRegions?.length || 1)) * 2 * Math.PI;
                  const radius = 25; // Percentage radius from center
                  positionStyle = {
                    top: `${50 + radius * Math.sin(angle)}%`,
                    left: `${50 + radius * Math.cos(angle)}%`,
                  };
              }

              return (
                <Tooltip key={subRegion.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        `absolute p-2.5 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-md transition-all duration-300 hover:scale-110`,
                         getRegionColor(subRegion.adoptionLevel),
                         'border-accent hover:border-accent/70 text-foreground', // Use foreground for better contrast on colored bg
                         'rounded-lg min-w-[90px]' // Abstract shape for subregions
                      )}
                      style={positionStyle}
                      aria-label={`View ${subRegion.name}`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xs font-semibold">{subRegion.name}</span>
                        <span className="text-[10px] font-medium opacity-90">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
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
        {showInfluenceBubble && !zoomedCountry && (
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

