/** @jsxImportSource @octane-xplat/jsx */
// The masonview wrapper is a NativeScript View — the router owns it as the SDK
// Animation target while retained panes keep their measured/hidden state.
import { useCallback } from 'octane'
import { coreViewForHost } from '../internal/platform/core-view-for-host'
import { RouterFlowVisibilityContext } from './router-hook-context'
import type { RoutePaneProps } from '../props'

const Visibility: any = RouterFlowVisibilityContext

export function RoutePane(props: RoutePaneProps): any {
  const bindView = useCallback((host: unknown) => props.viewRef?.(coreViewForHost(host)), [props.viewRef])
  return (
    <Visibility value={props.active}>
      <masonview
        visibility={props.active ? 'visible' : 'collapse'}
        ref={bindView}
        style={{ display: props.active ? 'flex' : 'none', flexGrow: 1 }}
      >
        {props.children}
      </masonview>
    </Visibility>
  )
}
