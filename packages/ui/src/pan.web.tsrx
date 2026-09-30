import { useEffect, useRef } from 'octane';
import type { PanEvent } from './props';

const VELOCITY_MAX_AGE_MS = 100;

/** Shared pan plumbing for web leaves — pointerdown/move/up/cancel with
 *  pointer capture, normalized to the shared gesture shape
 *  {x,y,dx,dy,vx,vy,state,target}. `pointermove` isn't in octane's
 *  delegated-event set, so listeners attach to the element directly —
 *  that's why callers pass the bound-element ref. */
export function usePan(el: { current: HTMLElement | null }, cb?: (e: PanEvent) => void): void {
	const callback = useRef(cb);
	callback.current = cb;
	const enabled = Boolean(cb);
	useEffect(() => {
		const node = el.current;
		if (!node || !enabled) return;
		let sx = 0, sy = 0, active = false;
		let last = 0, lx = 0, t0 = 0;
		let vx = 0, vy = 0, velocityAt = 0;
		const emit = (e: PointerEvent, state: string) => {
			const now = performance.now();
			const dt = Math.max(now - t0, 1) / 1000;
			const dx = e.clientX - lx;
			const dy = e.clientY - last;
			if (state === 'began') {
				vx = vy = 0;
				velocityAt = now;
			} else if (dx !== 0 || dy !== 0) {
				// Preserve this sample for pointer-up when it repeats the final coordinates.
				vx = dx / dt;
				vy = dy / dt;
				velocityAt = now;
			}

			lx = e.clientX; last = e.clientY; t0 = now;
			const fresh = now - velocityAt <= VELOCITY_MAX_AGE_MS;
			callback.current?.({
				x: e.clientX - sx,
				y: e.clientY - sy,
				dx: e.clientX - sx,
				dy: e.clientY - sy,
				vx: fresh ? vx : 0,
				vy: fresh ? vy : 0,
				state,
				target: node,
			});

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
	}, [el, enabled]);
}
