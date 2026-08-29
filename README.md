# RootMap

RootMap is a browser-based OWASP Web Security Testing Guide navigator. It presents one version-controlled methodology graph as an exploratory Map and a persistent Checklist, with tools, command examples, evidence cues, findings, next steps, and categorized resources attached to each check.

## MVP scope

- Web security testing only
- OWASP WSTG v4.2 content across eight approved categories
- Map and Checklist views over the same graph
- Browser-local checklist progress
- Deterministic GraphQL finding branch
- Copyable command examples that are never executed by the application

DFIR, steganography, OSINT implementation, accounts, server synchronization, scanning, AI assistance, and tool execution are intentionally outside this MVP.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

## Content layout

```text
content/
├── methodologies/web/
├── tools/
└── resources/
```

YAML is parsed and validated before the application builds its normalized graph. Validation rejects malformed content, duplicate IDs, and missing category, parent, tool, resource, next-step, or finding references.

Checklist progress is stored under the versioned browser key `rootmap:progress`. No assessment data leaves the browser.

## Methodology attribution

The methodology hierarchy and identifiers are based on [OWASP WSTG v4.2](https://owasp.org/www-project-web-security-testing-guide/v42/). RootMap uses versioned links so references remain stable. OWASP WSTG material is provided under the Creative Commons Attribution-ShareAlike 4.0 license; RootMap’s concise guidance is paraphrased and links back to the authoritative guide.
