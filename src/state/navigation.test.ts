import { describe, expect, it } from 'vitest'

import { navigationReducer, type NavigationState } from './navigation'

const selected: NavigationState = {
  mode: 'map',
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
      selectedCategoryId: 'information-gathering',
      selectedNodeId: 'web-graphql-overview',
    })
  })
})
