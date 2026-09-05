#!/usr/bin/env node
import fs from 'node:fs';
import { estimateTextTokens, calculateInputBreakdown, calculateModelCost, formatCurrency } from '../engine.js';
import { estimatePromptComplexity } from '../analyzer.js';
import { getModelById } from '../models-data.js';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('Usage: runlog price [--currency USD|EUR] [--cached] [--models id,id] [--turns N] "prompt or file"\nOffline heuristic cost estimates. Session telemetry is not supported.');
  process.exit(0);
}
try {
  if (args[0] === 'price') args.shift();
  let currency = 'EUR', cached = false, turns = 1, modelIds = ['gpt-4o'], prompt;
  while (args.length) {
    const arg = args.shift();
    if (arg === '--cached') cached = true;
    else if (arg === '--currency') currency = (args.shift() || '').toUpperCase();
    else if (arg === '--turns') turns = Number(args.shift());
    else if (arg === '--models') modelIds = (args.shift() || '').split(',');
    else if (arg.startsWith('--')) throw new Error(`Unsupported option: ${arg}`);
    else if (prompt !== undefined) throw new Error('Quote the prompt as one argument');
    else prompt = arg;
  }
  if (!['USD', 'EUR'].includes(currency)) throw new Error('Currency must be USD or EUR');
  if (!Number.isSafeInteger(turns) || turns < 1 || turns > 100000) throw new Error('Turns must be an integer from 1 to 100000');
  if (!prompt) throw new Error('A prompt or file is required');
  if (fs.existsSync(prompt)) prompt = fs.readFileSync(prompt, 'utf8');
  const models = modelIds.map(id => {
    const model = getModelById(id);
    if (!model || model.cohort === 'media') throw new Error(`Unknown text model: ${id}`);
    return model;
  });
  const complexity = estimatePromptComplexity(prompt);
  const tokens = estimateTextTokens(prompt);
  const breakdown = calculateInputBreakdown({ userPrompt: prompt, thinkingTokens: complexity.predictedThinking, expectedOutputTokens: complexity.predictedOutput });
  breakdown.totalInputTokens += (turns - 1) * (tokens + 600);
  console.log(`Estimated input tokens: ${tokens}`);
  console.log('Estimated costs using bundled reference prices (verification date unknown); verify provider rates before budgeting.');
  console.log('Output/thinking tokens, conversation history, and EUR conversion are assumptions, not metered usage.');
  for (const model of models) {
    const cost = calculateModelCost(model, breakdown, { currency, isCached: cached, scale: 1 });
    console.log(`${model.id}: ${formatCurrency(cost.totalCost, currency)}`);
  }
} catch (error) {
  console.error(`RunLog Pricer: ${error.message}`);
  process.exit(1);
}
