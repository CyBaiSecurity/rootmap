# RootMap

RootMap is a dependency-free methodology navigator for Web security testing and digital forensics and incident response (DFIR). It ships as plain HTML, CSS, JavaScript, JSON, and SVG, so GitHub Pages and Vercel can serve the repository directly without a package install or build step.

## Features

- Map and Checklist views backed by one validated content graph
- OWASP WSTG 4.2 Web testing methodology plus a GraphQL branch
- NIST SP 800-86-based DFIR workflow: readiness, collection, examination, analysis, and reporting
- Evidence-source branches for filesystems, volatile/OS data, network traffic, Windows and Linux artifacts, applications/logs, and malware triage
- Source provenance, tool documentation, safe command examples, findings, and next-step routing
- Browser-local completion state; assessment progress is not transmitted

## Run locally

The site must be served over HTTP because browsers do not allow module/JSON loading from `file://` pages.

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## Verify

No dependencies are required; use a current Node.js release:

```bash
node --test tests/*.test.js
node scripts/validate-content.js
```

## Deploy

- GitHub Pages: https://cybaisecurity.github.io/rootmap/ . `.github/workflows/pages.yml` validates and uploads the repository as-is. Pages builds from that workflow.
- Vercel: import the repository. The included `vercel.json` sets `cleanUrls` to true and `trailingSlash` to false, and no build command or output directory is needed.

All asset references are relative, so the site works from a GitHub project subpath such as `/rootmap/`.

## Structure

```text
index.html                 Loads assets/styles.css and js/app.js
assets/                    styles.css, icons.svg, favicon.svg
js/                        app, content, graph, navigation, progress, views
data/manifest.json         Lists the content files
data/methodologies/web.json       Web methodology
data/methodologies/graphql.json   Web methodology file (domain web)
data/methodologies/dfir.json      DFIR methodology
data/tools.json
data/resources.json
scripts/validate-content.js
tests/                     node --test
.github/workflows/pages.yml
vercel.json                cleanUrls true, trailingSlash false
```

## Methodology note

DFIR follows NIST SP 800-86: readiness, collection, examination, analysis, and reporting. A finding can stay inconclusive. The pages keep alternate hypotheses, source limits, and privacy limits in the write-up. The app does not run commands. Command text stays in the content.
