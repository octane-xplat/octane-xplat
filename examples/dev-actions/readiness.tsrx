import { useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import { DevActionScope } from '@octane-xplat/platform/dev-actions/readiness'
import { useDevAction, useDevReadiness } from '@octane-xplat/platform/dev-actions'

function Preview() {
  const [message, setMessage] = useState('Initial fixture')
  const [pending, setPending] = useState(false)

  if (import.meta.env.DEV) {
    useDevReadiness(pending, 'Preparing local fixture')
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

  return <Text>{message}</Text>
}

/** Mount this example in a development app, then invoke fixture.preview through xplat. */
export function ReadinessExample() {
  if (import.meta.env.DEV) {
    return (
      <DevActionScope label="Preview">
        <Preview />
      </DevActionScope>
    )
  }

  return <Preview />
}
