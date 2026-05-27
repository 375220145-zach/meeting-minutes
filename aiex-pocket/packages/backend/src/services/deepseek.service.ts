import OpenAI from 'openai';
import { config } from '../config';
import { getEffectiveApiKey } from './config.service';

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: getEffectiveApiKey(),
    baseURL: config.deepseek.baseURL,
  });
}

export async function callDeepSeek(systemPrompt: string, userMessage: string) {
  const client = getClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: config.deepseek.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from DeepSeek');
      }

      return {
        rawContent: content,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error: any) {
      lastError = error;
      console.error(`[DeepSeek] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

export function repairJson(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // Fix trailing commas before closing brackets/braces
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  return cleaned;
}
