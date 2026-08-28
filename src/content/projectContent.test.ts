import { describe, expect, it } from 'vitest'

import { projectContent } from './projectContent'

describe('project content', () => {
  it('covers each approved WSTG category with navigable checks', () => {
    const content = projectContent

    expect(content.version).toBe('4.2')
    expect(content.categories.map(({ title }) => title)).toEqual([
      'Information Gathering',
      'Configuration',
      'Authentication',
      'Authorization',
      'Sessions',
      'Input Validation',
      'Business Logic',
      'Client-Side',
    ])
    for (const category of content.categories) {
      expect(content.nodes.some(({ category: categoryId }) => categoryId === category.id)).toBe(
        true,
      )
    }
  })

  it('gives every check enough content to drive the node-detail interface', () => {
    const content = projectContent

    for (const node of content.nodes) {
      expect(node.goal, node.id).not.toBe('')
      expect(node.checklist.length, node.id).toBeGreaterThan(0)
      expect(node.lookFor.length, node.id).toBeGreaterThan(0)
      expect(node.resources.length, node.id).toBeGreaterThan(0)
    }
  })

  it('uses immutable WSTG v4.2 links for methodology resources', () => {
    const content = projectContent
    const methodologyResources = content.resources.filter(({ role }) => role === 'Methodology')

    expect(methodologyResources.length).toBeGreaterThan(0)
    for (const resource of methodologyResources) {
      expect(resource.url, resource.id).toContain('/v42/')
      expect(resource.url, resource.id).not.toContain('/stable/')
    }
  })

  it('connects the GraphQL finding to the specialized branch', () => {
    const content = projectContent
    const finding = content.nodes
      .flatMap(({ findings }) => findings)
      .find(({ id }) => id === 'graphql-detected')

    expect(finding?.next).toEqual(['web-graphql-overview'])
    expect(content.nodes.find(({ id }) => id === finding?.next[0])?.title).toBe(
      'GraphQL testing branch',
    )
  })
})
