'use client';

import type { EvolutionItem, EvolutionCategory } from '@/types';
import { EvolutionCard } from './EvolutionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface EvolutionPanelProps {
  categories: EvolutionCategory[];
  items: EvolutionItem[];
  onEvolve: (itemId: string) => void;
  influencePoints: number;
  evolvedItemIds: Set<string>;
}

export function EvolutionPanel({ categories, items, onEvolve, influencePoints, evolvedItemIds }: EvolutionPanelProps) {
  
  const canEvolveItem = (item: EvolutionItem): boolean => {
    if (!item.prerequisites || item.prerequisites.length === 0) {
      return true;
    }
    return item.prerequisites.every(prereqId => evolvedItemIds.has(prereqId));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-6 w-6 text-primary" />Evolution Tree</CardTitle>
        <CardDescription>Develop your cultural movement by evolving traits.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={categories[0]?.id || 'expression_methods'} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs px-1">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <ScrollArea className="h-[300px] pr-3"> {/* Adjust height as needed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items
                    .filter((item) => item.category === category.id)
                    .map((item) => (
                      <EvolutionCard
                        key={item.id}
                        item={{...item, isEvolved: evolvedItemIds.has(item.id)}}
                        onEvolve={onEvolve}
                        canEvolve={canEvolveItem(item)}
                        influencePoints={influencePoints}
                      />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
