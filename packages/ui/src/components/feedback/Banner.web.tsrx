/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import type { BannerProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import { Collapsible } from '../collections/Collapsible.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

const statusIcon: Record<string, string> = {
	info: 'xplat-info',
	success: 'xplat-check-circle',
	warning: 'xplat-warning',
	error: 'xplat-error',
}

/** Banner — inline notice strip (Astryx `Banner`): `status` paints the
 *  header row (icon + `title` + `description` + `endContent`), `isDismissable`
 *  renders the ✕ affordance, `children` render below — behind a show/hide
 *  toggle unless `collapsible={false}`. `variant="floating"` detaches the
 *  strip visually via the `vx-banner--floating` class hook. */
export function Banner(props: BannerProps): JSX.Element | null @{
	const [dismissed, setDismissed] = useState(false)
	if (dismissed) {
		return null
	}

	const status = props.status ?? 'info'
	const icon = props.icon ?? statusIcon[status]
	const hasBody = props.children != null
	const collapsible = props.collapsible !== false && hasBody
	const defaultOpen =
		typeof props.collapsible === 'object' ? props.collapsible.defaultIsOpen === true : false

	const dismiss = () => {
		props.onDismiss?.()
		setDismissed(true)
	}

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-banner',
			`vx-banner--${status}`,
			props.variant === 'floating' && 'vx-banner--floating',
			props.container === 'section' && 'vx-banner--section',
			props.elevation && props.elevation !== 'none' && `vx-banner--elev-${props.elevation}`,
			props.className,
		]}
		style={props.style}
		role={status === 'error' ? 'alert' : 'status'}
	>
		<div className="vx-banner-header">
			{icon ? (
				typeof icon === 'string' ? (
					<Icon name={icon as any} className="vx-banner-icon" />
				) : (
					icon
				)
			) : null}
			<div className="vx-banner-body">
				{props.title != null ? <div className="vx-banner-title">{props.title}</div> : null}
				{props.description != null ? (
					<div className="vx-banner-desc">{props.description}</div>
				) : null}
			</div>
			{props.endContent}
			{hasBody && collapsible ? (
				<Collapsible
					className="vx-banner-collapse"
					trigger={<span className="vx-banner-collapse-label">Details</span>}
					defaultOpen={defaultOpen}
				>
					<div className="vx-banner-content">{props.children}</div>
				</Collapsible>
			) : null}
			{props.isDismissable || props.onDismiss ? (
				<span
					className="vx-banner-dismiss"
					role="button"
					aria-label={typeof props.title === 'string' ? `Dismiss ${props.title}` : 'Dismiss'}
					tabIndex={0}
					onClick={dismiss}
					onKeyDown={(e: any) => {
						if (e.key === 'Enter') {
							dismiss()
						}
					}}
				>
					✕
				</span>
			) : null}
		</div>
		{hasBody && !collapsible ? <div className="vx-banner-content">{props.children}</div> : null}
	</div>
}
