import type { Store } from '@octane-xplat/ui/data'

export type IsolationProps = { label?: string }

export type IsolationFixture = {
  account: Store<{ name: string }>
  nested: { label: string }
  own: (cleanup: () => void) => void
}
