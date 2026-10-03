export function buildMapRows(graph, categoryId, activeNodeId, progress) {
  const rows = []
  const roots = graph.rootsByCategory.get(categoryId) || []
  const completedSet = new Set(progress.completed)
  
  function traverse(nodeId, depth) {
    const node = graph.nodesById.get(nodeId)
    if (!node) return
    
    rows.push({
      id: node.id,
      title: node.title,
      depth: depth,
      isCompleted: completedSet.has(node.id),
      isSelected: node.id === activeNodeId,
      domain: node.domain,
      categoryId: node.category
    })
    
    const children = graph.childrenByParent.get(nodeId) || []
    for (const child of children) {
      traverse(child.id, depth + 1)
    }
  }

  for (const root of roots) {
    traverse(root.id, 0)
  }
  
  return rows
}

export function renderMap(container, graph, categoryId, activeNodeId, progress) {
  const rows = buildMapRows(graph, categoryId, activeNodeId, progress)
  
  if (rows.length === 0) {
    container.innerHTML = '<div class="empty-state">No nodes found for this category.</div>'
    return
  }

  const listHtml = rows.map(row => `
    <li class="map-row depth-${row.depth} ${row.isSelected ? 'selected' : ''} ${row.isCompleted ? 'completed' : ''}">
      <a href="#/${row.domain}/${row.categoryId}/${row.id}?view=map" class="map-link">
        <span class="map-icon" aria-hidden="true">
          <svg><use href="#icon-${row.isCompleted ? 'check-circle' : 'circle'}"></use></svg>
        </span>
        <span class="map-title">${escapeHtml(row.title)}</span>
      </a>
    </li>
  `).join('')

  container.innerHTML = `<ul class="map-list">${listHtml}</ul>`
}

function escapeHtml(unsafe) {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
