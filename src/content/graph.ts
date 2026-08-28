import type { Category, MethodologyNode, Resource, RootMapContent, Tool } from './schema'

export interface MethodologyGraph {
  version: string
  categories: Category[]
  nodesById: Map<string, MethodologyNode>
  rootsByCategory: Map<string, MethodologyNode[]>
  childrenByParent: Map<string, MethodologyNode[]>
  toolsById: Map<string, Tool>
  resourcesById: Map<string, Resource>
}

function byOrderThenTitle<T extends { order: number; title: string }>(a: T, b: T): number {
  return a.order - b.order || a.title.localeCompare(b.title)
}

function append(
  map: Map<string, MethodologyNode[]>,
  key: string,
  node: MethodologyNode,
): void {
  const current = map.get(key)
  if (current) {
    current.push(node)
  } else {
    map.set(key, [node])
  }
}

export function createGraph(content: RootMapContent): MethodologyGraph {
  const rootsByCategory = new Map<string, MethodologyNode[]>()
  const childrenByParent = new Map<string, MethodologyNode[]>()

  for (const node of content.nodes) {
    if (node.parent) {
      append(childrenByParent, node.parent, node)
    } else {
      append(rootsByCategory, node.category, node)
    }
  }

  for (const nodes of rootsByCategory.values()) nodes.sort(byOrderThenTitle)
  for (const nodes of childrenByParent.values()) nodes.sort(byOrderThenTitle)

  return {
    version: content.version,
    categories: [...content.categories].sort(byOrderThenTitle),
    nodesById: new Map(content.nodes.map((node) => [node.id, node])),
    rootsByCategory,
    childrenByParent,
    toolsById: new Map(content.tools.map((tool) => [tool.id, tool])),
    resourcesById: new Map(content.resources.map((resource) => [resource.id, resource])),
  }
}
