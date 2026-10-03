/**
 * RootMap Static Content Validator and Loader
 * Dependency-free ES module for loading and validating static JSON content.
 */

const ID_REGEX = /^[a-z0-9][a-z0-9-]*$/
const ALLOWED_DOMAINS = new Set(['web', 'dfir'])
const ALLOWED_RELATIONSHIPS = new Set(['backbone', 'supplement', 'modernization'])
const ALLOWED_RESOURCE_ROLES = new Set([
  'Methodology',
  'Documentation',
  'Learning',
  'Practice',
])

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a non-null object`)
  }
}

function assertNoUnknownKeys(obj, allowedKeys, label) {
  const allowed = new Set(allowedKeys)
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new Error(`${label} contains unknown property "${key}"`)
    }
  }
}

function assertId(value, label) {
  if (typeof value !== 'string' || !ID_REGEX.test(value)) {
    throw new Error(`Invalid ID "${value}": ${label} must match ^[a-z0-9][a-z0-9-]*$`)
  }
  return value
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`)
  }
  return value
}

function assertInteger(value, min, max, label) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer, got ${value}`)
  }
  if (min !== undefined && max !== undefined && (value < min || value > max)) {
    throw new Error(`${label} must be an integer between ${min} and ${max}, got ${value}`)
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be >= ${min}, got ${value}`)
  }
  if (max !== undefined && value > max) {
    throw new Error(`${label} must be <= ${max}, got ${value}`)
  }
  return value
}

function assertHttpsUrl(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty URL string`)
  }
  let parsed
  try {
    parsed = new URL(value)
  } catch (err) {
    throw new Error(`Invalid URL for ${label}: "${value}"`)
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`Non-HTTPS URL for ${label}: must use HTTPS protocol, got "${value}"`)
  }
  return value
}

function assertArray(value, label, minLength = 0) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`)
  }
  if (value.length < minLength) {
    throw new Error(`${label} must be a non-empty array containing at least ${minLength} item(s)`)
  }
  return value
}

function assertStringArray(value, label, minLength = 0) {
  const arr = assertArray(value, label, minLength)
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'string' || arr[i].trim().length === 0) {
      throw new Error(`${label}[${i}] must be a non-empty string`)
    }
  }
  return arr
}

export function validateManifest(manifest) {
  assertObject(manifest, 'Manifest')
  assertNoUnknownKeys(
    manifest,
    ['schemaVersion', 'methodologies', 'tools', 'resources'],
    'Manifest',
  )

  assertInteger(manifest.schemaVersion, 1, 1, 'Manifest schemaVersion')
  const methodologies = assertStringArray(
    manifest.methodologies,
    'Manifest methodologies',
    1,
  )
  const tools = assertStringArray(manifest.tools, 'Manifest tools', 1)
  const resources = assertStringArray(manifest.resources, 'Manifest resources', 1)

  return {
    schemaVersion: manifest.schemaVersion,
    methodologies,
    tools,
    resources,
  }
}

function validateCategory(cat, index, fileLabel) {
  const label = `Category at index ${index} in ${fileLabel}`
  assertObject(cat, label)
  assertNoUnknownKeys(
    cat,
    ['id', 'domain', 'group', 'title', 'description', 'order'],
    label,
  )

  const id = assertId(cat.id, `${label} id`)
  if (!ALLOWED_DOMAINS.has(cat.domain)) {
    throw new Error(`${label} domain must be "web" or "dfir", got "${cat.domain}"`)
  }
  const group = assertNonEmptyString(cat.group, `${label} group`)
  const title = assertNonEmptyString(cat.title, `${label} title`)
  const description = assertNonEmptyString(cat.description, `${label} description`)
  const order = assertInteger(cat.order, 0, undefined, `${label} order`)

  return {
    id,
    domain: cat.domain,
    group,
    title,
    description,
    order,
  }
}

function validateFinding(finding, index, nodeLabel) {
  const label = `Finding at index ${index} in ${nodeLabel}`
  assertObject(finding, label)
  assertNoUnknownKeys(finding, ['id', 'title', 'next'], label)

  const id = assertId(finding.id, `${label} id`)
  const title = assertNonEmptyString(finding.title, `${label} title`)
  const next = assertStringArray(finding.next, `${label} next`, 1)

  return { id, title, next }
}

function validateSourceRef(ref, index, nodeLabel) {
  const label = `SourceRef at index ${index} in ${nodeLabel}`
  assertObject(ref, label)
  assertNoUnknownKeys(ref, ['resourceId', 'sections', 'relationship'], label)

  const resourceId = assertId(ref.resourceId, `${label} resourceId`)
  const sections = assertStringArray(ref.sections, `${label} sections`, 1)
  if (!ALLOWED_RELATIONSHIPS.has(ref.relationship)) {
    throw new Error(
      `${label} invalid relationship "${ref.relationship}". Must be "backbone", "supplement", or "modernization"`,
    )
  }

  return {
    resourceId,
    sections,
    relationship: ref.relationship,
  }
}

