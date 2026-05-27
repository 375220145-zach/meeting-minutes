import { Router, Request, Response, NextFunction } from 'express';
import { AnalysisRequestSchema } from '../types/api.types';
import { callDeepSeek, repairJson } from '../services/deepseek.service';
import { buildSystemPrompt, buildUserMessage } from '../services/prompt.service';

export const aiRouter = Router();

aiRouter.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const parsed = AnalysisRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.issues },
      });
      return;
    }

    const { meetingText, trainingSnippets, ruleSet } = parsed.data;

    const systemPrompt = buildSystemPrompt(trainingSnippets, ruleSet);
    const userMessage = buildUserMessage(meetingText);

    const { rawContent, tokensUsed } = await callDeepSeek(systemPrompt, userMessage);

    let parsedResponse: any;
    try {
      const repaired = repairJson(rawContent);
      parsedResponse = JSON.parse(repaired);
    } catch {
      res.status(502).json({
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse AI response as JSON',
          details: { rawContent },
        },
      });
      return;
    }

    const processingTimeMs = Date.now() - startTime;

    res.json({
      actionItems: parsedResponse.actionItems || [],
      metadata: {
        sentimentScore: parsedResponse.metadata?.sentimentScore ?? 0,
        overallSentiment: parsedResponse.metadata?.overallSentiment ?? 'neutral',
        trackUsed: parsedResponse.metadata?.trackUsed ?? 'b',
        warnings: parsedResponse.metadata?.warnings ?? [],
        processingTimeMs,
        tokensUsed,
      },
      summary: {
        keyDecisions: parsedResponse.summary?.keyDecisions ?? [],
        blockers: parsedResponse.summary?.blockers ?? [],
        nextSteps: parsedResponse.summary?.nextSteps ?? '',
      },
    });
  } catch (error) {
    next(error);
  }
});

aiRouter.post('/preview-rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, ruleSet } = req.body;
    if (!text || !ruleSet) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'text and ruleSet are required' } });
      return;
    }

    const systemPrompt = `You are a rule-matching analyzer. Given a text snippet and a set of custom rules, identify which rules match and explain why. Return JSON:
{
  "matches": [
    { "ruleName": "string", "matchedText": "the exact text that triggered the rule", "confidence": 0-1 }
  ]
}`;

    const userMessage = `Rules:\n${JSON.stringify(ruleSet.customHeuristics, null, 2)}\n\nText to analyze:\n${text}`;

    const { rawContent } = await callDeepSeek(systemPrompt, userMessage);
    const repaired = repairJson(rawContent);
    const parsed = JSON.parse(repaired);

    res.json(parsed);
  } catch (error) {
    next(error);
  }
});
