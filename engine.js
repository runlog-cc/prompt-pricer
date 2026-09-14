// RunLog Prompt Pricer - Pricing & Token Calculation Engine
// Heuristic estimates, not metered tokens; provider-specific framing/media may differ.

export const FX_PROVENANCE = {source:'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html',observed_at:'2026-09-09',usd_to_eur:0.8582};
export const CURRENCY_RATES = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.8582 }
};

/**
 * Fast client-side token estimator.
 * Tuned for English prose, code, markdown, and JSON structures.
 * No calibrated accuracy guarantee. Use provider usage for settlement.
 */
export function estimateTextTokens(text = '') {
  if (!text || typeof text !== 'string') return 0;
  if (text.trim().length === 0) return 0;

  // Code / JSON / Stacktrace detection heuristic (symbols & punctuation increase token density)
  const jsonChars = (text.match(/[{}\[\]":,]/g) || []).length;
  const codeChars = (text.match(/[<>=+\-*/\\|&^%#@`~;$]/g) || []).length;
  const whitespaceChars = (text.match(/\s+/g) || []).length;
  const totalLength = text.length;

  const symbolRatio = (jsonChars + codeChars) / Math.max(1, totalLength);

  // Standard prose: ~3.8-4.0 characters per token
  // Heavy JSON / Code / Punctuation: ~2.5-3.2 characters per token
  let charsPerToken = 3.85;
  if (symbolRatio > 0.15) {
    charsPerToken = 2.8;
  } else if (symbolRatio > 0.08) {
    charsPerToken = 3.2;
  }

  // Word-based heuristic cross-check
  const words = text.trim().split(/\s+/).length;
  const estimatedFromChars = Math.ceil(totalLength / charsPerToken);
  const estimatedFromWords = Math.ceil(words * 1.32);

  // Blend estimators
  return Math.max(1, Math.round((estimatedFromChars * 0.7) + (estimatedFromWords * 0.3)));
}

/**
 * Estimates tokens required for tool definitions (OpenAI / Anthropic schema format).
 */
export function estimateToolTokens(toolDefinitions = '') {
  if (!toolDefinitions.trim()) return 0;
  // Base framing overhead for tools array (~16 tokens per function signature)
  const rawTokens = estimateTextTokens(toolDefinitions);
  return Math.round(rawTokens * 1.15 + 16);
}

/**
 * Estimates tokens for structured JSON schemas (Pydantic / Zod / JSON Schema).
 */
export function estimateSchemaTokens(jsonSchema = '') {
  if (!jsonSchema.trim()) return 0;
  const rawTokens = estimateTextTokens(jsonSchema);
  // Structured grammar enforcement overhead
  return Math.round(rawTokens * 1.2 + 20);
}

/**
 * Multimodal token calculation for Images, Audio, and Video.
 */
export function estimateMediaTokens({
  imageCount = 0,
  imageDetail = 'high', // 'low' or 'high'
  audioMinutes = 0,
  videoSeconds = 0,
  pdfPages = 0
} = {}) {
  let tokens = 0;

  // Vision tokens (OpenAI / Claude standard: Low = 85 tokens, High = 85 + (tiles * 170), avg 4 tiles ~ 765 tokens)
  if (imageCount > 0) {
    const perImageTokens = imageDetail === 'low' ? 85 : 765;
    tokens += imageCount * perImageTokens;
  }

  // Audio tokens (GPT-4o Audio / Gemini: ~25 tokens per second => 1,500 tokens per minute)
  if (audioMinutes > 0) {
    tokens += Math.round(audioMinutes * 1500);
  }

  // Video tokens (Gemini / Claude: ~260 tokens per second of 1fps sampled video)
  if (videoSeconds > 0) {
    tokens += Math.round(videoSeconds * 260);
  }

  // PDF / Document Pages (Standard dense page ~ 500 words ~ 650 tokens)
  if (pdfPages > 0) {
    tokens += pdfPages * 650;
  }

  return tokens;
}

/**
 * Aggregates all token categories into an input breakdown.
 */
export function calculateInputBreakdown({
  systemPrompt = '',
  userPrompt = '',
  jsonSchema = '',
  toolDefinitions = '',
  mediaConfig = {},
  thinkingTokens = 0,
  expectedOutputTokens = 500
}) {
  const systemTokens = estimateTextTokens(systemPrompt);
  const userTokens = estimateTextTokens(userPrompt);
  const schemaTokens = estimateSchemaTokens(jsonSchema);
  const toolTokens = estimateToolTokens(toolDefinitions);
  const mediaTokens = estimateMediaTokens(mediaConfig);

  const totalInputTokens = systemTokens + userTokens + schemaTokens + toolTokens + mediaTokens;

  return {
    systemTokens,
    userTokens,
    schemaTokens,
    toolTokens,
    mediaTokens,
    totalInputTokens,
    thinkingTokens: Math.max(0, parseInt(thinkingTokens, 10) || 0),
    expectedOutputTokens: Math.max(1, parseInt(expectedOutputTokens, 10) || 1)
  };
}

/**
 * Calculates real-time cost for a single model across token breakdown.
 */
export function calculateModelCost(model, breakdown, {
  isCached = false,
  currency = 'USD',
  scale = 1 // 1 = per call, 1000 = 1k daily runs, 100000 = 100k monthly runs
} = {}) {
  breakdown={thinkingTokens:0,...breakdown};
  const finite = (v,label) => {if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw new Error(`Invalid ${label}: expected finite nonnegative number`);};
  finite(scale,'scale');
  for(const key of ['totalInputTokens','expectedOutputTokens','thinkingTokens'])finite(breakdown[key],key);
  for(const key of ['inputPricePerM','outputPricePerM','cachedInputPricePerM','thinkingPricePerM','costPerUnit'])if(model[key]!==undefined)finite(model[key],key);
  if(model.costPerUnit===undefined && (model.inputPricePerM===undefined || model.outputPricePerM===undefined))throw new Error('Unknown model pricing');
  if(!CURRENCY_RATES[currency])throw new Error('Unsupported currency');
  const rate = CURRENCY_RATES[currency]?.rate || 1.0;

  // Media / Generative non-token models (fal.ai, Midjourney, ElevenLabs, Runway)
  if (model.cohort === 'media' && model.costPerUnit !== undefined) {
    let unitCostUSD = model.costPerUnit;

    // Scale unit cost by volume
    const totalUSD = unitCostUSD * scale;
    return {
      modelId: model.id,
      modelName: model.name,
      currency,
      costPerCall: unitCostUSD * rate,
      totalCost: totalUSD * rate,
      inputCost: 0,
      outputCost: 0,
      thinkingCost: 0,
      cachedCost: totalUSD * rate,
      savingsFromCache: 0,
      isMedia: true,
      unitName: model.unitName
    };
  }

  // Token-based LLM pricing calculation
  const inputRatePerM = isCached && model.cachedInputPricePerM !== undefined
    ? model.cachedInputPricePerM
    : model.inputPricePerM;

  const freshInputRatePerM = model.inputPricePerM;
  const outputRatePerM = model.outputPricePerM;
  const thinkingRatePerM = model.thinkingPricePerM ?? model.outputPricePerM;

  // Cost for a single run
  const freshInputCostUSD = (breakdown.totalInputTokens / 1_000_000) * freshInputRatePerM;
  const activeInputCostUSD = (breakdown.totalInputTokens / 1_000_000) * inputRatePerM;
  const outputCostUSD = (breakdown.expectedOutputTokens / 1_000_000) * outputRatePerM;
  const thinkingCostUSD = model.supportsThinking
    ? (breakdown.thinkingTokens / 1_000_000) * thinkingRatePerM
    : 0;

  const singleCallCostUSD = activeInputCostUSD + outputCostUSD + thinkingCostUSD;
  const singleCallFreshUSD = freshInputCostUSD + outputCostUSD + thinkingCostUSD;
  const singleCallCachedUSD = ((breakdown.totalInputTokens / 1_000_000) * (model.cachedInputPricePerM ?? freshInputRatePerM)) + outputCostUSD + thinkingCostUSD;

  const totalCostUSD = singleCallCostUSD * scale;
  const savingsFromCacheUSD = Math.max(0, (singleCallFreshUSD - singleCallCachedUSD) * scale);

  return {
    modelId: model.id,
    modelName: model.name,
    currency,
    costPerCall: singleCallCostUSD * rate,
    totalCost: totalCostUSD * rate,
    freshTotalCost: singleCallFreshUSD * scale * rate,
    cachedTotalCost: singleCallCachedUSD * scale * rate,
    inputCost: activeInputCostUSD * scale * rate,
    outputCost: outputCostUSD * scale * rate,
    thinkingCost: thinkingCostUSD * scale * rate,
    savingsFromCache: savingsFromCacheUSD * rate,
    isMedia: false
  };
}

/**
 * Format currency with dynamic precision (e.g. $0.00042 for tiny micro-costs, $14.20 for larger sums).
 */
export function formatCurrency(amount, currency = 'USD') {
  const symbol = CURRENCY_RATES[currency]?.symbol || '$';
  if (amount === 0) return `${symbol}0.00`;

  if (amount < 0.0001) {
    return `${symbol}${amount.toFixed(6)}`;
  } else if (amount < 0.01) {
    return `${symbol}${amount.toFixed(4)}`;
  } else if (amount < 1.0) {
    return `${symbol}${amount.toFixed(3)}`;
  } else if (amount < 100) {
    return `${symbol}${amount.toFixed(2)}`;
  } else {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * Format token integers with comma separation.
 */
export function formatTokens(count) {
  return (count || 0).toLocaleString();
}

/**
 * Multi-Turn Conversation & Context Compounding Calculator.
 * Models real-world chat apps (ChatGPT, Claude, Cursor, Copilot) where every
 * subsequent turn re-sends the cumulative history of all prior turns as input tokens.
 */
export function calculateMultiTurnConversationCost(model, {
  systemPromptTokens = 0,
  userTokensPerTurn = 150,
  outputTokensPerTurn = 500,
  thinkingTokensPerTurn = 0,
  turns = 1,
  currency = 'USD',
  isCached = false
}) {
  for (const [key,value] of Object.entries({systemPromptTokens,userTokensPerTurn,outputTokensPerTurn,thinkingTokensPerTurn})) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${key}`);
  }
  if (!Number.isSafeInteger(turns) || turns < 1) throw new Error('Invalid turns');
  if (!CURRENCY_RATES[currency]) throw new Error('Unsupported currency');
  const rate = CURRENCY_RATES[currency].rate;
  if (!model || model.cohort === 'media') {
    return null;
  }

  calculateModelCost(model,{totalInputTokens:systemPromptTokens+userTokensPerTurn,expectedOutputTokens:outputTokensPerTurn,thinkingTokens:thinkingTokensPerTurn},{currency,isCached});

  const inputRatePerM = isCached && model.cachedInputPricePerM !== undefined
    ? model.cachedInputPricePerM
    : model.inputPricePerM;
  const outputRatePerM = model.outputPricePerM;
  const thinkingRatePerM = model.thinkingPricePerM ?? model.outputPricePerM;

  // Turn 1 Cost (Fresh Chat baseline)
  const freshInputTokens = systemPromptTokens + userTokensPerTurn;
  const freshCostUSD = (freshInputTokens / 1_000_000 * inputRatePerM) +
                       (outputTokensPerTurn / 1_000_000 * outputRatePerM) +
                       (model.supportsThinking ? (thinkingTokensPerTurn / 1_000_000 * thinkingRatePerM) : 0);

  // At Turn N:
  // Accumulated history = (N - 1) * (userTokensPerTurn + outputTokensPerTurn)
  // Total Input Tokens for Turn N = systemPromptTokens + accumulated history + userTokensPerTurn
  const contextDebtTokens = Math.max(0, (turns - 1) * (userTokensPerTurn + outputTokensPerTurn));
  const turnNInputTokens = freshInputTokens + contextDebtTokens;

  const costTurnN_USD = (turnNInputTokens / 1_000_000 * inputRatePerM) +
                        (outputTokensPerTurn / 1_000_000 * outputRatePerM) +
                        (model.supportsThinking ? (thinkingTokensPerTurn / 1_000_000 * thinkingRatePerM) : 0);

  // Cumulative Cost across all turns 1..N:
  // Sum_{t=1}^N [ system + (t-1)*(u + out) + u ]
  // = N * (system + u) + (u + out) * (N * (N - 1) / 2)
  const totalInputAcrossSession = (turns * freshInputTokens) + ((userTokensPerTurn + outputTokensPerTurn) * ((turns * (turns - 1)) / 2));
  const totalOutputAcrossSession = turns * outputTokensPerTurn;
  const totalThinkingAcrossSession = model.supportsThinking ? (turns * thinkingTokensPerTurn) : 0;

  const cumulativeCostUSD = (totalInputAcrossSession / 1_000_000 * inputRatePerM) +
                            (totalOutputAcrossSession / 1_000_000 * outputRatePerM) +
                            (totalThinkingAcrossSession / 1_000_000 * thinkingRatePerM);

  const costMultiplier = freshCostUSD > 0 ? (costTurnN_USD / freshCostUSD) : 1;
  const savingsIfResetUSD = Math.max(0, costTurnN_USD - freshCostUSD);
  const savingsPct = costTurnN_USD > 0 ? Math.round((savingsIfResetUSD / costTurnN_USD) * 100) : 0;

  return {
    turns,
    contextDebtTokens,
    turnNInputTokens,
    costTurnN: costTurnN_USD * rate,
    freshCost: freshCostUSD * rate,
    cumulativeCost: cumulativeCostUSD * rate,
    costMultiplier: parseFloat(costMultiplier.toFixed(2)),
    savingsIfReset: savingsIfResetUSD * rate,
    savingsPct,
    currency,
    shouldSuggestReset: turns >= 6 || contextDebtTokens >= 8000 || (savingsPct >= 60 && turns >= 4)
  };
}
