
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
    let baseColorClass = 'bg-muted/50 hover:bg-muted/60 border-border/50'; // Default for 0% adoption
    if (adoptionLevel > 0.8) baseColorClass = 'bg-primary/90 hover:bg-primary border-primary/70 shadow-primary/30';
    else if (adoptionLevel > 0.6) baseColorClass = 'bg-primary/70 hover:bg-primary/80 border-primary/60 shadow-primary/20';
    else if (adoptionLevel > 0.4) baseColorClass = 'bg-primary/50 hover:bg-primary/60 border-primary/50 shadow-primary/10';
    else if (adoptionLevel > 0.2) baseColorClass = 'bg-secondary/70 hover:bg-secondary/80 border-secondary/60 shadow-secondary/20';
    else if (adoptionLevel > 0.05) baseColorClass = 'bg-secondary/40 hover:bg-secondary/50 border-secondary/40 shadow-secondary/10';
    else if (adoptionLevel > 0) baseColorClass = 'bg-secondary/20 hover:bg-secondary/30 border-secondary/30';


    const selectedClass = isSelected ? 'ring-4 ring-offset-2 ring-offset-background ring-accent scale-105 shadow-lg shadow-accent/50' : 'shadow-md';
    return cn(baseColorClass, selectedClass, 'text-foreground'); // Ensure text contrast
  };
  
  const getSubRegionColor = (adoptionLevel: number) => {
    // Slightly more muted or distinct palette for sub-regions
    if (adoptionLevel > 0.8) return 'bg-primary/80 hover:bg-primary/90 border-primary/60 shadow-md shadow-primary/20';
    if (adoptionLevel > 0.6) return 'bg-primary/60 hover:bg-primary/70 border-primary/50 shadow-sm shadow-primary/10';
    if (adoptionLevel > 0.4) return 'bg-secondary/80 hover:bg-secondary/90 border-secondary/70 shadow-md shadow-secondary/20';
    if (adoptionLevel > 0.2) return 'bg-secondary/60 hover:bg-secondary/70 border-secondary/50 shadow-sm shadow-secondary/10';
    if (adoptionLevel > 0) return 'bg-secondary/30 hover:bg-secondary/40 border-secondary/30';
    return 'bg-muted/60 hover:bg-muted/70 border-border/40';
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
    <div className="p-2.5 space-y-1.5 text-sm w-52 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
      <p className="font-bold text-base mb-1.5 text-primary">{subRegion.name}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="font-medium text-muted-foreground">Adoption:</span><span className="text-right font-semibold">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Resistance:</span><span className="text-right font-semibold">{(subRegion.resistanceLevel * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Economy:</span><span className="text-right">{(subRegion.economicDevelopment * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Openness:</span><span className="text-right">{(subRegion.culturalOpenness * 100).toFixed(0)}%</span>
      </div>
    </div>
  );

  const renderCountryTooltipContent = (country: Country) => (
    <div className="p-2.5 space-y-1.5 text-sm w-52 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
      <p className="font-bold text-base mb-1.5 text-primary">{country.name}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="font-medium text-muted-foreground">Adoption:</span><span className="text-right font-semibold">{(country.adoptionLevel * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Resistance:</span><span className="text-right font-semibold">{(country.resistanceLevel * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Internet:</span><span className="text-right">{(country.internetPenetration * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Education:</span><span className="text-right">{(country.educationLevel * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Economy:</span><span className="text-right">{(country.economicDevelopment * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Openness:</span><span className="text-right">{(country.culturalOpenness * 100).toFixed(0)}%</span>
        <span className="font-medium text-muted-foreground">Media Free:</span><span className="text-right">{(country.mediaFreedom * 100).toFixed(0)}%</span>
      </div>
      {country.subRegions && country.subRegions.length > 0 && (
        <p className="text-xs italic mt-1.5 text-accent">Click to explore regions</p>
      )}
    </div>
  );

  return (
    <Card className="h-full shadow-xl flex flex-col border-2 border-card overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-center z-10 bg-background/80 backdrop-blur-sm">
        <CardTitle className="flex items-center text-lg">
          <Globe className="mr-2 h-5 w-5 text-primary" />
          {zoomedCountry ? `${zoomedCountry.name} - Territories` : 'Celestial Sphere of Influence'}
        </CardTitle>
        {zoomedCountry && (
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="border-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> Sphere View
          </Button>
        )}
      </CardHeader>
      <CardContent className={cn(
        "flex-grow relative overflow-hidden p-4 bg-muted/20 transition-opacity duration-300",
        zoomedCountry ? "opacity-30" : "opacity-100" 
      )}>
        <TooltipProvider delayDuration={150}>
          {!zoomedCountry && countries.map((country) => (
            countryPositions[country.id] && (
              <Tooltip key={country.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline" // Base variant, colors are applied via getRegionColor
                    className={cn(
                      `absolute p-0 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all duration-300 hover:scale-105`,
                      getRegionColor(country.adoptionLevel, selectedCountryId === country.id),
                      'rounded-xl w-32 h-20 flex flex-col justify-center items-center' 
                    )}
                    style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
                    onClick={() => handleCountryClick(country)}
                    aria-label={`Select ${country.name}`}
                  >
                    <span className="text-sm font-bold block truncate w-full px-1 text-center">{country.name}</span>
                    <span className="text-xs font-medium opacity-90 mt-0.5">{(country.adoptionLevel * 100).toFixed(0)}% Influence</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground">
                  {renderCountryTooltipContent(country)}
                </TooltipContent>
              </Tooltip>
            )
          ))}
        </TooltipProvider>

        {showInfluenceBubble && !zoomedCountry && (
          <Button
            variant="default"
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-16 h-16 shadow-2xl animate-pulse bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleCollect}
            aria-label="Collect Influence Points"
          >
            <Zap className="w-8 h-8" />
          </Button>
        )}
      </CardContent>

      {/* SubRegions View - Rendered on top */}
      {zoomedCountry && (
        <div className="absolute inset-0 p-4 pt-[70px] bg-background/50 backdrop-blur-md overflow-hidden flex justify-center items-center">
          <div className="relative w-full h-full max-w-3xl max-h-2xl"> {/* Container for relative positioning of subregions */}
            <TooltipProvider delayDuration={150}>
              {zoomedCountry.subRegions?.map((subRegion, index) => {
                const layoutConfig = SUB_REGION_LAYOUT_CONFIG[zoomedCountry.id];
                let positionStyle = { top: '50%', left: '50%'}; 
                if (layoutConfig && layoutConfig.offsets[index]) {
                  const scaleFactor = 1.8; // Adjusted scale factor for better spread in a constrained view
                  positionStyle = {
                    top: `${50 + parseFloat(layoutConfig.offsets[index].top) * scaleFactor}%`,
                    left: `${50 + parseFloat(layoutConfig.offsets[index].left) * scaleFactor}%`,
                  };
                } else { 
                    const angle = (index / (zoomedCountry.subRegions?.length || 1)) * 2 * Math.PI;
                    const radius = 25 + (index % 2 === 0 ? 0 : 5) ; // Percentage radius from center, slight variation
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
                          `absolute p-0 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-lg transition-all duration-300 hover:scale-110`,
                           getSubRegionColor(subRegion.adoptionLevel),
                           'text-foreground', 
                           'rounded-lg w-28 h-[70px] flex flex-col justify-center items-center' // Slightly smaller
                        )}
                        style={positionStyle}
                        aria-label={`View ${subRegion.name}`}
                      >
                        <span className="text-xs font-semibold block truncate w-full px-1 text-center">{subRegion.name}</span>
                        <span className="text-[10px] font-medium opacity-90 mt-0.5">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground">
                      {renderSubRegionTooltipContent(subRegion)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      )}
    </Card>
  );
}
