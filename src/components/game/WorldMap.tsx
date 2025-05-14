
'use client';

import type { Country, SubRegion, RivalMovement, ResistanceArchetype } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, ChevronLeft, ShieldQuestion } from 'lucide-react'; // Added ShieldQuestion
import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { subRegionPositions as SUB_REGION_LAYOUT_CONFIG, countryPositions } from '@/config/gameData';

const RIVAL_ICON_VISIBILITY_THRESHOLD = 0.15;
const RIVAL_DOMINANCE_THRESHOLD = 0.2;

interface WorldMapProps {
  countries: Country[];
  rivalMovements: RivalMovement[];
  onCountrySelect: (countryId: string) => void;
  onCollectInfluence: (points: number) => void;
  selectedCountryId?: string;
}

export function WorldMap({ countries, rivalMovements, onCountrySelect, onCollectInfluence, selectedCountryId }: WorldMapProps) {
  const [showInfluenceBubble, setShowInfluenceBubble] = useState(true);
  const [zoomedCountry, setZoomedCountry] = useState<Country | null>(null);

  const handleCollect = () => {
    const points = Math.floor(Math.random() * 5) + 1;
    onCollectInfluence(points);
    setShowInfluenceBubble(false);
    setTimeout(() => setShowInfluenceBubble(true), 10000);
  };

  const getRivalById = (rivalId: string): RivalMovement | undefined => rivalMovements.find(r => r.id === rivalId);

  const getRegionStyling = (
    adoptionLevel: number,
    isSelected: boolean,
    rivalPresence: Country['rivalPresence'] | SubRegion['rivalPresence']
  ): { bgClass: string; borderClass: string; textClass: string; shadowClass: string } => {
    let bgClass = 'bg-muted/50 hover:bg-muted/60';
    let borderClass = 'border-border/50';
    let textClass = 'text-foreground'; // Changed to foreground for better contrast with new theme
    let shadowClass = 'shadow-md';

    const rival = rivalPresence ? getRivalById(rivalPresence.rivalId) : null;

    if (rival && rivalPresence && rivalPresence.influenceLevel > adoptionLevel && rivalPresence.influenceLevel > RIVAL_DOMINANCE_THRESHOLD) {
      bgClass = `bg-[${rival.color}]/30 hover:bg-[${rival.color}]/40`;
      borderClass = `border-[${rival.color}]`;
      textClass = 'text-white'; // Assuming rival colors are dark enough
      shadowClass = `shadow-lg shadow-[${rival.color}]/40`;
    } else {
      // Player is dominant or no significant rival
      if (adoptionLevel > 0.8) { bgClass = 'bg-primary/90 hover:bg-primary'; borderClass = 'border-primary/70'; textClass = 'text-primary-foreground'; shadowClass = `shadow-xl shadow-primary/50`; }
      else if (adoptionLevel > 0.6) { bgClass = 'bg-primary/70 hover:bg-primary/80'; borderClass = 'border-primary/60'; textClass = 'text-primary-foreground'; shadowClass = `shadow-lg shadow-primary/30`; }
      else if (adoptionLevel > 0.4) { bgClass = 'bg-primary/50 hover:bg-primary/60'; borderClass = 'border-primary/50'; textClass = 'text-primary-foreground'; shadowClass = `shadow-md shadow-primary/20`; }
      else if (adoptionLevel > 0.2) { bgClass = 'bg-secondary/70 hover:bg-secondary/80'; borderClass = 'border-secondary/60'; textClass = 'text-secondary-foreground'; shadowClass = `shadow-lg shadow-secondary/30`; }
      else if (adoptionLevel > 0.05) { bgClass = 'bg-secondary/40 hover:bg-secondary/50'; borderClass = 'border-secondary/40'; textClass = 'text-secondary-foreground'; shadowClass = `shadow-md shadow-secondary/20`; }
      else if (adoptionLevel > 0) { bgClass = 'bg-secondary/20 hover:bg-secondary/30'; borderClass = 'border-secondary/30'; shadowClass = `shadow-sm shadow-secondary/10`; }
    }
    
    if (isSelected) {
      borderClass = 'border-accent ring-4 ring-offset-2 ring-offset-background ring-accent';
      shadowClass = `shadow-xl shadow-accent/50`;
    }

    return { bgClass, borderClass, textClass, shadowClass };
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

  const renderRivalIcon = (rivalPresence: Country['rivalPresence'] | SubRegion['rivalPresence']) => {
    if (!rivalPresence || rivalPresence.influenceLevel < RIVAL_ICON_VISIBILITY_THRESHOLD) return null;
    const rival = getRivalById(rivalPresence.rivalId);
    if (!rival) return null;
    
    const RivalIconComponent = rival.icon;
    return (
      <div
        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/30 backdrop-blur-sm"
        title={`${rival.name} Influence: ${(rivalPresence.influenceLevel * 100).toFixed(0)}%`}
      >
        <RivalIconComponent className="w-3 h-3" style={{ color: rival.color }} />
      </div>
    );
  };

  const formatResistanceArchetype = (archetype?: ResistanceArchetype | null): string => {
    if (!archetype) return 'Standard';
    return archetype.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capitals
  };


  const renderSubRegionTooltipContent = (subRegion: SubRegion) => {
    const rival = subRegion.rivalPresence ? getRivalById(subRegion.rivalPresence.rivalId) : null;
    return (
      <div className="p-2.5 space-y-1.5 text-sm w-60 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{subRegion.name}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="font-medium text-muted-foreground">Player Adoption:</span><span className="text-right font-semibold">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
          {rival && subRegion.rivalPresence && subRegion.rivalPresence.influenceLevel > 0.005 && (
            <>
              <span className="font-medium" style={{color: rival.color || 'inherit'}}>{rival.name}:</span>
              <span className="text-right font-semibold" style={{color: rival.color || 'inherit'}}>{(subRegion.rivalPresence.influenceLevel * 100).toFixed(0)}%</span>
            </>
          )}
          <span className="font-medium text-muted-foreground">Resistance:</span><span className="text-right font-semibold">{(subRegion.resistanceLevel * 100).toFixed(0)}%</span>
          {subRegion.resistanceArchetype && (
            <>
              <span className="font-medium text-muted-foreground flex items-center">
                <ShieldQuestion className="w-3.5 h-3.5 mr-1 text-destructive"/> Type:
              </span>
              <span className="text-right font-semibold">{formatResistanceArchetype(subRegion.resistanceArchetype)}</span>
            </>
          )}
          <span className="font-medium text-muted-foreground">Economy:</span><span className="text-right">{(subRegion.economicDevelopment * 100).toFixed(0)}%</span>
          <span className="font-medium text-muted-foreground">Openness:</span><span className="text-right">{(subRegion.culturalOpenness * 100).toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  const renderCountryTooltipContent = (country: Country) => {
     const rival = country.rivalPresence ? getRivalById(country.rivalPresence.rivalId) : null;
    return (
      <div className="p-2.5 space-y-1.5 text-sm w-60 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{country.name}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="font-medium text-muted-foreground">Player Adoption:</span><span className="text-right font-semibold">{(country.adoptionLevel * 100).toFixed(0)}%</span>
           {rival && country.rivalPresence && !country.subRegions?.length && country.rivalPresence.influenceLevel > 0.005 && (
            <>
              <span className="font-medium" style={{color: rival.color || 'inherit'}}>{rival.name}:</span>
              <span className="text-right font-semibold" style={{color: rival.color || 'inherit'}}>{(country.rivalPresence.influenceLevel * 100).toFixed(0)}%</span>
            </>
          )}
          <span className="font-medium text-muted-foreground">Resistance:</span><span className="text-right font-semibold">{(country.resistanceLevel * 100).toFixed(0)}%</span>
          {country.resistanceArchetype && !country.subRegions?.length && (
             <>
              <span className="font-medium text-muted-foreground flex items-center">
                <ShieldQuestion className="w-3.5 h-3.5 mr-1 text-destructive"/> Type:
              </span>
              <span className="text-right font-semibold">{formatResistanceArchetype(country.resistanceArchetype)}</span>
            </>
          )}
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
  };

  return (
    <Card className="h-full shadow-xl flex flex-col border-2 border-card overflow-hidden bg-muted/30">
      <CardHeader className="flex flex-row justify-between items-center z-10 bg-background/80 backdrop-blur-sm">
        <CardTitle className="flex items-center text-lg">
          <Globe className="mr-2 h-5 w-5 text-primary" />
          {zoomedCountry ? `${zoomedCountry.name} - Territories` : 'Celestial Sphere of Influence'}
        </CardTitle>
        {zoomedCountry && (
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> Sphere View
          </Button>
        )}
      </CardHeader>
      <CardContent className={cn(
        "flex-grow relative overflow-hidden p-4 transition-opacity duration-300",
        zoomedCountry ? "opacity-30" : "opacity-100" // This dims the main country buttons container
      )}>
        <TooltipProvider delayDuration={150}>
          {!zoomedCountry && countries.map((country) => {
            if (!countryPositions[country.id]) return null;
            const styling = getRegionStyling(country.adoptionLevel, selectedCountryId === country.id, country.rivalPresence);
            return (
              <Tooltip key={country.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      `absolute p-0 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all duration-300 hover:scale-105`,
                      styling.bgClass, styling.borderClass, styling.textClass, styling.shadowClass,
                      'rounded-xl w-32 h-20 flex flex-col justify-center items-center' // Fixed size for countries
                    )}
                    style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
                    onClick={() => handleCountryClick(country)}
                    aria-label={`Select ${country.name}`}
                  >
                    {renderRivalIcon(country.rivalPresence)}
                    <span className="text-sm font-bold block truncate w-full px-1 text-center">{country.name}</span>
                    <span className="text-xs font-medium opacity-90 mt-0.5">{(country.adoptionLevel * 100).toFixed(0)}% Influence</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground">
                  {renderCountryTooltipContent(country)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {showInfluenceBubble && !zoomedCountry && (
          <Button
            variant="default"
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-24 h-24 shadow-2xl animate-pulse bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleCollect}
            aria-label="Collect Influence Points"
          >
            <Zap className="w-12 h-12" />
          </Button>
        )}
      </CardContent>

      {/* Container for zoomed-in sub-regions. This stays fully opaque. */}
      {zoomedCountry && (
        <div className="absolute inset-0 p-4 pt-[70px] bg-background/50 backdrop-blur-md overflow-hidden flex justify-center items-center">
          <div className="relative w-full h-full max-w-3xl max-h-2xl">
            <TooltipProvider delayDuration={150}>
              {zoomedCountry.subRegions?.map((subRegion, index) => {
                const layoutConfig = SUB_REGION_LAYOUT_CONFIG[zoomedCountry.id];
                let positionStyle = { top: '50%', left: '50%' };
                if (layoutConfig && layoutConfig.offsets[index]) {
                  const scaleFactor = 1.8;
                  positionStyle = {
                    top: `${50 + parseFloat(layoutConfig.offsets[index].top) * scaleFactor}%`,
                    left: `${50 + parseFloat(layoutConfig.offsets[index].left) * scaleFactor}%`,
                  };
                } else {
                  const angle = (index / (zoomedCountry.subRegions?.length || 1)) * 2 * Math.PI;
                  const radiusBase = 25;
                  const radiusVariation = (index % 3) * 4;
                  const radius = radiusBase + radiusVariation;
                  positionStyle = {
                    top: `${50 + radius * Math.sin(angle)}%`,
                    left: `${50 + radius * Math.cos(angle)}%`,
                  };
                }

                const styling = getRegionStyling(subRegion.adoptionLevel, false, subRegion.rivalPresence); // isSelected is false for subregions
                return (
                  <Tooltip key={subRegion.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          `absolute p-0 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-lg transition-all duration-300 hover:scale-110`,
                          styling.bgClass, styling.borderClass, styling.textClass, styling.shadowClass,
                          'rounded-lg w-28 h-[70px] flex flex-col justify-center items-center' // Fixed size for sub-regions
                        )}
                        style={positionStyle}
                        aria-label={`View ${subRegion.name}`}
                      >
                        {renderRivalIcon(subRegion.rivalPresence)}
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
