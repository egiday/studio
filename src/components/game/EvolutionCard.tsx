
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
      !canEvolveOverall && !item.isEvolved ? "opacity-70 bg-muted/30" : "bg-card" // Added bg-card for default
    )}>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <item.icon className="mr-2 h-5 w-5 text-primary" />
          {item.name}
        </CardTitle>
        <CardDescription className="text-xs h-10 overflow-y-auto">{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant={item.isEvolved ? "default" : "secondary"} className={cn(
          item.isEvolved ? "bg-green-600 text-white" : "",
          "mb-2" // Added margin bottom for spacing
        )}>
          <Coins className="mr-1 h-3 w-3" /> {item.cost} IP
        </Badge>
        {allPrerequisiteNames.length > 0 && (
          <div className="text-xs mt-1 text-muted-foreground space-y-0.5">
            <p className="font-medium">Requires:</p>
            <ul className="list-disc list-inside pl-1">
              {allPrerequisiteNames.map(prereqName => (
                <li key={prereqName} className={cn(
                  item.prerequisites?.some(pId => {
                    const prereqItem = EVOLUTION_ITEMS.find(i => i.id === pId); // Assuming EVOLUTION_ITEMS is accessible or passed
                    return prereqItem?.name === prereqName && !item.isEvolved && !unmetPrerequisiteNames.includes(prereqName) && prerequisitesMet;
                  }) ? "text-green-600 dark:text-green-400" : // Met prerequisite
                  unmetPrerequisiteNames.includes(prereqName) ? "text-destructive" : "" // Unmet prerequisite
                )}>
                  {prereqName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onEvolve(item.id)}
                disabled={!canEvolveOverall || item.isEvolved} // Ensure button is disabled if already evolved
                className={cn("w-full text-sm", 
                  item.isEvolved ? "bg-green-600 hover:bg-green-700 text-white cursor-default" : // Styling for evolved button
                  !prerequisitesMet ? "bg-muted hover:bg-muted text-muted-foreground" :
                  !isAffordable ? "bg-amber-500 hover:bg-amber-600 text-amber-foreground" : // Ensure text color is good on amber
                  "bg-accent hover:bg-accent/90 text-accent-foreground"
                )}
                aria-describedby={tooltipMessage ? `tooltip-${item.id}` : undefined}
              >
                {buttonIcon}
                {buttonText}
              </Button>
            </TooltipTrigger>
            {tooltipMessage && !item.isEvolved && ( // Only show tooltip if not evolved
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

// Minimal mock for EVOLUTION_ITEMS to satisfy TypeScript in this isolated context
// In a real scenario, this data would come from props or a shared context/store.
const EVOLUTION_ITEMS: {id: string, name: string}[] = [
    {id: "expr_social_media", name: "Social Media Presence"},
    {id: "expr_apps", name: "Dedicated App"},
    {id: "expr_influencers", name: "Influencer Network"}
];
