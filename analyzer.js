// RunLog Prompt Pricer - Prompt Bloat & Optimization Analyzer
// "RunLog Ship-Check Lite" Heuristics

import { estimateTextTokens } from './engine.js';

export const BLOAT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Analyzes prompt inputs for anti-patterns, bloat, and costly token waste.
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
  let estimatedWastedTokens = 0;

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
    const traceTokens = estimateTextTokens(combinedText.match(/[a-zA-Z0-9_\-./]+:\d+:\d+/g)?.join(' ') || '') * 3;
    const wasted = Math.max(350, Math.round(traceTokens * 0.75));
    estimatedWastedTokens += wasted;

    issues.push({
      id: 'stack-trace-bloat',
      severity: BLOAT_SEVERITY.CRITICAL,
      title: 'Uncompacted Stack Trace / Raw Error Dump Detected',
      message: 'Raw framework stack traces contain redundant internal frames. Pre-filtering internal node_modules/site-packages frames before passing to LLMs routinely saves 65-80% of trace tokens.',
      wastedTokens: wasted,
      recommendation: 'Use RunLog Ship-Check trace sanitizer or strip third-party call frames.'
    });
  }

  // 2. OVERSIZED SYSTEM PROMPT & BOILERPLATE RATIO
  const systemTokens = estimateTextTokens(systemPrompt);
  const userTokens = estimateTextTokens(userPrompt);
  const totalInputTokens = systemTokens + userTokens;

  if (systemTokens > 3500) {
    const excessSystem = Math.round((systemTokens - 2000) * 0.4);
    estimatedWastedTokens += excessSystem;

    issues.push({
      id: 'oversized-system-prompt',
      severity: BLOAT_SEVERITY.WARNING,
      title: 'Heavy System Instruction Payload (>3,500 Tokens)',
      message: `System instructions consume ${systemTokens.toLocaleString()} tokens per run. In continuous agent loops, monolithic system prompts dominate 70%+ of inference expenditure unless cached.`,
      wastedTokens: excessSystem,
      recommendation: 'Leverage prompt caching (90% discount on Anthropic / 50% on OpenAI) or split domain guidelines into dynamic RAG chunks.'
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
    const wasted = repetitiveCount * 12;
    estimatedWastedTokens += wasted;

    issues.push({
      id: 'repetitive-directives',
      severity: BLOAT_SEVERITY.INFO,
      title: `${repetitiveCount} Repetitive Conversational Directives Found`,
      message: 'Fluff phrases like "make sure to" or "you must always" trigger defensive token overhead without improving model compliance on frontier models (Claude 3.7 / GPT-4o).',
      wastedTokens: wasted,
      recommendation: 'Use crisp imperative rules (e.g., "- Format: Strict JSON" instead of "- You must always format your answer as JSON").'
    });
  }

  // 4. JSON SCHEMA / TOOL DEFINITION VERBOSITY
  if (jsonSchema.trim().length > 0) {
    const schemaTokens = estimateTextTokens(jsonSchema);
    // Check for excessive whitespace or raw formatting
    const rawWhitespaceRatio = (jsonSchema.match(/\s{4,}/g) || []).length / Math.max(1, jsonSchema.split('\n').length);
    if (rawWhitespaceRatio > 0.4 && schemaTokens > 400) {
      const wasted = Math.round(schemaTokens * 0.25);
      estimatedWastedTokens += wasted;

      issues.push({
        id: 'unminified-json-schema',
        severity: BLOAT_SEVERITY.WARNING,
        title: 'Unminified Schema & Excessive Indentation',
        message: 'JSON schemas sent with multi-level indentations waste white-space tokens without adding semantic guidance.',
        wastedTokens: wasted,
        recommendation: 'Minify schemas or strip verbose descriptions on self-explanatory keys.'
      });
    }
  }

  // 5. EXTENDED THINKING RUNAWAY RISK
  if (thinkingTokens > 16000) {
    const wastedThinking = Math.round(thinkingTokens * 0.35);
    estimatedWastedTokens += wastedThinking;

    issues.push({
      id: 'thinking-runaway-risk',
      severity: BLOAT_SEVERITY.WARNING,
      title: 'Extended Thinking Token Budget >16,000 Tokens',
      message: `Thinking budget is configured for ${thinkingTokens.toLocaleString()} tokens. On Claude 3.7 Sonnet or OpenAI o1, reasoning tokens are billed at full output price ($15-$60/1M tokens).`,
      wastedTokens: wastedThinking,
      recommendation: 'Cap reasoning budget between 2,048 - 8,192 tokens unless solving unconstrained mathematical theorems.'
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
    status: bloatScore > 50 ? 'Severe Bloat' : bloatScore > 20 ? 'Moderate Inefficiencies' : 'Well Compacted',
    issues,
    estimatedWastedTokens,
    potentialMonthlySavingsUSD: Math.round((estimatedWastedTokens * 100000 / 1_000_000) * 15.0) // 100k calls at $15/1M (Claude 3.7 / GPT-4o output rate)
  };
}

/**
 * Automatically predicts the cognitive complexity of a prompt.
 * Determines how many thinking tokens and output tokens a frontier reasoning
 * model (Claude 3.7, o1, o3-mini, DeepSeek R1) will realistically burn.
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
      note: 'High algorithmic/code complexity. Frontier reasoning models will burn 4k–16k thinking tokens.'
    };
  } else if (score >= 20) {
    return {
      tier: 'moderate',
      label: 'Moderate / Analytical',
      predictedThinking: 2500,
      predictedOutput: 1200,
      cues: cues.slice(0, 3),
      note: 'Analytical or multi-step logic. Models will spend moderate reasoning tokens.'
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
