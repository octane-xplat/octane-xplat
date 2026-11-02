/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { refList } from '../../internal/accessibility/ref-list'
import type { ListItemProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { Checkbox } from '../forms/Checkbox.web.tsrx'
import { useListContext } from './list-context'
import type { JSX } from 'octane/jsx-runtime'

interface DelegateTarget {
	notify?(event?: any): void
	click?(): void
	focus?(): void
}

/** ListItem — a `List` row rendered as `<li>`: marker (context-driven) +
 *  startContent + label/description stack + endContent. `onPress`/`href`
 *  render an invisible button/anchor covering the row (one tab stop, real
 *  keyboard + activation semantics; `:focus-within` draws the ring).
 *  `delegateRef` (upstream `interactiveRef`) forwards row presses to a
 *  nested control instead — the row adds no second tab stop. */
export function ListItem(props: ListItemProps): JSX.Element @{
	const ctx = useListContext()
	const interactive = props.onPress != null || props.href != null
	const rel =
		props.href != null
			? (props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined))
			: undefined

	const onRowClick = (event: MouseEvent) => {
		if (props.isDisabled) {
			return
		}

		// A label or slot can sit above the invisible hit button. Treat its
		// click as a row press, but leave nested controls and the hit button
		// to their own handlers so one click invokes the action only once.
		const target = event.target as Element | null
		const control = target?.closest?.(
			'a,button,input,textarea,select,[role],[contenteditable="true"]',
		)

		if (
			control &&
			event.currentTarget instanceof Element &&
			event.currentTarget.contains(control)
		) {
			return
		}

		if (props.delegateRef?.current) {
			const delegate = props.delegateRef.current as DelegateTarget
			delegate.click?.()
			delegate.focus?.()
		} else if (props.href == null) {
			props.onPress?.()
		}
	}

	// ListMarkerScope may name another marker for this item, or a task
	// checkbox in the marker's place (Astryx ctx.marker/ctx.task).
	const markerKind = ctx.listStyle === 'none' ? null : (ctx.marker ?? ctx.listStyle)
	const task = markerKind == null ? undefined : ctx.task

	const marker =
		task != null ? (
			<span className="vx-listmarker vx-listmarker--task">
				<Checkbox
					size="sm"
					value={task.isChecked}
					label={task.label}
					isLabelHidden
					isReadOnly
				/>
			</span>
		) : markerKind === 'disc' || markerKind === 'circle' || markerKind === 'square' ? (
			<span className="vx-listmarker">
				<span className={`vx-listmarker-${markerKind === 'disc' ? 'dot' : markerKind}`} />
			</span>
		) : markerKind != null ? (
			<span className={`vx-listmarker vx-listmarker--num vx-listmarker--${markerKind}`} />
		) : null

	const labelNode =
		typeof props.label === 'string' ? (
			<span className="vx-listitem-label">{props.label}</span>
		) : (
			props.label
		)

	const descriptionNode =
		props.description == null ? null : typeof props.description === 'string' ? (
			<span className="vx-listitem-desc">{props.description}</span>
		) : (
			props.description
		)

	const hitLabel =
		props.accessibilityLabel ?? (typeof props.label === 'string' ? props.label : undefined)

	const hit =
		props.delegateRef != null ? null : props.href != null ? (
			<a
				className="vx-listitem-hit"
				href={props.href}
				target={props.target}
				rel={rel}
				tabIndex={props.isDisabled ? -1 : undefined}
				aria-label={hitLabel}
				aria-disabled={props.isDisabled || undefined}
				onClick={props.isDisabled ? (e: any) => e.preventDefault() : undefined}
			/>
		) : props.onPress != null ? (
			<button
				type="button"
				className="vx-listitem-hit"
				onClick={props.onPress}
				disabled={props.isDisabled || undefined}
				aria-label={hitLabel}
				tabIndex={props.isDisabled ? -1 : undefined}
			/>
		) : null

	const forwardedRef = useMemo(
		() =>
			refList((e: any) => {
				if (e) {
					applyEscapeProps(e, props)
					applyWebProps(e, props.web)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<li
		id={props.id}
		ref={forwardedRef}
		className={[
			'vx-listitem',
			`vx-listitem--density-${ctx.density}`,
			ctx.listStyle !== 'none' ? 'vx-listitem--marker' : undefined,
			interactive || props.delegateRef != null ? 'vx-listitem--interactive' : undefined,
			props.isDisabled ? 'vx-listitem--disabled' : undefined,
			props.isSelected ? 'vx-listitem--selected' : undefined,
			props.className,
		]}
		style={{
			...(ctx.edgeCompensation === 'inline'
				? {
						marginInlineStart:
							'calc(-1 * min(var(--vx-item-inset-inline, 0px), var(--container-padding-inline-start, 0px)))',
						marginInlineEnd:
							'calc(-1 * min(var(--vx-item-inset-inline, 0px), var(--container-padding-inline-end, 0px)))',
					}
				: {}),
			...styleRecord(props.style),
		}}
		aria-selected={props.isSelected || undefined}
		aria-disabled={props.isDisabled || undefined}
		aria-label={props.accessibilityLabel}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		onClick={props.delegateRef != null || props.onPress != null ? onRowClick : undefined}
	>
		{marker}
		{props.startContent != null ? (
			<span className="vx-listitem-start">{props.startContent}</span>
		) : null}
		<span className="vx-listitem-body">
			{labelNode}
			{descriptionNode}
			{props.children}
		</span>
		{props.endContent != null ? <span className="vx-listitem-end">{props.endContent}</span> : null}
		{hit}
	</li>
}
