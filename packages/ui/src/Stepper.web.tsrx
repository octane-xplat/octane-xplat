import type { StepperProps } from './props'
import { applyEscapeProps } from './escape-props'
import { StepperProvider } from './option-list-contexts'

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

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-stepper',
			ctx.orientation === 'vertical' ? 'vx-stepper--vertical' : undefined,
			ctx.indicatorPosition === 'on-track' ? 'vx-stepper--ontrack' : undefined,
			props.className,
		]}
		style={props.style}
		role="list"
		aria-label={props.accessibilityLabel}
	>
		{(props.steps ?? []).map((step: any, i: number) => {
			const done = i < current
			const active = i === current
			return (
				<div
					key={step.key}
					className="vx-stepper-cell"
					role="listitem"
					aria-current={active ? 'step' : undefined}
				>
					{i > 0 ? (
						<div
							className={['vx-stepper-line', done || active ? 'vx-stepper-line--done' : undefined]}
							aria-hidden="true"
						/>
					) : null}
					<div
						className={[
							'vx-step',
							done ? 'vx-step--done' : undefined,
							active ? 'vx-step--on' : undefined,
							step.disabled ? 'vx-step--disabled' : undefined,
						]}
						role="button"
						tabIndex={step.disabled ? undefined : 0}
						onClick={step.disabled ? undefined : () => props.onStepChange?.(i)}
						onKeyDown={(e: any) => {
							if (!step.disabled && e.key === 'Enter') {
								props.onStepChange?.(i)
							}
						}}
					>
						<span className="vx-step-dot">{done ? '✓' : i + 1}</span>
						{step.label != null ? <span className="vx-step-label">{step.label}</span> : null}
					</div>
				</div>
			)
		})}
		{props.children != null ? (
			<StepperProvider value={ctx}>{props.children}</StepperProvider>
		) : null}
	</div>
}
