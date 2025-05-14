
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
  prompt: `You are a master news editor for a dynamic global news agency, specializing in captivating headlines about emerging cultural phenomena. Your task is to generate 5 distinct news headlines that reflect the current global sentiment and impact of the "{{{culturalMovement}}}" movement.

Consider the following data points:
- Current Global Adoption Rate: {{globalAdoptionRate}} (0.0 means no adoption, 1.0 means universal adoption).
- Key Recent Developments: "{{{recentEvents}}}"

Craft headlines that are:
- Varied in tone: some positive, some neutral, some concerned or skeptical, depending on the adoption rate and events.
- Speculative or analytical: hinting at future trends or societal impacts.
- Attention-grabbing and concise.
- Reflective of the nuances of the cultural movement's progress. For example:
    - If adoption is very low (e.g., < 0.1), headlines might focus on niche appeal, obscurity, or early curiosity.
    - If adoption is moderate (e.g., 0.1 - 0.4), headlines might discuss growing trends, debates, or initial societal impact.
    - If adoption is high (e.g., > 0.4), headlines might cover mainstream integration, significant societal shifts, potential controversies, or long-term consequences.
- The recent events should strongly influence at least one or two headlines.

Output the headlines as a JSON array of strings, with each string being a headline.`,
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
