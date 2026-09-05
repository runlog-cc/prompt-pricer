# RunLog Prompt Pricer 0.1.0

Offline CLI for heuristic prompt token counts and estimated model costs. It does
not read editor sessions, meter actual usage, or provide a paid editor extension.
The bundled model catalog's original verification date is unknown: prices and EUR
conversion are reference assumptions, not current provider quotes. Review/update
`models-data.js` from provider pricing pages and record source/date before relying
on a catalog release for budgeting. Output and thinking token counts are estimated.

Install the downloaded versioned release archive with Node.js 20+:

```sh
npm install --global ./runlog-prompt-pricer-0.1.0.tgz
runlog price --currency USD --models gpt-4o "Summarize this document"
runlog price --turns 3 ./prompt.md
```

`--turns` models a conversation using an assumed 600 additional tokens per past
turn. `--cached` applies catalog caching estimates. No network requests are made.
Test from source with `npm test`; package using `npm pack`. Registry publication
is optional and not assumed by these install instructions.
