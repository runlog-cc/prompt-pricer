#!/usr/bin/env node
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {estimateTextTokens,calculateInputBreakdown,calculateModelCost,calculateMultiTurnConversationCost,formatCurrency,FX_PROVENANCE,CURRENCY_RATES} from '../engine.js';
import {estimatePromptComplexity} from '../analyzer.js';
import {getModelById} from '../models-data.js';
const args=process.argv.slice(2);
if(!args.length || args.includes('--help')){
 console.log('Usage: runlog price [--json] [--currency USD|EUR] [--cached] [--models id,id] [--turns N] [--output-tokens N] [--thinking-tokens N] [--file PATH | --stdin | "prompt"]\nOffline heuristic estimates. JSON includes price/FX provenance and session totals. No session telemetry or model execution.');process.exit(0);
}
try {
 if(args[0]==='price')args.shift();
 let currency='EUR',cached=false,turns=1,modelIds=['gpt-4o'],prompt,json=false,output,thinking,file,stdin=false;
 while(args.length){const arg=args.shift();
  if(arg==='--file'){if(file!==undefined)throw Error('Only one file is allowed');file=args.shift();if(!file||file.startsWith('--'))throw Error('--file requires a path');}
  else if(arg==='--stdin'){if(stdin)throw Error('Only one stdin input is allowed');stdin=true;}
  else if(arg==='--cached')cached=true;
  else if(arg==='--json')json=true;
  else if(arg==='--currency')currency=(args.shift()||'').toUpperCase();
  else if(arg==='--turns')turns=Number(args.shift());
  else if(arg==='--output-tokens')output=Number(args.shift());
  else if(arg==='--thinking-tokens')thinking=Number(args.shift());
  else if(arg==='--models')modelIds=(args.shift()||'').split(',');
  else if(arg.startsWith('--'))throw Error(`Unsupported option: ${arg}`);
  else if(prompt!==undefined)throw Error('Quote the prompt as one argument');else prompt=arg;
 }
 if(!['USD','EUR'].includes(currency))throw Error('Currency must be USD or EUR');
 if(!Number.isSafeInteger(turns)||turns<1||turns>100000)throw Error('Turns must be an integer from 1 to 100000');
 for(const [key,v]of [['output-tokens',output],['thinking-tokens',thinking]])if(v!==undefined&&(!Number.isSafeInteger(v)||v<0||v>1000000))throw Error(`${key} must be an integer from 0 to 1000000`);
 if(Number(prompt!==undefined)+Number(file!==undefined)+Number(stdin)!==1)throw Error('Provide exactly one quoted prompt, --file PATH, or --stdin');
 if(file!==undefined)prompt=fs.readFileSync(file,'utf8');
 if(stdin)prompt=fs.readFileSync(0,'utf8');
 if(!prompt.trim())throw Error('Prompt must not be empty');
 const models=modelIds.map(id=>{const m=getModelById(id);if(!m||m.cohort==='media')throw Error(`Unknown text model: ${id}`);return m;});
 const complexity=estimatePromptComplexity(prompt),tokens=estimateTextTokens(prompt);
 const explicitThinking=thinking!==undefined;
 output ??= complexity.predictedOutput;thinking ??= complexity.predictedThinking;
 const breakdown=calculateInputBreakdown({userPrompt:prompt,thinkingTokens:thinking,expectedOutputTokens:output});breakdown.expectedOutputTokens=output;
 const results=models.map(original=>{
  const model=explicitThinking ? {...original,supportsThinking:true} : original;
  const session=calculateMultiTurnConversationCost(model,{userTokensPerTurn:tokens,outputTokensPerTurn:output,thinkingTokensPerTurn:thinking,turns,currency,isCached:cached});
  const estimate=calculateModelCost(model,{...breakdown,totalInputTokens:session.turnNInputTokens},{currency,isCached:cached});
  const appliedThinking=model.supportsThinking?thinking:0;
  const applied_usage={last_turn:{input_tokens:session.turnNInputTokens,output_tokens:output,thinking_tokens:appliedThinking},cumulative:{input_tokens:turns*tokens+(tokens+output)*turns*(turns-1)/2,output_tokens:turns*output,thinking_tokens:turns*appliedThinking}};
  const rates_usd_per_million={input:cached?(model.cachedInputPricePerM??model.inputPricePerM):model.inputPricePerM,output:model.outputPricePerM,thinking:model.thinkingPricePerM??model.outputPricePerM};
  const thinking_application=explicitThinking?'explicit_override':original.supportsThinking?'automatic_applied':'automatic_ignored';
  return {applied_usage,rates_usd_per_million,thinking_application,model:model.id,canonical_model:model.canonicalId,pricing:model.pricingProvenance,last_turn_input_tokens:session.turnNInputTokens,last_turn_cost:estimate.totalCost,cumulative_cost:session.cumulativeCost,warnings:[...(!explicitThinking&&!original.supportsThinking&&thinking>0?['Automatic thinking assumption ignored: reasoning capability not confirmed.']:[]),...(explicitThinking&&!original.supportsThinking&&thinking>0?['Explicit thinking tokens priced at reasoning rate or output rate; capability not confirmed.']:[]),...(!model.pricingProvenance?.observed_at?['Reference price verification date unknown.']:[]),...(model.contextWindow&&session.turnNInputTokens+output+appliedThinking>model.contextWindow?['Estimated context exceeds model window.']:[])]};
 });
 const report={schema:'runlog.price-estimate.v1',estimator_version:'0.3.0',provenance:{pricing_snapshot_sha256:createHash('sha256').update(fs.readFileSync(new URL('../pricing-snapshot.js',import.meta.url))).digest('hex'),digest_scope:'pricing-snapshot.js file bytes',package_version:'0.3.0'},measured:false,currency,fx:{...FX_PROVENANCE,applied_rate:CURRENCY_RATES[currency].rate},assumptions:{input_tokens_per_turn:tokens,output_tokens_per_turn:output,thinking_tokens_per_turn:thinking,turns,all_input_cached:cached,tokenizer:'heuristic-uncalibrated'},results};
 if(json)console.log(JSON.stringify(report,null,2));
 else {console.log(`Estimated input tokens: ${tokens}`);console.log('Estimates use versioned price snapshots; unknown-date reference rows are labelled. Not metered usage.');console.log(`Assumed ${output} output and ${thinking} thinking tokens per turn. EUR reference date: ${FX_PROVENANCE.observed_at}.`);
 for(const r of results){console.log(`${r.model}: ${formatCurrency(r.last_turn_cost,currency)} (turn ${turns}); ${formatCurrency(r.cumulative_cost,currency)} total across ${turns} turn(s). Thinking: ${r.thinking_application} (${r.applied_usage.last_turn.thinking_tokens} applied tokens/turn). Price observed: ${r.pricing?.observed_at || 'unknown'}.`);for(const w of r.warnings)console.log(`  ${w}`);}}
}catch(error){console.error(`RunLog Pricer: ${error.message}`);process.exit(1);}
