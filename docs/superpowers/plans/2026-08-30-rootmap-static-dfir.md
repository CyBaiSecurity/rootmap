# RootMap Static Migration and DFIR Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver RootMap as a no-build HTML/CSS/vanilla-JavaScript application and align its DFIR methodology with NIST SP 800-86 while preserving the useful Web and practical DFIR content.

**Architecture:** A static `index.html` loads dependency-free ES modules and a JSON manifest through relative URLs. The browser and a dependency-free Node validation script share strict content/graph logic; hash navigation and localStorage provide routing and progress without a backend.

**Tech Stack:** HTML5, CSS, JavaScript ES modules, JSON, SVG, Node built-in test runner for development verification, GitHub Pages, Vercel

**Spec:** `docs/superpowers/specs/2026-08-30-rootmap-static-dfir-design.md`

## Global Constraints

- Production requires no package installation, transpilation, bundling, framework runtime, build command, backend, or server-side function.
- Production code has no npm imports and all production paths are relative.
- RootMap never executes commands; tool syntax is copy-only.
- Preserve Web node IDs, WSTG v4.2 references, GraphQL finding behavior, local progress, responsive behavior, and accessible interaction.
- NIST SP 800-86 is the DFIR process backbone but is not represented as legal advice, a complete investigative procedure, or the source of modern product-specific commands.
- Do not commit, push, merge, reset, clean, stash, or rewrite repository history during delegated implementation.

---

### Task 1: Dependency-free content contract and converted data

**Files:**
- Create: `js/content.js`, `data/manifest.json`, `data/methodologies/web.json`, `data/methodologies/graphql.json`, `data/methodologies/dfir.json`, `data/tools.json`, `data/resources.json`, `scripts/validate-content.js`
- Test: `tests/content.test.js`

**Interfaces:**
- Produces: `validateAndMergeContent(documents): RootMapContent`
- Produces: `loadProjectContent(manifestUrl): Promise<RootMapContent>`
- Produces: CLI exit `0` with a record-count summary for valid project data and nonzero with actionable errors for invalid data.

- [ ] Write `tests/content.test.js` first using `node:test`; cover unknown keys, non-HTTPS URLs, duplicate category/node/finding IDs, missing tool/resource/next/finding references, cross-category parents, parent cycles, empty required arrays, and successful loading of the real project JSON.
- [ ] Run `node --test tests/content.test.js` and confirm it fails because `js/content.js` does not exist.
- [ ] Implement strict dependency-free validation in `js/content.js`, keeping fetch injection optional so tests exercise real parsing/validation without network mocks.
- [ ] Convert current YAML records to JSON without losing Web/GraphQL IDs, text, tools, resources, findings, or next-step references; introduce independent `schemaVersion`, `domain`, category `group`/`description`, and node `record`/`cautions`/`sourceRefs` fields.
- [ ] Implement `scripts/validate-content.js` with filesystem-backed manifest loading and the production validator.
- [ ] Run `node --test tests/content.test.js` and `node scripts/validate-content.js`; correct every schema or cross-reference failure.

### Task 2: Graph, hash navigation, and resilient progress

**Files:**
- Create: `js/graph.js`, `js/navigation.js`, `js/progress.js`
- Test: `tests/graph.test.js`, `tests/navigation.test.js`, `tests/progress.test.js`

**Interfaces:**
- Produces: `createGraph(content)` with `categories`, `nodesById`, `rootsByCategory`, `childrenByParent`, `toolsById`, `resourcesById`, and `checklistNodeIdsByDomain`.
- Produces: `parseHash(hash)`, `serializeHash(state)`, and `resolveNavigation(candidate, graph)`.
- Produces: `readProgress(storage, eligibleIds)`, `writeProgress(storage, state)`, and `toggleNode(state, nodeId)`.

- [ ] Write graph tests first proving stable category/root/child order, all 47 existing DFIR nodes plus new NIST nodes remain addressable, and flattening a category includes every descendant exactly once.
- [ ] Run the focused graph test and confirm failure because the module is missing.
- [ ] Implement `createGraph` and descendant traversal, then run the graph tests to green.
- [ ] Write navigation tests first for map/checklist round trips, encoded IDs, empty/malformed hashes, stale nodes, cross-domain mismatch, and back/forward-compatible resolution.
- [ ] Run the focused navigation test red, implement the hash functions, and run it green.
- [ ] Write progress tests first for absent/malformed/wrong-version storage, throwing `getItem`/`setItem`, duplicate IDs, stale IDs, domain totals, and immutable toggling.
- [ ] Run the focused progress test red, implement failure-safe versioned progress, and run all three state suites green.

### Task 3: Static accessible application shell and complete views

**Files:**
- Create: `index.html`, `assets/styles.css`, `assets/icons.svg`, `js/app.js`, `js/views/header.js`, `js/views/categories.js`, `js/views/map.js`, `js/views/checklist.js`, `js/views/detail.js`
- Test: `tests/view-models.test.js`

