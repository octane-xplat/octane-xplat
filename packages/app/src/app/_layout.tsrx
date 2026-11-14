/** @jsxImportSource @octane-xplat/jsx */
import { RouteOutlet } from '@octane-xplat/ui'
import { Showcase } from '../showcase/Showcase.tsrx'
import { HARNESS_MODE, BASELINE_MODE } from '../platform/harness-mode'
import { Harness } from '../Harness.tsrx'
import { BaselineFixture } from '../harness/BaselineFixture.tsrx'

/** Visitor experiences and internal qualification have independent entry points. */
export function RootLayout(props: { children?: any }) @{
  if (props.children != null) {
    return <>{props.children}</>
  }

  if (BASELINE_MODE) {
    return <BaselineFixture />
  }

  if (HARNESS_MODE) return <Harness />

  <RouteOutlet>
    <Showcase />
  </RouteOutlet>
}
