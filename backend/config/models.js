/**
 * Gemini model configuration.
 * Change these two constants to swap model tiers without touching any prompt code.
 *
 * Tier rationale:
 *  - EXTRACTION_MODEL: simple structured parsing of a known-format document → optimise for speed/cost
 *  - MATCHING_MODEL:   multi-step reasoning (read bid, compare to criterion, judge compliance) → stronger model
 *
 * Demo fallback: if one tier is rate-limited, set both to the same model temporarily.
 */
module.exports = {
  EXTRACTION_MODEL: 'gemini-3.5-flash-lite',  // fast + cheap — simple document parsing
  MATCHING_MODEL:   'gemini-3.6-flash',        // stronger reasoning — compliance judgement
};
