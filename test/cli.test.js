import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const cli = new URL('../bin/runlog-pricer.js', import.meta.url).pathname;
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
test('price subcommand prices its prompt, honors model filter and labels estimates', () => {
  const result = run('price', '--currency', 'USD', '--models', 'gpt-4o', 'hello world');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Estimated input tokens: 3/);
  assert.match(result.stdout, /gpt-4o/);
  assert.doesNotMatch(result.stdout, /sonnet/);
});
test('unsupported session telemetry and invalid options fail instead of inventing usage', () => {
  for (const args of [['--codex'], ['--claude'], ['price'], ['price', '--turns', '-1', 'hello'], ['price', '--models', 'absent', 'hello'], ['price', '--currency', 'XXX', 'hello']]) {
    assert.notEqual(run(...args).status, 0, args.join(' '));
  }
});
test('JSON export includes provenance and distinguishes last turn from session total',()=>{
 const r=run('price','--json','--models','gpt-4o-mini','--turns','3','--output-tokens','20','--thinking-tokens','0','hello');
 assert.equal(r.status,0,r.stderr);const data=JSON.parse(r.stdout);assert.equal(data.schema,'runlog.price-estimate.v1');assert.equal(data.assumptions.turns,3);assert.equal(data.assumptions.output_tokens_per_turn,20);assert.ok(data.results[0].cumulative_cost>data.results[0].last_turn_cost);assert.ok(data.results[0].pricing.source);assert.ok(data.fx.source);assert.equal(data.measured,false);
});

test('explicit reasoning token override is charged even without capability metadata',()=>{
 const r=run('price','--json','--currency','USD','--models','gpt-4o','--output-tokens','0','--thinking-tokens','10000','hi');
 assert.equal(r.status,0,r.stderr);assert.ok(JSON.parse(r.stdout).results[0].cumulative_cost>0.01);
});
