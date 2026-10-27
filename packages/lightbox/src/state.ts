import { clamp } from './math'

export type Phase = 'closed' | 'opening' | 'open' | 'closing'

export interface RootState {
	index: number
	phase: Phase
	zoomed: boolean
	dragging: boolean
	uiHidden: boolean
	held: number | null
}

export type RootAction =
	| { kind: 'open'; index: number; count: number }
	| { kind: 'opened' }
	| { kind: 'requestClose' }
	| { kind: 'closed' }
	| { kind: 'goTo'; index: number; count: number; reducedMotion: boolean }
	| { kind: 'scrolled'; index: number }
	| { kind: 'fadeDone'; from: number }
	| { kind: 'zoomed'; value: boolean }
	| { kind: 'dragging'; value: boolean }
	| { kind: 'toggleUi' }

export type RootEffect =
	| { kind: 'slideTo'; index: number; instant: boolean }
	| { kind: 'fade'; from: number; to: number }
	| { kind: 'animateIn' }
	| { kind: 'animateOut' }
	| { kind: 'notifyOpen'; open: boolean }
	| { kind: 'notifyIndex'; index: number }

/** The root phase machine — the host executes effects; pure reducer. */
export function reduce(state: RootState, action: RootAction): { state: RootState; effects: RootEffect[] } {
	const no = { state, effects: [] as RootEffect[] }
	switch (action.kind) {
		case 'open': {
			// Ignored unless closed or the list is empty (upstream openAt).
			if (state.phase !== 'closed' || action.count === 0) {return no}
			const index = clamp(action.index, 0, action.count - 1)
			return {
				state: { ...state, index, phase: 'opening', uiHidden: false },
				effects: [{ kind: 'animateIn' }, { kind: 'notifyOpen', open: true }, { kind: 'notifyIndex', index }],
			}
		}
		case 'opened': {
			if (state.phase !== 'opening') {return no}
			return { state: { ...state, phase: 'open' }, effects: [] }
		}
		case 'requestClose': {
			if (state.phase === 'closed' || state.phase === 'closing') {return no}
			return {
				state: { ...state, phase: 'closing', dragging: false },
				effects: [{ kind: 'animateOut' }],
			}
		}
		case 'closed': {
			if (state.phase === 'closed') {return no}
			return {
				state: { ...state, phase: 'closed', zoomed: false, held: null },
				effects: [{ kind: 'notifyOpen', open: false }],
			}
		}
		case 'goTo': {
			const target = clamp(action.index, 0, action.count - 1)
			const from = state.index
			const changed = target !== from
			// Neighbor step (or any step when reduced/not open) slides; a jump of
			// two or more while open crossfades in place (upstream goTo).
			const neighbor = Math.abs(target - from) < 2
			const instant = action.reducedMotion || state.phase !== 'open'
			const effects: RootEffect[] = []
			let held = state.held
			if (changed && !neighbor && !instant) {
				held = from
				effects.push({ kind: 'fade', from, to: target })
			} else {
				effects.push({ kind: 'slideTo', index: target, instant })
			}
			if (changed && state.phase !== 'closed') {
				effects.push({ kind: 'notifyIndex', index: target })
			}
			return {
				state: { ...state, index: target, held, zoomed: changed ? false : state.zoomed },
				effects,
			}
		}
		case 'scrolled': {
			// Ignored while closing or closed (upstream onScrollIndex).
			if (action.index === state.index || state.phase === 'closing' || state.phase === 'closed') {return no}
			return {
				state: { ...state, index: action.index, zoomed: false },
				effects: [{ kind: 'notifyIndex', index: action.index }],
			}
		}
		case 'fadeDone': {
			if (state.held !== action.from) {return no}
			return { state: { ...state, held: null }, effects: [] }
		}
		case 'zoomed': {
			return { state: { ...state, zoomed: action.value }, effects: [] }
		}
		case 'dragging': {
			return { state: { ...state, dragging: action.value }, effects: [] }
		}
		case 'toggleUi': {
			return { state: { ...state, uiHidden: !state.uiHidden }, effects: [] }
		}
	}
}
