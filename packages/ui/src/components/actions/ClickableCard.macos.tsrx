/** @jsxImportSource @octane-xplat/jsx */
import type { ClickableCardProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'
import { Pressable } from './Pressable.macos.tsrx'
import { openUrl } from '@octane-xplat/platform'
import { sanitizeUrl } from '../../routing/safe-url'
import { TextSlot } from '../forms/text-slot.tsrx'

export function ClickableCard(props: ClickableCardProps): unknown @{
  const activate = () => {
    if (props.isDisabled) {
      return
    }

    if (props.href) {
      const url = sanitizeUrl(props.href)

      if (url) {
        openUrl(url)
      }
    }

    props.onPress?.()
  }

  <Pressable
    id={props.id}
    className={[
      'vx-card',
      'vx-clickable-card',
      `vx-card--${props.variant ?? 'default'}`,
      props.elevation && `vx-card--elev-${props.elevation}`,
      props.isDisabled && 'vx-card--disabled',
      props.className,
    ]}
    style={{
      ...styleRecord(props.style),
      paddingTop: (props.padding ?? 4) * 4,
      paddingRight: (props.padding ?? 4) * 4,
      paddingBottom: (props.padding ?? 4) * 4,
      paddingLeft: (props.padding ?? 4) * 4,
      width: props.width,
      height: props.height,
      maxWidth: props.maxWidth,
    }}
    disabled={props.isDisabled}
    onPress={activate}
    accessibilityRole={props.href ? 'link' : 'button'}
    accessibilityLabel={props.label}
    accessibilityState={{ disabled: props.isDisabled }}
  >
    <TextSlot>{props.children}</TextSlot>
  </Pressable>
}
