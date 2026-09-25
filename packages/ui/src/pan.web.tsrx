import { useEffect } from 'octane';
import type { PanEvent } from './props';

/** Shared pan plumbing for web leaves — pointerdown/move/up/cancel with
 *  pointer capture, normalized to the shared gesture shape
 *  {x,y,dx,dy,vx,vy,state,target}. `pointermove` isn't in octane's
 *  delegated-event set, so listeners attach to the element directly —
 *  that's why callers pass the bound-element ref. */
export function usePan(el: { current: HTMLElement | null }, cb?: (e: PanEvent) => void): void {
	useEffect(() => {
		const node = el.current;
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
	}, [el, cb]);
}
