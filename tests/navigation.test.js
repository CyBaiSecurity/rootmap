import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  parseHash,
  serializeHash,
  resolveNavigation,
} from '../js/navigation.js'
import { createGraph } from '../js/graph.js'
import { validateAndMergeContent, validateManifest } from '../js/content.js'

function loadRealProjectGraph() {
  const dataDir = path.join(process.cwd(), 'data')
  const manifest = validateManifest(
    JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8')),
  )
  const methodologies = manifest.methodologies.map((p) =>
    JSON.parse(fs.readFileSync(path.join(dataDir, p), 'utf8')),
  )
  const tools = manifest.tools.map((p) =>
    JSON.parse(fs.readFileSync(path.join(dataDir, p), 'utf8')),
  )
  const resources = manifest.resources.map((p) =>
    JSON.parse(fs.readFileSync(path.join(dataDir, p), 'utf8')),
  )
  const content = validateAndMergeContent({ methodologies, tools, resources })
  return createGraph(content)
}

describe('Hash Navigation Parsing, Serialization, and Safe Fallbacks', () => {
  describe('parseHash', () => {
    it('parses valid map view hash paths', () => {
      const parsed = parseHash('#/web/information-gathering/web-identify-technologies?view=map')
      assert.deepEqual(parsed, {
        domain: 'web',
        categoryId: 'information-gathering',
        nodeId: 'web-identify-technologies',
        view: 'map',
      })
    })

    it('parses valid checklist view hash paths', () => {
      const parsed = parseHash('#/dfir/dfir-collection/dfir-collect-preserve-evidence?view=checklist')
      assert.deepEqual(parsed, {
        domain: 'dfir',
        categoryId: 'dfir-collection',
        nodeId: 'dfir-collect-preserve-evidence',
        view: 'checklist',
      })
    })

    it('handles hashes without leading slashes or query strings', () => {
      const parsed = parseHash('#web/configuration/web-test-network-configuration')
      assert.deepEqual(parsed, {
        domain: 'web',
        categoryId: 'configuration',
        nodeId: 'web-test-network-configuration',
        view: 'map',
      })
    })

    it('decodes URI encoded segment parameters', () => {
      const parsed = parseHash('#/web/info%2Dgathering/web%2Dnode?view=map')
      assert.deepEqual(parsed, {
        domain: 'web',
        categoryId: 'info-gathering',
        nodeId: 'web-node',
        view: 'map',
      })
    })

    it('returns empty object or safe partials for empty, malformed, or blank hashes', () => {
      assert.deepEqual(parseHash(''), {
        domain: undefined,
        categoryId: undefined,
        nodeId: undefined,
        view: 'map',
      })
      assert.deepEqual(parseHash('#'), {
        domain: undefined,
        categoryId: undefined,
        nodeId: undefined,
        view: 'map',
      })
      assert.deepEqual(parseHash('#/'), {
        domain: undefined,
        categoryId: undefined,
        nodeId: undefined,
        view: 'map',
      })
      assert.deepEqual(parseHash('#junk-without-slashes'), {
        domain: 'junk-without-slashes',
        categoryId: undefined,
        nodeId: undefined,
        view: 'map',
      })
    })
  })

  describe('serializeHash', () => {
    it('serializes state into standard hash string', () => {
      const hash = serializeHash({
        domain: 'web',
        categoryId: 'information-gathering',
        nodeId: 'web-identify-technologies',
        view: 'map',
      })
      assert.equal(hash, '#/web/information-gathering/web-identify-technologies?view=map')
    })

    it('serializes checklist mode', () => {
      const hash = serializeHash({
        domain: 'dfir',
        categoryId: 'dfir-disk',
        nodeId: 'dfir-disk-verify-image',
        view: 'checklist',
      })
      assert.equal(hash, '#/dfir/dfir-disk/dfir-disk-verify-image?view=checklist')
    })

    it('falls back mode property to view', () => {
      const hash = serializeHash({
        domain: 'web',
        categoryId: 'sessions',
        nodeId: 'web-test-cookie-attributes',
        mode: 'checklist',
      })
      assert.equal(hash, '#/web/sessions/web-test-cookie-attributes?view=checklist')
    })
  })

  describe('Round-trip hash parsing and serialization', () => {
    it('round-trips state cleanly', () => {
      const original = {
        domain: 'web',
        categoryId: 'authentication',
        nodeId: 'web-test-password-policy',
        view: 'map',
      }
      const serialized = serializeHash(original)
      const parsed = parseHash(serialized)
      assert.deepEqual(parsed, original)
    })
  })

  describe('resolveNavigation with Real Project Graph', () => {
    const graph = loadRealProjectGraph()

    it('resolves valid candidate state directly', () => {
      const candidate = {
        domain: 'web',
        categoryId: 'information-gathering',
        nodeId: 'web-identify-technologies',
        view: 'map',
      }
      const resolved = resolveNavigation(candidate, graph)
      assert.deepEqual(resolved, candidate)
    })

    it('resolves empty or malformed candidate to first valid web node', () => {
      const resolved = resolveNavigation({}, graph)
      assert.equal(resolved.domain, 'web')
      assert.equal(resolved.categoryId, 'information-gathering')
      assert.equal(resolved.nodeId, 'web-search-reconnaissance')
      assert.equal(resolved.view, 'map')
    })

    it('resolves dfir domain request with missing node to first dfir root node', () => {
      const resolved = resolveNavigation({ domain: 'dfir' }, graph)
      assert.equal(resolved.domain, 'dfir')
      assert.equal(resolved.categoryId, 'dfir-readiness')
      assert.equal(resolved.nodeId, 'dfir-readiness-plan')
      assert.equal(resolved.view, 'map')
    })

    it('resolves valid category with missing/stale node to first root in that category', () => {
      const resolved = resolveNavigation(
        {
          domain: 'web',
          categoryId: 'authorization',
          nodeId: 'stale-or-deleted-node',
        },
        graph,
      )
      assert.equal(resolved.domain, 'web')
      assert.equal(resolved.categoryId, 'authorization')
      assert.equal(resolved.nodeId, 'web-test-directory-traversal')
      assert.equal(resolved.view, 'map')
    })

    it('resolves child node and automatically corrects categoryId', () => {
      // web-graphql-overview is in information-gathering with parent web-identify-technologies
      const resolved = resolveNavigation(
        {
          domain: 'web',
          categoryId: 'wrong-category',
          nodeId: 'web-graphql-overview',
        },
        graph,
      )
      assert.equal(resolved.domain, 'web')
      assert.equal(resolved.categoryId, 'information-gathering')
      assert.equal(resolved.nodeId, 'web-graphql-overview')
    })

    it('corrects cross-domain mismatch safely without crashing', () => {
      // Request dfir node while domain was given as web
      const resolved = resolveNavigation(
        {
          domain: 'web',
          categoryId: 'dfir-collection',
          nodeId: 'dfir-collect-preserve-evidence',
        },
        graph,
      )
      // When node is valid, its actual domain and category take precedence
      assert.equal(resolved.domain, 'dfir')
      assert.equal(resolved.categoryId, 'dfir-collection')
      assert.equal(resolved.nodeId, 'dfir-collect-preserve-evidence')
    })

    it('preserves checklist view across resolution', () => {
      const resolved = resolveNavigation(
        {
          domain: 'dfir',
          view: 'checklist',
        },
        graph,
      )
      assert.equal(resolved.domain, 'dfir')
      assert.equal(resolved.view, 'checklist')
    })
  })
})
