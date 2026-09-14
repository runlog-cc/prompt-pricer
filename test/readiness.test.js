import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {analyzePromptBloat} from '../analyzer.js';
import {estimateTextTokens} from '../engine.js';
const cli=new URL('../bin/runlog-pricer.js',import.meta.url).pathname;
const run=(args,input)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',input});
test('18-token directive fixture never invents 60 wasted tokens or $90 savings',()=>{
 const prompt='make sure to '.repeat(5);assert.equal(estimateTextTokens(prompt),18);
 const result=analyzePromptBloat({userPrompt:prompt});assert.equal(result.estimatedWastedTokens,null);assert.equal(result.potentialMonthlySavingsUSD,null);assert.equal(result.issues[0].wastedTokens,null);
 assert.doesNotMatch(result.issues[0].message,/without improving|defensive/);
});
test('explicit file/stdin inputs fail closed and positional strings stay literal',()=>{
 assert.notEqual(run(['price','--file','/missing/readiness-file']).status,0);
 assert.match(run(['price','--file','/missing/readiness-file']).stderr,/ENOENT/);
 const file=run(['price','--json','--file',new URL('../README.md',import.meta.url).pathname]);assert.equal(file.status,0,file.stderr);assert.equal(JSON.parse(file.stdout).assumptions.input_tokens_per_turn,estimateTextTokens(readFileSync(new URL('../README.md',import.meta.url),'utf8')));
 const stdin=run(['price','--json','--stdin'],'hello');assert.equal(stdin.status,0,stdin.stderr);assert.equal(JSON.parse(stdin.stdout).assumptions.input_tokens_per_turn,2);
 assert.notEqual(run(['price','--stdin','hello'],'world').status,0);
 const literal=run(['price','--json','README.md']);assert.equal(JSON.parse(literal.stdout).assumptions.input_tokens_per_turn,estimateTextTokens('README.md'));
});
test('every model exposes applied usage and rates that reconstruct both costs',()=>{
 for(const extra of [[],['--thinking-tokens','123'],['--cached']]){
 const r=run(['price','--json','--models','gpt-4o,claude-3-7-sonnet-thinking','--turns','3',...extra,'refactor architecture with algorithm']);assert.equal(r.status,0,r.stderr);
 const d=JSON.parse(r.stdout);assert.equal(d.estimator_version,'0.3.0');assert.match(d.provenance.pricing_snapshot_sha256,/^[a-f0-9]{64}$/);
 assert.equal(d.provenance.pricing_snapshot_sha256,createHash('sha256').update(readFileSync(new URL('../pricing-snapshot.js',import.meta.url))).digest('hex'));
 for(const m of d.results){for(const [period,key] of [['last_turn','last_turn_cost'],['cumulative','cumulative_cost']]){const u=m.applied_usage[period],p=m.rates_usd_per_million;const cost=(u.input_tokens*p.input+u.output_tokens*p.output+u.thinking_tokens*p.thinking)/1e6*d.fx.applied_rate;assert.ok(Math.abs(cost-m[key])<1e-12);}
 assert.equal(m.thinking_application,extra.includes('--thinking-tokens')?'explicit_override':m.model==='gpt-4o'?'automatic_ignored':'automatic_applied');
 }
 }
});
