/** @jsxImportSource @octane-xplat/jsx */
import { LiquidGlassContainerView } from './liquid-glass-container-view.ios'
import { registerElement } from '@octane-xplat/nativescript-octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import type { LiquidGlassContainerProps } from '../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../internal/platform/ui-host-props'
import { layoutChildProps } from '../components/layout/layout-child'

declare module '@octane-xplat/jsx/intrinsics' {
  interface NativeElements<TElement> {
    liquidglasscontainer: Attributes<TElement, { iosGlassEffect?: { spacing?: number } }>
  }
}

// Grouping and individual effects use the same Mason-owned layout contract.
registerElement('liquidglasscontainer', LiquidGlassContainerView)

/** LiquidGlassContainer — merged-glass region (UIGlassContainerEffect):
 *  glass siblings inside morph together across `spacing` dips. The native
 *  host defaults to block; ordinary style/className selects flex or grid.
 *  Inert layout on iOS < 26. */
export function LiquidGlassContainer(props: LiquidGlassContainerProps): unknown @{
  <liquidglasscontainer
    id={props.id}
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    {...layoutChildProps(props)}
    iosGlassEffect={{ spacing: props.spacing ?? 8 }}
    className={['vx-glass-container', props.className]}
  >
    {props.children}
  </liquidglasscontainer>
}
