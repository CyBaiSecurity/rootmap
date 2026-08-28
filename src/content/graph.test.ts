import { describe, expect, it } from 'vitest'

import { createGraph } from './graph'
import type { RootMapContent } from './schema'

const content: RootMapContent = {
  version: '4.2',
  categories: [
    { id: 'authentication', title: 'Authentication', order: 2 },
    { id: 'information-gathering', title: 'Information Gathering', order: 1 },
  ],
  nodes: [
    {
      id: 'child-two',
      title: 'Child two',
      category: 'information-gathering',
      parent: 'root-node',
      order: 2,
      goal: 'Second child.',
      checklist: ['Check second child.'],
      lookFor: ['Second signal.'],
      tools: [],
      resources: [],
      findings: [],
      nextSteps: [],
    },
    {
      id: 'root-node',
      title: 'Root node',
      category: 'information-gathering',
      order: 1,
      goal: 'Root goal.',
      checklist: ['Check root.'],
      lookFor: ['Root signal.'],
      tools: [],
      resources: [],
      findings: [],
      nextSteps: [],
    },
    {
      id: 'child-one',
      title: 'Child one',
      category: 'information-gathering',
      parent: 'root-node',
      order: 1,
      goal: 'First child.',
      checklist: ['Check first child.'],
      lookFor: ['First signal.'],
      tools: [],
      resources: [],
      findings: [],
      nextSteps: [],
    },
  ],
  tools: [],
  resources: [],
}

describe('createGraph', () => {
  it('orders categories, roots, and children without changing source arrays', () => {
    const graph = createGraph(content)

    expect(graph.categories.map(({ id }) => id)).toEqual([
      'information-gathering',
      'authentication',
    ])
    expect(graph.rootsByCategory.get('information-gathering')?.map(({ id }) => id)).toEqual([
      'root-node',
    ])
    expect(graph.childrenByParent.get('root-node')?.map(({ id }) => id)).toEqual([
      'child-one',
      'child-two',
    ])
    expect(content.nodes.map(({ id }) => id)).toEqual(['child-two', 'root-node', 'child-one'])
  })

  it('provides direct lookup maps for referenced records', () => {
    const graph = createGraph(content)

    expect(graph.nodesById.get('child-one')?.title).toBe('Child one')
    expect(graph.toolsById.size).toBe(0)
    expect(graph.resourcesById.size).toBe(0)
  })
})
