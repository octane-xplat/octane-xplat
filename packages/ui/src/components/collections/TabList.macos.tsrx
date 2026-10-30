/** @jsxImportSource @octane-xplat/jsx */
import type { NSScrollView, NSView, NSWindow } from '@octane-xplat/platform/macos'
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from '../../props'
import type { NavigationItemImplementation } from '../navigation/nav-link'
import { useNavigationItem } from '../navigation/use-navigation-item.shared.tsrx'
import { mergeStyle } from '../../internal/layout/style-merge'
import {
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'octane'

import type { TabListProps, TabProps, TabMenuProps, TabMenuOption } from '../../props'
import { useSize } from '../layout/size-context'
import { cx } from '@octane-xplat/lib'

import { Icon } from '../media/Icon.macos.tsrx'
import { Text } from '../content/Text.macos.tsrx'
import { Popover } from '../overlays/Popover.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { followHref } from '../navigation/nav-href'
import { TabListContext, TabListProvider } from '../navigation/nav-contexts'
import { revealAppKitTab } from './tab-reveal.macos'
import { createAppKitChoiceFocus } from '../forms/choice-focus.macos'
import { useKeyboard } from '../../internal/keyboard/use-keyboard.macos'
import { useDirection } from '../../internal/platform/internationalization'
import { MenuSurface } from '../overlays/MenuSurface.macos.tsrx'
import { useAppKitMenuRow } from '../overlays/use-menu-row.macos.tsrx'
import { useAppKitViewKeys } from './use-view-keys.macos.tsrx'
import { AppKitMenuReturnProvider, createAppKitMenuReturn } from '../overlays/menu-return.macos'

export { TabListContext }
export { useTabListContext } from '../navigation/nav-contexts'

const SIZE_HEIGHT: Record<string, number> = { sm: 28, md: 32, lg: 36 }

function navIcon(icon: any, size: number) {
	return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon
}

/** AppKit tab strip with native horizontal reveal and registered-tab roving
 * focus. Arrow keys move focus; the renderer owns Enter/Space activation. */
export function TabList(props: TabListProps): unknown @{
	const size = useSize(props.size, 'md')
	const overflow = props.overflow ?? 'auto'
	const layout = props.layout ?? 'hug'
	const hasScroll = overflow !== 'visible' && layout !== 'fill'
	const scroller = useRef<NSScrollView | null>(null)
	const tabViews = useRef(new Map<string, NSView>())
	const views = tabViews.current
	const selected = useRef(props.value)
	selected.current = props.value
	const attachScroller = useCallback((view: NSScrollView | null) => {
		scroller.current = view
	}, [])

	const root = useRef<NSView | null>(null)
	const pattern = useRef(props.role === 'tablist' ? ('tabs' as const) : ('nav' as const))
	pattern.current = props.role === 'tablist' ? 'tabs' : 'nav'
	const direction = useDirection(),
		liveDirection = useRef(direction)

	liveDirection.current = direction
	const navigation = useMemo(
		() =>
			createAppKitChoiceFocus({
				root: () => root.current,
				views,
				selected: () => selected.current,
				orientation: () => (pattern.current === 'tabs' ? 'horizontal' : 'both'),
				direction: () => liveDirection.current,
				reveal: (view) => {
					revealAppKitTab(scroller.current, view)
				},
			}),
		[],
	)

	const attachRoot = useCallback((view: NSView | null) => {
		if (!view) {
			navigation.dispose()
		}

		root.current = view
	}, [])

	const { keyboardProps } = useKeyboard({ onKeyDown: navigation.keyDown })

	const ctx = useMemo(
		() => ({
			value: props.value,
			onChange: props.onChange,
			size,
			layout,
			pattern: props.role === 'tablist' ? ('tabs' as const) : ('nav' as const),
			// Internal: Tabs/Tab register their views so the list can scroll the
			// selected stop into view. Not part of the public context type.
			_tabViews: views,
		}),
		[props.value, props.onChange, size, layout, props.role],
	)

	// Selection can precede layout; window updates also cover late geometry,
	// resizing and attachment without assuming NativeScript View methods.
	useEffect(() => {
		navigation.synchronize()
		if (hasScroll) {
			revealAppKitTab(scroller.current, views.get(props.value))
		}
	}, [props.value, hasScroll])

	useEffect(() => {
		const native = globalThis as Record<string, any>
		const center = native.NSNotificationCenter?.defaultCenter
		if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) {
			return
		}

		let token: unknown
		try {
			token = center.addObserverForNameObjectQueueUsingBlock(
				native.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification',
				null,
				null,
				(notification: { object: NSWindow }) => {
					if (root.current?.window !== notification.object) {
						return
					}

					navigation.synchronize()
					const scroll = scroller.current
					if (hasScroll && scroll) {
						revealAppKitTab(scroll, navigation.focusedView() ?? views.get(selected.current))
					}
				},
			)
		} catch (error) {
			console.warn('[macos-tablist] selected-tab observation unavailable', error)
			return
		}

		return () => {
			if (token != null) {
				center.removeObserver(token)
			}
		}
	}, [hasScroll])

	useEffect(() => () => navigation.dispose(), [])

	const row = (
		<masonview
			className={cx(
				'vx-tabstrip',
				'vx-tabstrip--appkit',
				props.isFullBleed && 'vx-tabstrip--bleed',
			)}
		>
			{props.children}
		</masonview>
	)

	const cls = cx(
		'vx-tablist',
		'vx-tablist--' + size,
		layout === 'fill' && 'vx-tablist--fill',
		props.hasDivider && 'vx-tablist--divided',
		props.isFullBleed && 'vx-tablist--bleed',
		props.className,
	)

	<TabListProvider value={ctx}>
		<masonview
			id={props.id}
			ref={attachRoot}
			className={cls}
			{...keyboardProps}
			accessibilityRole={props.role === 'tablist' ? 'tablist' : undefined}
			accessibilityLabel={
				props.role === 'tablist' ? String(props.web?.['aria-label'] ?? 'Tabs') : undefined
			}
			style={mergeStyle({ display: 'flex' }, props.style)}
		>
			@if (hasScroll) {
				<scrollview
					orientation="horizontal"
					ref={attachScroller}
					className="vx-tabstrip-scroll"
					scrollBarIndicatorVisible={false}
				>
					{row}
				</scrollview>
			} @else {
				<>{row}</>
			}
		</masonview>
	</TabListProvider>
}

