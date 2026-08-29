export type RootMapMode = 'map' | 'checklist'
export type RootMapDomain = 'web' | 'dfir'

export interface NavigationState {
  mode: RootMapMode
  selectedDomain: RootMapDomain
  selectedCategoryId: string
  selectedNodeId: string
}

export type NavigationAction =
  | { type: 'set-mode'; mode: RootMapMode }
  | { type: 'select-domain'; domain: RootMapDomain; categoryId?: string; firstNodeId?: string }
  | { type: 'select-category'; categoryId: string; firstNodeId: string }
  | { type: 'select-node'; nodeId: string; categoryId: string }
  | { type: 'follow-finding'; destinationId: string; categoryId: string }

export function navigationReducer(
  state: NavigationState,
  action: NavigationAction,
): NavigationState {
  switch (action.type) {
    case 'set-mode':
      return { ...state, mode: action.mode }
    case 'select-domain': {
      const isDfir = action.domain === 'dfir'
      return {
        ...state,
        selectedDomain: action.domain,
        selectedCategoryId:
          action.categoryId ?? (isDfir ? 'dfir-collection' : 'information-gathering'),
        selectedNodeId:
          action.firstNodeId ??
          (isDfir ? 'dfir-collect-preserve-evidence' : 'web-identify-technologies'),
      }
    }
    case 'select-category':
      return {
        ...state,
        selectedDomain: action.categoryId.startsWith('dfir-') ? 'dfir' : 'web',
        selectedCategoryId: action.categoryId,
        selectedNodeId: action.firstNodeId,
      }
    case 'select-node':
      return {
        ...state,
        selectedDomain: action.categoryId.startsWith('dfir-') ? 'dfir' : 'web',
        selectedCategoryId: action.categoryId,
        selectedNodeId: action.nodeId,
      }
    case 'follow-finding':
      return {
        mode: 'map',
        selectedDomain: action.categoryId.startsWith('dfir-') ? 'dfir' : 'web',
        selectedCategoryId: action.categoryId,
        selectedNodeId: action.destinationId,
      }
  }
}
