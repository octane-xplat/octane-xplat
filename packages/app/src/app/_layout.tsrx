/** @jsxImportSource @octane-xplat/jsx */
import { RouteOutlet } from '@octane-xplat/ui'
import { Showcase } from '../showcase/Showcase.tsrx'
import { HARNESS_MODE } from '../platform/harness-mode'
import { Harness } from '../Harness.tsrx'

/** Visitor experiences and internal qualification have independent entry points. */
export function RootLayout(props: { children?: any }) @{
  if (props.children != null) {
    return <>{props.children}</>
  }

  if (HARNESS_MODE) return <Harness />

  <RouteOutlet>
    <Showcase />
  </RouteOutlet>
}
