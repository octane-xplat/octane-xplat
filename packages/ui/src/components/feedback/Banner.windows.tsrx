/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { BannerProps } from '../../props'
import { mergeStyle } from '../../internal/layout/style-merge'
import { applyEscapeProps } from '../overlays/escape-props'
import { Pressable } from '../actions/Pressable'
import { Collapsible } from '../collections/Collapsible'
import { TextSlot } from '../forms/text-slot'
import { Icon } from '../media/Icon'
import './Banner.windows.css'

const statusIcon: Record<string, string> = {
	info: 'xplat-info',
	success: 'xplat-check-circle',
	warning: 'xplat-warning',
	error: 'xplat-error',
}

/** Banner — shared notice content with native Windows action peers for
 * dismissal and the optional details toggle. */
export function Banner(props: BannerProps): unknown @{
	const [dismissed, setDismissed, getDismissed] = useState(false)
	if (dismissed) {
		return null
	}

	const status = props.status ?? 'info'
	const icon = props.icon ?? statusIcon[status]
	const hasBody = props.children != null
	const collapsible = props.collapsible !== false && hasBody
	const defaultOpen =
		typeof props.collapsible === 'object' ? props.collapsible.defaultIsOpen === true : false

	const name =
		typeof props.title === 'string' || typeof props.title === 'number'
			? String(props.title)
			: typeof props.description === 'string'
				? props.description
				: 'Notice'

	const dismiss = () => {
		if (getDismissed()) {
			return
		}

		setDismissed(true)
		props.onDismiss?.()
	}

	<masonview
		ref={(view: any) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx(
			'vx-banner',
			'vx-banner-windows',
			`vx-banner--${status}`,
			props.variant === 'floating' && 'vx-banner--floating',
			props.container === 'section' && 'vx-banner--section',
			props.elevation && props.elevation !== 'none' && `vx-banner--elev-${props.elevation}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessible
		accessibilityLabel={name || 'Notice'}
		accessibilityLiveRegion={status === 'error' ? 'assertive' : 'polite'}
	>
		<masonview className="vx-banner-header vx-banner-header-windows" style={{ display: 'flex' }}>
			@if (icon) {
				@if (typeof icon === 'string') {
					<Icon name={icon} className="vx-banner-icon" />
				} @else {
					<>{icon}</>
				}
			}
			<masonview className="vx-banner-body vx-banner-body-windows" style={{ display: 'flex' }}>
				@if (props.title != null) {
					<TextSlot className="vx-banner-title">{props.title}</TextSlot>
				}
				@if (props.description != null) {
					<TextSlot className="vx-banner-desc">{props.description}</TextSlot>
				}
			</masonview>
			<TextSlot>{props.endContent}</TextSlot>
			@if (collapsible) {
				<Collapsible
					className="vx-banner-collapse"
					trigger={<label className="vx-banner-collapse-label" text="Details" />}
					accessibilityLabel="Details"
					defaultOpen={defaultOpen}
				>
					<masonview className="vx-banner-content" style={{ display: 'flex' }}>
						<TextSlot>{props.children}</TextSlot>
					</masonview>
				</Collapsible>
			}
			@if (props.isDismissable || props.onDismiss) {
				<Pressable
					className="vx-banner-dismiss vx-banner-dismiss-windows"
					accessibilityLabel={
						typeof props.title === 'string' ? `Dismiss ${props.title}` : 'Dismiss'
					}
					onPress={dismiss}
				>
					<label text="✕" />
				</Pressable>
			}
		</masonview>
		@if (hasBody && !collapsible) {
			<masonview className="vx-banner-content" style={{ display: 'flex' }}>
				<TextSlot>{props.children}</TextSlot>
			</masonview>
		}
	</masonview>
}
