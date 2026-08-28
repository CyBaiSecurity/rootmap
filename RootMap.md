# Cybersecurity Methodology Navigator — Validated Plan

> **Status:** Approved for build · **MVP:** Web (OWASP WSTG) only · **Sequence:** Spec → Build → Verify
> **Implementation:** Antigravity CLI (`agy`) orchestrated with human-in-the-loop (plan-first, review every iteration). Free models only; fallback Claude → GPT → Gemini.
> **Decisions:** MVP scope = Web/WSTG only (DFIR/Stego deferred). Run #1 = technical spec (node schema, repo structure, MVP requirements) for review. Run #2 = implementation from approved spec.
> **Progress:** 2026-08-28 — spec run in progress. See [[Hermes_Brain/Projects/RootMap]] for project log.

## 1. Product Goal

Build a web-based cybersecurity methodology navigator inspired by OSINT Framework and HackTricks, but focused on **guided investigation workflow** rather than being a giant collection of links.

The application should answer:

- What should I check next?
- Why should I check it?
- Which tools can help?
- What should I look for in the output?
- What findings should change my next step?
- Where can I learn more?

The main MVP domains are:

1. Web Security Testing
2. DFIR
3. Steganography

OSINT will **not** be reimplemented. The app can simply point users to OSINT Framework.

---

## 2. Validated Methodology Sources

### Web Security Testing

**Primary source: OWASP Web Security Testing Guide (WSTG)**

Why:

- Open source and community maintained.
- Designed specifically for web application security testing.
- Structured into identifiable testing scenarios.
- Provides a real testing methodology rather than only vulnerability descriptions.
- Covers information gathering, configuration, identity, authentication, authorization, sessions, input validation, business logic, client-side testing, and more.

The application should use OWASP WSTG as the canonical Web methodology backbone.

Example hierarchy:

```text
Web
├── Information Gathering
├── Configuration & Deployment
├── Identity Management
├── Authentication
├── Authorization
├── Session Management
├── Input Validation
├── Error Handling
├── Cryptography
├── Business Logic
└── Client-Side Testing
```

### Additional Web Sources

These should supplement WSTG rather than replace it:

- OWASP Cheat Sheet Series
- PortSwigger Web Security Academy
- HackTricks
- PayloadsAllTheThings
- Official documentation for detected technologies
- Vendor/framework security documentation

Examples:

```text
Technology detected: JWT
→ JWT-specific methodology branch

Technology detected: GraphQL
→ GraphQL testing branch

Technology detected: WordPress
→ WordPress-specific enumeration branch

Technology detected: Spring
→ Java/Spring-specific checks

Technology detected: Laravel
→ Laravel/PHP-specific checks
```

### MITRE ATT&CK / Cyber Kill Chain

These should **not** be the main Web methodology.

Reason:

- MITRE ATT&CK describes adversary techniques and behaviors.
- Cyber Kill Chain models stages of an attack lifecycle.
- Neither is primarily a web penetration-testing checklist.

They may later be used as metadata/mappings.

Example:

```text
Node:
Credential Stuffing

OWASP:
Authentication Testing

MITRE ATT&CK Mapping:
T1110 - Brute Force
```

This gives useful context without distorting the Web methodology.

---

## 3. DFIR Methodology

### Primary foundation: NIST SP 800-86

NIST SP 800-86 provides a practical digital-forensics process:

```text
Collection
    ↓
Examination
    ↓
Analysis
    ↓
Reporting
```

This should be the **process backbone**.

### Current Incident Response Context

Use:

**NIST SP 800-61 Rev. 3**

for modern incident-response context.

Do not use it as a replacement for artifact-specific forensic methodology.

### Practical DFIR Expansion

The app should organize investigation branches by evidence source:

```text
DFIR
├── Disk / Filesystem
├── Memory
├── Network / PCAP
├── Windows Artifacts
├── Linux Artifacts
├── Logs
└── Malware Triage
```

Practical supporting sources can include:

- SANS DFIR posters / cheat sheets
- Sleuth Kit documentation
- Volatility documentation
- Wireshark / TShark documentation
- Microsoft artifact documentation
- Linux documentation
- Velociraptor documentation where relevant

