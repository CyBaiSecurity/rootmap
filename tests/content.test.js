import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  validateAndMergeContent,
  loadProjectContent,
  validateManifest,
} from '../js/content.js'

function validCategory(overrides = {}) {
  return {
    id: 'info-gathering',
    domain: 'web',
    group: 'Web Security Testing',
    title: 'Information Gathering',
    description: 'Reconnaissance and fingerprinting.',
    order: 1,
    ...overrides,
  }
}

function validNode(overrides = {}) {
  return {
    id: 'web-fingerprint',
    domain: 'web',
    wstgId: 'WSTG-INFO-01',
    title: 'Fingerprint Web Server',
    category: 'info-gathering',
    order: 1,
    goal: 'Identify the web server and version.',
    why: 'Directs targeted vulnerability analysis.',
    checklist: ['Inspect response headers.', 'Probe error pages.'],
    lookFor: ['Server header tokens.'],
    record: 'Document banner strings and proxy headers.',
    cautions: ['Do not run aggressive scans without written authorization.'],
    tools: ['curl'],
    resources: ['wstg-info'],
    sourceRefs: [
      {
        resourceId: 'wstg-info',
        sections: ['4.1'],
        relationship: 'backbone',
      },
    ],
    findings: [],
    nextSteps: [],
    ...overrides,
  }
}

function validTool(overrides = {}) {
  return {
    id: 'curl',
    name: 'curl',
    description: 'Command line tool for transferring data with URLs.',
    officialUrl: 'https://curl.se/docs/',
    examples: [
      {
        context: 'Inspect headers',
        syntax: 'curl -I https://target.example',
      },
    ],
    ...overrides,
  }
}

function validResource(overrides = {}) {
  return {
    id: 'wstg-info',
    title: 'OWASP WSTG Information Gathering',
    url: 'https://owasp.org/www-project-web-security-testing-guide/v42/',
    tier: 1,
    role: 'Methodology',
    ...overrides,
  }
}

function validDocuments(overrides = {}) {
  return {
    methodologies: [
      {
        schemaVersion: 1,
        domain: 'web',
        sourceVersion: 'OWASP WSTG 4.2',
        categories: [validCategory()],
        nodes: [validNode()],
      },
    ],
    tools: [
      {
        schemaVersion: 1,
        tools: [validTool()],
      },
    ],
    resources: [
      {
        schemaVersion: 1,
        resources: [validResource()],
      },
    ],
    ...overrides,
  }
}

