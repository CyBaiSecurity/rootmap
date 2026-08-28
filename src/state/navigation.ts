export type RootMapMode = 'map' | 'checklist'

export interface NavigationState {
  mode: RootMapMode
  selectedCategoryId: string
  selectedNodeId: string
}

export type NavigationAction =
  | { type: 'set-mode'; mode: RootMapMode }
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
    case 'select-category':
      return {
        ...state,
        selectedCategoryId: action.categoryId,
        selectedNodeId: action.firstNodeId,
      }
    case 'select-node':
      return {
        ...state,
        selectedCategoryId: action.categoryId,
        selectedNodeId: action.nodeId,
      }
    case 'follow-finding':
      return {
        mode: 'map',
        selectedCategoryId: action.categoryId,
        selectedNodeId: action.destinationId,
      }
  }
}