Example:

```text
Disk Image
├── Preserve evidence
├── Hash image
├── Identify image format
├── Identify partition table
├── Identify filesystems
├── Enumerate filesystem
├── Deleted-file analysis
├── Timeline analysis
├── User artifacts
└── Suspicious-file analysis
```

Important distinction:

```text
NIST
= investigation process

Sleuth Kit / Volatility / Wireshark
= technical execution

SANS / practitioner references
= practical workflow enrichment
```

---

## 4. Steganography

There does **not appear to be a single widely accepted open-source steganography methodology equivalent to OWASP WSTG**.

Therefore:

**Do not claim the Stego methodology is an industry standard.**

Instead label it:

> Community-curated Steganography Triage Methodology

Suggested hierarchy:

```text
Steganography
├── Initial Triage
│   ├── Identify actual file type
│   ├── Verify magic bytes
│   ├── Inspect metadata
│   ├── Search strings
│   ├── Detect appended data
│   └── Inspect entropy / structure
│
├── PNG
│   ├── Chunk inspection
│   ├── Extra / malformed chunks
│   ├── Color channels
│   ├── Bit planes
│   └── LSB analysis
│
├── JPEG
│   ├── Metadata
│   ├── Appended data
│   ├── Embedded payloads
│   └── steghide / stegseek checks
│
├── Audio
│   ├── Metadata
│   ├── Spectrogram
│   ├── Frequency anomalies
│   └── Embedded data
│
├── Archives / Polyglots
│   ├── File signatures
│   ├── Nested archives
│   ├── Appended archives
│   └── Polyglot detection
│
└── Encoding / Transformation
    ├── Base encodings
    ├── XOR clues
    ├── Compression
    └── Repeated transformations
```

Sources should mainly be:

- official file-format specifications
- ExifTool documentation
- zsteg documentation
- stegseek / steghide documentation
- binwalk documentation
- ImageMagick documentation
- trusted CTF/research references

---

## 5. Core Data Model

The application should separate:

```text
Methodology
Tools
Resources
Findings
```

### Methodology Node

A methodology node answers:

> What should I investigate?

Example:

```yaml
id: web-info-vhost-enumeration

title: Virtual Host Enumeration

domain: web

parent: information-gathering

goal:
  Discover applications exposed through alternative Host headers.

checklist:
  - identify base hostname
  - establish baseline response
  - fuzz host header
  - compare response status
  - compare response length
  - validate discoveries

tools:
  - ffuf
  - gobuster
  - curl

findings:
  - id: discovered-vhost
    next:
      - web-fingerprint-application
      - web-content-discovery

resources:
  - owsp-wstg-reference
  - ffuf-docs
```

### Tool Object

Tool information should be stored independently.

```yaml
id: ffuf

name: ffuf

description:
  Fast web fuzzer commonly used for content, parameter, and virtual-host discovery.

categories:
  - fuzzing
  - enumeration

official_url: ...

examples:
  - context: directory-discovery
    syntax: "ffuf -u https://target/FUZZ -w wordlist.txt"

  - context: vhost-discovery
    syntax: 'ffuf -u https://target/ -H "Host: FUZZ.target" -w wordlist.txt'
```

One tool may therefore appear in many methodology nodes.

---

## 6. Node UI

Clicking a node should show:

```text
NODE TITLE

Goal
Why this check matters.

Checklist
□ Step
□ Step
□ Step

Tools
ffuf
curl
Burp Suite

Command Examples
...

What to Look For
...

Possible Findings
...

Next Steps
...

Resources
Methodology
Documentation
Learning
Practice
```

---

## 7. Two Main Views

The same methodology dataset should support two interfaces.

### Map Mode

Similar to OSINT Framework:

```text
Web
└── Information Gathering
    ├── Search-engine reconnaissance
    ├── Web-server fingerprinting
    ├── Application enumeration
    ├── Entry-point identification
    └── Architecture mapping
```

### Checklist Mode

```text
Web Assessment

Information Gathering
☑ Fingerprint web server
☑ Identify technologies
☐ Enumerate applications
☐ Identify entry points
☐ Map execution paths

Authentication
☐ Test account enumeration
☐ Test password policy
☐ Test reset flow
...
```