describe('Content Schema and Document Validation', () => {
  it('successfully validates and merges valid documents into RootMapContent', () => {
    const docs = validDocuments()
    const content = validateAndMergeContent(docs)

    assert.equal(content.schemaVersion, 1)
    assert.equal(content.categories.length, 1)
    assert.equal(content.nodes.length, 1)
    assert.equal(content.tools.length, 1)
    assert.equal(content.resources.length, 1)
    assert.equal(content.categories[0].id, 'info-gathering')
    assert.equal(content.nodes[0].id, 'web-fingerprint')
    assert.equal(content.tools[0].id, 'curl')
    assert.equal(content.resources[0].id, 'wstg-info')
  })

  describe('Manifest Validation', () => {
    it('validates a correct manifest structure', () => {
      const manifest = {
        schemaVersion: 1,
        methodologies: ['data/methodologies/web.json'],
        tools: ['data/tools.json'],
        resources: ['data/resources.json'],
      }
      assert.deepEqual(validateManifest(manifest), manifest)
    })

    it('rejects manifest with non-integer or missing schemaVersion', () => {
      assert.throws(
        () => validateManifest({ methodologies: [], tools: [], resources: [] }),
        /schemaVersion.*required|integer/i,
      )
      assert.throws(
        () =>
          validateManifest({
            schemaVersion: '1',
            methodologies: ['a'],
            tools: ['b'],
            resources: ['c'],
          }),
        /schemaVersion.*integer/i,
      )
    })

    it('rejects manifest with empty or non-array methodology, tool, or resource lists', () => {
      assert.throws(
        () =>
          validateManifest({
            schemaVersion: 1,
            methodologies: [],
            tools: ['data/tools.json'],
            resources: ['data/resources.json'],
          }),
        /methodologies.*non-empty array/i,
      )
    })

    it('rejects manifest with unknown keys', () => {
      assert.throws(
        () =>
          validateManifest({
            schemaVersion: 1,
            methodologies: ['data/methodologies/web.json'],
            tools: ['data/tools.json'],
            resources: ['data/resources.json'],
            extraProp: true,
          }),
        /unknown property.*extraProp/i,
      )
    })
  })

  describe('Unknown Keys Rejection', () => {
    it('rejects unknown keys on methodology root', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode()],
            extraMethodologyKey: 'disallowed',
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /unknown.*extraMethodologyKey/i)
    })

    it('rejects unknown keys on category records', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory({ rogueField: 123 })],
            nodes: [validNode()],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /unknown.*rogueField/i)
    })

    it('rejects unknown keys on node records', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ unexpectedProperty: 'bad' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /unknown.*unexpectedProperty/i)
    })

    it('rejects unknown keys on finding records', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({
                findings: [
                  {
                    id: 'sample-finding',
                    title: 'Sample finding',
                    next: ['web-fingerprint'],
                    unexpectedKey: true,
                  },
                ],
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /unknown.*unexpectedKey/i)
    })

    it('rejects unknown keys on sourceRefs records', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({
                sourceRefs: [
                  {
                    resourceId: 'wstg-info',
                    sections: ['4.1'],
                    relationship: 'backbone',
                    extraRefProp: 'no',
                  },
                ],
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /unknown.*extraRefProp/i)
    })

    it('rejects unknown keys on tool records', () => {
      const docs = validDocuments({
        tools: [
          {
            schemaVersion: 1,
            tools: [validTool({ disallowedToolAttr: 'bad' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /unknown.*disallowedToolAttr/i)
    })

    it('rejects unknown keys on resource records', () => {
      const docs = validDocuments({
        resources: [
          {
            schemaVersion: 1,
            resources: [validResource({ rogueResourceField: 'bad' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /unknown.*rogueResourceField/i)
    })
  })

  describe('URL HTTPS and Protocol Enforcement', () => {
    it('rejects non-HTTPS URLs in tools', () => {
      const docs = validDocuments({
        tools: [
          {
            schemaVersion: 1,
            tools: [validTool({ officialUrl: 'http://curl.se/docs/' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /https.*officialUrl/i)
    })

    it('rejects non-HTTPS URLs in resources', () => {
      const docs = validDocuments({
        resources: [
          {
            schemaVersion: 1,
            resources: [validResource({ url: 'http://owasp.org/wstg' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /https.*url/i)
    })

    it('rejects malformed URLs', () => {
      const docs = validDocuments({
        resources: [
          {
            schemaVersion: 1,
            resources: [validResource({ url: 'not-a-valid-url' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /invalid URL/i)
    })
  })

  describe('Duplicate ID Rejection', () => {
    it('rejects duplicate category IDs', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory(), validCategory()],
            nodes: [validNode()],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /duplicate category.*info-gathering/i)
    })

    it('rejects duplicate node IDs across files', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode()],
          },
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [],
            nodes: [validNode()],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /duplicate node.*web-fingerprint/i)
    })

    it('rejects duplicate finding IDs globally', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({
                id: 'node-1',
                findings: [
                  {
                    id: 'dup-finding',
                    title: 'Finding 1',
                    next: ['node-1'],
                  },
                ],
              }),
              validNode({
                id: 'node-2',
                order: 2,
                findings: [
                  {
                    id: 'dup-finding',
                    title: 'Finding 2',
                    next: ['node-2'],
                  },
                ],
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /duplicate finding.*dup-finding/i)
    })

    it('rejects duplicate tool IDs', () => {
      const docs = validDocuments({
        tools: [
          {
            schemaVersion: 1,
            tools: [validTool(), validTool()],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /duplicate tool.*curl/i)
    })

    it('rejects duplicate resource IDs', () => {
      const docs = validDocuments({
        resources: [
          {
            schemaVersion: 1,
            resources: [validResource(), validResource()],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /duplicate resource.*wstg-info/i)
    })
  })

  describe('ID Format Validation', () => {
    it('rejects invalid ID format with uppercase or special characters', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory({ id: 'Invalid_ID!' })],
            nodes: [validNode({ category: 'Invalid_ID!' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /invalid ID.*Invalid_ID!/i)
    })
  })

  describe('Missing Reference Validation', () => {
    it('rejects node referencing missing category', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ category: 'non-existent-cat' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /missing category.*non-existent-cat/i)
    })

    it('rejects node referencing missing parent', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ parent: 'non-existent-parent' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /missing parent.*non-existent-parent/i)
    })

    it('rejects node referencing missing tool', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ tools: ['missing-tool'] })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /missing tool.*missing-tool/i)
    })

    it('rejects node referencing missing resource', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ resources: ['missing-resource'] })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /missing resource.*missing-resource/i)
    })

    it('rejects sourceRef referencing missing resource', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({
                sourceRefs: [
                  {
                    resourceId: 'ghost-resource',
                    sections: ['1.0'],
                    relationship: 'backbone',
                  },
                ],
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /missing resource.*ghost-resource/i)
    })

    it('rejects node referencing missing nextStep', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ nextSteps: ['missing-step'] })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /missing next step.*missing-step/i)
    })

    it('rejects finding referencing missing destination node', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({
                findings: [
                  {
                    id: 'found-vuln',
                    title: 'Vulnerability found',
                    next: ['missing-destination-node'],
                  },
                ],
              }),
            ],
          },
        ],
      })
      assert.throws(
        () => validateAndMergeContent(docs),
        /missing destination.*missing-destination-node/i,
      )
    })
  })

  describe('Domain and Category Boundaries', () => {
    it('rejects node whose domain does not match its methodology file domain', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory({ id: 'web-cat', domain: 'web' })],
            nodes: [validNode({ id: 'node-dfir', domain: 'dfir', category: 'web-cat' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /domain "dfir" does not match methodology file domain "web"/i)
    })

    it('rejects node whose domain does not match its category domain', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory({ id: 'web-cat', domain: 'web' })],
            nodes: [],
          },
          {
            schemaVersion: 1,
            domain: 'dfir',
            sourceVersion: 'NIST SP 800-86',
            categories: [validCategory({ id: 'dfir-cat', domain: 'dfir', group: 'Process' })],
            nodes: [validNode({ id: 'node-dfir', domain: 'dfir', category: 'web-cat' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /Domain mismatch: node "node-dfir" \(dfir\) does not match category "web-cat" \(web\)/i)
    })

    it('rejects cross-category parent relationships', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [
              validCategory({ id: 'cat-1', order: 1 }),
              validCategory({ id: 'cat-2', order: 2 }),
            ],
            nodes: [
              validNode({ id: 'parent-node', category: 'cat-1' }),
              validNode({
                id: 'child-node',
                category: 'cat-2',
                parent: 'parent-node',
                order: 2,
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /parent.*different category/i)
    })

    it('rejects cross-domain parent relationships', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory({ id: 'web-cat', domain: 'web' })],
            nodes: [validNode({ id: 'web-parent', domain: 'web', category: 'web-cat' })],
          },
          {
            schemaVersion: 1,
            domain: 'dfir',
            sourceVersion: 'NIST SP 800-86',
            categories: [
              validCategory({
                id: 'dfir-cat',
                domain: 'dfir',
                group: 'Process',
              }),
            ],
            nodes: [
              validNode({
                id: 'dfir-child',
                domain: 'dfir',
                category: 'dfir-cat',
                parent: 'web-parent',
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /parent.*different/i)
    })
  })

  describe('Parent Cycles Detection', () => {
    it('rejects self-referencing parent cycle', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ id: 'self-loop', parent: 'self-loop' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /cycle.*self-loop/i)
    })

    it('rejects two-node direct parent cycle', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({ id: 'node-a', parent: 'node-b' }),
              validNode({ id: 'node-b', parent: 'node-a', order: 2 }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /cycle.*node-a|node-b/i)
    })

    it('rejects multi-node transitive parent cycle', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({ id: 'node-a', parent: 'node-c', order: 1 }),
              validNode({ id: 'node-b', parent: 'node-a', order: 2 }),
              validNode({ id: 'node-c', parent: 'node-b', order: 3 }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /cycle/i)
    })
  })

  describe('Empty and Required Fields Validation', () => {
    it('rejects empty checklist array', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ checklist: [] })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /checklist.*at least 1/i)
    })

    it('rejects empty lookFor array', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [validNode({ lookFor: [] })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /lookFor.*at least 1/i)
    })

    it('rejects finding with empty next destinations array', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({
                findings: [
                  {
                    id: 'empty-next-finding',
                    title: 'Empty Next',
                    next: [],
                  },
                ],
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /finding.*next.*at least 1/i)
    })

    it('rejects invalid resource role enum', () => {
      const docs = validDocuments({
        resources: [
          {
            schemaVersion: 1,
            resources: [validResource({ role: 'InvalidRole' })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /invalid role.*InvalidRole/i)
    })

    it('rejects invalid sourceRef relationship enum', () => {
      const docs = validDocuments({
        methodologies: [
          {
            schemaVersion: 1,
            domain: 'web',
            sourceVersion: 'OWASP WSTG 4.2',
            categories: [validCategory()],
            nodes: [
              validNode({
                sourceRefs: [
                  {
                    resourceId: 'wstg-info',
                    sections: ['1.0'],
                    relationship: 'invalid-rel',
                  },
                ],
              }),
            ],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /invalid relationship.*invalid-rel/i)
    })

    it('rejects resource tier out of range 1..4', () => {
      const docs = validDocuments({
        resources: [
          {
            schemaVersion: 1,
            resources: [validResource({ tier: 5 })],
          },
        ],
      })
      assert.throws(() => validateAndMergeContent(docs), /tier.*1.*4/i)
    })
  })

  describe('loadProjectContent with custom fetch', () => {
    it('fetches manifest and all referenced files and validates them', async () => {
      const fakeFiles = {
        'https://example.com/data/manifest.json': JSON.stringify({
          schemaVersion: 1,
          methodologies: ['methodologies/web.json'],
          tools: ['tools.json'],
          resources: ['resources.json'],
        }),
        'https://example.com/data/methodologies/web.json': JSON.stringify({
          schemaVersion: 1,
          domain: 'web',
          sourceVersion: 'OWASP WSTG 4.2',
          categories: [validCategory()],
          nodes: [validNode()],
        }),
        'https://example.com/data/tools.json': JSON.stringify({
          schemaVersion: 1,
          tools: [validTool()],
        }),
        'https://example.com/data/resources.json': JSON.stringify({
          schemaVersion: 1,
          resources: [validResource()],
        }),
      }

      const mockFetch = async (url) => {
        const urlStr = String(url)
        if (fakeFiles[urlStr]) {
          return {
            ok: true,
            status: 200,
            json: async () => JSON.parse(fakeFiles[urlStr]),
          }
        }
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => {
            throw new Error('Not Found')
          },
        }
      }

      const content = await loadProjectContent(
        'https://example.com/data/manifest.json',
        mockFetch,
      )
      assert.equal(content.schemaVersion, 1)
      assert.equal(content.nodes.length, 1)
    })

    it('resolves a relative manifest and its files under a GitHub Pages project path', async () => {
      const requested = []
      const fakeFiles = {
        'https://example.com/RootMap/data/manifest.json': { schemaVersion: 1, methodologies: ['methodologies/web.json'], tools: ['tools.json'], resources: ['resources.json'] },
        'https://example.com/RootMap/data/methodologies/web.json': { schemaVersion: 1, domain: 'web', sourceVersion: 'OWASP WSTG 4.2', categories: [validCategory()], nodes: [validNode()] },
        'https://example.com/RootMap/data/tools.json': { schemaVersion: 1, tools: [validTool()] },
        'https://example.com/RootMap/data/resources.json': { schemaVersion: 1, resources: [validResource()] },
      }
      const mockFetch = async (url) => {
        requested.push(String(url))
        const body = fakeFiles[String(url)]
        return { ok: Boolean(body), status: body ? 200 : 404, json: async () => body }
      }

      const content = await loadProjectContent('data/manifest.json', mockFetch, 'https://example.com/RootMap/')
      assert.equal(content.nodes.length, 1)
      assert.deepEqual(requested, Object.keys(fakeFiles))
    })

    it('throws when manifest request returns non-ok response', async () => {
      const mockFetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Error',
      })
      await assert.rejects(
        () => loadProjectContent('https://example.com/data/manifest.json', mockFetch),
        /failed to load manifest/i,
      )
    })
  })

  describe('Real Project JSON Validation', () => {
    it('validates the real project data files cleanly without errors', () => {
      const manifestPath = path.resolve(process.cwd(), 'data/manifest.json')
      if (!fs.existsSync(manifestPath)) {
        // Skip if files haven't been created yet in RED phase
        return
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      validateManifest(manifest)
      const manifestDir = path.dirname(manifestPath)

      const methodologies = manifest.methodologies.map((relPath) =>
        JSON.parse(fs.readFileSync(path.resolve(manifestDir, relPath), 'utf8')),
      )
      const tools = manifest.tools.map((relPath) =>
        JSON.parse(fs.readFileSync(path.resolve(manifestDir, relPath), 'utf8')),
      )
      const resources = manifest.resources.map((relPath) =>
        JSON.parse(fs.readFileSync(path.resolve(manifestDir, relPath), 'utf8')),
      )

      const content = validateAndMergeContent({
        methodologies,
        tools,
        resources,
      })

      assert.equal(content.schemaVersion, 1)
      assert.ok(content.categories.length >= 19)
      assert.ok(content.nodes.length >= 106)
      assert.ok(content.tools.length >= 25)
      assert.ok(content.resources.length >= 57)

      // Ensure finding graphql-detected points to web-graphql-overview
      const graphqlFinding = content.nodes
        .flatMap((n) => n.findings)
        .find((f) => f.id === 'graphql-detected')
      assert.ok(graphqlFinding)
      assert.deepEqual(graphqlFinding.next, ['web-graphql-overview'])

      // Ensure DFIR memory dump finding points to dfir-mem-triage
      const memFinding = content.nodes
        .flatMap((n) => n.findings)
        .find((f) => f.id === 'dfir-collect-memory-dump-captured')
      assert.ok(memFinding)
      assert.ok(memFinding.next.includes('dfir-mem-triage'))
    })
  })
})
