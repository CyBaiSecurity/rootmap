export function buildDomainTotals(graph, domain, progress) {
  const nodeIds = graph.checklistNodeIdsByDomain.get(domain) || []
  let completedCount = 0
  
  const completedSet = new Set(progress.completed)
  
  for (const id of nodeIds) {
    if (completedSet.has(id)) {
      completedCount++
    }
  }
  
  return {
    total: nodeIds.length,
    completed: completedCount
  }
}

export function buildHeaderLinks(domain, view, currentCategoryId, currentNodeId) {
  const category = encodeURIComponent(currentCategoryId || '')
  const node = encodeURIComponent(currentNodeId || '')

  return {
    web: `#/web//?view=${view}`,
    dfir: `#/dfir//?view=${view}`,
    map: `#/${domain}/${category}/${node}?view=map`,
    checklist: `#/${domain}/${category}/${node}?view=checklist`,
  }
}

export function renderHeader(container, graph, domain, view, progress, currentCategoryId, currentNodeId) {
  const totals = buildDomainTotals(graph, domain, progress)
  const links = buildHeaderLinks(domain, view, currentCategoryId, currentNodeId)
  
  container.innerHTML = `
    <header class="app-header">
      <a class="wordmark" href="#/web//?view=map" aria-label="RootMap home">
        <span class="wordmark-mark" aria-hidden="true">&lt;/&gt;</span>
        <span>RootMap</span>
      </a>
      <nav class="domain-nav" aria-label="Methodology domain">
        <a href="${links.web}" class="domain-link ${domain === 'web' ? 'active' : ''}" ${domain === 'web' ? 'aria-current="page"' : ''}>Web</a>
        <a href="${links.dfir}" class="domain-link ${domain === 'dfir' ? 'active' : ''}" ${domain === 'dfir' ? 'aria-current="page"' : ''}>DFIR</a>
      </nav>
      <div class="progress-indicator" aria-label="${totals.completed} of ${totals.total} checks complete">
        <span class="progress-text">${totals.completed} / ${totals.total} checks</span>
        <progress value="${totals.completed}" max="${totals.total || 1}">${totals.completed} of ${totals.total}</progress>
      </div>
      <nav class="view-toggles" aria-label="View mode">
        <a href="${links.map}" class="view-link ${view === 'map' ? 'active' : ''}" ${view === 'map' ? 'aria-current="page"' : ''}>Map</a>
        <a href="${links.checklist}" class="view-link ${view === 'checklist' ? 'active' : ''}" ${view === 'checklist' ? 'aria-current="page"' : ''}>Checklist</a>
      </nav>
    </header>
  `
}
