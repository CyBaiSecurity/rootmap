export const PROGRESS_KEY = 'rootmap:progress'

export interface ProgressState {
  version: 1
  completed: string[]
}

const EMPTY_PROGRESS: ProgressState = { version: 1, completed: [] }

function normalizeCompleted(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return null
  return [...new Set(value)]
}

export function readProgress(storage: Pick<Storage, 'getItem'>): ProgressState {
  const stored = storage.getItem(PROGRESS_KEY)
  if (!stored) return { ...EMPTY_PROGRESS }

  try {
    const candidate = JSON.parse(stored) as { version?: unknown; completed?: unknown }
    const completed = normalizeCompleted(candidate.completed)
    if (candidate.version !== 1 || completed === null) return { ...EMPTY_PROGRESS }
    return { version: 1, completed }
  } catch {
    return { ...EMPTY_PROGRESS }
  }
}

export function writeProgress(
  storage: Pick<Storage, 'setItem'>,
  state: ProgressState,
): void {
  storage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ version: 1, completed: [...new Set(state.completed)] }),
  )
}

export function toggleNode(state: ProgressState, nodeId: string): ProgressState {
  const completed = new Set(state.completed)
  if (completed.has(nodeId)) completed.delete(nodeId)
  else completed.add(nodeId)
  return { version: 1, completed: [...completed] }
}

