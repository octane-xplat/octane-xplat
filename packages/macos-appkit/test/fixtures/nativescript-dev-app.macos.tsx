import { Label } from '@nativescript/core'
import { __rendererId } from '@octane-xplat/macos-appkit'
import { useSignal$ } from 'octane/signals/client'

declare const __PROVIDER_DEV_REVISION__: string

export { Label, __rendererId }
export let increment = () => {}

export default function Counter() {
  const value$ = useSignal$(0)

  increment = () => value$.set(value$.get() + 1)
  return <label id="provider-dev-count" text={__PROVIDER_DEV_REVISION__ + ':' + value$.get()} />
}
