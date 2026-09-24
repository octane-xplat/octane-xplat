import { useEffect, useRef } from 'octane';
import type { ViewProps } from './props';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.web';

/** Neutral flex-column container — the RN-shaped default block.
 *  onPan is pointer plumbing: pointerdown/move/up on the element.
 *  pointermove isn't in octane's delegated-event set, so the leaf attaches
 *  raw listeners via a ref — that's why `bind` exists. Payloads normalize
 *  to the shared shape {x,y,dx,dy,vx,vy,state,target}. */
export function View(props: ViewProps) @{
	const el = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const node = el.current;
		const cb = props.onPan;
		if (!node || !cb) return;
		let sx = 0, sy = 0, active = false, last = 0, lx = 0, t0 = 0;
		const emit = (e: PointerEvent, state: string) => {
			const now = performance.now();
			const dt = Math.max(now - t0, 1) / 1000;
			const vx = (e.clientX - lx) / dt;
			const vy = (e.clientY - last) / dt;
			lx = e.clientX; last = e.clientY; t0 = now;
			cb({ x: e.clientX - sx, y: e.clientY - sy, dx: e.clientX - sx, dy: e.clientY - sy, vx, vy, state, target: node });
		};
		const down = (e: PointerEvent) => { active = true; sx = e.clientX; sy = e.clientY; t0 = performance.now(); lx = sx; last = sy; node.setPointerCapture?.(e.pointerId); emit(e, 'began'); };
		const move = (e: PointerEvent) => { if (active) emit(e, 'moved'); };
		const up = (e: PointerEvent) => { if (active) { active = false; emit(e, 'ended'); } };
		const cancel = (e: PointerEvent) => { if (active) { active = false; emit(e, 'cancelled'); } };
		node.addEventListener('pointerdown', down);
		node.addEventListener('pointermove', move);
		node.addEventListener('pointerup', up);
		node.addEventListener('pointercancel', cancel);
		return () => {
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointercancel', cancel);
		};
	}, [props.onPan]);

	<div
		id={props.id}
		ref={(e: any) => { el.current = e; if (e) { applyEscapeProps(e, props); props.bind?.(e); } }}
		className={['vx-view', props.className]}
		{...layoutChildProps(props)}
	>
		{props.children}
	</div>
}
