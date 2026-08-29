import { Code2, ListChecks, Network } from 'lucide-react'

import type { RootMapMode } from '../state/navigation'

interface AppHeaderProps {
  mode: RootMapMode
  completedCount: number
  totalCount: number
  onModeChange: (mode: RootMapMode) => void
}

export function AppHeader({
  mode,
  completedCount,
  totalCount,
  onModeChange,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="wordmark" aria-label="RootMap">
        <Code2 aria-hidden="true" />
        <span>RootMap</span>
      </div>
      <nav className="mode-nav" aria-label="View mode">
        <button
          className={mode === 'map' ? 'mode-button is-active' : 'mode-button'}
          type="button"
          aria-pressed={mode === 'map'}
          onClick={() => onModeChange('map')}
        >
          <Network aria-hidden="true" />
          Map
        </button>
        <button
          className={mode === 'checklist' ? 'mode-button is-active' : 'mode-button'}
          type="button"
          aria-pressed={mode === 'checklist'}
          onClick={() => onModeChange('checklist')}
        >
          <ListChecks aria-hidden="true" />
          Checklist
        </button>
        <span className="progress-count" aria-live="polite">
          {completedCount} of {totalCount} checks
        </span>
      </nav>
    </header>
  )
}

