// RunLog Prompt Pricer - Prompt Bloat & Optimization Analyzer
// "RunLog Ship-Check Lite" Heuristics

import { estimateTextTokens } from './engine.js';

export const BLOAT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Flags prompt patterns for qualitative review; no measured waste inference.
 */
export function analyzePromptBloat({
  systemPrompt = '',
  userPrompt = '',
  jsonSchema = '',
  toolDefinitions = '',
  thinkingTokens = 0,
  expectedOutputTokens = 500
}) {
  const issues = [];


  const combinedText = `${systemPrompt}\n${userPrompt}`;

  // 1. RAW STACK TRACE & LOG DUMP DETECTION
  const stackTracePatterns = [
    /Traceback \(most recent call last\):[\s\S]{80,}/i,
    /at\s+[\w\d_$.]+ \([\w\d_$./\\:-]+:\d+:\d+\)[\s\S]{60,}/i,
    /goroutine \d+ \[running\]:[\s\S]{60,}/i,
    /java\.lang\.[\w\d]+Exception:[\s\S]{60,}/i
  ];

  let hasStackTrace = false;
  for (const pattern of stackTracePatterns) {
    if (pattern.test(combinedText)) {
      hasStackTrace = true;
      break;
    }
  }

  if (hasStackTrace) {


    issues.push({
      id: 'stack-trace-bloat',
      severity: BLOAT_SEVERITY.CRITICAL,
      title: 'Uncompacted Stack Trace / Raw Error Dump Detected',
      message: 'Raw framework stack traces can contain redundant internal frames. Measure the compacted prompt against the original before relying on any token reduction.',
      wastedTokens: null,
      recommendation: 'Remove irrelevant third-party call frames and compare the estimated token counts before and after.'
    });
  }

  // 2. OVERSIZED SYSTEM PROMPT & BOILERPLATE RATIO
  const systemTokens = estimateTextTokens(systemPrompt);
  const userTokens = estimateTextTokens(userPrompt);
  const totalInputTokens = systemTokens + userTokens;

  if (systemTokens > 3500) {


    issues.push({
      id: 'oversized-system-prompt',
      severity: BLOAT_SEVERITY.WARNING,
      title: 'Heavy System Instruction Payload (>3,500 Tokens)',
      message: `System instructions consume ${systemTokens.toLocaleString()} estimated tokens per run. Compare a smaller prompt or retrieved instructions with the current prompt in a measured benchmark before changing production behavior.`,
      wastedTokens: null,
      recommendation: 'Check the selected provider pricing and caching terms, then measure a smaller or retrieved-instruction variant before adoption.'
    });
  }

  // 3. REPETITIVE DIRECTIVES & BOILERPLATE PHRASES
  const repetitivePhrases = [
    /you must always/gi,
    /make sure to/gi,
    /it is extremely important that/gi,
    /under no circumstances should you/gi,
    /please note that/gi,
    /as an ai language model/gi
  ];

  let repetitiveCount = 0;
  for (const regex of repetitivePhrases) {
    const matches = combinedText.match(regex);
    if (matches) {
      repetitiveCount += matches.length;
    }
  }

  if (repetitiveCount >= 5) {


    issues.push({
      id: 'repetitive-directives',
      severity: BLOAT_SEVERITY.INFO,
      title: `${repetitiveCount} Repetitive Conversational Directives Found`,
      message: 'Repeated directive phrases were detected. Review whether each repetition is needed and compare any edited prompt with representative tasks.',
      wastedTokens: null,
      recommendation: 'Use crisp imperative rules (e.g., "- Format: Strict JSON" instead of "- You must always format your answer as JSON").'
    });
  }

  // 4. JSON SCHEMA / TOOL DEFINITION VERBOSITY
  if (jsonSchema.trim().length > 0) {
    const schemaTokens = estimateTextTokens(jsonSchema);
    // Check for excessive whitespace or raw formatting
    const rawWhitespaceRatio = (jsonSchema.match(/\s{4,}/g) || []).length / Math.max(1, jsonSchema.split('\n').length);
    if (rawWhitespaceRatio > 0.4 && schemaTokens > 400) {


      issues.push({
        id: 'unminified-json-schema',
        severity: BLOAT_SEVERITY.WARNING,
        title: 'Unminified Schema & Excessive Indentation',
        message: 'Indented schema formatting was detected. Token effects depend on the tokenizer; compare a compact variant before adopting it.',
        wastedTokens: null,
        recommendation: 'Measure a compact schema variant and verify that required guidance is preserved.'
      });
    }
  }

  // 5. EXTENDED THINKING RUNAWAY RISK
  if (thinkingTokens > 16000) {


    issues.push({
      id: 'thinking-runaway-risk',
      severity: BLOAT_SEVERITY.WARNING,
      title: 'Extended Thinking Token Budget >16,000 Tokens',
      message: `Thinking budget is configured for ${thinkingTokens.toLocaleString()} tokens. Actual usage and billing depend on the model and provider; this threshold does not measure waste.`,
      wastedTokens: null,
      recommendation: 'Try a lower reasoning budget in a measured comparison and retain it only if the required output still passes your checks.'
    });
  }

  // Overall bloat score (0 = clean, 100 = severe bloat)
  let bloatScore = 0;
  if (issues.length > 0) {
    const criticalCount = issues.filter(i => i.severity === BLOAT_SEVERITY.CRITICAL).length;
    const warningCount = issues.filter(i => i.severity === BLOAT_SEVERITY.WARNING).length;
    const infoCount = issues.filter(i => i.severity === BLOAT_SEVERITY.INFO).length;

    bloatScore = Math.min(100, (criticalCount * 35) + (warningCount * 20) + (infoCount * 8));
  }

  return {
    score: bloatScore,
    status: issues.length ? 'Review suggested' : 'No heuristic flags',
    issues,
    estimatedWastedTokens: null,
    potentialMonthlySavingsUSD: null
  };
}

