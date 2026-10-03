import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  PROGRESS_KEY,
  readProgress,
  writeProgress,
  toggleNode,
  calculateDomainProgress,
} from '../js/progress.js'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value))
    },
    removeItem: (key) => {
      map.delete(key)
    },
    clear: () => {
      map.clear()
    },
  }
}

function throwingStorage(throwOn = 'both') {
  return {
    getItem: () => {
      if (throwOn === 'getItem' || throwOn === 'both') {
        throw new Error('Storage access denied')
      }
      return null
    },
    setItem: () => {
      if (throwOn === 'setItem' || throwOn === 'both') {
        throw new Error('QuotaExceededError')
      }
    },
  }
}

describe('Resilient Progress Persistence and Reconciliation', () => {
  describe('readProgress', () => {
    it('returns empty v1 progress when storage is null or undefined', () => {
      assert.deepEqual(readProgress(null), { version: 1, completed: [] })
      assert.deepEqual(readProgress(undefined), { version: 1, completed: [] })
    })

    it('returns empty v1 progress when storage key is absent', () => {
      const storage = memoryStorage()
      assert.deepEqual(readProgress(storage), { version: 1, completed: [] })
    })

    it('returns empty v1 progress on malformed JSON', () => {
      const storage = memoryStorage({ [PROGRESS_KEY]: 'not-valid-json{{' })
      assert.deepEqual(readProgress(storage), { version: 1, completed: [] })
    })

    it('returns empty v1 progress when version is not 1', () => {
      const storage = memoryStorage({
        [PROGRESS_KEY]: JSON.stringify({ version: 2, completed: ['web-node-1'] }),
      })
      assert.deepEqual(readProgress(storage), { version: 1, completed: [] })
    })

    it('returns empty v1 progress when completed is not an array', () => {
      const storage = memoryStorage({
        [PROGRESS_KEY]: JSON.stringify({ version: 1, completed: 'string-not-array' }),
      })
      assert.deepEqual(readProgress(storage), { version: 1, completed: [] })
    })

    it('handles throwing storage gracefully without unhandled exceptions', () => {
      const storage = throwingStorage('getItem')
      assert.deepEqual(readProgress(storage), { version: 1, completed: [] })
    })

    it('restores valid unique completion IDs', () => {
      const storage = memoryStorage({
        [PROGRESS_KEY]: JSON.stringify({
          version: 1,
          completed: ['web-search-reconnaissance', 'web-fingerprint-server'],
        }),
      })
      assert.deepEqual(readProgress(storage), {
        version: 1,
        completed: ['web-search-reconnaissance', 'web-fingerprint-server'],
      })
    })

    it('reconciles and removes stale IDs when eligibleIds set is provided', () => {
      const storage = memoryStorage({
        [PROGRESS_KEY]: JSON.stringify({
          version: 1,
          completed: [
            'valid-node-1',
            'stale-deleted-node',
            'valid-node-2',
            'another-stale-node',
          ],
        }),
      })
      const eligibleIds = new Set(['valid-node-1', 'valid-node-2', 'valid-node-3'])
      const result = readProgress(storage, eligibleIds)

      assert.deepEqual(result, {
        version: 1,
        completed: ['valid-node-1', 'valid-node-2'],
      })
    })
  })

  describe('writeProgress', () => {
    it('writes deduplicated state to storage', () => {
      const storage = memoryStorage()
      const success = writeProgress(storage, {
        version: 1,
        completed: ['web-node', 'web-node', 'dfir-node'],
      })

      assert.equal(success, true)
      const stored = JSON.parse(storage.getItem(PROGRESS_KEY))
      assert.deepEqual(stored, {
        version: 1,
        completed: ['web-node', 'dfir-node'],
      })
    })

    it('handles throwing storage without raising unhandled errors', () => {
      const storage = throwingStorage('setItem')
      const success = writeProgress(storage, {
        version: 1,
        completed: ['web-node'],
      })
      assert.equal(success, false)
    })

    it('handles null or undefined storage gracefully', () => {
      assert.equal(writeProgress(null, { version: 1, completed: [] }), false)
      assert.equal(writeProgress(undefined, { version: 1, completed: [] }), false)
    })
  })

  describe('toggleNode', () => {
    it('adds node when not present and removes it when already present', () => {
      const initial = { version: 1, completed: ['node-a'] }

      const added = toggleNode(initial, 'node-b')
      assert.deepEqual(added, { version: 1, completed: ['node-a', 'node-b'] })

      const removed = toggleNode(added, 'node-a')
      assert.deepEqual(removed, { version: 1, completed: ['node-b'] })

      // Original state must not be mutated
      assert.deepEqual(initial.completed, ['node-a'])
    })
  })

  describe('calculateDomainProgress', () => {
    it('calculates total, completed, and integer percentage accurately', () => {
      const domainNodeIds = ['node-1', 'node-2', 'node-3', 'node-4']
      const completed = ['node-1', 'node-3', 'other-domain-node']

      const stats = calculateDomainProgress(completed, domainNodeIds)
      assert.deepEqual(stats, {
        total: 4,
        completed: 2,
        percent: 50,
      })
    })

    it('handles empty domain node lists without division by zero', () => {
      const stats = calculateDomainProgress([], [])
      assert.deepEqual(stats, {
        total: 0,
        completed: 0,
        percent: 0,
      })
    })
  })
})
