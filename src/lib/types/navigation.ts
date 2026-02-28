import type { LucideIcon } from 'lucide-react'
import type { LocalizedText } from './i18n'

export type ModuleStatus = 'active' | 'coming-soon'

export interface ModuleConfig {
  id: string
  slug: string
  name: LocalizedText
  description: LocalizedText
  icon: LucideIcon
  status: ModuleStatus
}

export interface SectionConfig {
  id: string
  name: LocalizedText
  icon: LucideIcon
  basePath: string
  modules: ModuleConfig[]
}

export type NavigationConfig = SectionConfig[]
