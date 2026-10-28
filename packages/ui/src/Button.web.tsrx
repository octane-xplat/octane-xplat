/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import type { ButtonProps } from './props'
import { applyWebProps } from './platformProps.web'
import { Pressable } from './Pressable.web.tsrx'
import { VisuallyHidden } from './VisuallyHidden.web.tsrx'
import { Icon } from './Icon.web.tsrx'
import { useButtonGroup } from './button-group-context'
import { useSize } from './size-context'
import { sanitizeUrl } from './safe-url'
import { reportActionError } from './action-error'

/** Self-drawn button — Pressable row with optional icon/label/end content
 *  and a loading state that swaps content for the spinner and blocks
 *  presses. Props follow the Astryx vocabulary (`label`, `variant`, `size`,
 *  `isDisabled`, `isLoading`, `icon`, `isIconOnly`, `endContent`,
 *  `elevation`, `tooltip`, `href`, `clickAction`, `isInterruptible`);
 *  `href` renders a real anchor so link semantics (new tab, copy link)
 *  stay intact. Inside a ButtonGroup the group supplies size/disabled and a
 *  position class for the connected edge treatment. */
export function Button(props: ButtonProps) @{
	const group = useButtonGroup()
	const [actionPending, setActionPending] = useState(false)
	// Busy = isLoading or an in-flight clickAction: aria-busy + hidden content +
	// spinner overlay + live "Loading" status. Interruptible buttons stay
	// enabled (a re-click lands a fresh action) but still report busy.
	const busy = !!(props.isLoading || actionPending)
	const isDisabled = !!(props.isDisabled || group?.isDisabled)
	const disabled = !!(isDisabled || (busy && !props.isInterruptible))
	// Astryx: a tooltip'd disabled button stays focusable so keyboard users can
	// reach the tooltip — aria-disabled instead of the native attribute, with
	// activation suppressed in the press handler.
	const useAriaDisabled = props.tooltip != null && disabled
	const loading = busy
	const size = useSize(props.size ?? group?.size, 'md')
	const icon = typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon
	const labelEl =
		props.label != null ? <span className="vx-button-label">{props.label}</span> : null

	// The content stays mounted while busy — hidden (transparent + aria-hidden)
	// under the spinner overlay — so the button keeps its width and, via the
	// aria-label below, its accessible name.
	const content = (
		<>
			{busy && (
				<span className="vx-button-spinner" aria-hidden="true">
					<span role="status" aria-label="Loading" className="vx-button-spinner-status">
						<svg width="14" height="14" aria-hidden="true" className="vx-button-spinner-svg">
							<circle cx="50%" cy="50%" r="5" strokeWidth="2" className="vx-button-spinner-track" />
							<circle
								cx="50%"
								cy="50%"
								r="5"
								strokeWidth="2"
								strokeDasharray="11.78 19.63"
								className="vx-button-spinner-arc"
							/>
						</svg>
					</span>
				</span>
			)}
			<span
				className={['vx-button-content', busy && 'vx-button-content--hidden']}
				aria-hidden={busy || undefined}
			>
				{props.isIconOnly ? (
					(icon ?? props.children ?? labelEl)
				) : (
					<>
						{icon}
						{props.children ?? labelEl}
						{props.endContent}
					</>
				)}
			</span>
			<VisuallyHidden accessibilityRole="status" accessibilityLiveRegion="polite">
				{busy ? 'Loading' : null}
			</VisuallyHidden>
		</>
	)

	const cls = [
		'vx-button',
		`vx-button--${props.variant ?? 'secondary'}`,
		size && `vx-button--size-${size}`,
		props.elevation && props.elevation !== 'none' && `vx-button--elev-${props.elevation}`,
		props.isIconOnly && 'vx-button--icon',
		loading && 'vx-button--loading',
		isDisabled && 'vx-button--disabled',
		group && `vx-button--group-${group.position}`,
		props.className,
	]

	const runPress = (e?: any) => {
		if (disabled || (actionPending && !props.isInterruptible)) {
			e?.preventDefault?.()
			return
		}

		let action: void | Promise<void> | undefined
		try {
			action = props.clickAction?.()
		} catch (error) {
			reportActionError(error, props.onActionError)
			return
		}

		if (action && typeof action.then === 'function') {
			setActionPending(true)
			Promise.resolve(action).then(
				() => setActionPending(false),
				(error) => {
					setActionPending(false)
					reportActionError(error, props.onActionError)
				},
			)
		}
	}

	@if (props.href != null) {
		<a
			id={props.id}
			data-testid={props.testID}
			className={cls}
			style={props.style}
			href={sanitizeUrl(props.href) ?? undefined}
			target={props.target}
			rel={props.target === '_blank' ? 'noreferrer' : undefined}
			title={props.tooltip}
			aria-label={
				props.accessibilityLabel ??
				(props.isIconOnly || busy || (props.children != null && props.children !== props.label)
					? props.label
					: undefined)
			}
			aria-busy={busy || undefined}
			aria-disabled={disabled || undefined}
			tabIndex={disabled ? -1 : undefined}
			onClick={runPress}
			ref={(el: any) => applyWebProps(el, props.web)}
		>
			{content}
		</a>
	} @else {
		<Pressable
			{...{ ...props, _nativeButton: true }}
			disabled={useAriaDisabled ? false : disabled}
			onPress={runPress}
			className={cls}
			accessibilityRole={props.accessibilityRole ?? 'button'}
			accessibilityLabel={
				props.accessibilityLabel ??
				(props.isIconOnly || busy || (props.children != null && props.children !== props.label)
					? props.label
					: undefined)
			}
			accessibilityState={{
				...props.accessibilityState,
				busy: busy || undefined,
				disabled: useAriaDisabled || props.accessibilityState?.disabled,
			}}
			web={{ title: props.tooltip, ...props.web }}
		>
			{content}
		</Pressable>
	}
}
