/**
 * Extracts the latest developer-time-saved value reported by an AI Engineer.
 * Outcome comments should include a value such as "Dev Time Saved: 12 hours".
 */
export function getOutcomeHoursSaved(agent) {
  const outcomes = Array.isArray(agent?.engineerOutcomes) ? agent.engineerOutcomes : [];

  for (const outcome of outcomes) {
    const text = String(outcome?.text || '');
    const match = text.match(/(?:dev(?:eloper)?\s+)?time\s+saved\s*(?:is|of|:\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b|(?:saved|saving)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b|(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s+(?:of\s+)?(?:dev(?:eloper)?\s+)?time\s+saved/i);
    const hours = Number(match?.[1] ?? match?.[2] ?? match?.[3]);
    if (Number.isFinite(hours)) return hours;
  }

  return 0;
}