export interface DeidentifyResult {
  deidentifiedText: string;
  mapping: Map<string, string>;
}

export function deidentifyText(text: string, roleMapping: Array<{ rolePattern: string; department: string }>): DeidentifyResult {
  const mapping = new Map<string, string>();

  // Build a set of known names/patterns to replace
  const patterns = roleMapping.map(r => r.rolePattern);

  // Sort by length descending to match longer patterns first
  patterns.sort((a, b) => b.length - a.length);

  let result = text;
  let counter = 1;

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(result)) {
      regex.lastIndex = 0;
      const placeholder = `[Role-${counter}]`;
      mapping.set(placeholder, pattern);
      result = result.replace(regex, placeholder);
      counter++;
    }
  }

  // Strip emails
  result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Email]');

  // Strip phone numbers (Chinese formats)
  result = result.replace(/1[3-9]\d{9}/g, '[Phone]');

  return { deidentifiedText: result, mapping };
}
