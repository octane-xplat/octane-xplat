/** @jsxImportSource @octane-xplat/jsx/dom */
import { useContext } from 'octane'
import type { StepProps } from './props'
import { applyWebProps } from './platformProps.web'
import { StepperContext } from './option-list-contexts'

/** `Step` — one node in a `Stepper` (Astryx child part). Its state derives
 *  from comparing `step` to the group's `activeStep`: below completed,
 *  equal current, above upcoming. */
export function Step(props: StepProps) @{
	const ctx = useContext(StepperContext)
	const active = ctx?.activeStep ?? 0
	const done = props.step < active
	const current = props.step === active
	const disabled = Boolean(props.isDisabled)
	const indicator = props.indicator ?? 'auto'
	const onTrack = ctx?.indicatorPosition === 'on-track'
	const clickable = !disabled && ctx?.onStepClick != null

	const glyph =
		indicator === 'none' ? null : typeof indicator === 'string' ? (
			indicator === 'number' || (indicator === 'auto' && !done) ? (
				<span className="vx-step-dot">{props.step + 1}</span>
			) : (
				<span className="vx-step-dot vx-step-dot--done">{'✓'}</span>
			)
		) : (
			<span className="vx-step-node">{indicator}</span>
		)

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		role="listitem"
		aria-current={current ? 'step' : undefined}
		className={[
			'vx-step',
			done && 'vx-step--done',
			current && 'vx-step--on',
			disabled && 'vx-step--disabled',
			onTrack && 'vx-step--ontrack',
			props.status && `vx-step--status-${props.status}`,
			props.className,
		]}
		style={props.style}
		tabIndex={clickable ? 0 : undefined}
		onClick={clickable ? () => ctx!.onStepClick!(props.step) : undefined}
		onKeyDown={
			clickable
				? (e: any) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							ctx!.onStepClick!(props.step)
						}
					}
				: undefined
		}
	>
		{glyph}
		<span className="vx-step-body">
			<span className="vx-step-heading">
				{props.label != null ? <span className="vx-step-label">{props.label}</span> : null}
				{props.isOptional ? <span className="vx-step-optional">Optional</span> : null}
				{props.endContent != null ? <span className="vx-step-end">{props.endContent}</span> : null}
			</span>
			{props.description != null ? (
				<span className="vx-step-description">{props.description}</span>
			) : null}
			{props.children != null ? <span className="vx-step-content">{props.children}</span> : null}
		</span>
	</div>
}
