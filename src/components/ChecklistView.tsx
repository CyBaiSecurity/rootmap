import { Check, ChevronDown, ChevronRight } from 'lucide-react'

import type { MethodologyGraph } from '../content/graph'

interface ChecklistViewProps {
  graph: MethodologyGraph
  selectedCategoryId: string
  selectedNodeId: string
  completedIds: Set<string>
  onSelectCategory: (categoryId: string) => void
  onSelectNode: (nodeId: string) => void
  onToggle: (nodeId: string) => void
}

function shortId(wstgId?: string): string {
  return wstgId?.replace('WSTG-v42-', '') ?? ''
}

export function ChecklistView({
  graph,
  selectedCategoryId,
  selectedNodeId,
  completedIds,
  onSelectCategory,
  onSelectNode,
  onToggle,
}: ChecklistViewProps) {
  return (
    <main className="methodology-workspace checklist-workspace">
      <div className="workspace-heading">
        <h1>Web Assessment Checklist</h1>
      </div>
      <div className="checklist-groups">
        {graph.categories.map((category) => {
          const expanded = category.id === selectedCategoryId
          const nodes = (graph.rootsByCategory.get(category.id) ?? []).filter(({ wstgId }) => wstgId)
          return (
            <section className="checklist-group" key={category.id}>
              <button
                type="button"
                className={expanded ? 'checklist-group-button is-active' : 'checklist-group-button'}
                aria-expanded={expanded}
                onClick={() => onSelectCategory(category.id)}
              >
                <span>{category.title}</span>
                <small>{nodes.length} checks</small>
                {expanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
              </button>
              {expanded ? (
                <ol className="checklist-rows">
                  {nodes.map((node) => {
                    const checked = completedIds.has(node.id)
                    const selected = selectedNodeId === node.id
                    return (
                      <li className={selected ? 'checklist-row is-active' : 'checklist-row'} key={node.id}>
                        <label className="check-control">
                          <input
                            type="checkbox"
                            checked={checked}
                            aria-label={`Mark ${node.title} complete`}
                            onChange={() => onToggle(node.id)}
                          />
                          <span aria-hidden="true">{checked ? <Check /> : null}</span>
                        </label>
                        <span className="node-id">{shortId(node.wstgId)}</span>
                        <button className="checklist-node-button" type="button" onClick={() => onSelectNode(node.id)}>
                          {node.title}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              ) : null}
            </section>
          )
        })}
      </div>
    </main>
  )
}