/**
 * Supplies uncalibrated output/thinking scenario assumptions from keyword cues.
 * These values are not predictions of measured provider usage.
 */
export function estimatePromptComplexity(text = '') {
  if (!text || text.trim().length === 0) {
    return {
      tier: 'simple',
      label: 'Simple / Quick Answer',
      predictedThinking: 0,
      predictedOutput: 250,
      cues: [],
      note: 'Direct factual question or short query.'
    };
  }

  const cues = [];

  // Deep Reasoning & Heavy Architecture Triggers
  const deepPatterns = [
    /\b(refactor|architect|architecture|concurrency|race condition|deadlock|consensus|distributed|mutex|lock-free|atomic)\b/i,
    /\b(algorithm|byzantine|cryptograph|optimize memory|cache coherency|zero-copy|profil|ast|lexer|parser)\b/i,
    /\b(prove|theorem|derivation|mathematical proof|formal verification)\b/i,
    /\b(step-by-step reasoning|think deeply|consider all edge cases|comprehensive unit test)\b/i
  ];

  // Code Block & Trace Triggers
  const hasCodeBlocks = (text.match(/```[\s\S]*?```/g) || []).length > 0;
  const hasMultipleFunctions = (text.match(/\b(function|def|fn|class|impl|pub async)\b/g) || []).length >= 2;
  const isLargeCode = text.length > 2000 && (text.includes('{') || text.includes('def '));

  let score = 0;
  for (const pat of deepPatterns) {
    const match = text.match(pat);
    if (match) {
      score += 25;
      cues.push(match[0]);
    }
  }

  if (hasCodeBlocks) { score += 20; cues.push('embedded code'); }
  if (hasMultipleFunctions || isLargeCode) { score += 25; cues.push('multi-function codebase'); }
  if (text.length > 3000) { score += 15; cues.push('long context'); }

  if (score >= 45) {
    return {
      tier: 'deep',
      label: 'Deep Reasoning / Architecture',
      predictedThinking: 8000,
      predictedOutput: 3500,
      cues: cues.slice(0, 3),
      note: 'High algorithmic/code complexity. Treat the suggested reasoning range as an estimate and validate it with measured runs.'
    };
  } else if (score >= 20) {
    return {
      tier: 'moderate',
      label: 'Moderate / Analytical',
      predictedThinking: 2500,
      predictedOutput: 1200,
      cues: cues.slice(0, 3),
      note: 'Analytical or multi-step logic. The suggested token budget is an uncalibrated scenario assumption.'
    };
  } else {
    return {
      tier: 'simple',
      label: 'Simple / Quick Query',
      predictedThinking: 0,
      predictedOutput: 350,
      cues: [],
      note: 'Direct factual query or brief response task.'
    };
  }
}
