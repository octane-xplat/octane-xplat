/** @jsxImportSource @octane-xplat/jsx */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { mergeStyle } from './style-merge'
import { MenuData } from './MenuParts.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { ContextMenuProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Pressable } from './Pressable.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { TextSlot } from './text-slot'
import { AppKitMenuReturnProvider, createAppKitMenuReturn } from './menu-return.macos'
import { appKitContextMenuOrigin } from './context-menu-origin.macos'
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'

/** Self-drawn AppKit context menu with long-press, visible-trigger and
 * Shift+F10 intent. Native secondary-click opening remains separate. */
export function ContextMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: ContextMenuProps<Contracts, Stacks, Transitions>): any

export function ContextMenu(props: NavigationMenuImplementation<ContextMenuProps>) @{
	const anchor = useRef<NSView | null>(null), trigger = useRef<NSView | null>(null), origin = useRef<NSView | null>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const controlled = props.isOpen !== undefined
	const requestedOpen = props.isOpen ?? internal
	const open = requestedOpen && !props.isDisabled

	const setOpen = (next: boolean) => {
		if (props.isDisabled && next) {
			return
		}

		if (!controlled) {
			setInternal(next)
		}

		props.onOpenChange?.(next)
	}

	const live = useRef({ props, open, setOpen })
	live.current = { props, open, setOpen }
	const returnOwner = useMemo(() => createAppKitMenuReturn({
		anchor: () => appKitContextMenuOrigin(anchor.current, origin.current) ?? appKitContextMenuOrigin(anchor.current, trigger.current),
		open: () => live.current.open, close: () => live.current.setOpen(false),
	}), [])
	const finalFocus = useMemo(() => ({ get current() { return returnOwner.focusTarget() } }), [])
	const closeMenu = () => { returnOwner.reset(); setOpen(false) }
	const openPointer = (toggle = false) => {
		if (!anchor.current || live.current.props.isDisabled) return
		origin.current = appKitContextMenuOrigin(anchor.current, trigger.current)
		returnOwner.reset(); live.current.setOpen(toggle ? !live.current.open : true)
	}
	const keyDown = (event: NativeKeyboardEvent<NSView>) => {
		const current = live.current
		if (!anchor.current || current.props.isDisabled || current.open || event.defaultPrevented || event.isComposing ||
			event.altKey || event.ctrlKey || event.metaKey || !event.shiftKey || event.key !== 'F10') return
		const target = appKitContextMenuOrigin(anchor.current, event.target)
		if (!target) return
		origin.current = target; returnOwner.reset()
		event.preventDefault(); event.stopPropagation(); current.setOpen(true)
	}
	const bind = useCallback((view: NSView | null) => {
		anchor.current = view
		if (!view) origin.current = null
		else applyEscapeProps(view, live.current.props)
	}, [])
	useLayoutEffect(() => {
		if (anchor.current) applyEscapeProps(anchor.current, props)
	}, [props])
	useLayoutEffect(() => { if (open) returnOwner.reset() }, [open])

	useEffect(() => {
		if (props.isDisabled && requestedOpen) setOpen(false)
	}, [props.isDisabled, requestedOpen])

	<masonview
		ref={bind}
		id={props.id}
		disabled={props.isDisabled}
		className={cx('vx-contextmenu', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		onKeyDown={keyDown}
		onLongPress={props.isDisabled ? undefined : () => openPointer()}
		accessibilityRole="group"
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={{ disabled: props.isDisabled, expanded: open }}
	>
		{props.children}
		{props.trigger != null && props.trigger !== false ? (
			<Pressable
				ref={trigger}
				className="vx-contextmenu-trigger"
				accessibilityLabel={props.accessibilityLabel ?? 'Open actions'}
				disabled={props.isDisabled}
				onPress={() => openPointer(true)}
			>
				<TextSlot>{props.trigger}</TextSlot>
			</Pressable>
		) : null}
		<Popover
			anchor={anchor}
			finalFocusRef={finalFocus}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={closeMenu}
			className={cx('vx-menu', props.menuClassName)}
		>
			<AppKitMenuReturnProvider value={returnOwner}>
				<MenuSurface closeMenu={closeMenu} initialFocus="first" label={props.accessibilityLabel ?? props.label}>
					<MenuData items={props.items} />
					{props.menu}
				</MenuSurface>
			</AppKitMenuReturnProvider>
		</Popover>
	</masonview>
}
