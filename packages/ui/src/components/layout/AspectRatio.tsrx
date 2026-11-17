/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { AspectRatioProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../../internal/accessibility/native-accessibility'

import { useMeasure$ } from './useMeasure.tsrx'

/** AspectRatio — native has no aspect-ratio layout property, so the box
 *  measures its laid-out width and derives `height = width / ratio`
 *  (one extra layout pass; the measure hook coalesces identical bounds).
 *  `fit="cover"` stretches the child to fill; `center`/`contain` center it
 *  without stretching — media-level letterboxing belongs to the child
 *  (e.g. an Image's own scale mode). `shape="ellipse"` rounds the box to
 *  50% radius; child clipping depends on the platform view. */
export function AspectRatio(props: AspectRatioProps): unknown @{
  const { ref, bounds$ } = useMeasure$()
  const bounds = bounds$.get()
  const fit = props.fit ?? 'cover'
  const ellipse = props.shape === 'ellipse'
  const derivedHeight = bounds != null && bounds.width > 0 ? bounds.width / props.ratio : undefined

  const hostRef = useMemo(
    () => refList((view: any) => void (prepareUIHost(view), applyEscapeProps(view, props), applyUIHostModifiers(view, props)), ref, props.ref),
    [ref, props.ref, props.ios, props.android, props.web],
  )

  <masonview
    id={props.id}
    ref={hostRef}
    className={[
      'vx-aspectratio',
      `vx-aspectratio-fit-${fit}`,
      ellipse && 'vx-aspectratio--ellipse',
      props.className,
    ]}
    style={mergeStyle(
      { display: 'flex' },
      {
        width: '100%',
        ...(derivedHeight !== undefined ? { height: derivedHeight } : {}),
        ...(ellipse ? { borderRadius: '50%' } : {}),
        ...styleRecord(props.style),
      },
    )}
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState(props.accessibilityState)}
    accessibilityLiveRegion={props.accessibilityLiveRegion}
  >
    <masonview
      className="vx-aspectratio-content"
      style={mergeStyle(
        {
          justifyContent: fit !== 'cover' ? 'center' : undefined,
          alignItems: fit !== 'cover' ? 'center' : undefined,
        },
        mergeStyle({ display: 'flex' }, { flexGrow: 1 }),
      )}
    >
      {props.children}
    </masonview>
  </masonview>
}
