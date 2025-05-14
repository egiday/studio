
'use client';

import type { EvolutionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, CheckCircle, XCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvolutionCardProps {
  item: EvolutionItem;
  onEvolve: (itemId: string) => void;
  influencePoints: number;
  prerequisitesMet: boolean;
  unmetPrerequisiteNames: string[];
  allPrerequisiteNames: string[];
}

export function EvolutionCard({ 
  item, 
  onEvolve, 
  influencePoints, 
  prerequisitesMet, 
  unmetPrerequisiteNames,
  allPrerequisiteNames 
}: EvolutionCardProps) {
  const isAffordable = influencePoints >= item.cost;
  const canEvolveOverall = prerequisitesMet && isAffordable && !item.isEvolved;

  let buttonText = "Evolve";
  let buttonIcon = null;
  let tooltipMessage: string | null = null;

  if (item.isEvolved) {
    buttonText = "Evolved";
    buttonIcon = <CheckCircle className="mr-2 h-4 w-4" />;
  } else if (!prerequisitesMet) {
    buttonText = "Locked";
    buttonIcon = <Lock className="mr-2 h-4 w-4" />;
    tooltipMessage = `Requires: ${unmetPrerequisiteNames.join(', ')}`;
  } else if (!isAffordable) {
    buttonText = "Needs IP";
    buttonIcon = <Coins className="mr-2 h-4 w-4" />;
    tooltipMessage = `Requires ${item.cost} IP. You have ${influencePoints} IP.`;
  }

  return (
    <Card className={cn(
      "shadow-md flex flex-col justify-between transition-opacity", 
      item.isEvolved ? "bg-green-50 dark:bg-green-900/30 border-green-500" : 
      !canEvolveOverall ? "opacity-70" : ""
    )}>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <item.icon className="mr-2 h-5 w-5 text-primary" />
          {item.name}
        </CardTitle>
        <CardDescription className="text-xs h-10 overflow-y-auto">{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant={item.isEvolved ? "default" : "secondary"} className={item.isEvolved ? "bg-green-600 text-white" : ""}>
          <Coins className="mr-1 h-3 w-3" /> {item.cost} IP
        </Badge>
        {allPrerequisiteNames.length > 0 && (
          <p className="text-xs mt-2 text-muted-foreground">
            Requires: {allPrerequisiteNames.join(', ')}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onEvolve(item.id)}
                disabled={!canEvolveOverall}
                className={cn("w-full text-sm", 
                  item.isEvolved ? "bg-green-600 hover:bg-green-700 text-white" : 
                  !prerequisitesMet ? "bg-muted hover:bg-muted text-muted-foreground" :
                  !isAffordable ? "bg-amber-500 hover:bg-amber-600 text-white" : 
                  "bg-accent hover:bg-accent/90 text-accent-foreground"
                )}
                aria-describedby={tooltipMessage ? `tooltip-${item.id}` : undefined}
              >
                {buttonIcon}
                {buttonText}
              </Button>
            </TooltipTrigger>
            {tooltipMessage && (
              <TooltipContent id={`tooltip-${item.id}`}>
                <p>{tooltipMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
