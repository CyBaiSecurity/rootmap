import { useMemo, useReducer } from 'react'

import { AppHeader } from './components/AppHeader'
import { CategoryRail } from './components/CategoryRail'
import { ChecklistView } from './components/ChecklistView'
import { MapView } from './components/MapView'
import { NodeDetail } from './components/NodeDetail'
import { projectGraph } from './content/projectContent'
import { navigationReducer } from './state/navigation'
import { useProgress } from './state/useProgress'

const initialNavigation = {
  mode: 'map' as const,
  selectedCategoryId: 'information-gathering',
  selectedNodeId: 'web-identify-technologies',
}

export function App() {
  const [navigation, dispatch] = useReducer(navigationReducer, initialNavigation)
  const { progress, toggle } = useProgress()
  const completedIds = useMemo(() => new Set(progress.completed), [progress.completed])
  const category = projectGraph.categories.find(
    ({ id }) => id === navigation.selectedCategoryId,
  ) ?? projectGraph.categories[0]
  const nodes = (projectGraph.rootsByCategory.get(category.id) ?? []).filter(
    ({ wstgId }) => Boolean(wstgId),
  )
  const selectedNode = projectGraph.nodesById.get(navigation.selectedNodeId) ?? nodes[0]

  const selectNode = (nodeId: string) => {
    const node = projectGraph.nodesById.get(nodeId)
    if (!node) return
    dispatch({ type: 'select-node', nodeId, categoryId: node.category })
  }

  return (
    <div className="rootmap-app">
      <AppHeader
        mode={navigation.mode}
        completedCount={completedIds.size}
        totalCount={[...projectGraph.nodesById.values()].filter(({ wstgId }) => wstgId).length}
        onModeChange={(mode) => dispatch({ type: 'set-mode', mode })}
      />
      <div className="app-grid">
        <CategoryRail
          categories={projectGraph.categories}
          selectedId={category.id}
          onSelect={(categoryId) => {
            const firstNode = projectGraph.rootsByCategory.get(categoryId)?.find(({ wstgId }) => wstgId)
            if (firstNode) {
              dispatch({ type: 'select-category', categoryId, firstNodeId: firstNode.id })
            }
          }}
        />
        {navigation.mode === 'map' ? (
          <MapView
            category={category}
            nodes={selectedNode.wstgId ? nodes : [selectedNode]}
            selectedId={selectedNode.id}
            completedIds={completedIds}
            onSelect={selectNode}
          />
        ) : (
          <ChecklistView
            graph={projectGraph}
            selectedCategoryId={category.id}
            selectedNodeId={selectedNode.id}
            completedIds={completedIds}
            onSelectCategory={(categoryId) => {
              const firstNode = projectGraph.rootsByCategory.get(categoryId)?.find(({ wstgId }) => wstgId)
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
