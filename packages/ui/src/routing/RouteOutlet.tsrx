/** @jsxImportSource @octane-xplat/jsx */
import { ClientRouteOutlet } from './ClientRouteOutlet.tsrx'
import { useRouteOutletScope } from './route-outlet-scope.tsrx'
import { defaultRouterRuntime } from './default-router'
import type { RouteOutletProps } from '../props'

/** Renders the current route entry for the enclosing scope's stack. */
export function RouteOutlet(props: RouteOutletProps): any {
  const { host, flow } = useRouteOutletScope(props.stack, defaultRouterRuntime)

  // A NativeScript Page has one content slot. Keep the routed tree and the
  // outlet's zero-size portal owner inside that slot.
  return (
    <masonview style={{ flexDirection: 'column', flexGrow: 1 }}>
      <ClientRouteOutlet
        host={host}
        flow={flow}
        authority={props.authority}
        resumeUrl={props.resumeUrl}
        onResume={props.onResume}
      >
        {props.children}
      </ClientRouteOutlet>
    </masonview>
  )
}
