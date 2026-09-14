// RunLog Prompt Pricer - Automated Test & Verification Suite
// Validates token heuristics, pricing formulas, cache discounts, and bloat detection

import assert from 'node:assert/strict';
import { MODELS_DATA, getModelById, filterModels } from '../models-data.js';
import {
  CURRENCY_RATES,
  estimateTextTokens,
  estimateSchemaTokens,
  estimateMediaTokens,
  calculateInputBreakdown,
  calculateModelCost,
  calculateMultiTurnConversationCost,
  formatCurrency
} from '../engine.js';
import { analyzePromptBloat, BLOAT_SEVERITY } from '../analyzer.js';

console.log('🧪 Starting RunLog Prompt Pricer Verification Suite...\n');

// 1. Model Catalog Integrity Checks
console.log('▶ Test 1: Model Catalog Integrity');
assert.ok(MODELS_DATA.length >= 25, `Expected at least 25 models in catalog, found ${MODELS_DATA.length}`);

for (const model of MODELS_DATA) {
  assert.ok(model.id, `Model missing ID: ${JSON.stringify(model)}`);
  assert.ok(model.name, `Model missing Name: ${model.id}`);
  assert.ok(model.provider, `Model missing Provider: ${model.id}`);
  assert.ok(['frontier', 'workhorse', 'media'].includes(model.cohort), `Invalid cohort for model ${model.id}: ${model.cohort}`);

  if (model.cohort !== 'media') {
    assert.ok(typeof model.inputPricePerM === 'number' && model.inputPricePerM >= 0, `Invalid input price for ${model.id}`);
    assert.ok(typeof model.outputPricePerM === 'number' && model.outputPricePerM >= 0, `Invalid output price for ${model.id}`);
    assert.ok(model.contextWindow > 0, `Missing context window for ${model.id}`);
  } else {
    assert.ok(typeof model.costPerUnit === 'number' || typeof model.inputPricePerM === 'number', `Media model missing unit pricing: ${model.id}`);
  }
}
console.log(`  ✓ Checked ${MODELS_DATA.length} models across all cohorts for schema conformity.`);

// 2. Token Counting Heuristics
console.log('\n▶ Test 2: Token Counting Heuristics');
const prose = 'The quick brown fox jumps over the lazy dog.';
const proseTokens = estimateTextTokens(prose);
assert.ok(proseTokens >= 8 && proseTokens <= 14, `Prose token estimate out of bounds: ${proseTokens}`);

const jsonSample = JSON.stringify({
  action: "execute_sql",
  parameters: { table: "users", limit: 100, fields: ["id", "email", "created_at"] }
}, null, 2);
const jsonTokens = estimateSchemaTokens(jsonSample);
assert.ok(jsonTokens > 20, `JSON schema token estimate too low: ${jsonTokens}`);

const mediaTokens = estimateMediaTokens({
  imageCount: 2,
  audioMinutes: 1,
  videoSeconds: 10,
  pdfPages: 3
});
// 2 images * 765 + 1 min audio (1500) + 10s video (2600) + 3 pages pdf (1950) = 1530 + 1500 + 2600 + 1950 = 7580
assert.ok(mediaTokens > 7000 && mediaTokens < 8500, `Media token estimation unexpected: ${mediaTokens}`);
console.log(`  ✓ Verified text, JSON schema, and multimodal media token calculators.`);

// 3. Pricing Math & Cache Discounts
console.log('\n▶ Test 3: Pricing Math & Cache Discounts');
const claude37 = getModelById('claude-3-7-sonnet');
assert.ok(claude37, 'Claude 3.7 Sonnet model not found in catalog');

const breakdown = {
  totalInputTokens: 100000,
  thinkingTokens: 0,
  expectedOutputTokens: 10000
};

// 100k input at $3/1M = $0.30
// 10k output at $15/1M = $0.15
// Single call total = $0.45
const freshCost = calculateModelCost(claude37, breakdown, { isCached: false, scale: 1 });
assert.ok(Math.abs(freshCost.totalCost - 0.45) < 0.001, `Expected fresh cost ~$0.45, got ${freshCost.totalCost}`);

// Cached input at $0.30/1M = $0.03 + $0.15 = $0.18
const cachedCost = calculateModelCost(claude37, breakdown, { isCached: true, scale: 1 });
assert.ok(Math.abs(cachedCost.totalCost - 0.18) < 0.001, `Expected cached cost ~$0.18, got ${cachedCost.totalCost}`);
assert.ok(cachedCost.savingsFromCache > 0.25, `Expected savings > $0.25, got ${cachedCost.savingsFromCache}`);

