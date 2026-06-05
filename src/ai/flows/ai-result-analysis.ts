'use server';
/**
 * @fileOverview A Genkit flow for analyzing number lookup results.
 *
 * - aiResultAnalysis - A function that analyzes raw lookup data to generate a threat summary.
 * - AiResultAnalysisInput - The input type for the aiResultAnalysis function.
 * - AiResultAnalysisOutput - The return type for the aiResultAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiResultAnalysisInputSchema = z.object({
  rawData: z.string().describe('The raw JSON data received from the number lookup API.'),
});
export type AiResultAnalysisInput = z.infer<typeof AiResultAnalysisInputSchema>;

const AiResultAnalysisOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the number lookup findings, highlighting key information.'
    ),
  threatAssessment: z
    .string()
    .describe(
      'A detailed assessment of the potential threats or risks associated with the number, e.g., "Low", "Medium", "High", "Critical", along with reasoning.'
    ),
  category: z
    .string()
    .describe(
      'A categorization of the number based on the findings, e.g., "Spam", "Scam", "Legitimate", "Unknown", "Marketing", "Telemarketer".'
    ),
});
export type AiResultAnalysisOutput = z.infer<typeof AiResultAnalysisOutputSchema>;

export async function aiResultAnalysis(
  input: AiResultAnalysisInput
): Promise<AiResultAnalysisOutput> {
  return aiResultAnalysisFlow(input);
}

const numberAnalysisPrompt = ai.definePrompt({
  name: 'numberAnalysisPrompt',
  input: {schema: AiResultAnalysisInputSchema},
  output: {schema: AiResultAnalysisOutputSchema},
  prompt: `You are an advanced cyber security intelligence analyst specializing in telephone number forensics.
Your task is to analyze the provided raw data from a number lookup API and generate a clear, concise summary, a threat assessment, and a category for the number.

Raw Number Lookup Data (JSON):
{{{rawData}}}

Carefully analyze the data and provide the following:
1. A comprehensive 'summary' of the findings.
2. A 'threatAssessment' (e.g., Low, Medium, High, Critical) with justification based on the data.
3. A 'category' for the number (e.g., Spam, Scam, Legitimate, Unknown, Marketing, Telemarketer).

If the data indicates no specific threats or is insufficient for a definitive assessment, state so clearly in the assessment and categorize as 'Unknown' or 'Legitimate' as appropriate.
`,
});

const aiResultAnalysisFlow = ai.defineFlow(
  {
    name: 'aiResultAnalysisFlow',
    inputSchema: AiResultAnalysisInputSchema,
    outputSchema: AiResultAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await numberAnalysisPrompt(input);
    return output!;
  }
);
