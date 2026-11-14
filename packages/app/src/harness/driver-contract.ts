import type { CaseSpec } from './types'

export type DriverBindings = {
  mount(spec: CaseSpec): number
  clear(): void
  resources(): number
}
