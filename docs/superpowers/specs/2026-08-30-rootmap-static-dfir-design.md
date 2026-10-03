# RootMap Static Migration and DFIR Methodology Design

## Status

Approved for implementation on 2026-08-30. The user approved a no-build vanilla JavaScript single-page application with static JSON content and hash-based navigation.

## Goal

Replace the React/TypeScript/Vite implementation with a directly deployable HTML/CSS/vanilla-JavaScript site while preserving the Web methodology experience and restructuring DFIR around NIST SP 800-86.

## Deployment contract

- Production consists only of static HTML, CSS, JavaScript, JSON, SVG, and repository documentation.
- Running or deploying the site requires no package installation, transpilation, bundling, framework runtime, or server-side function.
- All production paths are relative and work from a GitHub Pages project subpath, a custom domain, and Vercel.
- GitHub Pages deploys the repository as a static artifact without a build step.
- Vercel serves the repository root as a static site without a framework preset or build command.
- Local development may use any ordinary static HTTP server. Opening through `file://` is not a supported runtime because browser fetch security differs from HTTP hosting.

## Application architecture

`index.html` contains the accessible shell and a deterministic boot-error region. `js/app.js` loads the manifest, validates content, constructs the graph, restores navigation and progress, and coordinates renderers. Focused ES modules own content loading, graph construction, URL state, browser storage, and each major view. No production module imports an npm package.

Static JSON remains human-editable and is loaded through `data/manifest.json`. The manifest lists methodology, tool, and resource files. The same dependency-free validation code is used by the browser and by `scripts/validate-content.js`, ensuring deployed content and CI enforce one contract.

Hash URLs use the form `#/domain/category/node?view=map` or `#/domain/category/node?view=checklist`. Invalid or stale hashes fall back to the first valid node in the requested domain without throwing. Navigation updates the hash, and browser back/forward navigation restores application state.

## Proposed file responsibilities

- `index.html`: semantic shell, metadata, noscript notice, boot target, and relative module entry point.
- `assets/styles.css`: retained dark visual language, responsive layouts, visible focus, reduced-motion support, and grouped DFIR navigation.
- `assets/icons.svg`: local SVG symbol sprite; no icon library or external font request.
- `js/app.js`: application startup and event coordination.
- `js/content.js`: manifest loading, strict validation, HTTPS enforcement, and cross-reference checks.
- `js/graph.js`: ordered lookup maps, parent/child traversal, domain/category groupings, and cycle detection.
- `js/navigation.js`: hash parsing, serialization, fallback resolution, and history integration.
- `js/progress.js`: versioned localStorage access, stale-ID reconciliation, and failure-safe reads/writes.
- `js/views/header.js`: domain/view controls and domain-scoped progress.
- `js/views/categories.js`: category groups and category selection.
- `js/views/map.js`: complete hierarchical tree, including child nodes.
- `js/views/checklist.js`: complete grouped checklist, including child nodes.
- `js/views/detail.js`: goal, rationale, steps, records to preserve, cautions, tools, copy-only commands, evidence cues, findings, next steps, and references.
- `data/manifest.json`: relative list of content files and schema version.
- `data/methodologies/web.json`: current WSTG v4.2 methodology converted without losing IDs or guidance.
- `data/methodologies/graphql.json`: current GraphQL branch converted without losing its finding destination.
- `data/methodologies/dfir.json`: revised NIST-backed DFIR process and evidence-source guidance.
- `data/tools.json`, `data/resources.json`: converted reusable records with HTTPS-only external links.
- `scripts/validate-content.js`: dependency-free Node entry point that loads the same JSON and calls the production validator.
- `tests/*.test.js`: dependency-free `node:test` coverage for validation, graph traversal, navigation, progress, and methodology invariants.
- `.github/workflows/pages.yml`: test, validate, and upload the static repository artifact to GitHub Pages.
- `vercel.json`: explicit static/no-build Vercel configuration.

## Content contract

The root content schema has an independent integer `schemaVersion`; Web keeps `sourceVersion: "OWASP WSTG 4.2"`, while DFIR keeps `sourceVersion: "NIST SP 800-86 (2006) with clearly labeled modern supplements"`. Category records include `id`, `domain`, `group`, `title`, `description`, and `order`.

Methodology nodes retain the useful current fields and add:

- `domain`: `web` or `dfir`, eliminating ID-prefix inference.
- `record`: concrete facts, outputs, hashes, decisions, or limitations the analyst should document.
- `cautions`: authorization, privacy, evidence-integrity, destructive-action, uncertainty, or tool-impact warnings.
- `sourceRefs`: objects containing `resourceId`, `sections`, and `relationship`, where relationship is `backbone`, `supplement`, or `modernization`.

