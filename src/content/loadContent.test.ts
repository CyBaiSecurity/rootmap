import { describe, expect, it } from 'vitest'

import { loadContent, type ContentFiles } from './loadContent'

const validMethodology = `
version: "4.2"
categories:
  - id: information-gathering
    title: Information Gathering
    order: 1
nodes:
  - id: web-identify-technologies
    wstgId: WSTG-v42-INFO-08
    title: Identify technologies
    category: information-gathering
    order: 1
    goal: Identify the target technology stack.
    checklist: [Inspect response headers.]
    lookFor: [Framework fingerprints.]
    tools: [curl]
    resources: [owasp-wstg-info-08]
    findings:
      - id: graphql-detected
        title: GraphQL detected
        next: [web-graphql-overview]
  - id: web-graphql-overview
    title: GraphQL testing branch
    category: information-gathering
    parent: web-identify-technologies
    order: 2
    goal: Scope a GraphQL endpoint.
    checklist: [Confirm the endpoint.]
    lookFor: [GraphQL responses.]
    tools: [curl]
    resources: [graphql-docs]
`

const validTools = `
tools:
  - id: curl
    name: curl
    description: Transfer data with URLs.
    officialUrl: https://curl.se/docs/
    examples: []
`

const validResources = `
resources:
  - id: owasp-wstg-info-08
    title: OWASP WSTG — Fingerprint Web Application Framework
    url: https://owasp.org/www-project-web-security-testing-guide/v42/
    tier: 1
    role: Methodology
  - id: graphql-docs
    title: GraphQL documentation
    url: https://graphql.org/learn/
    tier: 2
    role: Documentation
`

function files(overrides: Partial<ContentFiles> = {}): ContentFiles {
  return {
    methodologies: [validMethodology],
    tools: [validTools],
    resources: [validResources],
    ...overrides,
  }
}

describe('loadContent', () => {
  it('rejects malformed YAML instead of returning partial content', () => {
    expect(() => loadContent(files({ methodologies: ['nodes: ['] }))).toThrow(
      /methodology file 1.*YAML/i,
    )
  })

  it('rejects duplicate IDs across methodology files', () => {
    expect(() =>
      loadContent(files({ methodologies: [validMethodology, validMethodology] })),
    ).toThrow(/duplicate category id.*information-gathering/i)
  })

  it('rejects a node whose parent does not exist', () => {
    const invalid = validMethodology.replace(
      'parent: web-identify-technologies',
      'parent: missing-node',
    )
    expect(() => loadContent(files({ methodologies: [invalid] }))).toThrow(
      /web-graphql-overview.*missing parent.*missing-node/i,
    )
  })

  it('rejects missing tool and resource references', () => {
    const invalid = validMethodology.replace('tools: [curl]', 'tools: [missing-tool]')
    expect(() => loadContent(files({ methodologies: [invalid] }))).toThrow(
      /web-identify-technologies.*missing tool.*missing-tool/i,
    )
  })

  it('rejects a finding whose destination does not exist', () => {
    const invalid = validMethodology.replace(
      'next: [web-graphql-overview]',
      'next: [missing-destination]',
    )
    expect(() => loadContent(files({ methodologies: [invalid] }))).toThrow(
      /graphql-detected.*missing destination.*missing-destination/i,
    )
  })
})
