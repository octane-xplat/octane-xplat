/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { IndicatorProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** RadioIndicator — decorative circle (20/24dip); a filled dot appears
 *  when checked. `children` replaces the dot (busy spinners). Decorative
 *  only — the owning control keeps role/focus/state. */
export function RadioIndicator(props: IndicatorProps<'singleSelection'>): unknown @{
  const size = props.size ?? 'md'
  const content =
    props.children != null ? (
      props.children
    ) : props.state === 'checked' ? (
      <masonview
        className={['vx-radio-dot', 'vx-ind-radio-dot', `vx-ind-radio-dot--${size}`]}
        style={{ display: 'flex' }}
      />
    ) : null

  const forwardedRef = useMemo(
    () =>
      refList((v: any) => {
        if (v) {
          void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
        }
      }, props.ref),
    [props.ref, props.ios, props.android, props.web],
  )

  <masonview
    id={props.id}
    ref={forwardedRef}
    className={[
      'vx-radio',
      'vx-ind-radio',
      `vx-ind-radio--${size}`,
      props.state === 'checked' && 'vx-ind-radio--checked',
      props.isDisabled && 'vx-ind-radio--disabled',
      props.className,
    ]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    {content}
  </masonview>
}
