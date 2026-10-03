export function buildDetailViewModel(graph, nodeId) {
  const node = graph.nodesById.get(nodeId)
  if (!node) return null

  const resolvedFindings = (node.findings || []).map(f => {
    const destinationId = f.next[0]
    const dest = graph.nodesById.get(destinationId)
    return {
      ...f,
      destinationId,
      destinationTitle: dest ? dest.title : destinationId,
      destinationDomain: dest ? dest.domain : node.domain,
      destinationCategoryId: dest ? dest.category : node.category
    }
  })
  
  const resolvedTools = (node.tools || []).map(t => {
    const tool = graph.toolsById ? graph.toolsById.get(t) : null
    return tool || { id: t, name: t, description: '' }
  })
  
  const resolvedResources = (node.resources || []).map(r => {
    const res = graph.resourcesById ? graph.resourcesById.get(r) : null
    return res || { id: r, title: r, url: '' }
  })

  const resolvedSourceRefs = (node.sourceRefs || []).map(ref => {
    const resource = graph.resourcesById ? graph.resourcesById.get(ref.resourceId) : null
    return {
      ...ref,
      title: resource ? resource.title : ref.resourceId,
      url: resource ? resource.url : '',
    }
  })

  return {
    ...node,
    hasTools: resolvedTools.length > 0,
    hasResources: resolvedResources.length > 0,
    findings: resolvedFindings,
    resolvedTools,
    resolvedResources,
    resolvedSourceRefs,
  }
}

export function renderDetail(container, graph, nodeId, progress) {
  const vm = buildDetailViewModel(graph, nodeId)
  
  if (!vm) {
    container.innerHTML = '<div class="empty-state">Select an item to view details.</div>'
    return
  }
  
  const isCompleted = progress && progress.completed && progress.completed.includes(nodeId)
  
  let html = `
    <article class="node-detail">
      <header class="detail-header">
        <h2>${escapeHtml(vm.title)}</h2>
        <button class="toggle-completion btn-primary" data-id="${escapeHtml(vm.id)}" aria-pressed="${isCompleted}">
          ${isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
        </button>
      </header>
      
      ${vm.goal ? `<section class="detail-section"><h3>Goal</h3><p>${escapeHtml(vm.goal)}</p></section>` : ''}
      ${vm.why ? `<section class="detail-section"><h3>Why</h3><p>${escapeHtml(vm.why)}</p></section>` : ''}
      
      ${vm.checklist?.length > 0 ? `<section class="detail-section"><h3>Checklist</h3><ul>${vm.checklist.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></section>` : ''}
      
      ${vm.record ? `<section class="detail-section alert-record"><h3>Record</h3><p>${escapeHtml(vm.record)}</p></section>` : ''}
      ${vm.cautions?.length > 0 ? `<section class="detail-section alert-caution"><h3>Cautions</h3><ul>${vm.cautions.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></section>` : ''}
      
      ${vm.lookFor && vm.lookFor.length > 0 ? `
        <section class="detail-section">
          <h3>What to look for</h3>
          <ul>${vm.lookFor.map(signal => `<li>${escapeHtml(signal)}</li>`).join('')}</ul>
        </section>
      ` : ''}
      
      ${vm.findings.length > 0 ? `
        <section class="detail-section">
          <h3>Findings</h3>
          <ul class="finding-list">
            ${vm.findings.map(f => `
              <li><strong>${escapeHtml(f.title)}</strong>: <a href="#/${f.destinationDomain}/${f.destinationCategoryId}/${f.destinationId}?view=map">Open ${escapeHtml(f.destinationTitle)}</a></li>
            `).join('')}
          </ul>
        </section>
      ` : ''}
      
      ${vm.nextSteps && vm.nextSteps.length > 0 ? `
        <section class="detail-section">
          <h3>Next Steps</h3>
          <ul>
            ${vm.nextSteps.map(n => {
              const dest = graph.nodesById.get(n)
              const title = dest ? dest.title : n
              const domain = dest ? dest.domain : 'web'
              const catId = dest ? dest.category : ''
              return `<li><a href="#/${domain}/${catId}/${n}">${escapeHtml(title)}</a></li>`
            }).join('')}
          </ul>
        </section>
      ` : ''}

      ${vm.hasTools ? `
        <section class="detail-section">
          <h3>Tools</h3>
          ${vm.resolvedTools.map(t => `
            <div class="tool-info">
              <h4>${escapeHtml(t.name)}</h4>
              <p>${escapeHtml(t.description)}</p>
              ${t.officialUrl ? `<p><a href="${escapeHtml(t.officialUrl)}" target="_blank" rel="noopener noreferrer">Official documentation <span class="visually-hidden">(opens in a new tab)</span></a></p>` : ''}
              ${t.examples?.length > 0 ? `
                <div class="tool-examples">
                  ${t.examples.map(ex => `
                    <div class="example-block">
                      <p><strong>${escapeHtml(ex.context)}</strong></p>
                      <div class="command-block">
                        <pre><code>${escapeHtml(ex.syntax)}</code></pre>
                        <button class="copy-btn" data-clipboard="${escapeHtml(ex.syntax)}">Copy</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
      
      ${vm.hasResources ? `
        <section class="detail-section">
          <h3>References</h3>
          <ul>
            ${vm.resolvedResources.map(r => `<li><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)} <span class="visually-hidden">(opens in a new tab)</span></a></li>`).join('')}
          </ul>
        </section>
      ` : ''}

      ${vm.resolvedSourceRefs.length > 0 ? `
        <section class="detail-section">
          <h3>Source provenance</h3>
          <ul>
            ${vm.resolvedSourceRefs.map(ref => `<li>${ref.url ? `<a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref.title)} <span class="visually-hidden">(opens in a new tab)</span></a>` : escapeHtml(ref.title)} — ${escapeHtml(ref.sections.join(', '))} <small>(${escapeHtml(ref.relationship)})</small></li>`).join('')}
          </ul>
        </section>
      ` : ''}
      
    </article>
  `
  
  container.innerHTML = html
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
