export function buildCategoryGroups(graph, domain, activeCategoryId) {
  const domainCats = graph.categories.filter(c => c.domain === domain)
  const groupsMap = new Map()
  
  for (const cat of domainCats) {
    if (!groupsMap.has(cat.group)) {
      groupsMap.set(cat.group, { name: cat.group, categories: [] })
    }
    groupsMap.get(cat.group).categories.push({
      id: cat.id,
      title: cat.title,
      description: cat.description,
      isActive: cat.id === activeCategoryId
    })
  }
  
  return Array.from(groupsMap.values())
}

export function renderCategories(container, graph, domain, activeCategoryId, view = 'map') {
  const groups = buildCategoryGroups(graph, domain, activeCategoryId)
  
  if (groups.length === 0) {
    container.innerHTML = ''
    return
  }

  const listHtml = groups.map(group => `
    <li class="category-group">
      <h3 class="category-group-title">${escapeHtml(group.name)}</h3>
      <ul class="category-list">
        ${group.categories.map(cat => `
          <li class="category-item">
            <a href="#/${domain}/${cat.id}/?view=${view}"
               class="category-link ${cat.isActive ? 'active' : ''}" 
               ${cat.isActive ? 'aria-current="page"' : ''}
               data-id="${cat.id}">
              <span class="category-title">${escapeHtml(cat.title)}</span>
              ${cat.description ? `<span class="category-desc">${escapeHtml(cat.description)}</span>` : ''}
            </a>
          </li>
        `).join('')}
      </ul>
    </li>
  `).join('')

  container.innerHTML = `<ul class="category-groups">${listHtml}</ul>`
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