These must be two views of the **same node graph**, not separate content.

---

## 8. Finding-Driven Branching

Nodes should be able to unlock specialized methodology.

Example:

```text
General Web Recon

Finding:
GraphQL detected

        ↓

GraphQL Branch
├── Identify endpoint
├── Test introspection
├── Enumerate schema
├── Authorization testing
├── Query-depth testing
└── Mutation testing
```

Other examples:

```text
JWT detected
→ JWT branch

WordPress detected
→ WordPress branch

NTFS detected
→ Windows filesystem branch

PNG detected
→ PNG steganography branch

Memory image identified
→ Memory Forensics branch
```

This is one of the application's strongest differentiators.

---

## 9. Content Authority Hierarchy

Use a source priority system.

### Tier 1 — Standards / Methodology

- OWASP WSTG
- NIST publications

### Tier 2 — Official Technical Documentation

- Wireshark
- Volatility
- Sleuth Kit
- Ghidra
- Nmap
- ffuf
- ExifTool
- etc.

### Tier 3 — High-Quality Practitioner References

- SANS
- HackTricks
- PayloadsAllTheThings
- respected security research

### Tier 4 — Learning / Practice

- PortSwigger Academy
- picoCTF
- CyberDefenders
- Hack The Box
- TryHackMe

A node should identify what role each resource has rather than presenting every URL equally.

---

## 10. OSINT

Do not recreate OSINT Framework.

The OSINT entry can simply contain:

```text
OSINT

For dedicated OSINT tooling and taxonomy:
→ Visit OSINT Framework
```

Later, OSINT-related nodes can be added only where they support another workflow such as web reconnaissance.

---

## 11. MVP Scope

Do not attempt every cybersecurity discipline.

### Web

Implement the OWASP WSTG hierarchy first.

Focus on:

```text
Information Gathering
Configuration
Authentication
Authorization
Sessions
Input Validation
Business Logic
Client-Side
```

### DFIR

Implement:

```text
Disk
Memory
PCAP
```

### Stego

Implement:

```text
General Triage
PNG
JPEG
Archives / Polyglots
```

This is enough to validate whether the product works.

---

## 12. Content Storage

Prefer version-controlled structured content initially.

```text
content/
├── methodologies/
│   ├── web/
│   ├── dfir/
│   └── stego/
│
├── tools/
│   ├── ffuf.yaml
│   ├── mmls.yaml
│   ├── volatility.yaml
│   ├── tshark.yaml
│   └── zsteg.yaml
│
├── resources/
│
└── mappings/
    ├── mitre.yaml
    └── technologies.yaml
```

Advantages:

- easy Git review
- easy contributions
- easy Codex editing
- no database required for methodology content
- methodology versions can be tracked
- later migration to a CMS/database is possible

User-specific information such as checklist progress can live in the application database separately.

---

## 13. Important Design Rule

The application should **guide investigation, not solve it automatically**.

Its core output should be:

```text
WHAT TO CHECK
WHY
HOW
WHAT TO LOOK FOR
WHAT NEXT
```

Not:

```text
Upload challenge
→ AI gives solution
```

AI can later help interpret results or explain methodology nodes, but the deterministic methodology graph should remain the source of truth.

---

## 14. Validated Architecture Direction

Recommended product concept:

> A web-based interactive cybersecurity methodology navigator that uses trusted testing and forensic frameworks to guide practitioners through investigations, attach relevant tools and resources to each step, and dynamically branch based on findings.

The strongest architectural principle is:

```text
AUTHORITATIVE METHODOLOGY
        ↓
NORMALIZED NODE GRAPH
        ↓
┌─────────────┬──────────────┐
│ Map View    │ Checklist    │
└──────┬──────┴──────┬───────┘
       │             │
       └──────┬──────┘
              ↓
       Finding Branches
              ↓
        Tool / Resource
          References
```

This plan is suitable for handing to Codex after the next phase defines:

1. exact node schema
2. database schema
3. frontend information architecture
4. repository structure
5. MVP feature requirements
6. content ingestion strategy
