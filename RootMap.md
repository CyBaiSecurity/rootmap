# RootMap implementation record

> Status: static migration implemented; verification passed
> Architecture: no-build HTML/CSS/vanilla JavaScript/JSON/SVG
> Deployment targets: GitHub Pages and Vercel

## Product scope

RootMap helps practitioners answer what to check, why it matters, what evidence to preserve, what to record, which cautions apply, and where a finding should lead next.

Current domains:

- Web security assessment based on OWASP WSTG 4.2, with a GraphQL branch
- DFIR based on NIST SP 800-86 and organized by both forensic phase and evidence source

## Runtime architecture

`index.html` loads `assets/styles.css` and `js/app.js` directly. The application fetches `data/manifest.json`, validates every referenced JSON document in-browser, builds indexes in memory, and renders a hash-routed single-page interface. Relative URLs make the same files portable to a repository subpath.

The content graph keeps methodologies, tools, resources, findings, and provenance separate. Validation rejects malformed records, duplicate IDs, broken parent or next-step links, unknown keys, non-HTTPS references, and parent cycles.

Completion state is versioned and stored only in `localStorage`. If storage is unavailable, the app remains usable for the current session.

## DFIR model

The process backbone is:

1. Forensic readiness
2. Collection
3. Examination
4. Analysis
5. Reporting

Evidence-source branches cover files/filesystems, operating-system and volatile data, network traffic, Windows and Linux artifacts, applications/logs, and malware triage.

The NIST integration includes policy and role readiness, acquisition prioritization by likely value/volatility/effort, conditional containment, master and working copy separation, tool-impact recording, source fidelity, alternate hypotheses, inconclusive outcomes, audience-aware reporting, limitations, and process review.

## Hosting

The GitHub Pages workflow runs the dependency-free test suite and content validator, then uploads the repository root with no build. Vercel serves the same repository as a static project. Neither target requires npm, Vite, TypeScript, React, a server runtime, or generated `dist` files.

## Deferred scope

- Steganography methodology
- Accounts or synchronized progress
- Server-side scanning, command execution, or AI features
