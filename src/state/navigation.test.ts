import { describe, expect, it } from 'vitest'

import { navigationReducer, type NavigationState } from './navigation'

const selected: NavigationState = {
  mode: 'map',
  selectedDomain: 'web',
  selectedCategoryId: 'information-gathering',
  selectedNodeId: 'web-identify-technologies',
}

describe('navigationReducer', () => {
  it('changes view without discarding the selected methodology node', () => {
    expect(navigationReducer(selected, { type: 'set-mode', mode: 'checklist' })).toEqual({
      ...selected,
      mode: 'checklist',
    })
  })

  it('selects a finding destination and its category', () => {
    expect(
      navigationReducer(selected, {
        type: 'follow-finding',
        destinationId: 'web-graphql-overview',
        categoryId: 'information-gathering',
      }),
    ).toEqual({
      mode: 'map',
      selectedDomain: 'web',
      selectedCategoryId: 'information-gathering',
      selectedNodeId: 'web-graphql-overview',
    })
  })

  it('select-domain switches to dfir and resets category/node', () => {
    const result = navigationReducer(selected, {
      type: 'select-domain',
      domain: 'dfir',
    })
    expect(result.selectedDomain).toBe('dfir')
    expect(result.selectedCategoryId.startsWith('dfir-')).toBe(true)
    expect(result.selectedNodeId.startsWith('dfir-')).toBe(true)
  })
})
