/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { FormLayoutProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'
import { FormLayoutProvider } from './form-layout-context'

/** FormLayout — vertical column / horizontal row / horizontal-labels
 *  column (each Field renders its own label row). The AppKit grid doesn't
 *  auto-assign columns, so 'horizontal' uses a wrapped row flow rather
 *  than equal-width columns. */
export function FormLayout(props: FormLayoutProps) @{
	const direction = props.direction ?? 'vertical'
	const value = { direction, defaultOptionality: props.defaultOptionality }

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<FormLayoutProvider value={value}>
		<flexboxlayout
			id={props.id}
			ref={forwardedRef}
			flexDirection={direction === 'horizontal' ? 'row' : 'column'}
			flexWrap={(direction === 'horizontal' ? 'wrap' : undefined) as any}
			gap={16}
			className={cx('vx-formlayout', `vx-formlayout--${direction}`, props.className)}
			style={props.style}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={props.accessibilityRole}
			accessibilityHint={props.accessibilityHint}
		>
			{props.children}
		</flexboxlayout>
	</FormLayoutProvider>
}
