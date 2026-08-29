import {
  Braces,
  ChevronRight,
  CircleUserRound,
  KeyRound,
  Monitor,
  Network,
  Settings,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import type { ComponentType } from 'react'

import type { Category } from '../content/schema'

const icons: Record<string, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  'information-gathering': Network,
  configuration: Settings,
  authentication: CircleUserRound,
  authorization: ShieldCheck,
  sessions: KeyRound,
  'input-validation': Braces,
  'business-logic': Workflow,
  'client-side': Monitor,
}

interface CategoryRailProps {
  categories: Category[]
  selectedId: string
  onSelect: (categoryId: string) => void
}

export function CategoryRail({ categories, selectedId, onSelect }: CategoryRailProps) {
  return (
    <aside className="category-rail" aria-label="Web Assessment categories">
      <h2>Web Assessment</h2>
      <nav>
        {categories.map((category) => {
          const Icon = icons[category.id] ?? Network
          const selected = category.id === selectedId
          return (
            <button
              className={selected ? 'category-button is-active' : 'category-button'}
              type="button"
              aria-current={selected ? 'page' : undefined}
              key={category.id}
              onClick={() => onSelect(category.id)}
            >
              <Icon aria-hidden={true} />
              <span>{category.title}</span>
              <ChevronRight className="category-chevron" aria-hidden="true" />
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
