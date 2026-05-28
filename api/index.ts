let DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
let _client: any = null;

function getClient() {
  if (_client) return _client;
  const OpenAI = require('openai').default;
  _client = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: DEEPSEEK_BASE_URL });
  return _client;
}

function sendJson(res: any, data: any, status = 200) {
  res.status(status).json(data);
}

function repairJson(raw: string): string {
  let c = raw.trim();
  c = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  c = c.replace(/,(\s*[}\]])/g, '$1');
  return c;
}

function buildPrompt(snippets: string[], rules: any): string {
  return [
    'You are an expert meeting analyst. Extract action items, assign owners, assess risks, evaluate sentiment. Output language: Chinese.',
    snippets.length ? `--- TRAINING ---\n${snippets.map((s, i) => `[${i + 1}] ${s.slice(0, 800)}`).join('\n\n')}` : '',
    `--- TRACK A: CUSTOM RULES ---
${(rules.roleMapping || []).map((r: any) => `- "${r.rolePattern}" → ${r.department} P:${r.defaultPriority}`).join('\n') || '(none)'}
${(rules.customHeuristics || []).map((r: any) => `- "${r.name}": "${r.triggerPattern}" → "${r.suggestedAction}" P:${r.priority} R:${r.riskLevel}`).join('\n') || '(none)'}
--- TRACK B: STANDARD (IPD + Agile) ---`,
    `--- OUTPUT FORMAT ---
JSON: { "actionItems": [{ "action", "owner", "department", "priority": "P0|P1|P2|P3", "riskLevel": "high|medium|low", "deadlineHint", "contextAnchor": "verbatim quote", "contextStartIndex": number, "trackSource": "heuristic|ipd|agile" }], "metadata": { "sentimentScore": -1..1, "overallSentiment", "trackUsed", "warnings": [] }, "summary": { "keyDecisions": [], "blockers": [], "nextSteps": "" } }
contextAnchor MUST be verbatim. 0 actions → warning "NO_ACTIONS_DETECTED". sentiment < -0.6 → warning "HIGH_NEGATIVITY".`,
  ].filter(Boolean).join('\n\n');
}

export default async function handler(req: any, res: any) {
  const u = req.url || '';

  if (u === '/api/health' || u === '/health') {
    return sendJson(res, { status: 'ok', version: '1.1.0' });
  }

  if (u === '/api/config/key/status' || u === '/config/key/status') {
    return sendJson(res, { configured: !!DEEPSEEK_API_KEY && !DEEPSEEK_API_KEY.includes('your-') });
  }

  if ((u === '/api/config/key' || u === '/config/key') && req.method === 'POST') {
    const { apiKey } = req.body || {};
    if (!apiKey) return sendJson(res, { error: { code: 'VALIDATION_ERROR', message: 'apiKey required' } }, 400);
    DEEPSEEK_API_KEY = apiKey;
    _client = null;
    return sendJson(res, { configured: true });
  }

  if ((u === '/api/ai/analyze' || u === '/ai/analyze') && req.method === 'POST') {
    const start = Date.now();
    const { meetingText, trainingSnippets, ruleSet } = req.body || {};
    if (!meetingText) return sendJson(res, { error: { code: 'VALIDATION_ERROR', message: 'meetingText required' } }, 400);

    const systemPrompt = buildPrompt(trainingSnippets || [], ruleSet || {});
    const userMessage = `Analyze:\n\n--- MEETING TEXT ---\n${meetingText}\n--- END ---\n\nReturn only JSON.`;

    let lastErr: any;
    for (let i = 0; i < 3; i++) {
      try {
        const client = getClient();
        const r = await client.chat.completions.create({
          model: DEEPSEEK_MODEL,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
          response_format: { type: 'json_object' },
          temperature: 0.3, max_tokens: 4096,
        });
        const content = r.choices[0]?.message?.content;
        if (!content) throw new Error('Empty');
        let p: any;
        try { p = JSON.parse(repairJson(content)); } catch { return sendJson(res, { error: { code: 'PARSE_ERROR' } }, 502); }
        return sendJson(res, {
          actionItems: p.actionItems || [],
          metadata: {
            sentimentScore: p.metadata?.sentimentScore ?? 0,
            overallSentiment: p.metadata?.overallSentiment ?? 'neutral',
            trackUsed: p.metadata?.trackUsed ?? 'b',
            warnings: p.metadata?.warnings ?? [],
            processingTimeMs: Date.now() - start,
            tokensUsed: r.usage?.total_tokens || 0,
          },
          summary: { keyDecisions: p.summary?.keyDecisions ?? [], blockers: p.summary?.blockers ?? [], nextSteps: p.summary?.nextSteps ?? '' },
        });
      } catch (e: any) { lastErr = e; if (i < 2) await new Promise(r => setTimeout(r, 1000 * (i + 1))); }
    }
    return sendJson(res, { error: { code: 'INTERNAL_ERROR', message: lastErr?.message } }, 500);
  }

  return sendJson(res, { error: { code: 'NOT_FOUND' } }, 404);
}
