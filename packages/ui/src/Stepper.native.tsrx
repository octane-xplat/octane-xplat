/** @jsxImportSource @nativescript-community/octane */
import type { StepperProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Stepper — numbered step row with connectors. Steps before `current`
 *  show a done mark; tapping a non-disabled step calls `onStepChange`. */
export function Stepper(props: StepperProps) @{
	const current = props.current ?? 0;

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-stepper', props.className)}
		style={props.style}
	>
		@for (const e of props.steps.map((step, i) => ({ step, i })); key e.step.key) {
			<flexboxlayout className="vx-stepper-cell">
				{e.i > 0 ? <flexboxlayout className={cx('vx-stepper-line', (e.i <= current) && 'vx-stepper-line--done')} /> : null}
				<flexboxlayout
					className={cx('vx-step', e.i < current && 'vx-step--done', e.i === current && 'vx-step--on', e.step.disabled && 'vx-step--disabled')}
					onTap={e.step.disabled ? undefined : () => props.onStepChange?.(e.i)}
				>
					<label className="vx-step-dot" text={e.i < current ? '✓' : String(e.i + 1)} />
					{e.step.label != null ? <label className="vx-step-label" text={e.step.label} /> : null}
				</flexboxlayout>
			</flexboxlayout>
		}
	</flexboxlayout>
}
