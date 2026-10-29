/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { StepperProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { StepperProvider } from '../forms/option-list-contexts'

/** Stepper — numbered step row with connectors. `steps` is the flat
 *  data-driven contract; `Step` children are the Astryx child-part
 *  contract (context supplies `activeStep`/`onStepClick`). */
export function Stepper(props: StepperProps) @{
	const current = props.current ?? 0
	const ctx = {
		activeStep: props.activeStep ?? props.current ?? 0,
		onStepClick: props.onStepClick ?? props.onStepChange,
		orientation: props.orientation ?? 'horizontal',
		indicatorPosition: props.indicatorPosition ?? 'off-track',
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(
			'vx-stepper',
			ctx.orientation === 'vertical' && 'vx-stepper--vertical',
			props.className,
		)}
		style={mergeStyle(
			{ display: 'flex', flexDirection: ctx.orientation === 'vertical' ? 'column' : 'row' },
			props.style,
		)}
	>
		@for (const e of (props.steps ?? []).map((step, i) => ({ step, i })); key e.step.key) {
			<masonview className="vx-stepper-cell" style={{ display: 'flex' }}>
				{e.i > 0 ? (
					<masonview
						className={cx('vx-stepper-line', e.i <= current && 'vx-stepper-line--done')}
						style={{ display: 'flex' }}
					/>
				) : null}
				<masonview
					className={cx(
						'vx-step',
						e.i < current && 'vx-step--done',
						e.i === current && 'vx-step--on',
						e.step.disabled && 'vx-step--disabled',
					)}
					onTap={e.step.disabled ? undefined : () => props.onStepChange?.(e.i)}
					style={{ display: 'flex' }}
				>
					<label className="vx-step-dot" text={e.i < current ? '✓' : String(e.i + 1)} />
					{e.step.label != null ? (
						<label className="vx-step-label" text={e.step.label} />
					) : null}
				</masonview>
			</masonview>
		}
		{props.children != null ? (
			<StepperProvider value={ctx}>{props.children}</StepperProvider>
		) : null}
	</masonview>
}
