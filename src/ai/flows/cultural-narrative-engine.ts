'use server';
/**
 * @fileOverview Generates dynamic news headlines reflecting global reactions to the player's cultural movement.
 *
 * - generateDynamicNewsFeed - A function that generates news headlines based on the cultural movement's impact.
 * - DynamicNewsFeedInput - The input type for the generateDynamicNewsFeed function.
 * - DynamicNewsFeedOutput - The return type for the generateDynamicNewsFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DynamicNewsFeedInputSchema = z.object({
  culturalMovement: z.string().describe('The name of the cultural movement.'),
  globalAdoptionRate: z.number().describe('The current global adoption rate (0-1).'),
  recentEvents: z.string().describe('A summary of recent events related to the movement.'),
});
export type DynamicNewsFeedInput = z.infer<typeof DynamicNewsFeedInputSchema>;

const DynamicNewsFeedOutputSchema = z.object({
  newsHeadlines: z.array(z.string()).describe('An array of dynamic news headlines.'),
});
export type DynamicNewsFeedOutput = z.infer<typeof DynamicNewsFeedOutputSchema>;

export async function generateDynamicNewsFeed(input: DynamicNewsFeedInput): Promise<DynamicNewsFeedOutput> {
  return generateDynamicNewsFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicNewsFeedPrompt',
  input: {schema: DynamicNewsFeedInputSchema},
  output: {schema: DynamicNewsFeedOutputSchema},
  prompt: `You are a news headline generator, creating headlines that reflect the global reaction to a cultural movement.

  Cultural Movement: {{{culturalMovement}}}
  Global Adoption Rate: {{{globalAdoptionRate}}}
  Recent Events: {{{recentEvents}}}

  Generate 5 news headlines that accurately reflect the current state of the cultural movement. Make them attention-grabbing and relevant.

  Output the headlines as a JSON array of strings.`,
});

const generateDynamicNewsFeedFlow = ai.defineFlow(
  {
    name: 'generateDynamicNewsFeedFlow',
    inputSchema: DynamicNewsFeedInputSchema,
    outputSchema: DynamicNewsFeedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