function validateNode(node, index, fileLabel, fileDomain) {
  const label = `Node "${node?.id || index}" in ${fileLabel}`
  assertObject(node, label)
  assertNoUnknownKeys(
    node,
    [
      'id',
      'domain',
      'wstgId',
      'title',
      'category',
      'parent',
      'order',
      'goal',
      'why',
      'checklist',
      'lookFor',
      'record',
      'cautions',
      'tools',
      'resources',
      'sourceRefs',
      'findings',
      'nextSteps',
    ],
    label,
  )

  const id = assertId(node.id, `${label} id`)
  const domain = node.domain ?? fileDomain
  if (!ALLOWED_DOMAINS.has(domain)) {
    throw new Error(`${label} domain must be "web" or "dfir", got "${domain}"`)
  }
  if (fileDomain && domain !== fileDomain) {
    throw new Error(
      `${label} domain "${domain}" does not match methodology file domain "${fileDomain}"`,
    )
  }

  const title = assertNonEmptyString(node.title, `${label} title`)
  const category = assertId(node.category, `${label} category`)
  const order = assertInteger(node.order, 0, undefined, `${label} order`)
  const goal = assertNonEmptyString(node.goal, `${label} goal`)

  const wstgId =
    node.wstgId !== undefined
      ? assertNonEmptyString(node.wstgId, `${label} wstgId`)
      : undefined
  const parent =
    node.parent !== undefined
      ? assertId(node.parent, `${label} parent`)
      : undefined
  const why =
    node.why !== undefined
      ? assertNonEmptyString(node.why, `${label} why`)
      : undefined

  const checklist = assertStringArray(node.checklist, `${label} checklist`, 1)
  const lookFor = assertStringArray(node.lookFor, `${label} lookFor`, 1)

  const record =
    node.record !== undefined
      ? assertNonEmptyString(node.record, `${label} record`)
      : undefined

  const cautions =
    node.cautions !== undefined
      ? assertStringArray(node.cautions, `${label} cautions`)
      : []

  const tools =
    node.tools !== undefined
      ? assertStringArray(node.tools, `${label} tools`)
      : []

  const resources =
    node.resources !== undefined
      ? assertStringArray(node.resources, `${label} resources`)
      : []

  const sourceRefs =
    node.sourceRefs !== undefined
      ? assertArray(node.sourceRefs, `${label} sourceRefs`).map((r, i) =>
          validateSourceRef(r, i, label),
        )
      : []

  const findings =
    node.findings !== undefined
      ? assertArray(node.findings, `${label} findings`).map((f, i) =>
          validateFinding(f, i, label),
        )
      : []

  const nextSteps =
    node.nextSteps !== undefined
      ? assertStringArray(node.nextSteps, `${label} nextSteps`)
      : []

  return {
    id,
    domain,
    wstgId,
    title,
    category,
    parent,
    order,
    goal,
    why,
    checklist,
    lookFor,
    record,
    cautions,
    tools,
    resources,
    sourceRefs,
    findings,
    nextSteps,
  }
}

function validateTool(tool, index, fileLabel) {
  const label = `Tool "${tool?.id || index}" in ${fileLabel}`
  assertObject(tool, label)
  assertNoUnknownKeys(tool, ['id', 'name', 'description', 'officialUrl', 'examples'], label)

  const id = assertId(tool.id, `${label} id`)
  const name = assertNonEmptyString(tool.name, `${label} name`)
  const description = assertNonEmptyString(tool.description, `${label} description`)
  const officialUrl = assertHttpsUrl(tool.officialUrl, `${label} officialUrl`)

  const examples =
    tool.examples !== undefined
      ? assertArray(tool.examples, `${label} examples`).map((ex, i) => {
          const exLabel = `Example at index ${i} in ${label}`
          assertObject(ex, exLabel)
          assertNoUnknownKeys(ex, ['context', 'syntax'], exLabel)
          return {
            context: assertNonEmptyString(ex.context, `${exLabel} context`),
            syntax: assertNonEmptyString(ex.syntax, `${exLabel} syntax`),
          }
        })
      : []

  return {
    id,
    name,
    description,
    officialUrl,
    examples,
  }
}

