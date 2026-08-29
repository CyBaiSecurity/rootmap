import { Check, ChevronRight, Circle } from 'lucide-react'

import type { Category, MethodologyNode } from '../content/schema'

interface MapViewProps {
  category: Category
  nodes: MethodologyNode[]
  selectedId: string
  completedIds: Set<string>
  onSelect: (nodeId: string) => void
}

function shortId(node: { id: string; wstgId?: string }): string {
  if (node.wstgId) {
    return node.wstgId.replace('WSTG-v42-', '')
  }
  return node.id.replace(/^dfir-/, '').toUpperCase().slice(0, 10)
}

export function MapView({
  category,
  nodes,
  selectedId,
  completedIds,
  onSelect,
}: MapViewProps) {
  return (
    <main className="methodology-workspace">
      <div className="workspace-heading">
        <h1>{category.title}</h1>
        <p>Collect and analyze information about the target to understand its attack surface.</p>
      </div>
      <ol className="methodology-tree" aria-label={`${category.title} methodology`}>
        {nodes.map((node) => {
          const completed = completedIds.has(node.id)
          const selected = selectedId === node.id
          return (
            <li key={node.id}>
              <button
                className={selected ? 'tree-node is-active' : 'tree-node'}
                type="button"
                aria-current={selected ? 'step' : undefined}
                onClick={() => onSelect(node.id)}
              >
                <span className="tree-disclosure" aria-hidden="true">
                  <ChevronRight />
                </span>
                <span className="node-id">{shortId(node)}</span>
                <span className="node-title">{node.title}</span>
                <span className={completed ? 'node-status is-complete' : 'node-status'}>
                  {completed ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
