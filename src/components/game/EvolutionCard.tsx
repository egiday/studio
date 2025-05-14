'use client';

import type { EvolutionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvolutionCardProps {
  item: EvolutionItem;
  onEvolve: (itemId: string) => void;
  canEvolve: boolean;
  influencePoints: number;
}

export function EvolutionCard({ item, onEvolve, canEvolve, influencePoints }: EvolutionCardProps) {
  const affordable = influencePoints >= item.cost;
  const evolutionPossible = canEvolve && affordable && !item.isEvolved;

  return (
    <Card className={cn("shadow-md flex flex-col justify-between", item.isEvolved ? "bg-green-50 dark:bg-green-900/30 border-green-500" : !evolutionPossible && !item.isEvolved ? "opacity-60" : "")}>
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
        {item.prerequisites && item.prerequisites.length > 0 && (
          <p className="text-xs mt-1 text-muted-foreground">Requires: {item.prerequisites.join(', ')}</p>
        )}
      </CardContent>
      <CardFooter>
        {item.isEvolved ? (
          <Button variant="ghost" disabled className="w-full text-green-600">
            <CheckCircle className="mr-2 h-4 w-4" /> Evolved
          </Button>
        ) : (
          <Button
            onClick={() => onEvolve(item.id)}
            disabled={!evolutionPossible}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {affordable ? "Evolve" : "Too Expensive"}
            {!canEvolve && affordable && <XCircle className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
