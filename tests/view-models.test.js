import test from 'node:test'
import assert from 'node:assert'
import { buildCategoryGroups } from '../js/views/categories.js'
import { buildMapRows } from '../js/views/map.js'
import { buildChecklistRows } from '../js/views/checklist.js'
import { buildDetailViewModel } from '../js/views/detail.js'
import { buildDomainTotals } from '../js/views/header.js'
import { buildHeaderLinks } from '../js/views/header.js'

const mockGraph = {
  categories: [
    { id: 'cat1', domain: 'web', group: 'Phase 1', title: 'Category 1', description: 'Desc 1', order: 1 },
    { id: 'cat2', domain: 'web', group: 'Phase 1', title: 'Category 2', description: 'Desc 2', order: 2 },
    { id: 'cat3', domain: 'web', group: 'Phase 2', title: 'Category 3', description: 'Desc 3', order: 3 },
  ],
  rootsByCategory: new Map([
    ['cat1', [{ id: 'n1', title: 'Node 1', category: 'cat1', domain: 'web' }]],
    ['cat2', [{ id: 'n2', title: 'Node 2', category: 'cat2', domain: 'web' }]],
  ]),
  childrenByParent: new Map([
    ['n1', [{ id: 'n1a', title: 'Node 1A', category: 'cat1', domain: 'web', parent: 'n1' }]]
  ]),
  nodesById: new Map([
    ['n1', {
      id: 'n1',
      title: 'Node 1',
      category: 'cat1',
      domain: 'web',
      why: 'A reason grounded in evidence.',
      checklist: ['Perform the check.'],
      lookFor: ['A concrete evidence cue.'],
      record: 'Record the observation and timestamp.',
      cautions: ['Stay within authorization.'],
      tools: ['tool1'],
      resources: ['res1'],
      sourceRefs: [{ resourceId: 'res1', sections: ['Section 3.1'], relationship: 'backbone' }],
      findings: [{ id: 'f1', title: 'Finding 1', next: ['dest1'] }],
    }],
    ['n1a', { id: 'n1a', title: 'Node 1A', category: 'cat1', domain: 'web', parent: 'n1' }],
    ['n2', { id: 'n2', title: 'Node 2', category: 'cat2', domain: 'web' }],
    ['dest1', { id: 'dest1', title: 'Destination Node Title', category: 'cat3', domain: 'web' }],
  ]),
  toolsById: new Map([
    ['tool1', { id: 'tool1', name: 'Tool One', description: 'A tool.', officialUrl: 'https://example.com/tool', examples: [{ context: 'Inspect', syntax: 'tool --inspect' }] }],
  ]),
  resourcesById: new Map([
    ['res1', { id: 'res1', title: 'Source One', url: 'https://example.com/source', role: 'Methodology' }],
  ]),
  checklistNodeIdsByDomain: new Map([
    ['web', ['n1', 'n1a', 'n2']]
  ])
}

const mockProgress = {
  version: 1,
  completed: ['n1']
}

test('view models: category grouping', () => {
  const groups = buildCategoryGroups(mockGraph, 'web', 'cat2')
  assert.strictEqual(groups.length, 2)
  assert.strictEqual(groups[0].name, 'Phase 1')
  assert.strictEqual(groups[0].categories.length, 2)
  assert.strictEqual(groups[0].categories[0].id, 'cat1')
  assert.strictEqual(groups[0].categories[0].isActive, false)
  assert.strictEqual(groups[0].categories[1].id, 'cat2')
  assert.strictEqual(groups[0].categories[1].isActive, true)
  assert.strictEqual(groups[1].name, 'Phase 2')
  assert.strictEqual(groups[1].categories.length, 1)
})

test('view models: complete nested Map rows', () => {
  const rows = buildMapRows(mockGraph, 'cat1', 'n1a', mockProgress)
  assert.strictEqual(rows.length, 2)
  assert.strictEqual(rows[0].id, 'n1')
  assert.strictEqual(rows[0].depth, 0)
  assert.strictEqual(rows[0].isCompleted, true)
  assert.strictEqual(rows[0].isSelected, false)

  assert.strictEqual(rows[1].id, 'n1a')
  assert.strictEqual(rows[1].depth, 1)
  assert.strictEqual(rows[1].isCompleted, false)
  assert.strictEqual(rows[1].isSelected, true)
})

test('view models: complete nested Checklist rows', () => {
  const rows = buildChecklistRows(mockGraph, 'web', 'n2', mockProgress)
  assert.strictEqual(rows.length, 5) // cat1 header, n1, n1a, cat2 header, n2
  
  assert.strictEqual(rows[0].type, 'category')
  assert.strictEqual(rows[0].title, 'Category 1')
  
  assert.strictEqual(rows[1].type, 'node')
  assert.strictEqual(rows[1].id, 'n1')
  assert.strictEqual(rows[1].isCompleted, true)
  
  assert.strictEqual(rows[2].type, 'node')
  assert.strictEqual(rows[2].id, 'n1a')
  
  assert.strictEqual(rows[3].type, 'category')
  
  assert.strictEqual(rows[4].type, 'node')
  assert.strictEqual(rows[4].id, 'n2')
  assert.strictEqual(rows[4].isSelected, true)
})

test('view models: domain-scoped totals', () => {
  const totals = buildDomainTotals(mockGraph, 'web', mockProgress)
  assert.strictEqual(totals.completed, 1)
  assert.strictEqual(totals.total, 3)
})

test('view models: safe optional sections and finding labels from destination title', () => {
  const detail = buildDetailViewModel(mockGraph, 'n1')
  assert.strictEqual(detail.id, 'n1')
  assert.strictEqual(detail.title, 'Node 1')
  assert.strictEqual(detail.hasTools, true)
  assert.strictEqual(detail.hasResources, true)
  // checking findings resolve correctly
  assert.strictEqual(detail.findings.length, 1)
  assert.strictEqual(detail.findings[0].title, 'Finding 1')
  assert.strictEqual(detail.findings[0].destinationId, 'dest1')
  assert.strictEqual(detail.findings[0].destinationTitle, 'Destination Node Title')
  assert.deepStrictEqual(detail.lookFor, ['A concrete evidence cue.'])
  assert.strictEqual(detail.resolvedTools[0].examples[0].syntax, 'tool --inspect')
  assert.strictEqual(detail.resolvedSourceRefs[0].title, 'Source One')
  assert.deepStrictEqual(detail.resolvedSourceRefs[0].sections, ['Section 3.1'])
  
  const detail2 = buildDetailViewModel(mockGraph, 'n1a')
  assert.strictEqual(detail2.findings.length, 0)
})

test('header links switch domains without carrying an incompatible node and preserve selection across views', () => {
  const links = buildHeaderLinks('web', 'map', 'cat1', 'n1')
  assert.strictEqual(links.web, '#/web//?view=map')
  assert.strictEqual(links.dfir, '#/dfir//?view=map')
  assert.strictEqual(links.map, '#/web/cat1/n1?view=map')
  assert.strictEqual(links.checklist, '#/web/cat1/n1?view=checklist')
})
