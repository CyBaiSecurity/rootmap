import { describe, expect, it } from 'vitest'

import { PROGRESS_KEY, readProgress, toggleNode, writeProgress } from './progress'

function memoryStorage(initial?: string): Storage {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(PROGRESS_KEY, initial)
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('progress persistence', () => {
  it.each([
    ['absent', undefined],
    ['malformed', '{not-json'],
    ['wrong version', JSON.stringify({ version: 2, completed: ['web-node'] })],
  ])('returns empty v1 progress for %s storage', (_label, stored) => {
    expect(readProgress(memoryStorage(stored))).toEqual({ version: 1, completed: [] })
  })

  it('restores valid unique completion IDs written to storage', () => {
    const storage = memoryStorage()
    writeProgress(storage, {
      version: 1,
      completed: ['web-fingerprint-server', 'web-fingerprint-server'],
    })

    expect(readProgress(storage)).toEqual({
      version: 1,
      completed: ['web-fingerprint-server'],
    })
  })

  it('toggles only the requested node without mutating current state', () => {
    const current = { version: 1 as const, completed: ['first'] }
    const added = toggleNode(current, 'second')

    expect(added).toEqual({ version: 1, completed: ['first', 'second'] })
    expect(toggleNode(added, 'first')).toEqual({ version: 1, completed: ['second'] })
    expect(current.completed).toEqual(['first'])
  })
})

