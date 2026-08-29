import { useMemo, useReducer } from 'react'

import { AppHeader } from './components/AppHeader'
import { CategoryRail } from './components/CategoryRail'
import { ChecklistView } from './components/ChecklistView'
import { MapView } from './components/MapView'
import { NodeDetail } from './components/NodeDetail'
import { projectGraph } from './content/projectContent'
import { navigationReducer, type NavigationState } from './state/navigation'
import { useProgress } from './state/useProgress'

const initialNavigation: NavigationState = {
  mode: 'map',
  selectedDomain: 'web',
  selectedCategoryId: 'information-gathering',
  selectedNodeId: 'web-identify-technologies',
}

export function App() {
  const [navigation, dispatch] = useReducer(navigationReducer, initialNavigation)
  const { progress, toggle } = useProgress()
  const completedIds = useMemo(() => new Set(progress.completed), [progress.completed])

  const categoriesForDomain = useMemo(
    () =>
      projectGraph.categories.filter(
        (c) => (c.id.startsWith('dfir-') ? 'dfir' : 'web') === navigation.selectedDomain,
      ),
    [navigation.selectedDomain],
  )

  const category =
    categoriesForDomain.find(({ id }) => id === navigation.selectedCategoryId) ??
    categoriesForDomain[0]

  const nodes = projectGraph.rootsByCategory.get(category.id) ?? []
  const selectedNode = projectGraph.nodesById.get(navigation.selectedNodeId) ?? nodes[0]

  const selectNode = (nodeId: string) => {
    const node = projectGraph.nodesById.get(nodeId)
    if (!node) return
    dispatch({ type: 'select-node', nodeId, categoryId: node.category })
  }

  const handleDomainChange = (domain: 'web' | 'dfir') => {
    const targetCategories = projectGraph.categories.filter(
      (c) => (c.id.startsWith('dfir-') ? 'dfir' : 'web') === domain,
    )
    const firstCategory = targetCategories[0]
    const firstNode = firstCategory
      ? projectGraph.rootsByCategory.get(firstCategory.id)?.[0]
      : undefined
    if (firstCategory && firstNode) {
      dispatch({
        type: 'select-domain',
        domain,
        categoryId: firstCategory.id,
        firstNodeId: firstNode.id,
      })
    } else {
      dispatch({ type: 'select-domain', domain })
    }
  }

  return (
    <div className="rootmap-app">
      <AppHeader
        mode={navigation.mode}
        domain={navigation.selectedDomain}
        completedCount={
          [...completedIds].filter(
            (id) => (id.startsWith('dfir-') ? 'dfir' : 'web') === navigation.selectedDomain,
          ).length
        }
        totalCount={
          [...projectGraph.nodesById.values()].filter(
            (n) => (n.id.startsWith('dfir-') ? 'dfir' : 'web') === navigation.selectedDomain,
          ).length
        }
        onModeChange={(mode) => dispatch({ type: 'set-mode', mode })}
        onDomainChange={handleDomainChange}
      />
      <div className="app-grid">
        <CategoryRail
          categories={categoriesForDomain}
          selectedId={category.id}
          domain={navigation.selectedDomain}
          onSelect={(categoryId) => {
            const firstNode = projectGraph.rootsByCategory.get(categoryId)?.[0]
            if (firstNode) {
              dispatch({ type: 'select-category', categoryId, firstNodeId: firstNode.id })
            }
          }}
        />
        {navigation.mode === 'map' ? (
          <MapView
            category={category}
            nodes={nodes}
            selectedId={selectedNode.id}
            completedIds={completedIds}
            onSelect={selectNode}
          />
        ) : (
          <ChecklistView
            graph={projectGraph}
            selectedCategoryId={category.id}
            selectedNodeId={selectedNode.id}
            selectedDomain={navigation.selectedDomain}
            completedIds={completedIds}
            onSelectCategory={(categoryId) => {
              const firstNode = projectGraph.rootsByCategory.get(categoryId)?.[0]
              if (firstNode) {
                dispatch({ type: 'select-category', categoryId, firstNodeId: firstNode.id })
              }
            }}
            onSelectNode={selectNode}
            onToggle={toggle}
          />
        )}
        <NodeDetail
          node={selectedNode}
          graph={projectGraph}
          onSelectNode={selectNode}
          onFollowFinding={(destinationId) => {
            const destination = projectGraph.nodesById.get(destinationId)
            if (destination) {
              dispatch({
                type: 'follow-finding',
                destinationId,
                categoryId: destination.category,
              })
            }
          }}
        />
      </div>
    </div>
  )
}
