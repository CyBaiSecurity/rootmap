import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  createGraph,
  getCategoryDescendants,
  getNodeAndDescendants,
} from '../js/graph.js'
import { validateAndMergeContent, validateManifest } from '../js/content.js'

function sampleContent() {
  return {
    schemaVersion: 1,
    sourceVersions: {
      web: 'OWASP WSTG 4.2',
    },
    categories: [
      {
        id: 'category-b',
        domain: 'web',
        group: 'Web Security Testing',
        title: 'Category B',
        description: 'Second category.',
        order: 2,
      },
      {
        id: 'category-a',
        domain: 'web',
        group: 'Web Security Testing',
        title: 'Category A',
        description: 'First category.',
        order: 1,
      },
    ],
    nodes: [
      {
        id: 'root-2',
        domain: 'web',
        title: 'Root Two',
        category: 'category-a',
        order: 2,
        goal: 'Goal 2',
        checklist: ['Step 2'],
        lookFor: ['Cue 2'],
        record: 'Record 2',
        cautions: [],
        tools: [],
        resources: [],
        sourceRefs: [],
        findings: [],
        nextSteps: [],
      },
      {
        id: 'child-1-2',
        domain: 'web',
        title: 'Child One Two',
        category: 'category-a',
        parent: 'root-1',
        order: 2,
        goal: 'Goal 1-2',
        checklist: ['Step 1-2'],
        lookFor: ['Cue 1-2'],
        record: 'Record 1-2',
        cautions: [],
        tools: [],
        resources: [],
        sourceRefs: [],
        findings: [],
        nextSteps: [],
      },
      {
        id: 'root-1',
        domain: 'web',
        title: 'Root One',
        category: 'category-a',
        order: 1,
        goal: 'Goal 1',
        checklist: ['Step 1'],
        lookFor: ['Cue 1'],
        record: 'Record 1',
        cautions: [],
        tools: ['tool-curl'],
        resources: ['res-wstg'],
        sourceRefs: [],
        findings: [],
        nextSteps: [],
      },
      {
        id: 'child-1-1',
        domain: 'web',
        title: 'Child One One',
        category: 'category-a',
        parent: 'root-1',
        order: 1,
        goal: 'Goal 1-1',
        checklist: ['Step 1-1'],
        lookFor: ['Cue 1-1'],
        record: 'Record 1-1',
        cautions: [],
        tools: [],
        resources: [],
        sourceRefs: [],
        findings: [],
        nextSteps: [],
      },
      {
        id: 'grandchild-1-1-1',
        domain: 'web',
        title: 'Grandchild One One One',
        category: 'category-a',
        parent: 'child-1-1',
        order: 1,
        goal: 'Goal 1-1-1',
        checklist: ['Step 1-1-1'],
        lookFor: ['Cue 1-1-1'],
        record: 'Record 1-1-1',
        cautions: [],
        tools: [],
        resources: [],
        sourceRefs: [],
        findings: [],
        nextSteps: [],
      },
      {
        id: 'root-b-1',
        domain: 'web',
        title: 'Root B One',
        category: 'category-b',
        order: 1,
        goal: 'Goal B 1',
        checklist: ['Step B 1'],
        lookFor: ['Cue B 1'],
        record: 'Record B 1',
        cautions: [],
        tools: [],
        resources: [],
        sourceRefs: [],
        findings: [],
        nextSteps: [],
      },
    ],
    tools: [
      {
        id: 'tool-curl',
        name: 'cURL',
        description: 'Command line URL tool',
        officialUrl: 'https://curl.se/docs/',
        examples: [],
      },
    ],
    resources: [
      {
        id: 'res-wstg',
        title: 'WSTG',
        url: 'https://owasp.org/wstg',
        tier: 1,
        role: 'Methodology',
      },
    ],
  }
}

function loadRealProjectContent() {
  const rootDir = process.cwd()
  const dataDir = path.join(rootDir, 'data')
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
  return validateAndMergeContent({ methodologies, tools, resources })
}