Unknown fields are rejected. IDs are globally unique. Finding IDs are globally unique. Parents must exist in the same domain and category. Parent cycles are rejected. Tool, resource, finding destination, and next-step references must exist. All rendered external URLs must use HTTPS.

## DFIR information architecture

DFIR has two visible axes represented as category groups.

### Process backbone

1. Forensic Readiness — policy, authority, roles, privacy, retention, prepared toolkits, and logging readiness from NIST SP 800-86 Section 2.
2. Collection — identify sources, create an acquisition plan, prioritize by likely value/volatility/effort, acquire, verify, and document custody per Sections 3.1, 4.2, 5.2, 6.3, and 7.3.
3. Examination — work from verified copies; reduce, extract, normalize, and assess relevant data without changing evidence per Section 3.2.
4. Analysis — test competing hypotheses, correlate sources, distinguish fact from inference, and permit an inconclusive result per Sections 3.3, 4.4, 5.3, 6.4, 7.4, and 8.
5. Reporting — document methods and limitations, tailor results to the audience, identify actionable leads, and review process improvements per Sections 3.4 and 3.5.

### Evidence-source workflows

- Files and filesystems — Section 4, including logical versus bit-stream acquisition, master/working copies, write protection, integrity verification, headers, deleted data, metadata, timelines, and encryption limitations.
- Operating systems and volatile data — Section 5, including live-state risk decisions, trusted tool impact, volatility ordering, shutdown choice, filesystem/OS artifacts, and modern Windows/Linux/memory supplements.
- Network traffic — Section 6, including source fidelity, collection authority/privacy, incomplete capture limitations, multi-source corroboration, and cautious attacker identification.
- Applications and logs — Section 7, including application architecture, components, authentication, logs, data, client variants, and correlation across filesystem, OS, and network sources.
- Malware triage — clearly labeled practitioner modernization, linked back to the applicable collection/examination/analysis phase rather than presented as direct NIST procedure.

Current practical Windows, Linux, memory, PCAP, log, disk, and malware guidance remains where accurate, but every node is labeled by source relationship. NIST is not cited as the source of modern commands or product-specific procedures it does not contain.

## Safety and epistemic constraints

- RootMap never executes forensic or security tools; commands remain copy-only.
- The DFIR interface displays that NIST SP 800-86 is IT-oriented guidance, not an all-inclusive investigation procedure or legal advice.
- Isolation, live response, shutdown, monitoring, password recovery, credential extraction, and external-party contact are conditional decisions governed by authorization, policy, evidence value, operational impact, and legal advice.
- MD5 may appear only as a legacy interoperability value; SHA-256 or stronger is the primary integrity digest.
- Guidance must not claim evidence is automatically admissible or that an artifact proves identity, intent, attribution, or causation without corroboration.
- Analysis explicitly separates observed facts, analyst inferences, alternative explanations, limitations, and unanswered questions.
- The application stores completion/navigation preferences only; it does not ask users to place case evidence, credentials, personal data, or investigation notes in localStorage.

## Interaction and accessibility

Map and Checklist render the same complete graph, not only category roots. Category groups distinguish process from evidence sources. Completion controls expose checked state to assistive technology. Copy actions report success or failure through an accessible live region. All interactive elements are keyboard reachable, focus remains visible, and external links identify that they open a new tab.

The existing desktop three-column composition remains, with the detail panel moving below the workspace at medium widths and all regions stacking on mobile. The site uses system fonts and local SVG icons to avoid external runtime requests.

## Error handling

Content fetch, JSON parsing, schema validation, and graph construction errors stop application boot and render an accessible error summary. Missing storage or clipboard permission does not crash the application; the user receives feedback and the rest of the site remains usable. Invalid hash state resolves to valid content and replaces the malformed hash.

## Verification

- `node --test tests/*.test.js` covers content validation, graph completeness, navigation round trips/fallbacks, storage failures, stale-ID reconciliation, and NIST content invariants.
- `node scripts/validate-content.js` validates every production JSON file and cross-reference.
- `node --check` validates every production and test JavaScript file.
- A local static server smoke check confirms `index.html`, all manifest entries, CSS, SVG, and JavaScript return successfully.
- Chromium QA covers Web/DFIR switching, Map/Checklist parity, nested-node selection, hash refresh/back navigation, progress persistence, copy feedback, boot errors, external links, desktop layout, and 390-pixel mobile layout with no console errors, failed requests, or horizontal overflow.

## Migration boundary

After parity is demonstrated, remove the React/TypeScript/Vite source, YAML copies, Vite build output, TypeScript configuration, npm dependency manifests, and obsolete tests. Preserve product documentation, accepted design images, git history, and the approved static migration documents.

