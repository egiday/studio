
'use client';

import type { Country, SubRegion, RivalMovement, ResistanceArchetype, RivalPresence } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, ChevronLeft, ShieldQuestion, Users, ShieldAlert, Wifi, BookOpen, Briefcase, Eye, Newspaper } from 'lucide-react';
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
      bgClass = `bg-[${rivalDetails.color}]/60 hover:bg-[${rivalDetails.color}]/70`;
      borderClass = `border-[${rivalDetails.color}]/80`;
      textClass = 'text-white'; // Assuming rival colors are dark enough for white text
      shadowClass = `shadow-lg shadow-[${rivalDetails.color}]/50`;
    } else {
      // Player or neutral dominance
      if (adoptionLevel > 0.8) { bgClass = 'bg-primary/90 hover:bg-primary'; borderClass = 'border-primary/70'; textClass = 'text-primary-foreground'; shadowClass = `shadow-xl shadow-primary/50`; }
      else if (adoptionLevel > 0.6) { bgClass = 'bg-primary/70 hover:bg-primary/80'; borderClass = 'border-primary/60'; textClass = 'text-primary-foreground'; shadowClass = `shadow-lg shadow-primary/40`; }
      else if (adoptionLevel > 0.4) { bgClass = 'bg-primary/50 hover:bg-primary/60'; borderClass = 'border-primary/50'; textClass = 'text-primary-foreground'; shadowClass = `shadow-md shadow-primary/30`; }
      else if (adoptionLevel > 0.2) { bgClass = 'bg-secondary/70 hover:bg-secondary/80'; borderClass = 'border-secondary/60'; textClass = 'text-secondary-foreground'; shadowClass = `shadow-lg shadow-secondary/30`; }
      else if (adoptionLevel > 0.05) { bgClass = 'bg-secondary/40 hover:bg-secondary/50'; borderClass = 'border-secondary/40'; textClass = 'text-secondary-foreground'; shadowClass = `shadow-md shadow-secondary/20`; }
      else if (adoptionLevel > 0) { bgClass = 'bg-secondary/20 hover:bg-secondary/30'; borderClass = 'border-secondary/30'; shadowClass = `shadow-sm shadow-secondary/10`; }
    }
    
    if (isSelected) {
      borderClass = 'border-accent ring-4 ring-offset-2 ring-offset-background ring-accent';
      shadowClass = `shadow-xl shadow-accent/50`;
      if (rivalDetails && strongestRivalInRegion && strongestRivalInRegion.influenceLevel > adoptionLevel && strongestRivalInRegion.influenceLevel > RIVAL_DOMINANCE_THRESHOLD) {
         textClass = 'text-white';
      } else if (adoptionLevel > 0) {
        textClass = 'text-primary-foreground';
      } else {
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
    // Add spaces before capital letters, then trim
    return archetype.replace(/([A-Z])/g, ' $1').trim();
  };


  const renderSubRegionTooltipContent = (subRegion: SubRegion, parentCountryName: string) => {
    return (
      <div className="p-2.5 space-y-2 text-sm w-72 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{subRegion.name}</p>
        <p className="text-xs text-muted-foreground -mt-1.5 mb-2">Part of {parentCountryName}</p>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Player Adoption:</span><span className="font-semibold">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span></div>

          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Resistance:</span><span className="font-semibold">{(subRegion.resistanceLevel * 100).toFixed(0)}%</span></div>

          {subRegion.resistanceArchetype && (
            <>
              <ShieldQuestion className="w-4 h-4 text-destructive" />
              <div className="flex justify-between"><span>Type:</span><span className="font-semibold">{formatResistanceArchetype(subRegion.resistanceArchetype)}</span></div>
            </>
          )}

          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Economy:</span><span className="font-semibold">{(subRegion.economicDevelopment * 100).toFixed(0)}</span></div>
          
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Openness:</span><span className="font-semibold">{(subRegion.culturalOpenness * 100).toFixed(0)}</span></div>

          {subRegion.internetPenetration !== undefined && (
            <>
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <div className="flex justify-between"><span>Internet:</span><span className="font-semibold">{(subRegion.internetPenetration * 100).toFixed(0)}%</span></div>
            </>
          )}
          {subRegion.educationLevel !== undefined && (
            <>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <div className="flex justify-between"><span>Education:</span><span className="font-semibold">{(subRegion.educationLevel * 100).toFixed(0)}%</span></div>
            </>
          )}
        </div>

        {subRegion.rivalPresences.length > 0 && subRegion.rivalPresences.some(rp => rp.influenceLevel >= MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) && (
          <div className="mt-2.5 pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Rival Influences:</p>
            {subRegion.rivalPresences.map(rp => {
              const rival = getRivalById(rp.rivalId);
              if (!rival || rp.influenceLevel < MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) return null;
              return (
                <div key={rp.rivalId} className="flex justify-between text-xs items-center mb-0.5">
                  <div className="flex items-center">
                    <rival.icon className="w-3.5 h-3.5 mr-1.5" style={{color: rival.color}} />
                    <span style={{color: rival.color}}>{rival.name}:</span>
                  </div>
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
      <div className="p-2.5 space-y-2 text-sm w-72 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{country.name}</p>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Player Adoption:</span><span className="font-semibold">{(country.adoptionLevel * 100).toFixed(0)}%</span></div>

          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Resistance:</span><span className="font-semibold">{(country.resistanceLevel * 100).toFixed(0)}%</span></div>

          {country.resistanceArchetype && !country.subRegions?.length && (
             <>
              <ShieldQuestion className="w-4 h-4 text-destructive" />
              <div className="flex justify-between"><span>Type:</span><span className="font-semibold">{formatResistanceArchetype(country.resistanceArchetype)}</span></div>
            </>
          )}
          
          <Wifi className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Internet:</span><span className="font-semibold">{(country.internetPenetration * 100).toFixed(0)}%</span></div>

          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Education:</span><span className="font-semibold">{(country.educationLevel * 100).toFixed(0)}%</span></div>
          
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Economy:</span><span className="font-semibold">{(country.economicDevelopment * 100).toFixed(0)}%</span></div>
          
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Openness:</span><span className="font-semibold">{(country.culturalOpenness * 100).toFixed(0)}%</span></div>
          
          <Newspaper className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Media Free:</span><span className="font-semibold">{(country.mediaFreedom * 100).toFixed(0)}%</span></div>
        </div>

        {country.rivalPresences.length > 0 && !country.subRegions?.length && country.rivalPresences.some(rp => rp.influenceLevel >= MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) && (
          <div className="mt-2.5 pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Rival Influences:</p>
            {country.rivalPresences.map(rp => {
              const rival = getRivalById(rp.rivalId);
              if (!rival || rp.influenceLevel < MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) return null;
              return (
                <div key={rp.rivalId} className="flex justify-between text-xs items-center mb-0.5">
                   <div className="flex items-center">
                    <rival.icon className="w-3.5 h-3.5 mr-1.5" style={{color: rival.color}} />
                    <span style={{color: rival.color}}>{rival.name}:</span>
                  </div>
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
        zoomedCountry ? "opacity-30" : "opacity-100" 
      )}>
        <TooltipProvider delayDuration={150}>
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
                      'rounded-xl w-32 h-20 flex flex-col justify-center items-center text-center'
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

      {zoomedCountry && (
        <div className="absolute inset-0 p-4 pt-[calc(theme(spacing.14)_+_1rem)] bg-background/50 backdrop-blur-md overflow-hidden flex justify-center items-center z-20">
          <div className="relative w-full h-full max-w-3xl max-h-2xl">
            <TooltipProvider delayDuration={150}>
              {zoomedCountry.subRegions?.map((subRegion, index) => {
                const layoutConfig = SUB_REGION_LAYOUT_CONFIG[zoomedCountry.id];
                let positionStyle = { top: '50%', left: '50%' }; 
                if (layoutConfig && layoutConfig.offsets[index]) {
                  const scaleFactor = 2.0; // Increased scale factor for more spread
                  positionStyle = {
                    top: `${50 + parseFloat(layoutConfig.offsets[index].top) * scaleFactor}%`,
                    left: `${50 + parseFloat(layoutConfig.offsets[index].left) * scaleFactor}%`,
                  };
                } else {
                  const angle = (index / (zoomedCountry.subRegions?.length || 1)) * 2 * Math.PI;
                  const numSubRegions = zoomedCountry.subRegions?.length || 1;
                  const radiusBase = numSubRegions > 6 ? 35 : numSubRegions > 4 ? 30 : 25; // Adjust radius based on number of items
                  const radiusVariation = (index % 3) * (numSubRegions > 4 ? 3 : 5); // Stagger radius a bit more
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
                          'rounded-lg w-28 h-[70px] flex flex-col justify-center items-center text-center border-accent/70'
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
                      {renderSubRegionTooltipContent(subRegion, zoomedCountry.name)}
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