describe('Methodology Graph Construction and Traversal', () => {
  it('orders categories, roots, and child nodes stably by order then title without mutating source', () => {
    const content = sampleContent()
    const originalNodeIds = content.nodes.map((n) => n.id)
    const graph = createGraph(content)

    // Categories sorted by order
    assert.deepEqual(
      graph.categories.map((c) => c.id),
      ['category-a', 'category-b'],
    )

    // Category A roots sorted by order
    const rootsA = graph.rootsByCategory.get('category-a')
    assert.ok(rootsA)
    assert.deepEqual(
      rootsA.map((n) => n.id),
      ['root-1', 'root-2'],
    )

    // root-1 children sorted by order
    const childrenRoot1 = graph.childrenByParent.get('root-1')
    assert.ok(childrenRoot1)
    assert.deepEqual(
      childrenRoot1.map((n) => n.id),
      ['child-1-1', 'child-1-2'],
    )

    // Source arrays not mutated
    assert.deepEqual(
      content.nodes.map((n) => n.id),
      originalNodeIds,
    )
  })

  it('provides fast map lookups for nodes, tools, and resources', () => {
    const content = sampleContent()
    const graph = createGraph(content)

    assert.equal(graph.nodesById.get('root-1')?.title, 'Root One')
    assert.equal(graph.nodesById.get('grandchild-1-1-1')?.title, 'Grandchild One One One')
    assert.equal(graph.toolsById.get('tool-curl')?.name, 'cURL')
    assert.equal(graph.resourcesById.get('res-wstg')?.title, 'WSTG')
  })

  it('flattens a category into complete pre-order descendant list where each node appears once', () => {
    const content = sampleContent()
    const graph = createGraph(content)

    const descendantsA = getCategoryDescendants(graph, 'category-a')
    assert.deepEqual(
      descendantsA.map((n) => n.id),
      ['root-1', 'child-1-1', 'grandchild-1-1-1', 'child-1-2', 'root-2'],
    )

    const descendantsB = getCategoryDescendants(graph, 'category-b')
    assert.deepEqual(
      descendantsB.map((n) => n.id),
      ['root-b-1'],
    )
  })

  it('flattens a specific node subtree into pre-order list', () => {
    const content = sampleContent()
    const graph = createGraph(content)

    const subtree = getNodeAndDescendants(graph, 'root-1')
    assert.deepEqual(
      subtree.map((n) => n.id),
      ['root-1', 'child-1-1', 'grandchild-1-1-1', 'child-1-2'],
    )
  })

  it('generates domain-scoped checklist node IDs in hierarchical traversal order', () => {
    const content = sampleContent()
    const graph = createGraph(content)

    const webChecklist = graph.checklistNodeIdsByDomain.get('web')
    assert.ok(webChecklist)
    assert.deepEqual(webChecklist, [
      'root-1',
      'child-1-1',
      'grandchild-1-1-1',
      'child-1-2',
      'root-2',
      'root-b-1',
    ])
  })

  describe('Real Project Content Graph Invariants', () => {
    it('indexes every project node with zero missing or orphan nodes', () => {
      const content = loadRealProjectContent()
      const graph = createGraph(content)

      assert.equal(graph.nodesById.size, content.nodes.length)
      assert.equal(graph.categories.length, content.categories.length)
      assert.equal(graph.toolsById.size, 25)
      assert.equal(graph.resourcesById.size, 57)

      // Check all 47 DFIR nodes exist and are addressable
      const dfirNodes = content.nodes.filter((n) => n.domain === 'dfir')
      assert.ok(dfirNodes.length >= 48)
      for (const node of dfirNodes) {
        assert.ok(graph.nodesById.has(node.id), `DFIR node ${node.id} must be in nodesById`)
      }

      // Check all 59 Web nodes exist and are addressable
      const webNodes = content.nodes.filter((n) => n.domain === 'web')
      assert.equal(webNodes.length, 59)
      for (const node of webNodes) {
        assert.ok(graph.nodesById.has(node.id), `Web node ${node.id} must be in nodesById`)
      }

      // Every category flattening contains every node in that category
      for (const cat of graph.categories) {
        const expectedCount = content.nodes.filter((n) => n.category === cat.id).length
        const flattened = getCategoryDescendants(graph, cat.id)
        assert.equal(
          flattened.length,
          expectedCount,
          `Category ${cat.id} flattened count (${flattened.length}) must match expected (${expectedCount})`,
        )
        const uniqueIds = new Set(flattened.map((n) => n.id))
        assert.equal(uniqueIds.size, flattened.length, `Category ${cat.id} must not have duplicate flattened nodes`)
      }

      // Checklist node IDs for Web and DFIR include every node in domain
      const webChecklist = graph.checklistNodeIdsByDomain.get('web')
      assert.equal(webChecklist.length, 59)
      const dfirChecklist = graph.checklistNodeIdsByDomain.get('dfir')
      assert.equal(dfirChecklist.length, dfirNodes.length)
    })
  })
})