// Scale check (1,000 runs)
const scaledCost = calculateModelCost(claude37, breakdown, { isCached: false, scale: 1000 });
assert.ok(Math.abs(scaledCost.totalCost - 450.0) < 0.1, `Expected scaled cost ~$450, got ${scaledCost.totalCost}`);
console.log(`  ✓ Verified fresh vs cached rates, cache savings, and volume scaling math.`);

// 4. Currency Conversion
console.log('\n▶ Test 4: Currency Conversion (USD to EUR)');
const eurCost = calculateModelCost(claude37, breakdown, { isCached: false, scale: 1, currency: 'EUR' });
assert.ok(Math.abs(eurCost.totalCost - (0.45 * CURRENCY_RATES.EUR.rate)) < 0.005, `Expected EUR cost ~${0.45 * CURRENCY_RATES.EUR.rate}, got ${eurCost.totalCost}`);
assert.equal(formatCurrency(12.50, 'EUR'), '€12.50');
assert.equal(formatCurrency(12.50, 'USD'), '$12.50');
console.log(`  ✓ Verified multi-currency exchange rate conversions and formatting.`);

// 5. Bloat Detection & RunLog Ship-Check Lite
console.log('\n▶ Test 5: Bloat Detection & RunLog Ship-Check Lite');
const cleanPrompt = {
  systemPrompt: 'You are a concise code review assistant.',
  userPrompt: 'Review the following 2-line diff:\n+ return math.sqrt(x)\n- return x ** 0.5',
  jsonSchema: '',
  thinkingTokens: 0,
  expectedOutputTokens: 200
};
const cleanReport = analyzePromptBloat(cleanPrompt);
assert.equal(cleanReport.issues.length, 0, 'Clean prompt should have 0 issues');
assert.equal(cleanReport.status, 'Well Compacted');

const bloatedPrompt = {
  systemPrompt: `You must always check everything. You must make sure to format as JSON. You must always ensure tests pass. Make sure to adhere to guidelines. Under no circumstances should you forget this. It is extremely important that you remember.`,
  userPrompt: `The runner failed:
Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/urllib3/connectionpool.py", line 467, in _make_request
    six.raise_from(e, None)
  File "<string>", line 3, in raise_from
  File "/usr/local/lib/python3.11/site-packages/urllib3/connectionpool.py", line 462, in _make_request
    httplib_response = conn.getresponse()
  File "/usr/local/lib/python3.11/http/client.py", line 1374, in getresponse
    response.begin()
ConnectionResetError: [Errno 54] Connection reset by peer`,
  jsonSchema: '',
  thinkingTokens: 24000,
  expectedOutputTokens: 1000
};
const bloatedReport = analyzePromptBloat(bloatedPrompt);
assert.ok(bloatedReport.issues.length >= 2, `Expected at least 2 bloat issues, got ${bloatedReport.issues.length}`);
const issueIds = bloatedReport.issues.map(i => i.id);
assert.ok(issueIds.includes('stack-trace-bloat'), 'Failed to detect stack trace bloat');
assert.ok(issueIds.includes('thinking-runaway-risk'), 'Failed to detect thinking runaway risk');
assert.ok(bloatedReport.estimatedWastedTokens > 500, `Expected wasted tokens > 500, got ${bloatedReport.estimatedWastedTokens}`);
console.log(`  ✓ Successfully flagged stack trace bloat, thinking runaway risk, and calculated savings.`);

// 6. Multi-Turn Conversation & Context Reset Advisor
console.log('\n▶ Test 6: Multi-Turn Conversation & Context Reset Advisor');
const multiTurn = calculateMultiTurnConversationCost(claude37, {
  systemPromptTokens: 500,
  userTokensPerTurn: 200,
  outputTokensPerTurn: 800,
  turns: 10,
  currency: 'USD'
});

assert.ok(multiTurn, 'Multi-turn report returned null');
assert.equal(multiTurn.turns, 10);
// Context debt for 9 prior turns = 9 * (200 + 800) = 9,000 tokens
assert.equal(multiTurn.contextDebtTokens, 9000);
assert.ok(multiTurn.costTurnN > multiTurn.freshCost, `Turn 10 cost (${multiTurn.costTurnN}) should exceed fresh chat cost (${multiTurn.freshCost})`);
assert.ok(multiTurn.savingsPct >= 60, `Expected at least 60% savings on reset, got ${multiTurn.savingsPct}%`);
assert.equal(multiTurn.shouldSuggestReset, true, 'Should suggest reset on Turn 10 with 9,000 debt');
console.log(`  ✓ Verified 10-turn context compounding (+9,000 debt), Turn N vs Fresh Chat cost delta, and reset trigger.`);

console.log('\n✅ ALL 6 TEST SUITES PASSED FLAWLESSLY!\n');
