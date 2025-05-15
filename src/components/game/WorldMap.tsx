
'use client';

import type { Country, SubRegion, RivalMovement, ResistanceArchetype, RivalPresence } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, ChevronLeft, ShieldQuestion } from 'lucide-react';
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
const RIVAL_DOMINANCE_THRESHOLD = 0.2; // For region coloring
const MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP = 0.001; // 0.1%

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

  const getStrongestRivalInRegion = (rivalPresences: RivalPresence[]): RivalPresence | null => {
    if (!rivalPresences || rivalPresences.length === 0) return null;
    return rivalPresences.reduce((strongest, current) => 
      current.influenceLevel > strongest.influenceLevel ? current : strongest, 
      rivalPresences[0]
    );
  };
  
  const getRegionStyling = (
    adoptionLevel: number,
    isSelected: boolean,
    rivalPresences: RivalPresence[]
  ): { bgClass: string; borderClass: string; textClass: string; shadowClass: string } => {
    let bgClass = 'bg-muted/50 hover:bg-muted/60';
    let borderClass = 'border-border/50';
    let textClass = 'text-foreground'; // Default text color
    let shadowClass = 'shadow-md';

    const strongestRivalInRegion = getStrongestRivalInRegion(rivalPresences);
    const rivalDetails = strongestRivalInRegion ? getRivalById(strongestRivalInRegion.rivalId) : null;

    if (rivalDetails && strongestRivalInRegion && strongestRivalInRegion.influenceLevel > adoptionLevel && strongestRivalInRegion.influenceLevel > RIVAL_DOMINANCE_THRESHOLD) {
      // Rival is dominant
      bgClass = `bg-[${rivalDetails.color}]/60 hover:bg-[${rivalDetails.color}]/70`; // Stronger rival color
      borderClass = `border-[${rivalDetails.color}]/80`; // Prominent rival border
      textClass = 'text-white'; // Assuming rival colors are dark enough for white text
      shadowClass = `shadow-lg shadow-[${rivalDetails.color}]/50`;
    } else {
      // Player or neutral dominance
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
      if (rivalDetails && strongestRivalInRegion && strongestRivalInRegion.influenceLevel > adoptionLevel && strongestRivalInRegion.influenceLevel > RIVAL_DOMINANCE_THRESHOLD) {
        // If rival is dominant and selected, keep text white for contrast with rival bg
         textClass = 'text-white';
      } else if (adoptionLevel > 0) {
        // If player has influence and selected, use primary foreground
        textClass = 'text-primary-foreground';
      } else {
        // If neutral and selected, use accent foreground or a light color
        textClass = 'text-accent-foreground';
      }
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

  const renderRivalIcon = (rivalPresences: RivalPresence[]) => {
    const strongestRival = getStrongestRivalInRegion(rivalPresences);
    if (!strongestRival || strongestRival.influenceLevel < RIVAL_ICON_VISIBILITY_THRESHOLD) return null;
    
    const rivalDetails = getRivalById(strongestRival.rivalId);
    if (!rivalDetails) return null;
    
    const RivalIconComponent = rivalDetails.icon;
    return (
      <div
        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/40 backdrop-blur-sm shadow-md"
        title={`${rivalDetails.name} Influence: ${(strongestRival.influenceLevel * 100).toFixed(0)}%`}
      >
        <RivalIconComponent className="w-4 h-4" style={{ color: rivalDetails.color }} />
      </div>
    );
  };

  const formatResistanceArchetype = (archetype?: ResistanceArchetype | null): string => {
    if (!archetype) return 'Standard';
    return archetype.replace(/([A-Z])/g, ' $1').trim();
  };


  const renderSubRegionTooltipContent = (subRegion: SubRegion) => {
    return (
      <div className="p-2.5 space-y-1.5 text-sm w-64 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{subRegion.name}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="font-medium text-muted-foreground">Player Adoption:</span><span className="text-right font-semibold">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
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
        {subRegion.rivalPresences.length > 0 && subRegion.rivalPresences.some(rp => rp.influenceLevel >= MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) && (
          <div className="mt-2 pt-1.5 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Rival Influences:</p>
            {subRegion.rivalPresences.map(rp => {
              const rival = getRivalById(rp.rivalId);
              if (!rival || rp.influenceLevel < MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) return null;
              return (
                <div key={rp.rivalId} className="flex justify-between text-xs">
                  <span style={{color: rival.color}}>{rival.name}:</span>
                  <span style={{color: rival.color}} className="font-semibold">{(rp.influenceLevel * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCountryTooltipContent = (country: Country) => {
    return (
      <div className="p-2.5 space-y-1.5 text-sm w-64 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{country.name}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="font-medium text-muted-foreground">Player Adoption:</span><span className="text-right font-semibold">{(country.adoptionLevel * 100).toFixed(0)}%</span>
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
        {country.rivalPresences.length > 0 && !country.subRegions?.length && country.rivalPresences.some(rp => rp.influenceLevel >= MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) && (
          <div className="mt-2 pt-1.5 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Rival Influences:</p>
            {country.rivalPresences.map(rp => {
              const rival = getRivalById(rp.rivalId);
              if (!rival || rp.influenceLevel < MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) return null;
              return (
                <div key={rp.rivalId} className="flex justify-between text-xs">
                  <span style={{color: rival.color}}>{rival.name}:</span>
                  <span style={{color: rival.color}} className="font-semibold">{(rp.influenceLevel * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
        {country.subRegions && country.subRegions.length > 0 && (
          <p className="text-xs italic mt-1.5 text-accent">Click to explore regions</p>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full shadow-xl flex flex-col border-2 border-card overflow-hidden bg-muted/30">
      <CardHeader className="flex flex-row justify-between items-center z-10 bg-background/80 backdrop-blur-sm py-3 px-4">
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
        // When zoomed, the main container for countries is made less prominent
        zoomedCountry ? "opacity-30" : "opacity-100" 
      )}>
        <TooltipProvider delayDuration={150}>
          {/* Render countries only if not zoomed into a specific country */}
          {!zoomedCountry && countries.map((country) => {
            if (!countryPositions[country.id]) return null;
            const styling = getRegionStyling(country.adoptionLevel, selectedCountryId === country.id, country.rivalPresences);
            return (
              <Tooltip key={country.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      `absolute p-0 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all duration-300 hover:scale-105`,
                      styling.bgClass, styling.borderClass, styling.textClass, styling.shadowClass,
                      'rounded-xl w-32 h-20 flex flex-col justify-center items-center text-center' // Added text-center
                    )}
                    style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
                    onClick={() => handleCountryClick(country)}
                    aria-label={`Select ${country.name}`}
                  >
                    {renderRivalIcon(country.rivalPresences)}
                    <span className="text-sm font-bold block truncate w-full px-1">{country.name}</span>
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

      {/* This container is for displaying sub-regions when a country is zoomed */}
      {zoomedCountry && (
        <div className="absolute inset-0 p-4 pt-[calc(theme(spacing.14)_+_1rem)] bg-background/50 backdrop-blur-md overflow-hidden flex justify-center items-center z-20">
          {/* Adjusted pt to account for header height */}
          <div className="relative w-full h-full max-w-3xl max-h-2xl"> {/* Consider max-w/h for better layout control */}
            <TooltipProvider delayDuration={150}>
              {zoomedCountry.subRegions?.map((subRegion, index) => {
                const layoutConfig = SUB_REGION_LAYOUT_CONFIG[zoomedCountry.id];
                let positionStyle = { top: '50%', left: '50%' }; // Default fallback
                if (layoutConfig && layoutConfig.offsets[index]) {
                  const scaleFactor = 1.8; // Adjust scale for zoomed view spread
                  positionStyle = {
                    top: `${50 + parseFloat(layoutConfig.offsets[index].top) * scaleFactor}%`,
                    left: `${50 + parseFloat(layoutConfig.offsets[index].left) * scaleFactor}%`,
                  };
                } else {
                  // Fallback circular layout if specific config is missing
                  const angle = (index / (zoomedCountry.subRegions?.length || 1)) * 2 * Math.PI;
                  const radiusBase = zoomedCountry.subRegions && zoomedCountry.subRegions.length > 4 ? 30 : 25; // Slightly larger radius for more items
                  const radiusVariation = (index % 3) * 4; // Stagger radius a bit
                  const radius = radiusBase + radiusVariation;
                  positionStyle = {
                    top: `${50 + radius * Math.sin(angle)}%`,
                    left: `${50 + radius * Math.cos(angle)}%`,
                  };
                }

                const styling = getRegionStyling(subRegion.adoptionLevel, false, subRegion.rivalPresences);
                return (
                  <Tooltip key={subRegion.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          `absolute p-0 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-lg transition-all duration-300 hover:scale-110`,
                          styling.bgClass, styling.borderClass, styling.textClass, styling.shadowClass,
                          // Slightly different styling for sub-regions if needed
                          'rounded-lg w-28 h-[70px] flex flex-col justify-center items-center text-center border-accent/70' // Added text-center
                        )}
                        style={positionStyle}
                        aria-label={`View ${subRegion.name}`}
                      >
                        {renderRivalIcon(subRegion.rivalPresences)}
                        <span className="text-xs font-semibold block truncate w-full px-1">{subRegion.name}</span>
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