function validateResource(res, index, fileLabel) {
  const label = `Resource "${res?.id || index}" in ${fileLabel}`
  assertObject(res, label)
  assertNoUnknownKeys(res, ['id', 'title', 'url', 'tier', 'role'], label)

  const id = assertId(res.id, `${label} id`)
  const title = assertNonEmptyString(res.title, `${label} title`)
  const url = assertHttpsUrl(res.url, `${label} url`)
  const tier = assertInteger(res.tier, 1, 4, `${label} tier`)

  if (!ALLOWED_RESOURCE_ROLES.has(res.role)) {
    throw new Error(
      `${label} invalid role "${res.role}". Must be one of: ${[...ALLOWED_RESOURCE_ROLES].join(', ')}`,
    )
  }

  return {
    id,
    title,
    url,
    tier,
    role: res.role,
  }
}

export function validateAndMergeContent(documents) {
  assertObject(documents, 'Content documents container')
  assertArray(documents.methodologies, 'documents.methodologies', 1)
  assertArray(documents.tools, 'documents.tools', 1)
  assertArray(documents.resources, 'documents.resources', 1)

  const sourceVersions = {}
  const categories = []
  const nodes = []
  const tools = []
  const resources = []

  // Validate methodology documents
  for (let mIdx = 0; mIdx < documents.methodologies.length; mIdx++) {
    const doc = documents.methodologies[mIdx]
    const fileLabel = `Methodology document ${mIdx + 1}`
    assertObject(doc, fileLabel)
    assertNoUnknownKeys(
      doc,
      ['schemaVersion', 'domain', 'sourceVersion', 'categories', 'nodes'],
      fileLabel,
    )

    assertInteger(doc.schemaVersion, 1, 1, `${fileLabel} schemaVersion`)
    if (!ALLOWED_DOMAINS.has(doc.domain)) {
      throw new Error(`${fileLabel} domain must be "web" or "dfir", got "${doc.domain}"`)
    }
    const sourceVersion = assertNonEmptyString(doc.sourceVersion, `${fileLabel} sourceVersion`)
    sourceVersions[doc.domain] = sourceVersion

    const docCategories = assertArray(doc.categories ?? [], `${fileLabel} categories`)
    for (let cIdx = 0; cIdx < docCategories.length; cIdx++) {
      categories.push(validateCategory(docCategories[cIdx], cIdx, fileLabel))
    }

    const docNodes = assertArray(doc.nodes ?? [], `${fileLabel} nodes`)
    for (let nIdx = 0; nIdx < docNodes.length; nIdx++) {
      nodes.push(validateNode(docNodes[nIdx], nIdx, fileLabel, doc.domain))
    }
  }

  // Validate tool documents
  for (let tIdx = 0; tIdx < documents.tools.length; tIdx++) {
    const doc = documents.tools[tIdx]
    const fileLabel = `Tool document ${tIdx + 1}`
    assertObject(doc, fileLabel)
    assertNoUnknownKeys(doc, ['schemaVersion', 'tools'], fileLabel)
    assertInteger(doc.schemaVersion, 1, 1, `${fileLabel} schemaVersion`)

    const docTools = assertArray(doc.tools ?? [], `${fileLabel} tools`)
    for (let i = 0; i < docTools.length; i++) {
      tools.push(validateTool(docTools[i], i, fileLabel))
    }
  }

  // Validate resource documents
  for (let rIdx = 0; rIdx < documents.resources.length; rIdx++) {
    const doc = documents.resources[rIdx]
    const fileLabel = `Resource document ${rIdx + 1}`
    assertObject(doc, fileLabel)
    assertNoUnknownKeys(doc, ['schemaVersion', 'resources'], fileLabel)
    assertInteger(doc.schemaVersion, 1, 1, `${fileLabel} schemaVersion`)

    const docResources = assertArray(doc.resources ?? [], `${fileLabel} resources`)
    for (let i = 0; i < docResources.length; i++) {
      resources.push(validateResource(docResources[i], i, fileLabel))
    }
  }

  // Uniqueness checks
  const categoryMap = new Map()
  for (const cat of categories) {
    if (categoryMap.has(cat.id)) {
      throw new Error(`Duplicate category ID: "${cat.id}"`)
    }
    categoryMap.set(cat.id, cat)
  }

  const nodeMap = new Map()
  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      throw new Error(`Duplicate node ID: "${node.id}"`)
    }
    nodeMap.set(node.id, node)
  }

  const findingIds = new Set()
  for (const node of nodes) {
    for (const finding of node.findings) {
      if (findingIds.has(finding.id)) {
        throw new Error(`Duplicate finding ID: "${finding.id}"`)
      }
      findingIds.add(finding.id)
    }
  }

  const toolMap = new Map()
  for (const tool of tools) {
    if (toolMap.has(tool.id)) {
      throw new Error(`Duplicate tool ID: "${tool.id}"`)
    }
    toolMap.set(tool.id, tool)
  }

  const resourceMap = new Map()
  for (const res of resources) {
    if (resourceMap.has(res.id)) {
      throw new Error(`Duplicate resource ID: "${res.id}"`)
    }
    resourceMap.set(res.id, res)
  }

  // Cross-reference integrity checks
  for (const node of nodes) {
    const cat = categoryMap.get(node.category)
    if (!cat) {
      throw new Error(`Node "${node.id}" references missing category "${node.category}"`)
    }
    if (node.domain !== cat.domain) {
      throw new Error(
        `Domain mismatch: node "${node.id}" (${node.domain}) does not match category "${cat.id}" (${cat.domain})`,
      )
    }

    if (node.parent) {
      const parentNode = nodeMap.get(node.parent)
      if (!parentNode) {
        throw new Error(`Node "${node.id}" references missing parent "${node.parent}"`)
      }
      if (parentNode.domain !== node.domain) {
        throw new Error(
          `Parent domain mismatch: node "${node.id}" (${node.domain}) has parent "${parentNode.id}" (${parentNode.domain}) in a different domain`,
        )
      }
      if (parentNode.category !== node.category) {
        throw new Error(
          `Node "${node.id}" has parent "${parentNode.id}" in a different category ("${parentNode.category}" vs "${node.category}")`,
        )
      }
    }

    for (const toolId of node.tools) {
      if (!toolMap.has(toolId)) {
        throw new Error(`Node "${node.id}" references missing tool "${toolId}"`)
      }
    }

    for (const resId of node.resources) {
      if (!resourceMap.has(resId)) {
        throw new Error(`Node "${node.id}" references missing resource "${resId}"`)
      }
    }

    for (const ref of node.sourceRefs) {
      if (!resourceMap.has(ref.resourceId)) {
        throw new Error(`SourceRef in node "${node.id}" references missing resource "${ref.resourceId}"`)
      }
    }

    for (const nextId of node.nextSteps) {
      if (!nodeMap.has(nextId)) {
        throw new Error(`Node "${node.id}" references missing next step "${nextId}"`)
      }
    }

    for (const finding of node.findings) {
      for (const destId of finding.next) {
        if (!nodeMap.has(destId)) {
          throw new Error(
            `Finding "${finding.id}" in node "${node.id}" references missing destination "${destId}"`,
          )
        }
      }
    }
  }

  // Parent cycle detection
  for (const node of nodes) {
    const visited = new Set([node.id])
    let current = node
    while (current.parent) {
      if (visited.has(current.parent)) {
        throw new Error(
          `Parent cycle detected involving node "${current.parent}" through chain: ${[...visited].join(' -> ')} -> ${current.parent}`,
        )
      }
      visited.add(current.parent)
      current = nodeMap.get(current.parent)
      if (!current) break
    }
  }

  return {
    schemaVersion: 1,
    sourceVersions,
    categories,
    nodes,
    tools,
    resources,
  }
}

