/** @jsxImportSource @octane-xplat/jsx/dom */
import { DropdownMenu } from '../overlays/DropdownMenu.web.tsrx'
import { MenuData } from '../overlays/MenuParts.web.tsrx'
import type {
	BreadcrumbProps,
	BreadcrumbEntry,
	BreadcrumbItemProps,
	BreadcrumbMenuOption,
	RegisteredRouteContracts,
	AppRouteStacks,
	RouteTransitionName,
} from '../../props'

import type {
	NavigationItemImplementation,
	NavigationItemsImplementation,
	MenuOptionImplementation,
} from './nav-link'

import { isChildrenBlock } from 'octane'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { useLinkComponent } from './use-link-component.web.tsrx'
import { applyEscapeProps } from '../overlays/escape-props'
import { toChildArray } from '../../internal/rendering/child-array'
import { mergeStyle } from '../../internal/layout/style-merge'
import type { JSX } from 'octane/jsx-runtime'

function menuOptions(menu: BreadcrumbMenuOption[]): MenuOptionImplementation[] {
	return menu.map((opt, i) =>
		'type' in opt && opt.type === 'divider'
			? { type: 'separator', key: 'divider-' + i }
			: {
					type: 'action',
					key: 'opt-' + i,
					label: (opt as { label: string }).label,
					onSelect: (opt as { onClick?: () => void }).onClick,
				},
	)
}

function BreadcrumbCrumb(props: {
	item: NavigationItemImplementation<BreadcrumbEntry>
	current: boolean
}) @{
	const link = useNavigationItem({ ...props.item, onClick: () => props.item.onSelect?.() })
	const LinkEl: any = useLinkComponent(props.item.as)
	const icon = (props.item as BreadcrumbEntry).startIcon
	const menu = (props.item as BreadcrumbEntry).menu

	<span className="vx-breadcrumb-crumb">
		{icon ? <span className="vx-breadcrumb-icon">{icon}</span> : null}
		@if (menu) {
			<DropdownMenu
				hasChevron={false}
				button={{
					label: '',
					variant: 'ghost',
					size: 'sm',
					accessibilityLabel: `${props.item.label} options`,
				}}
			>
				<MenuData items={menuOptions(menu)} />
			</DropdownMenu>
		}
		@if (link.href != null) {
			<LinkEl
				className="vx-breadcrumb-link"
				href={link.href}
				target={props.item.target}
				rel={props.item.rel}
				download={props.item.download}
				aria-current={link.selected || props.item.isCurrent ? 'page' : undefined}
				aria-disabled={link.disabled || undefined}
				tabIndex={link.disabled ? -1 : undefined}
				onClick={link.activateWeb}
			>
				{props.item.label}
			</LinkEl>
		} @else if (props.item.onSelect) {
			<button
				type="button"
				className="vx-breadcrumb-link"
				disabled={link.disabled}
				onClick={link.activateWeb}
			>
				{props.item.label}
			</button>
		} @else {
			<span className="vx-breadcrumb-text" aria-current={props.current ? 'page' : undefined}>
				{props.item.label}
			</span>
		}
	</span>
}

/** BreadcrumbItem part — one trail entry inside `Breadcrumbs` (Astryx
 *  composition). `children` are the label; navigation comes from
 *  `href`/`to`/`onPress`; `isCurrent` marks the current location. */
export function BreadcrumbItem(props: BreadcrumbItemProps): JSX.Element @{
	const label = props.children
	const menu = props.menu ? menuOptions(props.menu) : null
	const href = props.href ?? props.to

	<span id={props.id} className={['vx-breadcrumb-crumb', props.className]} style={props.style}>
		{props.startIcon ? <span className="vx-breadcrumb-icon">{props.startIcon}</span> : null}
		{menu ? (
			<DropdownMenu
				hasChevron={false}
				button={{ label: '', variant: 'ghost', size: 'sm', accessibilityLabel: 'Options' }}
			>
				<MenuData items={menu} />
			</DropdownMenu>
		) : null}
		@if (href != null) {
			<a
				className="vx-breadcrumb-link"
				href={href}
				aria-current={props.isCurrent ? 'page' : undefined}
				onClick={props.onPress ?? props.onClick}
			>
				{label}
			</a>
		} @else if (props.onPress || props.onClick) {
			<button
				type="button"
				className="vx-breadcrumb-link"
				onClick={props.onPress ?? props.onClick}
			>
				{label}
			</button>
		} @else {
			<span
				className="vx-breadcrumb-text"
				aria-current={props.isCurrent ? 'page' : undefined}
			>
				{label}
			</span>
		}
	</span>
}

/** Ancestor links share typed destinations with the owning route flow.
 *  `items` render first; `BreadcrumbItem` part children follow (Astryx
 *  composition preserved). */
export function Breadcrumb<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: BreadcrumbProps<Contracts, Stacks, Transitions>): any

export function Breadcrumb(
	props: Omit<NavigationItemsImplementation<BreadcrumbProps, BreadcrumbEntry>, 'items'> & {
		items?: readonly NavigationItemImplementation<BreadcrumbEntry>[]
	},
) @{
	const sep = props.separator ?? '/'
	const all = props.items ?? []
	const childCrumb = isChildrenBlock(props.children) ? [] : toChildArray(props.children)
	const limit = Math.max(2, props.maxVisibleItems ?? all.length)
	const overflow = all.length > limit ? all.slice(1, all.length - limit + 1) : []
	const visible = overflow.length ? [all[0], ...all.slice(all.length - limit + 1)] : all
	const count = visible.length + childCrumb.length
	const overflowItems: readonly MenuOptionImplementation[] = overflow.map((item, index) =>
		item.to !== undefined || item.href !== undefined
			? { ...item, type: 'link', key: 'ancestor-' + index }
			: {
					type: 'action',
					key: 'ancestor-' + index,
					label: item.label,
					onSelect: item.onSelect,
					isDisabled: item.isDisabled || !item.onSelect,
				},
	)

	const sepAt = (index: number) =>
		index > 0 ? (
			<span className="vx-breadcrumb-sep" aria-hidden="true">
				{sep}
			</span>
		) : null

	<nav
		ref={(element: any) => applyEscapeProps(element, props)}
		id={props.id}
		className={[
			'vx-breadcrumb',
			props.variant === 'supporting' && 'vx-breadcrumb--supporting',
			props.className,
		]}
		style={mergeStyle({ '--vx-bc-sep': JSON.stringify(' ' + sep + ' ') }, props.style)}
		aria-label={props.accessibilityLabel ?? 'Breadcrumb'}
	>
		@for (const item of visible; index index; key index) {
			<span className="vx-breadcrumb-item">
				{index === 1 && (overflow.length > 0 || props.overflowMenu) && (
					<DropdownMenu
						hasChevron={false}
						button={{
							label: '…',
							variant: 'ghost',
							size: 'sm',
							accessibilityLabel: props.overflowLabel ?? 'More ancestors',
						}}
					>
						<MenuData items={overflowItems} />
						{props.overflowMenu}
					</DropdownMenu>
				)}
				{sepAt(index)}
				<BreadcrumbCrumb
					item={item}
					current={item.isCurrent === true || index === count - 1}
				/>
			</span>
		}
		{isChildrenBlock(props.children)
			? props.children
			: childCrumb.map((child: any, i: number) => (
					<span className="vx-breadcrumb-item" key={'c' + i}>
						{sepAt(visible.length + i)}
						{child}
					</span>
				))}
	</nav>
}
