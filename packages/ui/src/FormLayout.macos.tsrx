/** @jsxImportSource @octane-xplat/macos-renderer */
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

	<FormLayoutProvider value={value}>
		<flexboxlayout
			id={props.id}
			ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
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
