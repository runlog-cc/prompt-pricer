# RunLog Prompt Pricer 0.3.0

Estimate prompt cost locally, with price provenance and machine-readable output. No account, API key, model execution, or session telemetry is involved.

## Download → install → run

Node.js 20 or newer and npm are required. In a new working folder:

```sh
curl -fL -o runlog-prompt-pricer-0.3.0.tgz https://github.com/runlog-cc/prompt-pricer/releases/download/v0.3.0/runlog-prompt-pricer-0.3.0.tgz
curl -fLO https://github.com/runlog-cc/prompt-pricer/releases/download/v0.3.0/SHA256SUMS
awk '$2 == "runlog-prompt-pricer-0.3.0.tgz" {print; found=1} END {if (!found) exit 1}' SHA256SUMS > pricer.SHA256SUMS
sha256sum --check pricer.SHA256SUMS
npm install --global ./runlog-prompt-pricer-0.3.0.tgz
runlog price --currency USD --models gpt-4o-mini "Summarize a short note."
```

On Windows PowerShell use `curl.exe` instead of `curl`. You can also download the file through the release page and open a terminal in its download folder. The `./` install path requires that file to exist in the current folder. Global installation needs a writable npm prefix; no sudo is required with a user-managed Node installation. Release assets include SHA256SUMS.

The command prints estimated input tokens, output/thinking assumptions, per-turn and cumulative cost, and the price observation date. Values are estimates, not metered usage.

```sh
runlog price --json --currency USD --models openai/gpt-4o-mini --turns 3 --output-tokens 200 --thinking-tokens 0 --file ./prompt.md > estimate.json
```

`estimate.json` has schema `runlog.price-estimate.v1`, `measured:false`, exact provider identity, price and FX provenance, assumptions, `last_turn_cost` and `cumulative_cost`. Prompt contents are not included in the export. `--turns` assumes repeated same-sized user/answer messages and charges their accumulated history. Output/thinking overrides are optional; otherwise the uncalibrated prompt heuristic supplies them.

## Honest limits

- The bundled OpenRouter snapshot includes its source and fetch timestamp. Live browser refresh is separate; the CLI is offline. A snapshot observation is not a future pricing guarantee.
- Legacy provider-specific reference entries not found in the snapshot are explicitly marked with an unknown verification date. Exact IDs and explicit aliases are used; dated variants never overwrite their parent by name matching.
- EUR conversion uses a dated reference rate recorded in JSON, not a live FX quote.
- Token counts are heuristic; no percentage accuracy guarantee is offered. Provider framing, tool/media pricing, reasoning, tiering and cache writes may differ. `--cached` assumes all input is eligible cache-read input; it does not promise cache eligibility or account for cache writes.
- Model context overflow is reported as a warning. This calculator does not enforce a spend limit or reserve money. Use actual provider usage for settlement.
- Exit 0 means an estimate was generated; invalid options/models/inputs exit 1. Session-inspection flags are unsupported rather than fabricating usage.

## Source verification and release

`npm test` runs formula, alias/order, invalid-price, zero-cache and CLI regressions. `node scripts/refresh-prices.mjs` explicitly captures a fresh public catalog before a release. Review the diff; it does not run models. `npm pack` produces the versioned install artifact. Registry publication is not assumed.

## Reconstructing JSON costs

Each result includes `applied_usage.last_turn` and `applied_usage.cumulative`, each with `input_tokens`, `output_tokens`, and `thinking_tokens`. Multiply those by matching `rates_usd_per_million.input`, `.output`, and `.thinking`, sum, divide by 1,000,000, and multiply by `fx.applied_rate` to reconstruct `last_turn_cost` and `cumulative_cost` respectively. Input rates already reflect the requested cache assumption (falling back to fresh pricing when no cache rate is known). Thinking history is not resent in this scenario.

`thinking_application` is `automatic_applied`, `automatic_ignored` (capability not confirmed; applied tokens are zero), or `explicit_override`. Explicit overrides charge the supplied tokens at the reasoning rate, falling back to the output rate, even when capability metadata is absent. Global assumptions record the requested heuristic scenario; per-model applied usage records what was charged.

`provenance` includes the package version and SHA-256 of the bundled `pricing-snapshot.js` file bytes. Per-row provenance identifies the actual pricing source, including legacy reference rows. The digest identifies the bundled snapshot, not verification of every model's price.

Use `--file ./prompt.md` to read a file (missing files fail with ENOENT), or `cat prompt.md | runlog price --stdin` to read standard input. Exactly one input source is required. Quoted positional prompts remain supported and are always literal text, even if a matching file exists.

Analyzer warnings are qualitative review cues. Legacy numeric waste and monthly savings fields are `null`: no before/after benchmark supports a numerical reduction or efficacy claim. The warning score is a heuristic flag weight, not measured waste.
