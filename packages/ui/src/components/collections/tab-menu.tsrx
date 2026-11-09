/** @jsxImportSource @octane-xplat/jsx */
import { useContext, useRef, useState } from 'octane'
import type { TabMenuProps } from '../../props'
import { mergeStyle } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.tsrx'
import { Text } from '../content/Text.tsrx'
import { View } from '../layout/View.tsrx'
import { Popover } from '../overlays/Popover.tsrx'
import { Pressable } from '../actions/Pressable.tsrx'
import { TabListContext } from '../navigation/nav-contexts'

export const SIZE_HEIGHT: Record<string, number> = { sm: 28, md: 32, lg: 36 }

export function navIcon(icon: any, size: number) {
  return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon
}

/** TabMenu — overflow trigger inside a TabList. Native leaf opens the
 *  shared anchored Popover with menuitemradio-style rows. */
export function TabMenu(props: TabMenuProps): unknown @{
  const ctx = useContext(TabListContext)

  if (ctx == null) {
    throw new Error('TabMenu must be used within a TabList.')
  }

  const anchor = useRef<any>(null)
  const [open, setOpen] = useState(false)
  const selected = props.options.find((o) => o.value === ctx.value)
  const triggerLabel = selected?.label ?? props.label

  const pick = (value: string) => {
    ctx.onChange(value)
    setOpen(false)
  }

  <>
    <Pressable
      ref={(v: any) => {
        anchor.current = v
        applyEscapeProps(v, props)
      }}
      id={props.id}
      className={cx('vx-tab vx-tabmenu-trigger', selected && 'vx-tab--selected', props.className)}
      style={mergeStyle({ height: SIZE_HEIGHT[ctx.size] }, props.style)}
      accessibilityLabel={triggerLabel}
      accessibilityHint={props.label}
      onPress={() => setOpen(!open)}
    >
      <View
        className="vx-tab-content"
        style={mergeStyle(
          { flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' },
          { display: 'flex' },
        )}
      >
        <View
          style={mergeStyle(
            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
            { display: 'flex' },
          )}
        >
          <Text className="vx-tab-label">{triggerLabel}</Text>
          <Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
        </View>
        <View
          className={cx('vx-tab-indicator', selected && 'vx-tab-indicator--on')}
          style={{ display: 'flex' }}
        />
      </View>
    </Pressable>
    <Popover
      anchor={anchor}
      open={open}
      placement="bottom"
      onDismiss={() => setOpen(false)}
      className="vx-tabmenu-pop"
    >
      <View
        className="vx-tabmenu"
        style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
      >
        <Text className="vx-tabmenu-heading">{props.label}</Text>
        @for (const option of props.options; key option.value) {
          <Pressable
            className={cx(
              'vx-tabmenu-item',
              ctx.value === option.value && 'vx-tabmenu-item--selected',
            )}
            accessibilityState={{ selected: ctx.value === option.value }}
            onPress={() => pick(option.value)}
          >
            <View
              style={mergeStyle(
                { flexDirection: 'row', alignItems: 'center', gap: 8 },
                { display: 'flex' },
              )}
            >
              {option.icon != null ? navIcon(option.icon, 16) : null}
              <Text className="vx-tabmenu-itemcontent">{option.label}</Text>
              {ctx.value === option.value ? <Icon name="xplat-check" size={16} /> : null}
            </View>
          </Pressable>
        }
      </View>
    </Popover>
  </>
}
