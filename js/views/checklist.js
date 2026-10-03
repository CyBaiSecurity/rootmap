export function buildChecklistRows(graph, domain, activeNodeId, progress) {
  const items = []
  const completedSet = new Set(progress.completed)
  const nodeIds = graph.checklistNodeIdsByDomain.get(domain) || []
  
  let currentCategoryId = null

  for (const id of nodeIds) {
    const node = graph.nodesById.get(id)
    if (!node) continue
    
    if (node.category !== currentCategoryId) {
      currentCategoryId = node.category
      const cat = graph.categories.find(c => c.id === currentCategoryId)
      if (cat) {
        items.push({
          type: 'category',
          id: cat.id,
          title: cat.title
        })
      }
    }
    
    // Compute depth by traversing parent
    let depth = 0;
    let curr = node;
    while (curr.parent) {
      depth++;
      curr = graph.nodesById.get(curr.parent);
      if (!curr) break;
    }

    items.push({
      type: 'node',
      id: node.id,
      title: node.title,
      depth: depth,
      isCompleted: completedSet.has(node.id),
      isSelected: node.id === activeNodeId,
      domain: node.domain,
      categoryId: node.category
    })
  }
  
  return items
}

export function renderChecklist(container, graph, domain, activeNodeId, progress) {
  const rows = buildChecklistRows(graph, domain, activeNodeId, progress)
  
  if (rows.length === 0) {
    container.innerHTML = '<div class="empty-state">No items found.</div>'
    return
  }

  const listHtml = rows.map(row => {
    if (row.type === 'category') {
      return `<li class="checklist-header"><h3>${escapeHtml(row.title)}</h3></li>`
    } else {
      return `
        <li class="checklist-row depth-${row.depth || 0} ${row.isSelected ? 'selected' : ''} ${row.isCompleted ? 'completed' : ''}">
          <button class="toggle-completion checklist-toggle" data-id="${escapeHtml(row.id)}" aria-pressed="${row.isCompleted}" aria-label="Mark ${escapeHtml(row.title)} ${row.isCompleted ? 'incomplete' : 'complete'}">
            <span class="checklist-icon" aria-hidden="true">
              <svg><use href="#icon-${row.isCompleted ? 'check-square' : 'square'}"></use></svg>
            </span>
          </button>
          <a href="#/${row.domain}/${row.categoryId}/${row.id}?view=checklist" class="checklist-link">
            <span class="checklist-title">${escapeHtml(row.title)}</span>
          </a>
        </li>
      `
    }
  }).join('')

  container.innerHTML = `<ul class="checklist-list">${listHtml}</ul>`
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
