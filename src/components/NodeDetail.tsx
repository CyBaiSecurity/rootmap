import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Copy,
  Eye,
  Target,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'

import type { MethodologyGraph } from '../content/graph'
import type { MethodologyNode } from '../content/schema'

interface NodeDetailProps {
  node: MethodologyNode
  graph: MethodologyGraph
  onSelectNode: (nodeId: string) => void
  onFollowFinding: (nodeId: string) => void
}

export function NodeDetail({ node, graph, onSelectNode, onFollowFinding }: NodeDetailProps) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const tools = node.tools.flatMap((id) => {
    const tool = graph.toolsById.get(id)
    return tool ? [tool] : []
  })
  const resources = node.resources.flatMap((id) => {
    const resource = graph.resourcesById.get(id)
    return resource ? [resource] : []
  })
  const commandExamples = tools.flatMap((tool) => tool.examples)
  const nextSteps = node.nextSteps.flatMap((id) => {
    const next = graph.nodesById.get(id)
    return next ? [next] : []
  })

  return (
    <aside className="node-detail" aria-label="Methodology node detail">
      <div className="detail-title">
        <div>
          <h2>{node.title}</h2>
        </div>
      </div>

      <section className="detail-section">
        <h3><Target aria-hidden="true" />Goal</h3>
        <p>{node.goal}</p>
        {node.why ? <p className="detail-muted">{node.why}</p> : null}
      </section>

      <section className="detail-section">
        <h3><ClipboardList aria-hidden="true" />Checklist</h3>
        <ul className="detail-checklist">
          {node.checklist.map((step) => <li key={step}>{step}</li>)}
        </ul>
      </section>

      <section className="detail-section">
        <h3><Wrench aria-hidden="true" />Tools</h3>
        <div className="tool-list">
          {tools.map((tool) => (
            <a href={tool.officialUrl} target="_blank" rel="noreferrer" key={tool.id}>
              {tool.name}
            </a>
          ))}
        </div>
      </section>

      {commandExamples.length > 0 ? (
      <section className="detail-section">
        <h3><Copy aria-hidden="true" />Command examples</h3>
        {commandExamples.map((example) => {
          const commandKey = `${example.context}:${example.syntax}`
          const copied = copiedCommand === commandKey
          return <div className="command-example" key={commandKey}>
            <span>{example.context}</span>
            <div className="command-row">
              <code>{example.syntax}</code>
              <button
                type="button"
                aria-label={`Copy ${example.context} command`}
                title={copied ? 'Copied' : 'Copy command'}
                onClick={async () => {
                  await navigator.clipboard.writeText(example.syntax)
                  setCopiedCommand(commandKey)
                }}
              >
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </button>
            </div>
          </div>
        })}
      </section>
      ) : null}

      <section className="detail-section">
        <h3><Eye aria-hidden="true" />What to look for</h3>
        <ul>{node.lookFor.map((signal) => <li key={signal}>{signal}</li>)}</ul>
      </section>

      {node.findings.length > 0 ? (
        <section className="detail-section finding-section">
          <h3><AlertTriangle aria-hidden="true" />Possible findings</h3>
          {node.findings.map((finding) => (
            <div className="finding-row" key={finding.id}>
              <span>{finding.title}</span>
              <button type="button" onClick={() => onFollowFinding(finding.next[0])}>
                Open GraphQL testing branch <ArrowRight aria-hidden="true" />
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <section className="detail-section">
        <h3><ArrowRight aria-hidden="true" />Next steps</h3>
        {nextSteps.length > 0 ? (
          <div className="next-step-list">
            {nextSteps.map((next) => (
              <button type="button" key={next.id} onClick={() => onSelectNode(next.id)}>
                {next.title}<ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : <p className="detail-muted">Continue with the next relevant check in this category.</p>}
      </section>

      <section className="detail-section">
        <h3><BookOpen aria-hidden="true" />Resources</h3>
        <div className="resource-list">
          {resources.map((resource) => (
            <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id}>
              <span>{resource.title}</span>
              <small>{resource.role}</small>
            </a>
          ))}
        </div>
      </section>
    </aside>
  )
}
