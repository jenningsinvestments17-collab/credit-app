const HIGH_RISK_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bguarantee(?:d|s|ing)?\b/gi, "cannot promise"],
  [/\bviolation confirmed\b/gi, "potential reporting issue identified"],
  [/\bconfirmed violation\b/gi, "identified reporting concern"],
  [/\bwill be deleted\b/gi, "may warrant correction or deletion"],
  [/\bmust be deleted\b/gi, "may need to be reviewed for correction or deletion"],
  [/\bthis proves\b/gi, "this may indicate"],
  [/\bwe proved\b/gi, "we documented information that may indicate"],
  [/\billegal\b/gi, "potentially noncompliant"],
  [/\blawsuit\b/gi, "outside action"],
];

export function applyContentGuardrails(text: string) {
  return HIGH_RISK_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  );
}

export function sanitizeGeneratedParagraphs(lines: string[]) {
  return lines.map((line) => applyContentGuardrails(line));
}
