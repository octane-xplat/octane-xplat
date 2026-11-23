import 'octane/signals'
import { useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import { ReadinessScope, useReadinessTask, useReadiness$ } from '@octane-xplat/platform/readiness'
import { useDevAction } from '@octane-xplat/platform/dev-actions'

function Preview() {
  // 1. Keep the fixture text and the preparation state in this component.
  const [message, setMessage] = useState('Initial fixture')
  const [pending, setPending] = useState(false)

  // 2. Register the work so readiness follows the pending state.
  useReadinessTask({ label: 'Preparing local fixture', pending })

  const readiness$ = useReadiness$()

  // 3. Expose a cancellable action only in development.
  if (import.meta.env.DEV) {
    useDevAction(
      {
        id: 'fixture.preview',
        title: 'Prepare preview',
        description: 'Prepare an owned local fixture and wait for its registered work.',
        effects: { summary: 'Changes fixture text', appState: true },
        execution: { timeoutMs: 5000, cancellable: true },
        async run(_input, { signal }) {
          setPending(true)
          try {
            await Promise.resolve()
            if (!signal.aborted) {
              setMessage('Prepared fixture')
            }

            return {}
          } finally {
            setPending(false)
          }
        },
      },
      { label: 'Preview' },
    )
  }

  // 4. Show preparation while the registered work is pending.
  return <Text>{readiness$.get().status === 'pending' ? 'Preparing…' : message}</Text>
}

/** Ordinary UI observes readiness; development actions also await it automatically. */
export function ReadinessExample() {
  // 5. Give the component an owning scope for its readiness tasks.
  return (
    <ReadinessScope label="Preview">
      <Preview />
    </ReadinessScope>
  )
}
