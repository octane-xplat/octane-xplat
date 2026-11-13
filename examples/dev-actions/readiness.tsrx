import 'octane/signals'
import { useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import { ReadinessScope, useReadinessTask, useReadiness$ } from '@octane-xplat/platform/readiness'
import { useDevAction } from '@octane-xplat/platform/dev-actions'

function Preview() {
  const [message, setMessage] = useState('Initial fixture')
  const [pending, setPending] = useState(false)

  useReadinessTask({ label: 'Preparing local fixture', pending })

  const readiness$ = useReadiness$()

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

  return <Text>{readiness$.get().status === 'pending' ? 'Preparing…' : message}</Text>
}

/** Ordinary UI observes readiness; development actions also await it automatically. */
export function ReadinessExample() {
  return (
    <ReadinessScope label="Preview">
      <Preview />
    </ReadinessScope>
  )
}
