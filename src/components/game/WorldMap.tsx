
'use client';

import type { Country, SubRegion } from '@/types';
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
    setTimeout(() => setShowInfluenceBubble(true), 10000); // Respawn bubble after 10s
  };

  const getRegionColor = (adoptionLevel: number, isSelected: boolean) => {
    let baseColorClass = 'bg-muted/60 hover:bg-muted/70 border-muted-foreground/50';
    if (adoptionLevel > 0.8) baseColorClass = 'bg-primary/90 hover:bg-primary border-primary/70';
    else if (adoptionLevel > 0.6) baseColorClass = 'bg-primary/70 hover:bg-primary/80 border-primary/60';
    else if (adoptionLevel > 0.4) baseColorClass = 'bg-primary/50 hover:bg-primary/60 border-primary/50';
    else if (adoptionLevel > 0.15) baseColorClass = 'bg-secondary/50 hover:bg-secondary/60 border-secondary/40';
    else if (adoptionLevel > 0) baseColorClass = 'bg-secondary/30 hover:bg-secondary/40 border-secondary/30';

    const selectedClass = isSelected ? 'ring-4 ring-offset-2 ring-accent scale-105 shadow-accent/50' : 'shadow-md';
    return cn(baseColorClass, selectedClass);
  };
  
  const getSubRegionColor = (adoptionLevel: number) => {
    if (adoptionLevel > 0.75) return 'bg-primary/70 hover:bg-primary/80 border-primary/60';
    if (adoptionLevel > 0.5) return 'bg-primary/50 hover:bg-primary/60 border-primary/50';
    if (adoptionLevel > 0.25) return 'bg-secondary/60 hover:bg-secondary/70 border-secondary/50';
    if (adoptionLevel > 0) return 'bg-secondary/40 hover:bg-secondary/50 border-secondary/30';
    return 'bg-muted/70 hover:bg-muted border-muted-foreground/40';
  }

  const handleCountryClick = (country: Country) => {
    onCountrySelect(country.id);
    if (country.subRegions && country.subRegions.length > 0) {
      setZoomedCountry(country);
    } else {
      setZoomedCountry(null); // If country has no subregions, don't zoom
    }
  };

  const handleZoomOut = () => {
    setZoomedCountry(null);
  };

  const renderSubRegionTooltipContent = (subRegion: SubRegion) => (
    <div className="p-2 space-y-1 text-sm w-48 bg-popover text-popover-foreground rounded-md shadow-xl">
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
    <div className="p-2 space-y-1 text-sm w-48 bg-popover text-popover-foreground rounded-md shadow-xl">
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
        <p className="text-xs italic mt-1 text-muted-foreground">Click to view regions</p>
      )}
    </div>
  );

  return (
    <Card className="h-full shadow-xl flex flex-col border-2 border-card">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-6 w-6 text-primary" />
          {zoomedCountry ? `${zoomedCountry.name} - Regions` : 'Celestial Sphere of Influence'}
        </CardTitle>
        {zoomedCountry && (
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="border-accent text-accent-foreground hover:bg-accent/20">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Sphere
          </Button>
        )}
      </CardHeader>
      <CardContent className={cn(
        "flex-grow relative overflow-hidden p-4 bg-muted/30 transition-opacity duration-500",
        // When zoomed, the main container holding country buttons dims.
        zoomedCountry ? "opacity-30" : "opacity-100" 
      )}>
        <TooltipProvider delayDuration={100}>
          {/* Render Countries if not zoomed into a specific one */}
          {!zoomedCountry && countries.map((country) => (
            countryPositions[country.id] && (
              <Tooltip key={country.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      `absolute p-3.5 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all duration-300 hover:scale-105`,
                      getRegionColor(country.adoptionLevel, selectedCountryId === country.id),
                      'rounded-xl min-w-[110px] text-foreground' // Ensure text contrast
                    )}
                    style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
                    onClick={() => handleCountryClick(country)}
                    aria-label={`Select ${country.name}`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="text-sm font-bold">{country.name}</span>
                      <span className="text-xs font-medium opacity-90">{(country.adoptionLevel * 100).toFixed(0)}% Influence</span>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {renderCountryTooltipContent(country)}
                </TooltipContent>
              </Tooltip>
            )
          ))}
        </TooltipProvider>

        {/* Influence bubble always renders on top if not zoomed */}
        {showInfluenceBubble && !zoomedCountry && (
          <Button
            variant="default"
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-14 h-14 shadow-2xl animate-pulse bg-accent hover:bg-accent/90"
            onClick={handleCollect}
            aria-label="Collect Influence Points"
          >
            <Zap className="w-7 h-7 text-accent-foreground" />
          </Button>
        )}
      </CardContent>

      {/* Separate container for SubRegions, rendered on top and visible only when zoomed */}
      {zoomedCountry && (
        <div className="absolute inset-0 p-4 pt-[70px] bg-background/30 backdrop-blur-sm overflow-hidden"> {/* Matches CardContent padding + CardHeader approx height */}
          <TooltipProvider delayDuration={100}>
            {zoomedCountry.subRegions?.map((subRegion, index) => {
              const layoutConfig = SUB_REGION_LAYOUT_CONFIG[zoomedCountry.id];
              let positionStyle = { top: '50%', left: '50%'}; // Default fallback
              if (layoutConfig && layoutConfig.offsets[index]) {
                const scaleFactor = 2.8; // Spread out subregions more
                positionStyle = {
                  top: `${50 + parseFloat(layoutConfig.offsets[index].top) * scaleFactor}%`,
                  left: `${50 + parseFloat(layoutConfig.offsets[index].left) * scaleFactor}%`,
                };
              } else { 
                  const angle = (index / (zoomedCountry.subRegions?.length || 1)) * 2 * Math.PI;
                  const radius = 30; // Percentage radius from center
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
                        `absolute p-3 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-lg transition-all duration-300 hover:scale-110`,
                         getSubRegionColor(subRegion.adoptionLevel),
                         'border-secondary hover:border-secondary/70 text-foreground', 
                         'rounded-lg min-w-[100px]'
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
            })}
          </TooltipProvider>
        </div>
      )}
    </Card>
  );
}
