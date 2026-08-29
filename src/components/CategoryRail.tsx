import {
  Braces,
  Bug,
  ChevronRight,
  CircleUserRound,
  FileText,
  FlaskConical,
  HardDrive,
  KeyRound,
  MemoryStick,
  Monitor,
  MonitorSmartphone,
  Network,
  PackageSearch,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Terminal,
  Workflow,
} from 'lucide-react'
import type { ComponentType } from 'react'

import type { Category } from '../content/schema'
import type { RootMapDomain } from '../state/navigation'

const icons: Record<string, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  'information-gathering': Network,
  configuration: Settings,
  authentication: CircleUserRound,
  authorization: ShieldCheck,
  sessions: KeyRound,
  'input-validation': Braces,
  'business-logic': Workflow,
  'client-side': Monitor,
  'dfir-collection': PackageSearch,
  'dfir-examination': Search,
  'dfir-analysis': FlaskConical,
  'dfir-reporting': FileText,
  'dfir-disk': HardDrive,
  'dfir-memory': MemoryStick,
  'dfir-network': Network,
  'dfir-windows': MonitorSmartphone,
  'dfir-linux': Terminal,
  'dfir-logs': ScrollText,
  'dfir-malware': Bug,
}

interface CategoryRailProps {
  categories: Category[]
  selectedId: string
  domain: RootMapDomain
  onSelect: (categoryId: string) => void
}

export function CategoryRail({ categories, selectedId, domain, onSelect }: CategoryRailProps) {
  const heading = domain === 'dfir' ? 'DFIR Investigation' : 'Web Assessment'
  return (
    <aside className="category-rail" aria-label={`${heading} categories`}>
      <h2>{heading}</h2>
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
