# RootMap MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only OWASP WSTG v4.2 methodology navigator with Map and Checklist views backed by one validated content graph, local progress, node details, and one GraphQL finding branch.

**Architecture:** A React + TypeScript + Vite client loads version-controlled YAML through an eager content loader. Zod validates methodology, tool, resource, finding, and cross-reference contracts before the UI consumes a normalized graph. React owns selected view/node/finding state; a versioned localStorage record owns checklist completion, with no server, account, scanner, AI, or tool execution.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, YAML, Zod, Lucide React, CSS

**Spec:** `RootMap.md`

## Global Constraints

- MVP domain is Web only; DFIR, steganography, OSINT implementation, MITRE mappings, and AI are excluded.
- Canonical methodology release is OWASP WSTG v4.2; source links must use `/v42/`, not mutable `stable` links.
- Included WSTG categories are Information Gathering, Configuration, Authentication, Authorization, Sessions, Input Validation, Business Logic, and Client-Side.
- Map and Checklist are views of the same graph.
- Finding navigation is deterministic and content-driven; GraphQL is the single specialized MVP branch.
- Commands are copyable text only and are never executed.
- Checklist state is local to the browser and uses a versioned storage envelope.
- The accepted visual references are `docs/design/rootmap-map-mode.png` and `docs/design/rootmap-checklist-mode.png`.

---

### Task 1: Project and content-contract foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`
- Create: `src/content/schema.ts`, `src/content/loadContent.ts`, `src/content/graph.ts`
- Test: `src/content/loadContent.test.ts`, `src/content/graph.test.ts`

**Interfaces:**
- Produces: `loadContent(files: ContentFiles): RootMapContent`
- Produces: `createGraph(content: RootMapContent): MethodologyGraph`
- `MethodologyGraph` exposes `categories`, `nodesById`, `childrenByParent`, `toolsById`, and `resourcesById`.

- [x] Write a failing loader test proving malformed YAML, duplicate IDs, missing parents, missing tool/resource references, and missing finding destinations are rejected with actionable messages.
- [x] Run `npm test -- src/content/loadContent.test.ts` and confirm failure because the loader does not exist.
- [x] Add the minimal Vite/Vitest configuration, Zod schemas, YAML parsing, and reference validation needed to pass the loader contract.
- [x] Run `npm test -- src/content/loadContent.test.ts` and confirm it passes.
- [x] Write a failing graph test proving ordered roots/children and O(1) ID lookups are produced from valid content.
- [x] Implement `createGraph` with `Map`-backed lookups and ordered child arrays, then run `npm test -- src/content/graph.test.ts` and the complete suite.

### Task 2: Versioned MVP content

**Files:**
- Create: `content/methodologies/web/wstg-v42.yaml`
- Create: `content/methodologies/web/graphql.yaml`
- Create: `content/tools/web.yaml`
- Create: `content/resources/web.yaml`
- Test: `src/content/projectContent.test.ts`

**Interfaces:**
- Consumes: Task 1 schemas and loader.
- Produces: validated WSTG category/node records, reusable tools/resources, and finding `graphql-detected -> web-graphql-overview`.

- [x] Write a failing project-content test that loads the real YAML and asserts the eight exact categories, version `4.2`, versioned OWASP URLs, required node-detail fields, and the GraphQL branch reference.
- [x] Run `npm test -- src/content/projectContent.test.ts` and confirm failure because project content is absent.
- [x] Add the eight category roots and the WSTG v4.2 scenario hierarchy at the agreed MVP depth; paraphrase concise goals/checklists and retain WSTG IDs and attribution.
- [x] Add only referenced tool records, resource records with authority tier/role, and the GraphQL branch required by the selected finding.
- [x] Run the project-content test and complete suite; correct every validation or reference failure.

### Task 3: Shared selection and local progress state

