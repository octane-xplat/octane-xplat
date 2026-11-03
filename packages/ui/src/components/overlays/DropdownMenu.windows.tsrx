/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type {
  AppRouteStacks,
  DropdownMenuProps,
  MenuActionData,
  RegisteredRouteContracts,
  RouteTransitionName,
} from '../../props'

import type { NavigationMenuImplementation } from '../navigation/nav-link'
import { Button } from '../actions/Button.tsrx'
import { useButtonGroup } from '../actions/button-group-context'
import { Text } from '../content/Text.tsrx'
import { View } from '../layout/View.tsrx'
import { useMeasure } from '../layout/useMeasure.tsrx'
import { Icon } from '../media/Icon.tsrx'
import { DropdownMenu as SharedDropdownMenu } from './DropdownMenu.tsrx'
import './menu-control.windows'

// Internal navigation destinations are already validated before this leaf.
const SharedMenu = SharedDropdownMenu as (
  props: NavigationMenuImplementation<DropdownMenuProps>,
) => any

export function DropdownMenu<
  Contracts = RegisteredRouteContracts,
  Stacks extends string = keyof AppRouteStacks & string,
  Transitions extends string = RouteTransitionName,
>(props: DropdownMenuProps<Contracts, Stacks, Transitions>): any

/** Finite action menus use native MenuItem peers over shared row content.
 * Other presentations retain the shared implementation and its input limits. */
export function DropdownMenu(props: NavigationMenuImplementation<DropdownMenuProps>) @{
  const measured = useMeasure()
  const group = useButtonGroup()
  const button = props.button ?? { label: 'Menu' }
  const disabled = !!(props.isDisabled || group?.isDisabled || button.isDisabled)
  const busy = !!(button.isLoading && !button.isInterruptible)
  const [internal, setInternal] = useState(props.defaultOpen ?? false)
  const local = useRef(internal)
  const active = useRef(false)
  const latest = useRef({ props, disabled, busy })
  latest.current = { props, disabled, busy }
  const requestedOpen = props.isOpen ?? internal
  const open = requestedOpen && !disabled && !busy
  const setOpen = (next: boolean) => {
    const current = latest.current
    if (active.current || (next && (current.disabled || current.busy))) {
      return
    }

    if (next === (current.props.isOpen ?? local.current)) {
      return
    }

    active.current = true
    try {
      if (current.props.isOpen === undefined) {
        local.current = next
        setInternal(next)
      }

      current.props.onOpenChange?.(next)
    } finally {
      active.current = false
    }
  }

  useEffect(() => {
    if ((disabled || busy) && requestedOpen) {
      setOpen(false)
    }
  }, [disabled, busy, requestedOpen])

  const nativeItems =
    props.items?.length &&
    props.items.every((item) => item.type === 'action' && item.hasCloseOnSelect !== false)
      ? (props.items as readonly MenuActionData[])
      : undefined

  const buttonLabel = typeof button.label === 'string' ? button.label : undefined
  const endContent =
    button.endContent ??
    (props.hasChevron !== false && !button.isIconOnly ? (
      <Icon name="xplat-chevron-down" size={16} />
    ) : undefined)

  @if (
    !nativeItems ||
    props.children != null ||
    (props.presentation != null && props.presentation !== 'popover') ||
    (props.placement != null && props.placement !== 'bottom') ||
    props.alignment != null ||
    props.menuWidth != null ||
    props.className != null ||
    props.style != null ||
    props.menuClassName != null
  ) {
    <SharedMenu {...props} isOpen={requestedOpen} onOpenChange={setOpen} />
  } @else {
    <View ref={measured.ref}>
      <Button
        {...button}
        id={props.id ?? button.id}
        className={cx('vx-menu-trigger', button.className)}
        isDisabled={disabled}
        endContent={endContent}
        clickAction={() => setOpen(!(latest.current.props.isOpen ?? local.current))}
        accessibilityState={{ ...button.accessibilityState, expanded: open }}
      />
      <xplatwindowsmenu
        id={props.id ? `${props.id}-native-menu` : undefined}
        settings={{
          open,
          blocked: disabled || busy,
          label: props.label ?? buttonLabel ?? 'Menu',
          onOpenChange: setOpen,
        }}
        isEnabled={!disabled && !busy}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: measured.bounds?.width ?? 0,
          height: measured.bounds?.height ?? 0,
        }}
      >
        @for (const item of nativeItems; key item.key) {
          <xplatwindowsmenuitem
            id={item.key}
            settings={{
              label: item.label ?? item.key,
              disabled: !!item.isDisabled,
              onSelect: item.onSelect,
            }}
          >
            <masonview
              className={cx(
                'vx-menu-item',
                item.isDisabled && 'vx-menu-item--disabled',
                item.variant === 'destructive' && 'vx-menu-item--destructive',
              )}
            >
              {item.icon ? <Icon name={item.icon} /> : null}
              <Text className="vx-menu-item-label">{item.label ?? item.key}</Text>
              {item.description ? <Text>{item.description}</Text> : null}
            </masonview>
          </xplatwindowsmenuitem>
        }
      </xplatwindowsmenu>
    </View>
  }
}
