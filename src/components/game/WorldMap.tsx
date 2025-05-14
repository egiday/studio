
'use client';

import type { Country, SubRegion, RivalMovement } from '@/types';
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
  rivalMovements: RivalMovement[]; // Add rival movements prop
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

  const getRivalById = (rivalId: string) => rivalMovements.find(r => r.id === rivalId);

  const getRegionColor = (adoptionLevel: number, isSelected: boolean, rivalPresenceInfluence: number = 0) => {
    let baseColorClass = 'bg-muted/50 hover:bg-muted/60 border-border/50';
    let shadowClass = 'shadow-md';

    if (adoptionLevel > 0.8) { baseColorClass = 'bg-primary/90 hover:bg-primary border-primary/70'; shadowClass = 'shadow-xl shadow-primary/50'; }
    else if (adoptionLevel > 0.6) { baseColorClass = 'bg-primary/70 hover:bg-primary/80 border-primary/60'; shadowClass = 'shadow-lg shadow-primary/30'; }
    else if (adoptionLevel > 0.4) { baseColorClass = 'bg-primary/50 hover:bg-primary/60 border-primary/50'; shadowClass = 'shadow-md shadow-primary/20'; }
    else if (adoptionLevel > 0.2) { baseColorClass = 'bg-secondary/70 hover:bg-secondary/80 border-secondary/60'; shadowClass = 'shadow-lg shadow-secondary/30'; }
    else if (adoptionLevel > 0.05) { baseColorClass = 'bg-secondary/40 hover:bg-secondary/50 border-secondary/40'; shadowClass = 'shadow-md shadow-secondary/20'; }
    else if (adoptionLevel > 0) { baseColorClass = 'bg-secondary/20 hover:bg-secondary/30 border-secondary/30'; shadowClass = 'shadow-sm shadow-secondary/10'; }
    
    // If rival has more influence, tint towards rival color or mute player color
    if (rivalPresenceInfluence > adoptionLevel && rivalPresenceInfluence > 0.1) {
        baseColorClass = 'bg-slate-500/50 hover:bg-slate-500/60 border-slate-600/50'; // Muted color if rival dominant
    }


    const selectedClass = isSelected ? `ring-4 ring-offset-2 ring-offset-background ring-accent scale-105 ${shadowClass} shadow-accent/50` : shadowClass;
    return cn(baseColorClass, selectedClass, 'text-foreground');
  };

  const getSubRegionColor = (adoptionLevel: number, rivalPresenceInfluence: number = 0) => {
    let color = 'bg-muted/60 hover:bg-muted/70 border-border/40';
    if (adoptionLevel > 0.8) color = 'bg-primary/80 hover:bg-primary/90 border-primary/60 shadow-md shadow-primary/20';
    else if (adoptionLevel > 0.6) color = 'bg-primary/60 hover:bg-primary/70 border-primary/50 shadow-sm shadow-primary/10';
    else if (adoptionLevel > 0.4) color = 'bg-secondary/80 hover:bg-secondary/90 border-secondary/70 shadow-md shadow-secondary/20';
    else if (adoptionLevel > 0.2) color = 'bg-secondary/60 hover:bg-secondary/70 border-secondary/50 shadow-sm shadow-secondary/10';
    else if (adoptionLevel > 0) color = 'bg-secondary/30 hover:bg-secondary/40 border-secondary/30';

    if (rivalPresenceInfluence > adoptionLevel && rivalPresenceInfluence > 0.1) {
        color = 'bg-slate-400/60 hover:bg-slate-400/70 border-slate-500/50';
    }
    return color;
  }

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

  const renderRivalIndicator = (rivalPresence: Country['rivalPresence'] | SubRegion['rivalPresence']) => {
    if (!rivalPresence || rivalPresence.influenceLevel < 0.01) return null;
    const rival = getRivalById(rivalPresence.rivalId);
    if (!rival) return null;
    
    return (
      <div 
        className="absolute top-1 right-1 w-3 h-3 rounded-full border border-background"
        style={{ backgroundColor: rival.color }}
        title={`${rival.name} Influence: ${(rivalPresence.influenceLevel * 100).toFixed(0)}%`}
      />
    );
  };

  const renderSubRegionTooltipContent = (subRegion: SubRegion) => {
    const rival = subRegion.rivalPresence ? getRivalById(subRegion.rivalPresence.rivalId) : null;
    return (
      <div className="p-2.5 space-y-1.5 text-sm w-56 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{subRegion.name}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="font-medium text-muted-foreground">Player Adoption:</span><span className="text-right font-semibold">{(subRegion.adoptionLevel * 100).toFixed(0)}%</span>
          {rival && subRegion.rivalPresence && (
            <>
              <span className="font-medium" style={{color: rival.color || 'inherit'}}>{rival.name}:</span>
              <span className="text-right font-semibold" style={{color: rival.color || 'inherit'}}>{(subRegion.rivalPresence.influenceLevel * 100).toFixed(0)}%</span>
            </>
          )}
          <span className="font-medium text-muted-foreground">Resistance:</span><span className="text-right font-semibold">{(subRegion.resistanceLevel * 100).toFixed(0)}%</span>
          <span className="font-medium text-muted-foreground">Economy:</span><span className="text-right">{(subRegion.economicDevelopment * 100).toFixed(0)}%</span>
          <span className="font-medium text-muted-foreground">Openness:</span><span className="text-right">{(subRegion.culturalOpenness * 100).toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  const renderCountryTooltipContent = (country: Country) => {
     const rival = country.rivalPresence ? getRivalById(country.rivalPresence.rivalId) : null;
    return (
      <div className="p-2.5 space-y-1.5 text-sm w-56 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border">
        <p className="font-bold text-base mb-1.5 text-primary">{country.name}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="font-medium text-muted-foreground">Player Adoption:</span><span className="text-right font-semibold">{(country.adoptionLevel * 100).toFixed(0)}%</span>
           {rival && country.rivalPresence && !country.subRegions?.length && ( // Show for country only if no subregions
            <>
              <span className="font-medium" style={{color: rival.color || 'inherit'}}>{rival.name}:</span>
              <span className="text-right font-semibold" style={{color: rival.color || 'inherit'}}>{(country.rivalPresence.influenceLevel * 100).toFixed(0)}%</span>
            </>
          )}
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
  };
  
  return (
    <Card className="h-full shadow-xl flex flex-col border-2 border-card overflow-hidden bg-muted/30">
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
        "flex-grow relative overflow-hidden p-4 transition-opacity duration-300",
        zoomedCountry ? "opacity-30" : "opacity-100"
      )}>
        <TooltipProvider delayDuration={150}>
          {!zoomedCountry && countries.map((country) => (
            countryPositions[country.id] && (
              <Tooltip key={country.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      `absolute p-0 h-auto transform -translate-x-1/2 -translate-y-1/2 border-2 transition-all duration-300 hover:scale-105`,
                      getRegionColor(country.adoptionLevel, selectedCountryId === country.id, country.rivalPresence?.influenceLevel),
                      'rounded-xl w-32 h-20 flex flex-col justify-center items-center'
                    )}
                    style={{ top: countryPositions[country.id].top, left: countryPositions[country.id].left }}
                    onClick={() => handleCountryClick(country)}
                    aria-label={`Select ${country.name}`}
                  >
                    {renderRivalIndicator(country.rivalPresence)}
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
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-20 h-20 shadow-2xl animate-pulse bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleCollect}
            aria-label="Collect Influence Points"
          >
            <Zap className="w-10 h-10" />
          </Button>
        )}
      </CardContent>

      {zoomedCountry && (
        <div className="absolute inset-0 p-4 pt-[70px] bg-background/30 backdrop-blur-md overflow-hidden flex justify-center items-center">
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
                  const radius = 25 + (index % 2 === 0 ? 0 : 5);
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
                          getSubRegionColor(subRegion.adoptionLevel, subRegion.rivalPresence?.influenceLevel),
                          'text-foreground border-accent',
                          'rounded-lg w-28 h-[70px] flex flex-col justify-center items-center'
                        )}
                        style={positionStyle}
                        aria-label={`View ${subRegion.name}`}
                      >
                        {renderRivalIndicator(subRegion.rivalPresence)}
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
