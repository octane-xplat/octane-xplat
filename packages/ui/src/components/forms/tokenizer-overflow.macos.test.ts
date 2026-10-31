import { expect, it } from 'vitest'
import { countClippedAppKitTokens } from './tokenizer-overflow.macos'
const rect = (x: number, width: number) => ({ origin: { x, y: 0 }, size: { width, height: 24 } })
function fixture(origin = 0, width = 100) {
	const window = {}, viewport: any = { window, bounds: rect(origin, width) }
	const token = (x: number, width: number): any => ({ window, bounds: rect(0, width), isDescendantOf: (view: unknown) => view === viewport, convertRectToView: (_: unknown, view: unknown) => { expect(view).toBe(viewport); return rect(x, width) } })
	return { viewport, token }
}
it('counts partial and whole clipping while preserving exact and fractional edges', () => {
	const f = fixture()
	expect(countClippedAppKitTokens(f.viewport, [f.token(0, 40), f.token(40, 60), f.token(80, 30), f.token(120, 30)])).toBe(2)
	expect(countClippedAppKitTokens(f.viewport, [f.token(-0.25, 100.5)])).toBe(0)
	expect(countClippedAppKitTokens(f.viewport, [f.token(-0.75, 10)])).toBe(1)
})
it('uses both edges in viewport coordinates, including nonzero bounds and RTL positions', () => {
	const f = fixture(20)
	expect(countClippedAppKitTokens(f.viewport, [f.token(90, 30), f.token(40, 50), f.token(10, 30), f.token(-50, 20)])).toBe(2)
})
it('incomplete, detached and foreign geometry cannot claim zero overflow', () => {
	const f = fixture(), view = f.token(0, 30)
	expect(countClippedAppKitTokens(null, [])).toBe(null)
	expect(countClippedAppKitTokens({ ...f.viewport, window: null }, [view])).toBe(null)
	expect(countClippedAppKitTokens(f.viewport, [null])).toBe(null)
	expect(countClippedAppKitTokens(f.viewport, [{ ...view, window: {} }])).toBe(null)
	expect(countClippedAppKitTokens(f.viewport, [{ ...view, isDescendantOf: () => false }])).toBe(null)
})
it('zero-size or nonfinite native layout remains pending and current empty selection counts zero', () => {
	const f = fixture()
	for (const width of [0, -1, NaN, Infinity]) {expect(countClippedAppKitTokens({ ...f.viewport, bounds: rect(0, width) }, [])).toBe(null)}
	for (const width of [0, -1, NaN, Infinity]) {expect(countClippedAppKitTokens(f.viewport, [f.token(0, width)])).toBe(null)}
	expect(countClippedAppKitTokens(f.viewport, [])).toBe(0)
})
it('current native rectangle conversion observes resize and rejects missing conversion APIs', () => {
	const f = fixture(), view = f.token(80, 30)
	expect(countClippedAppKitTokens(f.viewport, [view])).toBe(1)
	f.viewport.bounds.size.width = 120; expect(countClippedAppKitTokens(f.viewport, [view])).toBe(0)
	expect(countClippedAppKitTokens(f.viewport, [{ ...view, convertRectToView: undefined }])).toBe(null)
})
it('reclaims a trailing counter when all tokens would fit, avoiding a self-reserving stale count', () => {
	const f = fixture(), tokens = [f.token(0, 70), f.token(70, 50)]
	expect(countClippedAppKitTokens(f.viewport, tokens, f.token(104, 40))).toBe(0)
	expect(countClippedAppKitTokens(f.viewport, [...tokens, f.token(120, 50)], f.token(104, 40))).toBe(2)
})
it('reclaims a leading RTL counter and preserves genuine clipping on the opposite edge', () => {
	const f = fixture(), counter = f.token(-44, 40)
	expect(countClippedAppKitTokens(f.viewport, [f.token(-20, 50), f.token(30, 70)], counter)).toBe(0)
	expect(countClippedAppKitTokens(f.viewport, [f.token(-20, 50), f.token(90, 20)], counter)).toBe(2)
})
it('foreign, nonfinite or overlapping counters cannot expand the clipping region', () => {
	const f = fixture(), token = f.token(80, 30)
	for (const counter of [{ ...f.token(100, 40), window: {} }, f.token(NaN, 40), f.token(80, 40)]) {expect(countClippedAppKitTokens(f.viewport, [token], counter)).toBe(1)}
})