/** Tab — a single stop in a TabList. Native leaf renders a Pressable;
 *  `href` activates through the deep-link/route table (`followHref`) in
 *  addition to reporting selection. */
export function Tab<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: TabProps<Contracts, Stacks, Transitions>): any

export function Tab(props: NavigationItemImplementation<TabProps>) @{
	const ctx = useContext(TabListContext)
	if (ctx == null) {
		throw new Error('Tab must be used within a TabList.')
	}

	const isTabs = ctx.pattern === 'tabs'
	if (isTabs && props.to !== undefined) {
		throw new TypeError(
			'Typed route destinations belong in the navigation TabList pattern, not role="tablist"',
		)
	}

	const link = useNavigationItem({ ...props, href: isTabs ? undefined : props.href })
	const isSelected = props.to !== undefined ? link.selected : ctx.value === props.value
	const isDisabled = link.disabled
	const displayIcon = isSelected && props.selectedIcon != null ? props.selectedIcon : props.icon
	const showLabel = !props.isLabelHidden && props.label !== ''

	const select = () => {
		if (link.activateNative(isTabs ? undefined : followHref)) {
			ctx.onChange(props.value)
		}
	}

	<Pressable
		id={props.id}
		ref={(v: NSView | null) => {
			if (v) {
				ctx?._tabViews?.set(props.value, v)
			} else {
				ctx?._tabViews?.delete(props.value)
			}
		}}
		className={cx(
			'vx-tab',
			isSelected && 'vx-tab--selected',
			ctx.layout === 'fill' && 'vx-tab--fill',
			props.className,
		)}
		style={mergeStyle({ height: SIZE_HEIGHT[ctx.size] }, props.style)}
		disabled={isDisabled}
		accessibilityRole={ctx.pattern === 'tabs' ? 'tab' : link.href != null ? 'link' : 'button'}
		accessibilityLabel={props.label}
		accessibilityState={{ disabled: isDisabled, selected: isSelected }}
		onPress={select}
	>
		<masonview
			className="vx-tab-content"
			style={mergeStyle(
				{ flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' },
				{ display: 'flex' },
			)}
		>
			<masonview
				style={mergeStyle(
					{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
					{ display: 'flex' },
				)}
			>
				{displayIcon != null
					? navIcon(displayIcon, ctx.size === 'lg' ? 18 : ctx.size === 'sm' ? 14 : 16)
					: null}
				{showLabel ? <Text className="vx-tab-label">{props.label}</Text> : null}
				{props.endContent != null ? props.endContent : null}
			</masonview>
			<masonview
				className={cx('vx-tab-indicator', isSelected && 'vx-tab-indicator--on')}
				style={{ display: 'flex' }}
			/>
		</masonview>
	</Pressable>
}

/** TabMenu — overflow trigger inside a TabList. Native leaf opens the
 *  shared anchored Popover with menuitemradio-style rows. */
export function TabMenu(props: TabMenuProps): unknown @{
	const ctx = useContext(TabListContext)
	if (ctx == null) {
		throw new Error('TabMenu must be used within a TabList.')
	}

	const anchor = useRef<NSView | null>(null),
		menuKey = useId()

	const [open, setOpenState] = useState(false)
	const openRef = useRef(open)
	openRef.current = open
	const choosing = useRef(false),
		initialFocus = useRef<'first' | 'last'>('first')

	const live = useRef({ props, ctx })
	live.current = { props, ctx }
	const setOpen = (next: boolean) => {
		openRef.current = next
		if (anchor.current) {
			setOpenState(next)
		}
	}

	const selected = props.options.find((o) => o.value === ctx.value)
	const triggerLabel = selected?.label ?? props.label
	const registrationKey = selected?.value ?? menuKey,
		views = ctx._tabViews

	const registration = useRef<{ views: Map<string, unknown>; key: string; view: NSView } | null>(
		null,
	)

	const synchronizeRegistration = () => {
		const previous = registration.current
		if (previous && previous.views.get(previous.key) === previous.view) {
			previous.views.delete(previous.key)
		}

		registration.current = null
		if (anchor.current && views) {
			views.set(registrationKey, anchor.current)
			registration.current = { views, key: registrationKey, view: anchor.current }
		}
	}

	const registerLatest = useRef(synchronizeRegistration)
	registerLatest.current = synchronizeRegistration
	const bind = useCallback((view: NSView | null) => {
		anchor.current = view
		registerLatest.current()
	}, [])

	useLayoutEffect(synchronizeRegistration, [views, registrationKey])

	const returnOwner = useMemo(
		() =>
			createAppKitMenuReturn({
				anchor: () => anchor.current,
				open: () => Boolean(anchor.current) && openRef.current,
				close: () => setOpen(false),
			}),
		[],
	)

	const finalFocus = useMemo(
		() => ({
			get current() {
				return returnOwner.focusTarget()
			},
		}),
		[],
	)

	const closeMenu = () => {
		returnOwner.reset()
		setOpen(false)
	}

	const requestOpen = (edge: 'first' | 'last') => {
		if (!anchor.current || choosing.current || !live.current.props.options.length) {
			return
		}

		initialFocus.current = edge
		returnOwner.reset()
		setOpen(true)
	}

	const keys = useAppKitViewKeys({
		onKeyDown: (event) => {
			if (
				!anchor.current ||
				choosing.current ||
				!live.current.props.options.length ||
				event.defaultPrevented ||
				event.isComposing ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				(event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
			) {
				return
			}

			event.preventDefault()
			event.stopPropagation()
			if (!openRef.current) {
				requestOpen(event.key === 'ArrowUp' ? 'last' : 'first')
			}
		},
	})

	const triggerRef = useMemo(() => [bind, keys.ref], [bind, keys.ref])
	useLayoutEffect(() => {
		if (!props.options.length && openRef.current) {
			closeMenu()
		}

		if (!open) {
			initialFocus.current = 'first'
		}
	}, [props.options.length, open])

	const pick = (value: string) => {
		if (
			!anchor.current ||
			!openRef.current ||
			choosing.current ||
			!live.current.props.options.some((option) => option.value === value)
		) {
			return
		}

		choosing.current = true
		openRef.current = false
		returnOwner.reset()
		try {
			live.current.ctx.onChange(value)
		} finally {
			try {
				if (anchor.current) {
					setOpen(false)
				}
			} finally {
				choosing.current = false
			}
		}
	}

	<>
		<Pressable
			ref={triggerRef}
			id={props.id}
			className={cx('vx-tab vx-tabmenu-trigger', selected && 'vx-tab--selected', props.className)}
			style={mergeStyle({ height: SIZE_HEIGHT[ctx.size] }, props.style)}
			accessibilityLabel={triggerLabel}
			accessibilityHint={props.label}
			disabled={!props.options.length}
			accessibilityState={{
				expanded: open && !!props.options.length,
				selected: !!selected,
				disabled: !props.options.length,
			}}
			onPress={() => {
				if (!anchor.current || choosing.current) {
					return
				}

				if (openRef.current) {
					closeMenu()
				} else {
					requestOpen('first')
				}
			}}
		>
			<masonview
				className="vx-tab-content"
				style={mergeStyle(
					{ flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' },
					{ display: 'flex' },
				)}
			>
				<masonview
					style={mergeStyle(
						{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
						{ display: 'flex' },
					)}
				>
					<Text className="vx-tab-label">{triggerLabel}</Text>
					<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
				</masonview>
				<masonview
					className={cx('vx-tab-indicator', selected && 'vx-tab-indicator--on')}
					style={{ display: 'flex' }}
				/>
			</masonview>
		</Pressable>
		<Popover
			anchor={anchor}
			finalFocusRef={finalFocus}
			open={open && !!props.options.length}
			placement="bottom"
			onDismiss={closeMenu}
			className="vx-tabmenu-pop"
		>
			<AppKitMenuReturnProvider value={returnOwner}>
				<MenuSurface
					closeMenu={closeMenu}
					initialFocus={initialFocus.current}
					label={props.label}
					className="vx-tabmenu"
				>
					<Text className="vx-tabmenu-heading">{props.label}</Text>
					@for (const option of props.options; key option.value) {
						<AppKitTabMenuOption
							option={option}
							selected={ctx.value === option.value}
							pick={pick}
						/>
					}
				</MenuSurface>
			</AppKitMenuReturnProvider>
		</Popover>
	</>
}

function AppKitTabMenuOption(props: {
	option: TabMenuOption
	selected: boolean
	pick(value: string): void
}) @{
	const row = useAppKitMenuRow({
		label: props.option.label,
		disabled: false,
		press: () => props.pick(props.option.value),
	})

	<Pressable
		ref={row.ref}
		className={cx('vx-tabmenu-item', props.selected && 'vx-tabmenu-item--selected')}
		accessibilityRole="menuitemradio"
		accessibilityLabel={props.option.label}
		accessibilityState={{ checked: props.selected, selected: props.selected }}
		onPress={row.press}
	>
		<masonview
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center', gap: 8 },
				{ display: 'flex' },
			)}
		>
			{props.option.icon != null ? navIcon(props.option.icon, 16) : null}
			<Text className="vx-tabmenu-itemcontent">{props.option.label}</Text>
			{props.selected ? <Icon name="xplat-check" size={16} /> : null}
		</masonview>
	</Pressable>
}
