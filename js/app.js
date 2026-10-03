import { loadProjectContent } from './content.js'
import { createGraph } from './graph.js'
import { parseHash, resolveNavigation, serializeHash } from './navigation.js'
import { readProgress, writeProgress, toggleNode } from './progress.js'
import { renderHeader } from './views/header.js'
import { renderCategories } from './views/categories.js'
import { renderMap } from './views/map.js'
import { renderChecklist } from './views/checklist.js'
import { renderDetail } from './views/detail.js'

export async function startApp({ document, window, manifestUrl }) {
  try {
    try {
      const iconRes = await window.fetch('assets/icons.svg')
      if (iconRes.ok) {
        const iconSvg = await iconRes.text()
        const spriteContainer = document.getElementById('svg-sprite-container')
        if (spriteContainer) spriteContainer.innerHTML = iconSvg
      }
    } catch {
      // Icons are decorative; content remains usable if the sprite is unavailable.
    }

    const content = await loadProjectContent(manifestUrl)
    const graph = createGraph(content)
    
    const headerRegion = document.getElementById('header-region')
    const categoriesRegion = document.getElementById('categories-region')
    const treeRegion = document.getElementById('tree-region')
    const detailRegion = document.getElementById('detail-region')
    const liveRegion = document.getElementById('live-region')

    const navState = parseHash(window.location.hash)
    let resolvedState = resolveNavigation(navState, graph)
    
    if (serializeHash(navState) !== serializeHash(resolvedState)) {
      window.location.hash = serializeHash(resolvedState)
    }

    let storage = null
    try {
      storage = window.localStorage
    } catch {
      // Privacy settings can make the localStorage getter itself throw.
    }
    let progress = readProgress(storage, Array.from(graph.nodesById.keys()))

    function renderAll() {
      renderHeader(headerRegion, graph, resolvedState.domain, resolvedState.view, progress, resolvedState.categoryId, resolvedState.nodeId)
      renderCategories(categoriesRegion, graph, resolvedState.domain, resolvedState.categoryId, resolvedState.view)
      
      if (resolvedState.view === 'checklist') {
        renderChecklist(treeRegion, graph, resolvedState.domain, resolvedState.nodeId, progress)
      } else {
        renderMap(treeRegion, graph, resolvedState.categoryId, resolvedState.nodeId, progress)
      }
      
      renderDetail(detailRegion, graph, resolvedState.nodeId, progress)
    }
    
    function handleHashChange() {
      const newHash = window.location.hash
      const parsed = parseHash(newHash)
      const resolved = resolveNavigation(parsed, graph)
      
      if (serializeHash(parsed) !== serializeHash(resolved)) {
        window.location.hash = serializeHash(resolved)
        return
      }
      
      resolvedState = resolved
      renderAll()
    }
    
    window.addEventListener('hashchange', handleHashChange)
    
    document.addEventListener('click', async (e) => {
      const completeBtn = e.target.closest('.toggle-completion')
      if (completeBtn) {
        const targetId = completeBtn.dataset.id || resolvedState.nodeId
        if (targetId) {
          progress = toggleNode(progress, targetId)
          writeProgress(storage, progress)
          renderAll()
          
          if (liveRegion) {
            liveRegion.textContent = `Node marked as ${progress.completed.includes(targetId) ? 'completed' : 'incomplete'}`
          }
        }
      }

      const copyBtn = e.target.closest('.copy-btn')
      if (copyBtn) {
        const text = copyBtn.dataset.clipboard
        if (text) {
          try {
            await window.navigator.clipboard.writeText(text)
            if (liveRegion) liveRegion.textContent = 'Copied to clipboard'
            const orig = copyBtn.textContent
            copyBtn.textContent = 'Copied!'
            window.setTimeout(() => { copyBtn.textContent = orig }, 2000)
          } catch (err) {
            if (liveRegion) liveRegion.textContent = 'Failed to copy to clipboard'
            console.error('Clipboard error:', err)
          }
        }
      }
    })
    
    renderAll()
    
  } catch (err) {
    console.error('Boot error:', err)
    const errorEl = document.getElementById('boot-error')
    if (errorEl) {
      errorEl.textContent = 'Application failed to start: ' + err.message
      errorEl.style.display = 'block'
    }
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  startApp({ document, window, manifestUrl: 'data/manifest.json' })
}
