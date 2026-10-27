/** @jsxImportSource @nativescript-community/octane */
import type { ActivityIndicatorProps } from './props';
import { mergeStyle, styleRecord } from './style-merge'
import { cx } from '@octane-xplat/lib'

const sizePx: Record<string, number> = { xsm: 12, sm: 16, md: 20, lg: 24, xl: 32 };

/** ActivityIndicator — exported as `Spinner`. Native leaf: a fixed-size box
 *  carrying the `vx-spinner` hook + optional label row. */
export function ActivityIndicator(props: ActivityIndicatorProps) @{
	const busy = props.busy !== false;
	if (!busy) return null;
	const size = typeof props.size === 'number' ? props.size : sizePx[props.size ?? 'md'];
	const ring = (
		<activityindicator
			id={props.id}
			className={cx('vx-spinner', props.shade === 'onMedia' && 'vx-spinner--onmedia', !props.label && props.className)}
			style={mergeStyle({ width: size, height: size }, !props.label ? styleRecord(props.style) : undefined)}
			busy={busy}
		/>
	);

	@if (props.label != null) {
		<masonview id={props.id} className={cx('vx-spinner-row', props.className)} style={mergeStyle({ display: 'flex' }, styleRecord(props.style))}>
			{ring}
			<label className="vx-spinner-label" text={typeof props.label === 'string' ? props.label : ''} />
			{typeof props.label === 'string' ? null : props.label}
		</masonview>
	} @else {
		<>{ring}</>
	}
}
