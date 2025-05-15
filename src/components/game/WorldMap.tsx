
'use client';

import type { Country, SubRegion, RivalMovement, ResistanceArchetype, RivalPresence } from '@/types'; // Country is System, SubRegion is Planet
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, ChevronLeft, ShieldQuestion, Users, ShieldAlert, Wifi, BookOpen, Briefcase, Eye, Newspaper, SunMedium, Orbit as PlanetIcon, Rocket } from 'lucide-react'; // Changed Planet to Orbit
import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { systemPositions, planetPositions } from '@/config/gameData'; // Renamed from countryPositions

const RIVAL_ICON_VISIBILITY_THRESHOLD = 0.15;
const RIVAL_DOMINANCE_THRESHOLD = 0.2;
const MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP = 0.001;

interface WorldMapProps {
  countries: Country[]; // Thematic: Solar Systems
  rivalMovements: RivalMovement[];
  onCountrySelect: (countryId: string) => void; // Thematic: onSystemSelect
  onCollectInfluence: (points: number) => void;
  selectedCountryId?: string; // Thematic: selectedSystemId
}

export function WorldMap({ countries: systems, rivalMovements, onCountrySelect: onSystemSelect, onCollectInfluence, selectedCountryId: selectedSystemId }: WorldMapProps) {
  const [showInfluenceBubble, setShowInfluenceBubble] = useState(true);
  const [zoomedCountry, setZoomedCountry] = useState<Country | null>(null); // Thematic: zoomedSystem

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
    rivalPresences: RivalPresence[],
    isPlanet: boolean = false
  ): { bgClass: string; borderClass: string; textClass: string; shadowClass: string; shapeClass: string } => {
    let bgClass = 'bg-muted/50 hover:bg-muted/70';
    let borderClass = 'border-border/50';
    let textClass = 'text-foreground';
    let shadowClass = 'shadow-md';
    let shapeClass = isPlanet ? 'rounded-full' : 'rounded-full';

    const strongestRivalInRegion = getStrongestRivalInRegion(rivalPresences);
    const rivalDetails = strongestRivalInRegion ? getRivalById(strongestRivalInRegion.rivalId) : null;

    if (rivalDetails && strongestRivalInRegion && strongestRivalInRegion.influenceLevel > adoptionLevel && strongestRivalInRegion.influenceLevel > RIVAL_DOMINANCE_THRESHOLD) {
      bgClass = `bg-[${rivalDetails.color}]/60 hover:bg-[${rivalDetails.color}]/75`;
      borderClass = `border-[${rivalDetails.color}]`;
      textClass = 'text-white'; 
      shadowClass = `shadow-lg shadow-[${rivalDetails.color}]/50`;
    } else {
      // Player influence colors (nebula/energy theme)
      if (adoptionLevel > 0.8) { bgClass = 'bg-primary/90 hover:bg-primary'; borderClass = 'border-primary/70'; textClass = 'text-primary-foreground'; shadowClass = `shadow-xl shadow-primary/50`; }
      else if (adoptionLevel > 0.6) { bgClass = 'bg-primary/70 hover:bg-primary/80'; borderClass = 'border-primary/60'; textClass = 'text-primary-foreground'; shadowClass = `shadow-lg shadow-primary/40`; }
      else if (adoptionLevel > 0.4) { bgClass = 'bg-primary/50 hover:bg-primary/60'; borderClass = 'border-primary/50'; textClass = 'text-primary-foreground'; shadowClass = `shadow-md shadow-primary/30`; }
      else if (adoptionLevel > 0.2) { bgClass = 'bg-secondary/70 hover:bg-secondary/80'; borderClass = 'border-secondary/60'; textClass = 'text-secondary-foreground'; shadowClass = `shadow-lg shadow-secondary/30`; }
      else if (adoptionLevel > 0.05) { bgClass = 'bg-secondary/40 hover:bg-secondary/50'; borderClass = 'border-secondary/40'; textClass = 'text-secondary-foreground'; shadowClass = `shadow-md shadow-secondary/20`; }
      else if (adoptionLevel > 0) { bgClass = 'bg-secondary/20 hover:bg-secondary/30'; borderClass = 'border-secondary/30'; shadowClass = `shadow-sm shadow-secondary/10`; textClass = 'text-muted-foreground'; }
      else { bgClass = 'bg-muted/40 hover:bg-muted/60 border-border/30'; textClass = 'text-muted-foreground'; shadowClass = 'shadow-sm';}
    }
    
    if (isSelected) {
      borderClass = 'border-accent ring-4 ring-offset-background ring-offset-accent ring-accent/70';
      shadowClass = `shadow-xl shadow-accent/50`;
      if (rivalDetails && strongestRivalInRegion && strongestRivalInRegion.influenceLevel > adoptionLevel && strongestRivalInRegion.influenceLevel > RIVAL_DOMINANCE_THRESHOLD) {
         textClass = 'text-white';
      } else if (adoptionLevel > 0) {
        textClass = 'text-primary-foreground';
      } else {
        textClass = 'text-accent-foreground';
      }
    }
    return { bgClass, borderClass, textClass, shadowClass, shapeClass };
  };

  const handleSystemClick = (system: Country) => {
    onSystemSelect(system.id);
    if (system.subRegions && system.subRegions.length > 0) {
      setZoomedCountry(system);
    } else {
      setZoomedCountry(null); 
    }
  };

  const handleZoomOut = () => {
    setZoomedCountry(null);
  };

  const renderRivalIconDisplay = (rivalPresences: RivalPresence[]) => { 
    const strongestRival = getStrongestRivalInRegion(rivalPresences);
    if (!strongestRival || strongestRival.influenceLevel < RIVAL_ICON_VISIBILITY_THRESHOLD) return null;
    
    const rivalDetails = getRivalById(strongestRival.rivalId);
    if (!rivalDetails) return null;
    
    const RivalIconComponent = rivalDetails.icon;
    return (
      <div
        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 backdrop-blur-sm shadow-md"
        title={`${rivalDetails.name} Influence: ${(strongestRival.influenceLevel * 100).toFixed(0)}%`}
      >
        <RivalIconComponent className="w-4 h-4" style={{ color: rivalDetails.color }} />
      </div>
    );
  };

  const formatResistanceArchetype = (archetype?: ResistanceArchetype | null): string => {
    if (!archetype) return 'Standard Galactic';
    return archetype.replace(/([A-Z])/g, ' $1').trim().replace('Guardians', 'Conservators').replace('Rebels', 'Syndicate').replace('Suppressors', 'Enforcers');
  };

  const renderPlanetTooltipContent = (planet: SubRegion, parentSystemName: string) => {
    return (
      <div className="p-2.5 space-y-2 text-sm w-72 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary flex items-center"><PlanetIcon className="w-5 h-5 mr-2" />{planet.name}</p>
        <p className="text-xs text-muted-foreground -mt-1.5 mb-2">Planet in the {parentSystemName}</p>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Player Adoption:</span><span className="font-semibold">{(planet.adoptionLevel * 100).toFixed(0)}%</span></div>

          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Resistance:</span><span className="font-semibold">{(planet.resistanceLevel * 100).toFixed(0)}%</span></div>

          {planet.resistanceArchetype && (
            <>
              <ShieldQuestion className="w-4 h-4 text-destructive" />
              <div className="flex justify-between"><span>Type:</span><span className="font-semibold">{formatResistanceArchetype(planet.resistanceArchetype)}</span></div>
            </>
          )}

          <Briefcase className="w-4 h-4 text-muted-foreground" /> 
          <div className="flex justify-between"><span>Resource Output:</span><span className="font-semibold">{(planet.economicDevelopment * 100).toFixed(0)}</span></div>
          
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Xeno-Acceptance:</span><span className="font-semibold">{(planet.culturalOpenness * 100).toFixed(0)}</span></div>

          {planet.internetPenetration !== undefined && (
            <>
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <div className="flex justify-between"><span>Hypernet Access:</span><span className="font-semibold">{(planet.internetPenetration * 100).toFixed(0)}%</span></div>
            </>
          )}
          {planet.educationLevel !== undefined && (
            <>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <div className="flex justify-between"><span>Tech Literacy:</span><span className="font-semibold">{(planet.educationLevel * 100).toFixed(0)}%</span></div>
            </>
          )}
        </div>

        {planet.rivalPresences.length > 0 && planet.rivalPresences.some(rp => rp.influenceLevel >= MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) && (
          <div className="mt-2.5 pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Rival Faction Influences:</p>
            {planet.rivalPresences.map(rp => {
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

  const renderSystemTooltipContent = (system: Country) => {
    return (
      <div className="p-2.5 space-y-2 text-sm w-72 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary flex items-center"><SunMedium className="w-5 h-5 mr-2" />{system.name}</p>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Avg. Player Adoption:</span><span className="font-semibold">{(system.adoptionLevel * 100).toFixed(0)}%</span></div>

          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Avg. Resistance:</span><span className="font-semibold">{(system.resistanceLevel * 100).toFixed(0)}%</span></div>

          {system.resistanceArchetype && !system.subRegions?.length && (
             <>
              <ShieldQuestion className="w-4 h-4 text-destructive" />
              <div className="flex justify-between"><span>Type:</span><span className="font-semibold">{formatResistanceArchetype(system.resistanceArchetype)}</span></div>
            </>
          )}
          
          <Wifi className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Avg. Hypernet Access:</span><span className="font-semibold">{(system.internetPenetration * 100).toFixed(0)}%</span></div>

          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Avg. Tech Literacy:</span><span className="font-semibold">{(system.educationLevel * 100).toFixed(0)}%</span></div>
          
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Avg. Resource Output:</span><span className="font-semibold">{(system.economicDevelopment * 100).toFixed(0)}%</span></div>
          
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Avg. Xeno-Acceptance:</span><span className="font-semibold">{(system.culturalOpenness * 100).toFixed(0)}%</span></div>
          
          <Newspaper className="w-4 h-4 text-muted-foreground" />
          <div className="flex justify-between"><span>Avg. Info-Flow Freedom:</span><span className="font-semibold">{(system.mediaFreedom * 100).toFixed(0)}%</span></div>
        </div>

        {system.rivalPresences.length > 0 && !system.subRegions?.length && system.rivalPresences.some(rp => rp.influenceLevel >= MIN_RIVAL_INFLUENCE_TO_DISPLAY_IN_TOOLTIP) && (
          <div className="mt-2.5 pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Rival Faction Influences:</p>
            {system.rivalPresences.map(rp => {
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
        {system.subRegions && system.subRegions.length > 0 && (
          <p className="text-xs italic mt-1.5 text-accent">Click to scan planets</p>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full shadow-xl flex flex-col border-2 border-card overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-center z-30 bg-background/80 backdrop-blur-sm py-3 px-4">
        <CardTitle className="flex items-center text-lg">
          <Globe className="mr-2 h-5 w-5 text-primary" />
          {zoomedCountry ? `${zoomedCountry.name} - Planetary Scan` : 'Galactic Influence Monitor'}
        </CardTitle>
        {zoomedCountry && (
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> Galaxy View
          </Button>
        )}
      </CardHeader>
      <CardContent className={cn(
        "flex-grow relative overflow-hidden p-4 transition-opacity duration-300",
        zoomedCountry ? "opacity-30 pointer-events-none" : "opacity-100" 
      )}>
        <div className="starry-sky-bg">
          <div className="stars"></div>
          <div className="stars stars2"></div>
          <div className="stars stars3"></div>
        </div>
        <TooltipProvider delayDuration={150}>
          {systems.map((system) => { 
            if (!systemPositions[system.id]) return null;
            const styling = getRegionStyling(system.adoptionLevel, selectedSystemId === system.id, system.rivalPresences, false);
            return (
              <Tooltip key={system.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      `absolute p-0 transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all duration-300 hover:scale-105 flex flex-col justify-center items-center text-center z-10`,
                      styling.bgClass, styling.borderClass, styling.textClass, styling.shadowClass, styling.shapeClass,
                      'w-24 h-24 md:w-28 md:h-28' 
                    )}
                    style={{ top: systemPositions[system.id].top, left: systemPositions[system.id].left }}
                    onClick={() => handleSystemClick(system)}
                    aria-label={`Select ${system.name}`}
                  >
                    {renderRivalIconDisplay(system.rivalPresences)}
                    <SunMedium className="w-5 h-5 mb-1 opacity-70" />
                    <span className="text-xs font-bold block truncate w-full px-1">{system.name}</span>
                    <span className="text-[10px] font-medium opacity-90 mt-0.5">{(system.adoptionLevel * 100).toFixed(0)}% Influence</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground">
                  {renderSystemTooltipContent(system)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {showInfluenceBubble && !zoomedCountry && (
          <Button
            variant="default"
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-28 h-28 shadow-2xl animate-pulse bg-accent hover:bg-accent/90 text-accent-foreground z-10 flex flex-col"
            onClick={handleCollect}
            aria-label="Collect Cosmic Energy"
          >
            <Zap className="w-10 h-10" />
            <span className="text-xs mt-1">Collect Energy</span>
          </Button>
        )}
      </CardContent>

      {zoomedCountry && (
        <div className="absolute inset-0 p-4 pt-[calc(theme(spacing.14)_+_1rem)] bg-background/50 backdrop-blur-md overflow-hidden flex justify-center items-center z-20">
          <div className="relative w-full h-full max-w-3xl max-h-2xl">
            <TooltipProvider delayDuration={150}>
              {zoomedCountry.subRegions?.map((planet, index) => { 
                const layoutConfig = planetPositions[zoomedCountry.id];
                let positionStyle = { top: '50%', left: '50%' }; 
                if (layoutConfig && layoutConfig.offsets[index]) {
                  const scaleFactor = 2.0; 
                  positionStyle = {
                    top: `${50 + parseFloat(layoutConfig.offsets[index].top) * scaleFactor}%`,
                    left: `${50 + parseFloat(layoutConfig.offsets[index].left) * scaleFactor}%`,
                  };
                } else {
                  const angle = (index / (zoomedCountry.subRegions?.length || 1)) * 2 * Math.PI;
                  const numPlanets = zoomedCountry.subRegions?.length || 1;
                  const radiusBase = numPlanets > 6 ? 35 : numPlanets > 4 ? 30 : 25; 
                  const radiusVariation = (index % 3) * (numPlanets > 4 ? 3 : 5); 
                  const radius = radiusBase + radiusVariation;
                  positionStyle = {
                    top: `${50 + radius * Math.sin(angle)}%`,
                    left: `${50 + radius * Math.cos(angle)}%`,
                  };
                }

                const styling = getRegionStyling(planet.adoptionLevel, false, planet.rivalPresences, true); 
                return (
                  <Tooltip key={planet.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          `absolute p-0 transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-lg transition-all duration-300 hover:scale-110 flex flex-col justify-center items-center text-center z-10`,
                          styling.bgClass, styling.borderClass, styling.textClass, styling.shadowClass, styling.shapeClass,
                          'w-20 h-20 md:w-24 md:h-24 border-accent/70' 
                        )}
                        style={positionStyle}
                        aria-label={`View ${planet.name}`}
                      >
                        {renderRivalIconDisplay(planet.rivalPresences)}
                        <PlanetIcon className="w-4 h-4 mb-0.5 opacity-70" />
                        <span className="text-[11px] font-semibold block truncate w-full px-1">{planet.name}</span>
                        <span className="text-[9px] font-medium opacity-90">{(planet.adoptionLevel * 100).toFixed(0)}%</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground">
                      {renderPlanetTooltipContent(planet, zoomedCountry.name)}
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
