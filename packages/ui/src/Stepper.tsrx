/** @jsxImportSource @nativescript-community/octane */
import type { StepperProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** Stepper — numbered step row with connectors. Steps before `current`
 *  show a done mark; tapping a non-disabled step calls `onStepChange`. */
export function Stepper(props: StepperProps) @{
	const current = props.current ?? 0;

	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} flexDirection="row" className={cx('vx-stepper', props.className)} style={props.style as any}>
		@for (const e of props.steps.map((step, i) => ({ step, i })); key e.step.key) {
			<masonview display="flex" className="vx-stepper-cell">
				{e.i > 0 ? <masonview display="flex" className={cx('vx-stepper-line', (e.i <= current) && 'vx-stepper-line--done')} /> : null}
				<masonview display="flex" className={cx('vx-step', e.i < current && 'vx-step--done', e.i === current && 'vx-step--on', e.step.disabled && 'vx-step--disabled')} onTap={e.step.disabled ? undefined : () => props.onStepChange?.(e.i)}>
					<label className="vx-step-dot" text={e.i < current ? '✓' : String(e.i + 1)} />
					{e.step.label != null ? <label className="vx-step-label" text={e.step.label} /> : null}
				</masonview>
			</masonview>
		}
	</masonview>
}
