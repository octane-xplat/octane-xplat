import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { ReadinessScope, useReadinessTask, useReadiness$ } from '@octane-xplat/platform/readiness'

function Content(props: { loading: boolean }) {
  // 1. Register loading work inside the nearest readiness scope.
  useReadinessTask({ label: 'Loading checkout', pending: props.loading })

  // 2. Read the scope's status to choose the visible message.
  const readiness$ = useReadiness$()

  return (
    <Text>{readiness$.get().status === 'pending' ? 'Loading checkout…' : 'Checkout ready'}</Text>
  )
}

/** Change loading to false to observe the screen become ready. */
export function LoadingExample(props: { loading: boolean }) {
  // 3. Own the registered work with a scope around the content.
  return (
    <ReadinessScope label="Checkout">
      <Content loading={props.loading} />
    </ReadinessScope>
  )
}
