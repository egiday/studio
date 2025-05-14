
'use client';

import type { EvolutionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, CheckCircle, XCircle, Lock, Award, Star } from 'lucide-react'; // Added Award, Star
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

  const hasSpecialAbility = item.isEvolved && item.specialAbilityName && item.specialAbilityDescription;

  return (
    <Card className={cn(
      "shadow-lg flex flex-col justify-between transition-opacity", 
      item.isEvolved ? "bg-green-500/10 dark:bg-green-500/20 border-green-500" : 
      !canEvolveOverall && !item.isEvolved ? "opacity-70 bg-muted/30" : "bg-card",
      hasSpecialAbility ? "border-amber-400 dark:border-amber-500 border-2" : "" // Highlight for special ability
    )}>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <item.icon className="mr-2 h-5 w-5 text-primary" />
          {item.name}
        </CardTitle>
        <CardDescription className="text-xs h-auto min-h-[40px] overflow-y-auto">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Badge variant={item.isEvolved ? "default" : "secondary"} className={cn(
          item.isEvolved ? "bg-green-600 text-white" : "",
          "mb-2" 
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
                    // This mock lookup is a placeholder. In a real app, you'd have access to the full items list or a helper.
                    const isMet = !unmetPrerequisiteNames.includes(prereqName); 
                    return isMet;
                  }) && !item.isEvolved ? "text-green-500 dark:text-green-400" : 
                  unmetPrerequisiteNames.includes(prereqName) ? "text-destructive" : ""
                )}>
                  {prereqName}
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasSpecialAbility && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <h4 className="text-sm font-semibold flex items-center text-amber-500 dark:text-amber-400 mb-1">
              <Award className="mr-1.5 h-4 w-4" />
              Special Ability: {item.specialAbilityName}
            </h4>
            <p className="text-xs text-muted-foreground">{item.specialAbilityDescription}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onEvolve(item.id)}
                disabled={!canEvolveOverall || item.isEvolved}
                className={cn("w-full text-sm", 
                  item.isEvolved ? "bg-green-600 hover:bg-green-700 text-white cursor-default" : 
                  !prerequisitesMet ? "bg-muted hover:bg-muted text-muted-foreground" :
                  !isAffordable ? "bg-amber-500 hover:bg-amber-600 text-amber-foreground" : 
                  "bg-accent hover:bg-accent/90 text-accent-foreground"
                )}
                aria-describedby={tooltipMessage ? `tooltip-${item.id}` : undefined}
              >
                {buttonIcon}
                {buttonText}
              </Button>
            </TooltipTrigger>
            {tooltipMessage && !item.isEvolved && (
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
// We use a different name to avoid linting errors about redefining EVOLUTION_ITEMS from gameData
// This mock isn't strictly used for logic in this version of the card but helps with local type checking if isolated.
const EVOLUTION_ITEMS_MOCK: {id: string, name: string}[] = [
    {id: "expr_social_media", name: "Social Media Presence"},
    {id: "expr_apps", name: "Dedicated App"},
    {id: "expr_influencers", name: "Influencer Network"}
];

