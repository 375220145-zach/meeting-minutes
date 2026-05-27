import { z } from 'zod';

export const RuleSetContentSchema = z.object({
  roleMapping: z.array(z.object({
    rolePattern: z.string(),
    department: z.string(),
    defaultPriority: z.enum(['P0', 'P1', 'P2', 'P3']),
    weight: z.number().min(0).max(1),
  })),
  phaseGates: z.array(z.object({
    phaseName: z.string(),
    tolerancePercent: z.number(),
    gateCriteria: z.string(),
  })),
  customHeuristics: z.array(z.object({
    name: z.string(),
    triggerPattern: z.string(),
    suggestedAction: z.string(),
    priority: z.enum(['P0', 'P1', 'P2', 'P3']),
    riskLevel: z.enum(['high', 'medium', 'low']),
  })),
});

export const AnalysisRequestSchema = z.object({
  meetingText: z.string().min(1),
  trainingSnippets: z.array(z.string()).max(3),
  ruleSet: RuleSetContentSchema,
  options: z.object({
    trackPreference: z.enum(['auto', 'rule-first']).default('auto'),
    maxActionItems: z.number().min(1).max(50).default(20),
    language: z.enum(['zh', 'en']).default('zh'),
  }).optional(),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type RuleSetContent = z.infer<typeof RuleSetContentSchema>;

export interface ActionItem {
  action: string;
  owner: string;
  department: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  riskLevel: 'high' | 'medium' | 'low';
  deadlineHint: string;
  contextAnchor: string;
  contextStartIndex: number;
  trackSource: 'heuristic' | 'ipd' | 'agile';
}

export interface AnalysisResponse {
  actionItems: ActionItem[];
  metadata: {
    sentimentScore: number;
    overallSentiment: 'positive' | 'neutral' | 'negative';
    trackUsed: 'a' | 'b' | 'mixed';
    warnings: string[];
    processingTimeMs: number;
    tokensUsed: number;
  };
  summary: {
    keyDecisions: string[];
    blockers: string[];
    nextSteps: string;
  };
}
