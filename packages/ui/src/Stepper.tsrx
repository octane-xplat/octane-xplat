/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { StepperProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** Stepper — numbered step row with connectors. Steps before `current`
 *  show a done mark; tapping a non-disabled step calls `onStepChange`. */
export function Stepper(props: StepperProps) @{
	const current = props.current ?? 0;

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-stepper', props.className)} style={mergeStyle({flexDirection: "row"}, mergeStyle({display: "flex"}, props.style as any))}>
		@for (const e of props.steps.map((step, i) => ({ step, i })); key e.step.key) {
			<masonview className="vx-stepper-cell" style={{display: "flex"}}>
				{e.i > 0 ? <masonview className={cx('vx-stepper-line', (e.i <= current) && 'vx-stepper-line--done')} style={{display: "flex"}}/> : null}
				<masonview className={cx('vx-step', e.i < current && 'vx-step--done', e.i === current && 'vx-step--on', e.step.disabled && 'vx-step--disabled')} onTap={e.step.disabled ? undefined : () => props.onStepChange?.(e.i)} style={{display: "flex"}}>
					<label className="vx-step-dot" text={e.i < current ? '✓' : String(e.i + 1)} />
					{e.step.label != null ? <label className="vx-step-label" text={e.step.label} /> : null}
				</masonview>
			</masonview>
		}
	</masonview>
}
