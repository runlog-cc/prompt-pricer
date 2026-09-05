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