**Files:**
- Create: `src/state/progress.ts`, `src/state/useProgress.ts`, `src/state/navigation.ts`
- Test: `src/state/progress.test.ts`, `src/state/navigation.test.ts`

**Interfaces:**
- Produces: `readProgress(storage): ProgressState`, `writeProgress(storage, state): void`, and `toggleNode(state, nodeId): ProgressState`.
- Produces: navigation transitions for mode selection, node selection, and finding destination selection.

- [x] Write failing tests proving an absent, malformed, or wrong-version localStorage value becomes an empty v1 progress state and valid completion IDs survive reload.
- [x] Implement the minimal versioned persistence functions and hook; run the focused tests to green.
- [x] Write failing tests proving mode changes preserve selection and a finding action selects its declared destination.
- [x] Implement the navigation reducer and run all state tests plus the complete suite.

### Task 4: Approved application shell, Map, and node details

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `src/components/AppHeader.tsx`, `src/components/CategoryRail.tsx`, `src/components/MapView.tsx`, `src/components/NodeDetail.tsx`
- Test: `src/App.map.test.tsx`

**Interfaces:**
- Consumes: Task 1 graph and Task 3 state.
- Produces: accessible Map mode with category/node selection and a complete detail panel.

- [x] Write a failing interaction test that selects a map node and observes its Goal, Checklist, Tools, What to look for, Possible findings, Next steps, and Resources.
- [x] Run `npm test -- src/App.map.test.tsx` and confirm failure because the UI is absent.
- [x] Extract design tokens from `rootmap-map-mode.png`, implement the three-column shell and Map state using focused components, and keep all UI copy code-native.
- [x] Implement copy-only command controls, external-resource links, keyboard focus styles, and missing-optional-section behavior.
- [x] Run the focused test and complete suite to green.

### Task 5: Checklist and finding branch

**Files:**
- Create: `src/components/ChecklistView.tsx`, `src/components/ModeSwitch.tsx`
- Modify: `src/App.tsx`, `src/styles.css`, `src/components/NodeDetail.tsx`
- Test: `src/App.checklist.test.tsx`, `src/App.findings.test.tsx`

**Interfaces:**
- Consumes: shared graph, progress hook, and navigation reducer.
- Produces: Checklist mode over the same node IDs and deterministic GraphQL-branch navigation.

- [x] Write a failing test proving a node checked in Checklist mode updates progress and remains checked after unmount/remount with the same storage.
- [x] Implement grouped checklist rows and versioned persistence; run the focused test to green.
- [x] Write a failing test proving `GraphQL detected` reveals and activates `Open GraphQL testing branch` without executing any external action.
- [x] Implement the finding action and branch selection; run both focused tests and the complete suite.
- [x] Match `rootmap-checklist-mode.png` without adding filters, search, workflow fields, metrics, or dashboard cards.

### Task 6: Responsive and completion verification

**Files:**
- Modify: `src/styles.css` and affected components only when verification exposes a concrete defect.
- Create: `README.md`

**Interfaces:**
- Produces: runnable and documented MVP with verified desktop/mobile behavior.

- [x] Run `npm test`, `npm run typecheck`, and `npm run build`; resolve every failure and warning.
- [x] Start the Vite app and verify Map selection, Checklist persistence, category expansion, resource links, command copying, and GraphQL navigation in a real browser.
- [x] Capture desktop screenshots at 1536×1024 for both modes and a mobile screenshot; inspect for overflow, clipping, focus visibility, and readable content.
- [x] Use `view_image` on each accepted concept and latest matching render, record at least five fidelity comparisons, and correct visible drift.
- [x] Add a concise README with install, test, build, run, content-layout, and WSTG v4.2 attribution instructions.
- [x] Re-run the full verification commands after documentation and cleanup.

> Status: All MVP tasks implemented and verified. Retheme to light pastel leaf-green + white applied 2026-08-29 (single-file CSS change, build/typecheck/21 tests green).
