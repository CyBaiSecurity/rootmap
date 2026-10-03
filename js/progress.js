/**
 * RootMap Resilient Progress Persistence
 * Failure-safe localStorage progress reading, writing, and reconciliation.
 */

export const PROGRESS_KEY = 'rootmap:progress'

export function readProgress(storage, eligibleIds) {
  const emptyProgress = { version: 1, completed: [] }
  if (!storage || typeof storage.getItem !== 'function') {
    return emptyProgress
  }

  let raw
  try {
    raw = storage.getItem(PROGRESS_KEY)
  } catch {
    return emptyProgress
  }

  if (!raw || typeof raw !== 'string') {
    return emptyProgress
  }

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return emptyProgress
  }

  if (!data || typeof data !== 'object' || data.version !== 1 || !Array.isArray(data.completed)) {
    return emptyProgress
  }

  let completed = data.completed.filter((item) => typeof item === 'string' && item.trim().length > 0)

  if (eligibleIds) {
    const eligibleSet = eligibleIds instanceof Set ? eligibleIds : new Set(eligibleIds)
    completed = completed.filter((id) => eligibleSet.has(id))
  }

  return {
    version: 1,
    completed: [...new Set(completed)],
  }
}

export function writeProgress(storage, state) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false
  }

  const completed = Array.isArray(state?.completed)
    ? [...new Set(state.completed.filter((item) => typeof item === 'string'))]
    : []

  const payload = JSON.stringify({
    version: 1,
    completed,
  })

  try {
    storage.setItem(PROGRESS_KEY, payload)
    return true
  } catch {
    return false
  }
}

export function toggleNode(state, nodeId) {
  const current = new Set(Array.isArray(state?.completed) ? state.completed : [])
  if (current.has(nodeId)) {
    current.delete(nodeId)
  } else {
    current.add(nodeId)
  }

  return {
    version: 1,
    completed: [...current],
  }
}

export function calculateDomainProgress(completedIds, domainNodeIds) {
  const total = Array.isArray(domainNodeIds) ? domainNodeIds.length : 0
  if (total === 0) {
    return { total: 0, completed: 0, percent: 0 }
  }

  const completedSet = new Set(Array.isArray(completedIds) ? completedIds : [])
  const count = domainNodeIds.filter((id) => completedSet.has(id)).length
  const percent = Math.round((count / total) * 100)

  return {
    total,
    completed: count,
    percent,
  }
}
