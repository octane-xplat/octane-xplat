/** @jsxImportSource @nativescript-community/octane */
import { AccessibilityRole } from '@nativescript/core';
import { registerElement } from '@nativescript-community/octane';
import { CanvasView, Cap, Paint, Style } from '@nativescript-community/ui-canvas';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { useEffect, useRef } from 'octane';
import type { MeterProps } from './props';
import { cx } from './cx';
import { meterRange } from './meter-math';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		canvasview: Attributes<typeof CanvasView> & {
			/** ui-canvas's public typings expose `onDraw` as an instance method
			 *  (no `static drawEvent` on CanvasView), so Attributes can't derive
			 *  the event prop — declare it here. */
			onDraw?: (event: any) => void;
		};
	}
}

registerElement('canvasview', CanvasView);

export function Meter(props: MeterProps) @{
	const max = props.max ?? 100;
	const { max: rangeMax, value, ratio } = meterRange(props.value, max);
	const size = props.size ?? 24;
	const strokeWidth = Math.max(0, Math.min(props.strokeWidth ?? 3, size));
	const color = props.color ?? '#3376cc';
	const trackColor = props.trackColor ?? '#e1ecf7';
	const canvasRef = useRef<any>(null);
	useEffect(() => {
		canvasRef.current?.invalidate();
	}, [value, rangeMax, strokeWidth, color, trackColor]);
	const draw = (event: any) => {
		const canvas = event.canvas;
		const width = canvas.getWidth();
		const height = canvas.getHeight();
		const diameter = Math.max(0, Math.min(width, height) - strokeWidth);
		const left = (width - diameter) / 2;
		const top = (height - diameter) / 2;
		const right = left + diameter;
		const bottom = top + diameter;
		const paint = new Paint();
		paint.style = Style.STROKE;
		paint.strokeCap = Cap.ROUND;
		paint.strokeWidth = strokeWidth;
		paint.setColor(trackColor);
		canvas.drawArc(left, top, right, bottom, -90, 360, false, paint);
		if (ratio > 0) {
			paint.setColor(color);
			canvas.drawArc(left, top, right, bottom, -90, ratio * 360, false, paint);
		}
	};
	<canvasview
		id={props.id}
		ref={canvasRef}
		className={cx('vx-meter', props.className)}
		style={{ width: size, height: size, ...props.style }}
		onDraw={draw}
		accessible={true}
		accessibilityRole={AccessibilityRole.ProgressBar}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityValue={`${value} of ${rangeMax}`}
	>
		<gridlayout horizontalAlignment="center" verticalAlignment="middle">
			{props.children}
		</gridlayout>
	</canvasview>
}
