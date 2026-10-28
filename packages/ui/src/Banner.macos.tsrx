/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { BannerProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Icon } from './Icon.macos.tsrx'

/** Banner — inline notice strip with optional dismiss affordance. */
export function Banner(props: BannerProps) @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-banner', props.className)}
		style={mergeStyle({ flexDirection: 'row' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		{props.icon ? (
			<Icon
				name={typeof props.icon === 'string' ? props.icon : 'xplat-info'}
				className="vx-banner-icon"
			/>
		) : null}
		<masonview className="vx-banner-body" style={{ display: 'flex' }}>
			{props.children}
		</masonview>
		{props.onDismiss ? (
			<label
				className="vx-banner-dismiss"
				text="✕"
				style={{ marginLeft: 8, width: 12, height: 16, textAlign: 'center' }}
				onTap={props.onDismiss}
			/>
		) : null}
	</masonview>
}
