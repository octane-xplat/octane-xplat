/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useContext, useId, useCallback } from 'octane'
import type { MobileNavProps, MobileNavToggleProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Button } from '../actions/Button.tsrx'
import { Icon } from '../media/Icon'
import { Text } from '../content/Text'
import { Pressable } from '../actions/Pressable'
import { AppShellMobileContext, useAppShellMobile } from './nav-contexts'
import { SizeProvider } from '../layout/size-context'

export { AppShellMobileContext, useAppShellMobile }

/** MobileNav — the navigation drawer. Inside AppShell its open state comes
 *  from context; standalone it takes `isOpen`/`onOpenChange`.
 *
 *  Native leaf: renders as an overlay covering its parent cell — backdrop +
 *  edge-pinned panel. (On Android, hardware back dismissal is owned by the
 *  router's back interceptor when one is registered; otherwise the backdrop
 *  tap closes.) Slide-in animation is not implemented on this leaf yet —
 *  the drawer appears/dismisses instantly. */
export function MobileNav(props: MobileNavProps): unknown @{
	const appShell = useContext(AppShellMobileContext)
	const fallbackId = useId()
	const id = props.id ?? appShell.mobileNavId ?? fallbackId

	const isControlled = props.isOpen != null
	const isOpen = isControlled ? props.isOpen : appShell.isMobileNavOpen

	const onOpenChange = useCallback(
		(next: boolean) => {
			if (props.onOpenChange) {
				props.onOpenChange(next)
			} else if (next) {
				appShell.openMobileNav()
			} else {
				appShell.closeMobileNav()
			}
		},
		[props.onOpenChange, appShell],
	)

	// `auto` resolves to `start` — the toggle's position can't be read on
	// native, and start is the platform convention (documented deviation).
	const side = props.side === 'auto' || props.side == null ? 'start' : props.side
	const width = props.width ?? 320

	@if (!isOpen) {
		null
	} @else {
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={id}
			className={cx('vx-mobilenav', 'vx-mobilenav--' + side, 'vx-mobilenav--open', props.className)}
			style={mergeStyle({ display: 'grid' }, props.style)}
			accessibilityLabel={
				props.label ?? (typeof props.header === 'string' ? props.header : 'Navigation')
			}
		>
			<masonview
				className="vx-mobilenav-backdrop"
				onTap={() => onOpenChange(false)}
				style={{ display: 'flex' }}
			/>
			<masonview
				style={mergeStyle(
					{ flexDirection: 'column' },
					mergeStyle(
						{ display: 'flex' },
						{ width, justifySelf: side === 'start' ? 'left' : 'right' },
					),
				)}
				className="vx-mobilenav-drawer"
			>
				@if (props.header != null) {
					<masonview
						className="vx-mobilenav-header"
						style={mergeStyle(
							{ flexDirection: 'row', alignItems: 'center' },
							{ display: 'flex' },
						)}
					>
						{typeof props.header === 'string' ? (
							<Text className="vx-mobilenav-heading">{props.header}</Text>
						) : (
							props.header
						)}
					</masonview>
				}
				<scrollview className="vx-mobilenav-content" style={{ flexGrow: 1 }}>
					<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
						<SizeProvider value={null}>{props.children}</SizeProvider>
					</masonview>
				</scrollview>
			</masonview>
		</masonview>
	}
}

/** MobileNavToggle — the hamburger. Renders nothing unless the AppShell
 *  mobile context says the drawer is enabled and mobile layout is active. */
export function MobileNavToggle(props: MobileNavToggleProps): unknown @{
	const { isMobile, isMobileNavEnabled, toggleMobileNav } = useAppShellMobile()

	@if (!isMobile || !isMobileNavEnabled) {
		null
	} @else {
		<Button
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx('vx-mobilenav-toggle', props.className)}
			style={props.style}
			accessibilityLabel={props.label ?? 'Open navigation'}
			clickAction={toggleMobileNav}
		>
			{props.children ?? <Icon name="xplat-menu" size={20} />}
		</Button>
	}
}
