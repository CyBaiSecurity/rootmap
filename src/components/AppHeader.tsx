import { Code2, ListChecks, Network, ShieldAlert } from 'lucide-react'

import type { RootMapDomain, RootMapMode } from '../state/navigation'

interface AppHeaderProps {
  mode: RootMapMode
  domain: RootMapDomain
  completedCount: number
  totalCount: number
  onModeChange: (mode: RootMapMode) => void
  onDomainChange: (domain: RootMapDomain) => void
}

export function AppHeader({
  mode,
  domain,
  completedCount,
  totalCount,
  onModeChange,
  onDomainChange,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="wordmark" aria-label="RootMap">
        <Code2 aria-hidden="true" />
        <span>RootMap</span>
      </div>
      <nav className="domain-nav" aria-label="Domain">
        <button
          className={domain === 'web' ? 'domain-button is-active' : 'domain-button'}
          type="button"
          aria-pressed={domain === 'web'}
          onClick={() => onDomainChange('web')}
        >
          <Network aria-hidden="true" />
          Web
        </button>
        <button
          className={domain === 'dfir' ? 'domain-button is-active' : 'domain-button'}
          type="button"
          aria-pressed={domain === 'dfir'}
          onClick={() => onDomainChange('dfir')}
        >
          <ShieldAlert aria-hidden="true" />
          DFIR
        </button>
      </nav>
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

