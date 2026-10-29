/** @jsxImportSource @octane-xplat/jsx */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationMenuImplementation } from './nav-link'
import { MenuData } from './MenuParts.macos.tsrx'
import { MenuSurface } from './MenuSurface.macos.tsrx'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'
import type { DropdownMenuProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Button } from './controls.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { useButtonGroup } from './button-group-context'
import { useAppKitViewKeys } from './use-view-keys.macos.tsrx'
import { AppKitMenuReturnProvider, createAppKitMenuReturn } from './menu-return.macos'

/** Self-drawn dropdown menu — a shared-`Button` trigger (`button` props,
 *  Astryx `button`) plus an anchored item list via Popover. The same
 *  anchored listbox renders on every target (decision #48): bounded,
 *  unvirtualized items. */
export function DropdownMenu<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: DropdownMenuProps<Contracts, Stacks, Transitions>): any

export function DropdownMenu(props: NavigationMenuImplementation<DropdownMenuProps>) @{
	const anchor = useRef<NSView | null>(null)
	const group = useButtonGroup()
	const button = props.button ?? { label: 'Menu' }
	const disabled = !!(props.isDisabled || group?.isDisabled || button.isDisabled)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const requestedOpen = props.isOpen ?? internal
	const open = requestedOpen && !disabled

	const initialFocus = useRef<'first' | 'last'>('first')
	const local = useRef(internal), active = useRef<symbol | null>(null)
	const live = useRef({ props, disabled, busy: false })
	live.current = { props, disabled, busy: !!(button.isLoading && !button.isInterruptible) }
	const bindAnchor = useCallback((view: NSView | null) => {
		// Ref replacement may detach and reattach the same host during a callback.
		// Keep an accepted request claimed until its own finally releases it.
		anchor.current = view
	}, [])
	const setOpen = (intent: boolean | 'toggle', resetReturn = false, edge?: 'first' | 'last') => {
		const current = live.current
		if (!anchor.current || active.current) return
		const previous = current.props.isOpen ?? local.current
		const next = intent === 'toggle' ? !previous : intent
		if (next && (current.disabled || current.busy || (edge && previous))) return
		const token = Symbol('dropdown-open-change')
		active.current = token
		try {
			if (resetReturn) returnOwner.reset()
			if (next) initialFocus.current = edge ?? 'first'
			if (current.props.isOpen === undefined) { local.current = next; setInternal(next) }
			current.props.onOpenChange?.(next)
		} finally {
			if (active.current === token) active.current = null
		}
	}


	const liveReturn = useRef({ open, close: () => setOpen(false) })
	liveReturn.current = { open, close: () => setOpen(false) }
	const returnOwner = useMemo(() => createAppKitMenuReturn({ anchor: () => anchor.current,
		open: () => liveReturn.current.open, close: () => liveReturn.current.close() }), [])
	const finalFocus = useMemo(() => ({ get current() { return returnOwner.focusTarget() } }), [])
	const closeMenu = () => setOpen(false, true)

	const keys = useAppKitViewKeys({ onKeyDown: (event) => {
		const current = live.current
		if (!anchor.current || active.current || current.disabled || current.busy ||
			(current.props.isOpen ?? local.current) || event.defaultPrevented || event.isComposing ||
			event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
		event.preventDefault(); event.stopPropagation()
		setOpen(true, true, event.key === 'ArrowUp' ? 'last' : 'first')
	} })
	const mergedRef = useMemo(() => button.ref ? [bindAnchor, keys.ref, button.ref] : [bindAnchor, keys.ref], [button.ref, keys.ref, bindAnchor])
	useLayoutEffect(() => { if (!open) initialFocus.current = 'first'; else returnOwner.reset() }, [open])

	useEffect(() => {
		if (disabled && requestedOpen) setOpen(false)
	}, [disabled, requestedOpen])

	const buttonLabel = typeof button.label === 'string' ? button.label : undefined
	const iconOnly = button.isIconOnly === true
	const endContent =
		button.endContent ??
		(props.hasChevron !== false && !iconOnly ? (
			<Icon name="xplat-chevron-down" size={16} />
		) : undefined)

	<>
		<Button
			{...button}
			ref={mergedRef}
			id={props.id ?? button.id}
			className={cx('vx-menu-trigger', button.className)}
			isDisabled={disabled}
			endContent={endContent}
			clickAction={() => setOpen('toggle', true)}
			accessibilityState={{ ...button.accessibilityState, expanded: open }}
		/>
		<Popover
			anchor={anchor}
			finalFocusRef={finalFocus}
			open={open}
			placement={props.placement ?? 'bottom'}
			alignment={props.alignment}
			onDismiss={closeMenu}
			className={cx('vx-menu', props.menuClassName)}
			style={typeof props.menuWidth === 'number' ? { minWidth: props.menuWidth } : undefined}
		>
			<AppKitMenuReturnProvider value={returnOwner}>
			<MenuSurface
				closeMenu={closeMenu}
				initialFocus={initialFocus.current}
				label={props.label ?? buttonLabel}
				className={props.className}
				style={props.style}
			>
				<MenuData items={props.items} />
				{props.children}
			</MenuSurface>
			</AppKitMenuReturnProvider>
		</Popover>
	</>
}