**Interfaces:**
- Consumes: Tasks 1–2 content, graph, navigation, and progress modules.
- Produces: `startApp({ document, window, manifestUrl })` and focused render functions that update their owned semantic region.

- [ ] Write pure view-model tests first proving category grouping, complete nested Map/Checklist rows, selected/completed states, domain-scoped totals, safe optional sections, and finding labels that use the actual destination title rather than hard-coded GraphQL copy.
- [ ] Run `node --test tests/view-models.test.js` and confirm the missing view modules fail.
- [ ] Implement the semantic HTML shell and focused DOM renderers with event delegation, local SVG symbols, system fonts, accessible live regions, visible focus, and no inline event handlers.
- [ ] Implement `app.js` boot, hash change handling, domain/view/category/node actions, completion toggles, next/finding navigation, external links, and clipboard success/failure feedback.
- [ ] Port the accepted dark responsive visual language from `src/styles.css`, correct category-specific descriptions, and render all descendants in both modes.
- [ ] Run the view-model tests plus all existing static tests; resolve every failure without adding dependencies.

### Task 4: Faithful NIST SP 800-86 DFIR methodology

**Files:**
- Modify: `data/methodologies/dfir.json`, `data/resources.json`, `data/tools.json`
- Test: `tests/dfir-methodology.test.js`

**Interfaces:**
- Produces: grouped DFIR categories for `Process` and `Evidence Sources` and section-level provenance through `sourceRefs`.

- [ ] Write DFIR invariant tests first requiring Forensic Readiness plus Collection/Examination/Analysis/Reporting; files, OS/volatile, network, and application evidence-source coverage; acquisition priority factors; original/master/working copy separation; tool-impact records; alternative hypotheses; inconclusive analysis; audience/limitations reporting; and NIST scope/legal cautions.
- [ ] Run `node --test tests/dfir-methodology.test.js` and confirm it fails on the current converted content.
- [ ] Add the missing readiness, acquisition-plan, application-source, analysis-quality, and reporting nodes; revise existing process nodes to match NIST Sections 2–8.
- [ ] Retain accurate disk, memory, PCAP, Windows, Linux, logs, and malware guidance as labeled supplements/modernizations; replace blanket isolation/shutdown instructions, primary MD5 use, automatic admissibility language, and unsupported attribution/intent claims.
- [ ] Add concrete `record`, `cautions`, and section-level `sourceRefs` to DFIR nodes; ensure commands remain non-executing examples and sensitive actions carry authorization warnings.
- [ ] Run the focused methodology test, content validator, and complete Node suite to green.

### Task 5: Static hosting, documentation, and legacy removal

**Files:**
- Create: `.nojekyll`, `.github/workflows/pages.yml`, `vercel.json`
- Modify: `README.md`, `RootMap.md`, `.gitignore`
- Remove after verification: `src/`, `content/`, `dist/`, `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`
- Test: `tests/static-assets.test.js`

**Interfaces:**
- Produces: a GitHub Pages workflow that runs Node tests/validation and uploads the repository static artifact without a build step.
- Produces: Vercel configuration with no build command and static root output.

- [ ] Write the static-assets test first to parse `index.html` and `data/manifest.json`, resolve every local production URL relative to the repository, and reject absolute-root asset paths or imports of React, Vite, TypeScript, YAML, Zod, Lucide, or npm packages.
- [ ] Run the focused test and confirm it fails while the legacy runtime is present.
- [ ] Add `.nojekyll`, the Pages workflow, and Vercel static configuration; rewrite README setup/deployment/content-authoring/NIST attribution instructions.
- [ ] Remove legacy framework sources, YAML duplicates, generated Vite output, npm manifests, and obsolete TS/TSX tests only after the replacement tests and validator pass.
- [ ] Run the static-assets test, full Node test suite, validator, and `git diff --check`.

### Task 6: Independent browser and deployment verification

**Files:**
- Modify only files implicated by a reproduced verification failure.

**Interfaces:**
- Produces: verified desktop/mobile static behavior and clean hosted-path behavior.

- [ ] Run `node --test tests/*.test.js`, `node scripts/validate-content.js`, `node --check` over every `.js` file, and `git diff --check`; record exact counts and exit results.
- [ ] Start an ordinary static HTTP server at the repository root and request `index.html`, the manifest, every manifest entry, every JavaScript module, CSS, and SVG asset.
- [ ] In Chromium at 1536×1024, exercise Web/DFIR switching, grouped categories, Map/Checklist parity, child selection, next/finding routing, hash refresh/back navigation, persistence, clipboard status, and external-resource links.
- [ ] In Chromium at 390×844, repeat core navigation and inspect for horizontal overflow, clipping, unreadable controls, and inaccessible focus.
- [ ] Confirm zero console errors, zero failed resource requests, dependency-free production source, and no regression in WSTG/GraphQL/DFIR node availability.
- [ ] If any defect appears, add a failing automated regression test where feasible, fix the smallest responsible unit, rerun the focused check, and then repeat the complete verification gate.

