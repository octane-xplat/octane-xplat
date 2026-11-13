import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { ReadinessScope, useReadinessTask, useReadiness$ } from '@octane-xplat/platform/readiness'

function Content(props: { loading: boolean }) {
  useReadinessTask({ label: 'Loading checkout', pending: props.loading })

  const readiness$ = useReadiness$()

  return (
    <Text>{readiness$.get().status === 'pending' ? 'Loading checkout…' : 'Checkout ready'}</Text>
  )
}

/** Change loading to false to observe the screen become ready. */
export function LoadingExample(props: { loading: boolean }) {
  return (
    <ReadinessScope label="Checkout">
      <Content loading={props.loading} />
    </ReadinessScope>
  )
}
