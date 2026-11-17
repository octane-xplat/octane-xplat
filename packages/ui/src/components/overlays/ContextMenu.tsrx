/** @jsxImportSource @octane-xplat/jsx */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from '../../props'
import type { NavigationMenuImplementation } from '../navigation/nav-link'
import { MenuData } from './MenuParts.tsrx'
import { MenuSurface } from './MenuSurface.tsrx'
import { useRef, useState } from 'octane'
import type { ContextMenuProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { Pressable } from '../actions/Pressable.tsrx'
import { Popover } from './Popover.tsrx'
import { MenuSheet, useMenuSheet } from './menu-sheet.tsrx'

/** Self-drawn context menu — long-press opens the same anchored list as
 *  DropdownMenu, positioned over the children. There is no right-click on
 *  touch targets; long-press is the honest equivalent gesture. */
export function ContextMenu<
  Contracts = RegisteredRouteContracts,
  Stacks extends string = keyof AppRouteStacks & string,
  Transitions extends string = RouteTransitionName,
>(props: ContextMenuProps<Contracts, Stacks, Transitions>): any

export function ContextMenu(props: NavigationMenuImplementation<ContextMenuProps>) @{
  const anchor = useRef<any>(null)
  const [internal, setInternal] = useState(props.defaultOpen ?? false)
  const controlled = props.isOpen !== undefined
  const open = props.isOpen ?? internal
  const asSheet = useMenuSheet(props.presentation)

  const setOpen = (next: boolean) => {
    if (props.isDisabled && next) {
      return
    }

    if (!controlled) {
      setInternal(next)
    }

    props.onOpenChange?.(next)
  }

  <masonview
    ref={(v: any) => {
      anchor.current = v
      if (v) {
        void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
      }
    }}
    id={props.id}
    className={['vx-contextmenu', props.className]}
    style={props.style}
    onLongPress={props.isDisabled ? undefined : () => setOpen(true)}
  >
    {props.children}
    {props.trigger && (
      <Pressable
        accessibilityLabel={props.accessibilityLabel ?? 'Open actions'}
        disabled={props.isDisabled}
        onPress={() => setOpen(!open)}
      >
        {props.trigger}
      </Pressable>
    )}
    @if (asSheet) {
      <MenuSheet
        open={open}
        onOpenChange={setOpen}
        label={props.label ?? props.accessibilityLabel}
        items={props.items}
      >
        {props.menu}
      </MenuSheet>
    } @else {
      <Popover
        anchor={anchor}
        open={open}
        placement={props.placement ?? 'bottom'}
        alignment={props.alignment}
        onDismiss={() => setOpen(false)}
        className={['vx-menu', props.menuClassName]}
      >
        <MenuSurface
          closeMenu={() => setOpen(false)}
          label={props.accessibilityLabel ?? props.label}
        >
          <MenuData items={props.items} />
          {props.menu}
        </MenuSurface>
      </Popover>
    }
  </masonview>
}
