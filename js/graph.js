/**
 * RootMap Methodology Graph
 * Builds indexed lookup maps, root/child hierarchies, and traversal sequences.
 */

function byOrderThenTitle(a, b) {
  return a.order - b.order || a.title.localeCompare(b.title)
}

function appendToMap(map, key, item) {
  const existing = map.get(key)
  if (existing) {
    existing.push(item)
  } else {
    map.set(key, [item])
  }
}

export function getNodeAndDescendants(graph, nodeId) {
  const node = graph.nodesById.get(nodeId)
  if (!node) return []

  const result = [node]
  const children = graph.childrenByParent.get(nodeId) || []
  for (const child of children) {
    const childDescendants = getNodeAndDescendants(graph, child.id)
    for (const d of childDescendants) {
      result.push(d)
    }
  }
  return result
}

export function getCategoryDescendants(graph, categoryId) {
  const roots = graph.rootsByCategory.get(categoryId) || []
  const result = []
  for (const root of roots) {
    const subtree = getNodeAndDescendants(graph, root.id)
    for (const node of subtree) {
      result.push(node)
    }
  }
  return result
}

export function createGraph(content) {
  const categories = [...content.categories].sort(byOrderThenTitle)
  const categoriesByDomain = new Map()

  for (const cat of categories) {
    appendToMap(categoriesByDomain, cat.domain, cat)
  }

  const rootsByCategory = new Map()
  const childrenByParent = new Map()
  const nodesById = new Map()

  for (const node of content.nodes) {
    nodesById.set(node.id, node)
    if (node.parent) {
      appendToMap(childrenByParent, node.parent, node)
    } else {
      appendToMap(rootsByCategory, node.category, node)
    }
  }

  // Sort roots and children stably by order then title
  for (const nodes of rootsByCategory.values()) {
    nodes.sort(byOrderThenTitle)
  }
  for (const nodes of childrenByParent.values()) {
    nodes.sort(byOrderThenTitle)
  }

  const toolsById = new Map(content.tools.map((tool) => [tool.id, tool]))
  const resourcesById = new Map(content.resources.map((res) => [res.id, res]))

  const tempGraph = {
    schemaVersion: content.schemaVersion,
    sourceVersions: content.sourceVersions || {},
    categories,
    categoriesByDomain,
    nodesById,
    rootsByCategory,
    childrenByParent,
    toolsById,
    resourcesById,
  }

  // Compute checklistNodeIdsByDomain (ordered pre-order traversal per domain)
  const checklistNodeIdsByDomain = new Map()
  const domains = ['web', 'dfir']

  for (const domain of domains) {
    const domainCats = categoriesByDomain.get(domain) || []
    const domainNodeIds = []
    for (const cat of domainCats) {
      const catNodes = getCategoryDescendants(tempGraph, cat.id)
      for (const n of catNodes) {
        domainNodeIds.push(n.id)
      }
    }
    checklistNodeIdsByDomain.set(domain, domainNodeIds)
  }

  tempGraph.checklistNodeIdsByDomain = checklistNodeIdsByDomain

  return tempGraph
}
