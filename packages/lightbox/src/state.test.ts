import { describe, expect, it } from 'vitest'
import { reduce, type RootState } from './state'

const closed: RootState = { index: 0, phase: 'closed', zoomed: false, dragging: false, uiHidden: false, held: null }
const open: RootState = { index: 0, phase: 'open', zoomed: false, dragging: false, uiHidden: false, held: null }
const at = (state: RootState, phase: RootState['phase']): RootState => ({ ...state, phase })

describe('root reducer', () => {
	it('open is ignored unless closed or the list is empty', () => {
		expect(reduce(open, { kind: 'open', index: 1, count: 3 }).effects).toEqual([])
		expect(reduce(closed, { kind: 'open', index: 1, count: 0 }).effects).toEqual([])
		const r = reduce(closed, { kind: 'open', index: 1, count: 3 })
		expect(r.state.phase).toBe('opening')
		expect(r.state.index).toBe(1)
		expect(r.effects).toContainEqual({ kind: 'animateIn' })
		expect(r.effects).toContainEqual({ kind: 'notifyOpen', open: true })
		expect(r.effects).toContainEqual({ kind: 'notifyIndex', index: 1 })
	})

	it('requestClose is ignored while closed or closing', () => {
		expect(reduce(closed, { kind: 'requestClose' }).effects).toEqual([])
		expect(reduce(at(open, 'closing'), { kind: 'requestClose' }).effects).toEqual([])
		const r = reduce(open, { kind: 'requestClose' })
		expect(r.state.phase).toBe('closing')
		expect(r.state.dragging).toBe(false)
		expect(r.effects).toEqual([{ kind: 'animateOut' }])
	})

	it('scrolled is ignored while closing or closed; otherwise updates index and resets zoom', () => {
		expect(reduce(closed, { kind: 'scrolled', index: 1 }).effects).toEqual([])
		expect(reduce(at(open, 'closing'), { kind: 'scrolled', index: 1 }).effects).toEqual([])
		expect(reduce(open, { kind: 'scrolled', index: 0 }).effects).toEqual([])
		const r = reduce({ ...open, zoomed: true }, { kind: 'scrolled', index: 2 })
		expect(r.state.index).toBe(2)
		expect(r.state.zoomed).toBe(false)
		expect(r.effects).toEqual([{ kind: 'notifyIndex', index: 2 }])
	})

	it('goTo neighbor slides; jump ≥2 while open fades; reduced or not open slides instantly', () => {
		const n = reduce(open, { kind: 'goTo', index: 1, count: 5, reducedMotion: false })
		expect(n.effects).toContainEqual({ kind: 'slideTo', index: 1, instant: false })
		expect(n.effects).toContainEqual({ kind: 'notifyIndex', index: 1 })
		expect(n.state.held).toBeNull()

		const j = reduce(open, { kind: 'goTo', index: 3, count: 5, reducedMotion: false })
		expect(j.effects).toContainEqual({ kind: 'fade', from: 0, to: 3 })
		expect(j.state.held).toBe(0)
		expect(j.state.index).toBe(3)

		const r = reduce(open, { kind: 'goTo', index: 3, count: 5, reducedMotion: true })
		expect(r.effects).toContainEqual({ kind: 'slideTo', index: 3, instant: true })

		const c = reduce(closed, { kind: 'goTo', index: 3, count: 5, reducedMotion: false })
		expect(c.effects).toContainEqual({ kind: 'slideTo', index: 3, instant: true })
		expect(c.effects).not.toContainEqual({ kind: 'notifyIndex', index: 3 })
	})

	it('zoom resets on every index change', () => {
		const r = reduce({ ...open, zoomed: true }, { kind: 'goTo', index: 1, count: 5, reducedMotion: false })
		expect(r.state.zoomed).toBe(false)
	})

	it('closed emits notifyOpen(false) once, from a non-closed phase', () => {
		const r = reduce(at(open, 'closing'), { kind: 'closed' })
		expect(r.state.phase).toBe('closed')
		expect(r.effects).toEqual([{ kind: 'notifyOpen', open: false }])
		expect(reduce(closed, { kind: 'closed' }).effects).toEqual([])
	})

	it('opened, fadeDone, zoomed, dragging, toggleUi', () => {
		expect(reduce(at(open, 'opening'), { kind: 'opened' }).state.phase).toBe('open')
		expect(reduce({ ...open, held: 0 }, { kind: 'fadeDone', from: 0 }).state.held).toBeNull()
		expect(reduce({ ...open, held: 2 }, { kind: 'fadeDone', from: 0 }).state.held).toBe(2)
		expect(reduce(open, { kind: 'zoomed', value: true }).state.zoomed).toBe(true)
		expect(reduce(open, { kind: 'dragging', value: true }).state.dragging).toBe(true)
		expect(reduce(open, { kind: 'toggleUi' }).state.uiHidden).toBe(true)
	})
})
