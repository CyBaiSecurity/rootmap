/**
 * RootMap Hash Navigation
 * Parses, serializes, and safely resolves hash routing state.
 */

function safeDecode(str) {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

export function parseHash(hash) {
  if (typeof hash !== 'string' || hash.length === 0) {
    return { domain: undefined, categoryId: undefined, nodeId: undefined, view: 'map' }
  }

  let cleaned = hash.trim()
  if (cleaned.startsWith('#')) cleaned = cleaned.slice(1)
  if (cleaned.startsWith('/')) cleaned = cleaned.slice(1)

  const [pathPart, queryPart] = cleaned.split('?')
  let view = 'map'

  if (queryPart) {
    const params = new URLSearchParams(queryPart)
    const viewParam = params.get('view') || params.get('mode')
    if (viewParam === 'checklist') {
      view = 'checklist'
    }
  }

  const segments = (pathPart || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(safeDecode)

  return {
    domain: segments[0] || undefined,
    categoryId: segments[1] || undefined,
    nodeId: segments[2] || undefined,
    view,
  }
}

export function serializeHash(state) {
  const domain = state?.domain || 'web'
  const categoryId = state?.categoryId || ''
  const nodeId = state?.nodeId || ''
  const view = state?.view === 'checklist' || state?.mode === 'checklist' ? 'checklist' : 'map'

  return `#/${encodeURIComponent(domain)}/${encodeURIComponent(categoryId)}/${encodeURIComponent(nodeId)}?view=${view}`
}

export function resolveNavigation(candidate, graph) {
  const view = candidate?.view === 'checklist' || candidate?.mode === 'checklist' ? 'checklist' : 'map'

  // If node ID is provided and exists in graph, it takes highest precedence
  if (candidate?.nodeId && graph?.nodesById?.has(candidate.nodeId)) {
    const node = graph.nodesById.get(candidate.nodeId)
    return {
      domain: node.domain,
      categoryId: node.category,
      nodeId: node.id,
      view,
    }
  }

  // Otherwise determine domain (defaulting to 'web')
  const targetDomain = candidate?.domain === 'dfir' ? 'dfir' : 'web'
  const domainCategories = graph?.categoriesByDomain?.get(targetDomain) || []

  // Try candidate category or fall back to first category of domain
  let category = domainCategories.find((c) => c.id === candidate?.categoryId)
  if (!category && domainCategories.length > 0) {
    category = domainCategories[0]
  }

  let nodeId = ''
  if (category) {
    const roots = graph?.rootsByCategory?.get(category.id) || []
    if (roots.length > 0) {
      nodeId = roots[0].id
    }
  }

  return {
    domain: targetDomain,
    categoryId: category ? category.id : '',
    nodeId,
    view,
  }
}
