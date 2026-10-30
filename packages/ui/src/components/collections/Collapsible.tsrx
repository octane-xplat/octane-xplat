/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useState } from 'octane'
import { useContext } from 'octane'
import type { CollapsibleProps, CollapsibleGroupProps } from '../../props'
import { CollapsibleGroupContext, CollapsibleGroupProvider } from './collapsible-context'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Pressable } from '../actions/Pressable'

/** Self-drawn collapsible — `trigger` toggles `children` between shown and
 *  hidden (unmounted). Controlled via `open`/`onOpenChange`, uncontrolled
 *  via `defaultOpen`. */
export function Collapsible(props: CollapsibleProps): unknown @{
	const group = useContext(CollapsibleGroupContext)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const controlled = props.open !== undefined
	const grouped = group != null && props.value != null
	const open = grouped ? group.isOpen(props.value!) : controlled ? props.open : internal

	const toggle = () => {
		if (props.disabled) {
			return
		}

		if (grouped) {
			group.toggle(props.value!)
			return
		}

		const next = !open
		if (!controlled) {
			setInternal(next)
		}

		props.onOpenChange?.(next)
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-collapsible', open && 'vx-collapsible--open', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		<Pressable
			className="vx-collapsible-trigger"
			disabled={props.disabled}
			onPress={toggle}
			accessibilityLabel={props.accessibilityLabel}
		>
			{props.trigger}
		</Pressable>
		{open ? (
			<masonview className="vx-collapsible-content" style={{ display: 'flex' }}>
				{props.children}
			</masonview>
		) : null}
	</masonview>
}

/** CollapsibleGroup — native leaf: coordinates `Collapsible` children by
 *  `value` (same contract as the web leaf). */
export function CollapsibleGroup(props: CollapsibleGroupProps): unknown @{
	const [internal, setInternal] = useState<string[]>(() => {
		const dv = props.defaultValue
		return dv == null ? [] : Array.isArray(dv) ? [...dv] : [dv]
	})

	const controlled = props.value !== undefined
	const openKeys: string[] = controlled
		? Array.isArray(props.value)
			? props.value
			: props.value != null
				? [props.value]
				: []
		: internal

	const multiple = props.type === 'multiple'
	const report = (next: string[]) => {
		if (!controlled) {
			setInternal(next)
		}

		props.onChange?.(multiple ? next : (next[0] ?? ''))
	}

	const ctx = {
		isOpen: (v: string) => openKeys.includes(v),
		toggle: (v: string) =>
			report(
				multiple
					? openKeys.includes(v)
						? openKeys.filter((k) => k !== v)
						: [...openKeys, v]
					: openKeys.includes(v)
						? []
						: [v],
			),
	}

	<CollapsibleGroupProvider value={ctx}>
		<masonview
			id={props.id}
			className={cx(
				'vx-collapsible-group',
				props.hasDividers && 'vx-collapsible-group--divided',
				props.className,
			)}
			style={props.style}
		>
			{props.children}
		</masonview>
	</CollapsibleGroupProvider>
}
