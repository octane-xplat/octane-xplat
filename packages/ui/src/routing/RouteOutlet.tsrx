/** @jsxImportSource @octane-xplat/jsx */
import { GridLayout } from '@nativescript/core'
import { registerElement } from '@octane-xplat/nativescript-octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import { ClientRouteOutlet } from './ClientRouteOutlet.tsrx'
import { useRouteOutletScope } from './route-outlet-scope.tsrx'
import { defaultRouterRuntime } from './default-router'
import type { RouteOutletProps } from '../props'

declare module '@octane-xplat/jsx/intrinsics' {
  interface NativeElements<TElement> {
    xplatrouteoutlethost: Attributes<TElement>
  }
}

registerElement('xplatrouteoutlethost', GridLayout)

/** Renders the current route entry for the enclosing scope's stack. */
export function RouteOutlet(props: RouteOutletProps): any {
  const { host, flow } = useRouteOutletScope(props.stack, defaultRouterRuntime)

  // A Page has one content slot. GridLayout measures both children in that
  // slot, including a Screen whose RootLayout owns its own overlays.
  return (
    <xplatrouteoutlethost style={{ flexGrow: 1 }}>
      <ClientRouteOutlet
        host={host}
        flow={flow}
        authority={props.authority}
        resumeUrl={props.resumeUrl}
        onResume={props.onResume}
      >
        {props.children}
      </ClientRouteOutlet>
    </xplatrouteoutlethost>
  )
}