export async function loadProjectContent(
  manifestUrl,
  fetchFn = fetch,
  baseUrl = globalThis.document?.baseURI || 'http://localhost/',
) {
  const resolvedManifestUrl = new URL(manifestUrl, baseUrl).toString()
  let manifestRes
  try {
    manifestRes = await fetchFn(resolvedManifestUrl)
  } catch (err) {
    throw new Error(`Failed to load manifest at "${manifestUrl}": ${err.message}`)
  }

  if (!manifestRes || !manifestRes.ok) {
    const status = manifestRes?.status ?? 'unknown'
    const statusText = manifestRes?.statusText ?? ''
    throw new Error(`Failed to load manifest at "${manifestUrl}" (status ${status} ${statusText})`)
  }

  const manifestData = await manifestRes.json()
  const manifest = validateManifest(manifestData)

  async function loadFile(relPath) {
    const fileUrl = new URL(relPath, resolvedManifestUrl).toString()
    let res
    try {
      res = await fetchFn(fileUrl)
    } catch (err) {
      throw new Error(`Failed to fetch file "${fileUrl}": ${err.message}`)
    }
    if (!res || !res.ok) {
      const status = res?.status ?? 'unknown'
      throw new Error(`Failed to fetch file "${fileUrl}" (status ${status})`)
    }
    return res.json()
  }

  const methodologies = await Promise.all(manifest.methodologies.map(loadFile))
  const tools = await Promise.all(manifest.tools.map(loadFile))
  const resources = await Promise.all(manifest.resources.map(loadFile))

  return validateAndMergeContent({
    methodologies,
    tools,
    resources,
  })
}
