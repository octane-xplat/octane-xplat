/** @jsxImportSource @octane-xplat/jsx */
import { styleRecord } from '../../internal/layout/style-merge'
import { useContext } from 'octane'
import type { SafeAreaProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { useSafeAreaInsets } from './safeAreaInsets.tsrx'
import {
  ConsumedInsetsContext,
  ConsumedInsetsProvider,
  consumeInsets,
  resolveSafeAreaEdges,
} from './inset-consumption'

/**
 * Insets content away from notches/system bars by consuming the given edges. Import from `@octane-xplat/ui`.
 *
 * @see SafeAreaProps, useSafeAreaInsets.
 */
export function SafeArea(props: SafeAreaProps): unknown @{
  const measured = useSafeAreaInsets()
  const ancestor = useContext(ConsumedInsetsContext)
  const edges = resolveSafeAreaEdges(props.edges, props.ignoreSafeArea)
  const { applied, provided } = consumeInsets(measured, ancestor, edges)

  <masonview
    id={props.id}
    ref={(host: any) => void (prepareUIHost(host), applyEscapeProps(host, props), applyUIHostModifiers(host, props))}
    className={['vx-safe-area', props.className]}
    style={{
      ...styleRecord(props.style),
      paddingTop: applied.top,
      paddingRight: applied.right,
      paddingBottom: applied.bottom,
      paddingLeft: applied.left,
    }}
  >
    <ConsumedInsetsProvider value={provided}>{props.children}</ConsumedInsetsProvider>
  </masonview>
}
