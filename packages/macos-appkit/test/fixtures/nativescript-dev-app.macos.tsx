import { Label } from '@nativescript/core'
import { useSignal$ } from 'octane/signals/client'

declare const __PROVIDER_DEV_REVISION__: string

export { Label }
export let increment = () => {}

export default function Counter() {
  const value$ = useSignal$(0)

  increment = () => value$.set(value$.get() + 1)
  return <label id="provider-dev-count" text={__PROVIDER_DEV_REVISION__ + ':' + value$.get()} />
}
