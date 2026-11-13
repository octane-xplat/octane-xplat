import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { ReadinessScope, useReadinessTask, useReadiness$ } from '@octane-xplat/platform/readiness'

function Content(props: { pending: boolean; error?: unknown }) {
  useReadinessTask({ label: 'Preparing preview', pending: props.pending, error: props.error })

  const readiness$ = useReadiness$()

  return (
    <Text>
      {readiness$.get().status === 'blocked'
        ? 'Preview failed. Try again.'
        : readiness$.get().status === 'pending'
          ? 'Preparing…'
          : 'Preview ready'}
    </Text>
  )
}

/** Clear error and set pending while retrying; settle both when preparation succeeds. */
export function RecoveryExample(props: { pending: boolean; error?: unknown }) {
  return (
    <ReadinessScope label="Preview">
      <Content pending={props.pending} error={props.error} />
    </ReadinessScope>
  )
}
