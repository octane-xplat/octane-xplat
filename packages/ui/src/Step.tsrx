/** @jsxImportSource @nativescript-community/octane */
import { useContext } from 'octane'
import { mergeStyle } from './style-merge'
import type { StepProps } from './props'
import { applyEscapeProps, nativeAccessibilityState } from './escape-props'
import { StepperContext } from './option-list-contexts'

/** `Step` — one node in a `Stepper` (Astryx child part). Its state derives
 *  from comparing `step` to the group's `activeStep`. */
export function Step(props: StepProps) @{
	const ctx = useContext(StepperContext)
	const active = ctx?.activeStep ?? 0
	const done = props.step < active
	const current = props.step === active
	const disabled = Boolean(props.isDisabled)
	const indicator = props.indicator ?? 'auto'
	const clickable = !disabled && ctx?.onStepClick != null

	const glyph =
		indicator === 'none' ? null : typeof indicator === 'string' ? (
			<label
				className="vx-step-dot"
				text={
					indicator === 'number' || (indicator === 'auto' && !done) ? String(props.step + 1) : '✓'
				}
			/>
		) : (
			<masonview className="vx-step-node" style={{ display: 'flex' }}>
				{indicator}
			</masonview>
		)

	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-step',
			done && 'vx-step--done',
			current && 'vx-step--on',
			disabled && 'vx-step--disabled',
			props.status && `vx-step--status-${props.status}`,
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityState={nativeAccessibilityState({ selected: current, disabled })}
		onTap={clickable ? () => ctx!.onStepClick!(props.step) : undefined}
	>
		{glyph}
		<masonview className="vx-step-body" style={{ display: 'flex', flexDirection: 'column' }}>
			<masonview className="vx-step-heading" style={{ display: 'flex' }}>
				{props.label != null ? <label className="vx-step-label" text={props.label} /> : null}
				{props.isOptional ? <label className="vx-step-optional" text="Optional" /> : null}
				{props.endContent != null ? (
					<masonview className="vx-step-end" style={{ display: 'flex' }}>
						{props.endContent}
					</masonview>
				) : null}
			</masonview>
			{props.description != null ? (
				<label className="vx-step-description" text={props.description} />
			) : null}
			{props.children != null ? (
				<masonview className="vx-step-content" style={{ display: 'flex' }}>
					{props.children}
				</masonview>
			) : null}
		</masonview>
	</masonview>
}
