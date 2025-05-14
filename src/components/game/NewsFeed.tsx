'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateDynamicNewsFeed, type DynamicNewsFeedInput } from '@/ai/flows/cultural-narrative-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Newspaper, RefreshCw } from 'lucide-react';
import type { NewsHeadline as NewsHeadlineType } from '@/types'; // Renamed to avoid conflict

interface NewsFeedProps {
  culturalMovementName: string;
  globalAdoptionRate: number; // 0-1
  recentEventsSummary: string;
  currentTurn: number; // Used to trigger refresh
}

export function NewsFeed({ culturalMovementName, globalAdoptionRate, recentEventsSummary, currentTurn }: NewsFeedProps) {
  const [headlines, setHeadlines] = useState<NewsHeadlineType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeadlines = useCallback(async () => {
    if (!culturalMovementName) return; // Don't fetch if no movement selected

    setIsLoading(true);
    setError(null);
    try {
      const input: DynamicNewsFeedInput = {
        culturalMovement: culturalMovementName,
        globalAdoptionRate: globalAdoptionRate,
        recentEvents: recentEventsSummary,
      };
      const result = await generateDynamicNewsFeed(input);
      const newHeadlines = result.newsHeadlines.map((text, index) => ({
        id: `${Date.now()}-${index}`,
        text,
        timestamp: Date.now(),
      }));
      // Prepend new headlines and keep a limited history
      setHeadlines(prev => [...newHeadlines, ...prev].slice(0, 20));
    } catch (e) {
      console.error('Error fetching news headlines:', e);
      setError('Failed to fetch news headlines. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [culturalMovementName, globalAdoptionRate, recentEventsSummary]);

  useEffect(() => {
    // Fetch headlines on initial mount if a movement is selected and on turn change
    if (currentTurn > 0 || (culturalMovementName && headlines.length === 0)) {
      fetchHeadlines();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, culturalMovementName, fetchHeadlines]); // headlines.length dependency removed to avoid loop with prepend

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center"><Newspaper className="mr-2 h-6 w-6 text-primary" />Global News Feed</CardTitle>
          <CardDescription>Latest reactions to your movement.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchHeadlines} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-3"> {/* Adjust height as needed */}
          {isLoading && headlines.length === 0 && <p className="text-muted-foreground">Loading headlines...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!isLoading && headlines.length === 0 && !error && <p className="text-muted-foreground">No news yet. Start your movement!</p>}
          <ul className="space-y-2">
            {headlines.map((headline) => (
              <li key={headline.id} className="text-sm p-2 bg-muted/50 rounded-md">
                {headline.text}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
