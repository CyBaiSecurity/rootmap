import { parse } from 'yaml'

import {
  methodologyFileSchema,
  resourceFileSchema,
  toolFileSchema,
  type RootMapContent,
} from './schema'

export interface ContentFiles {
  methodologies: string[]
  tools: string[]
  resources: string[]
}

function parseFile<T>(
  source: string,
  label: string,
  schema: { parse(value: unknown): T },
): T {
  let document: unknown
  try {
    document = parse(source, { merge: true })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`${label} contains invalid YAML: ${reason}`)
  }

  try {
    return schema.parse(document)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`${label} does not match the content schema: ${reason}`)
  }
}

function assertUnique(items: Array<{ id: string }>, kind: string): void {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${kind} ID: ${item.id}`)
    }
    seen.add(item.id)
  }
}

export function loadContent(files: ContentFiles): RootMapContent {
  const methodologyFiles = files.methodologies.map((source, index) =>
    parseFile(source, `Methodology file ${index + 1}`, methodologyFileSchema),
  )
  const toolFiles = files.tools.map((source, index) =>
    parseFile(source, `Tool file ${index + 1}`, toolFileSchema),
  )
  const resourceFiles = files.resources.map((source, index) =>
    parseFile(source, `Resource file ${index + 1}`, resourceFileSchema),
  )

  const versions = new Set(methodologyFiles.map((file) => file.version))
  if (versions.size !== 1) {
    throw new Error('Methodology files must declare one shared version')
  }

  const content: RootMapContent = {
    version: methodologyFiles[0]?.version ?? '',
    categories: methodologyFiles.flatMap((file) => file.categories),
    nodes: methodologyFiles.flatMap((file) => file.nodes),
    tools: toolFiles.flatMap((file) => file.tools),
    resources: resourceFiles.flatMap((file) => file.resources),
  }

  assertUnique(content.categories, 'category')
  assertUnique(content.nodes, 'node')
  assertUnique(content.tools, 'tool')
  assertUnique(content.resources, 'resource')

  const categoryIds = new Set(content.categories.map(({ id: itemId }) => itemId))
  const nodeIds = new Set(content.nodes.map(({ id: itemId }) => itemId))
  const toolIds = new Set(content.tools.map(({ id: itemId }) => itemId))
  const resourceIds = new Set(content.resources.map(({ id: itemId }) => itemId))

  for (const node of content.nodes) {
    if (!categoryIds.has(node.category)) {
      throw new Error(`Node ${node.id} references missing category ${node.category}`)
    }
    if (node.parent && !nodeIds.has(node.parent)) {
      throw new Error(`Node ${node.id} references missing parent ${node.parent}`)
    }
    for (const toolId of node.tools) {
      if (!toolIds.has(toolId)) {
        throw new Error(`Node ${node.id} references missing tool ${toolId}`)
      }
    }
    for (const resourceId of node.resources) {
      if (!resourceIds.has(resourceId)) {
        throw new Error(`Node ${node.id} references missing resource ${resourceId}`)
      }
    }
    for (const nextStepId of node.nextSteps) {
      if (!nodeIds.has(nextStepId)) {
        throw new Error(`Node ${node.id} references missing next step ${nextStepId}`)
      }
    }
    for (const finding of node.findings) {
      for (const destinationId of finding.next) {
        if (!nodeIds.has(destinationId)) {
          throw new Error(
            `Finding ${finding.id} references missing destination ${destinationId}`,
          )
        }
      }
    }
  }

  return content
}
