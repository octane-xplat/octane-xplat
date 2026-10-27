import { beforeEach, describe, expect, it, vi } from 'vitest'
const driver = vi.hoisted(() => ({ renders: [] as any[], unmounts: 0, fail: false }))
vi.mock('@nativescript-community/octane', () => ({
	defineUniversalComponent: (_target: string, component: unknown) => component,
	universalPlan: () => ({}),
	createNativeScriptRoot: () => ({
		render(component: unknown, props: unknown) {
			driver.renders.push({ component, props })
			if (driver.fail) {
				throw new Error('native render failed')
			}
		},
		unmount() {
			driver.unmounts++
		},
	}),
}))

vi.mock('../src/native/story-tree.tsrx', () => ({ StoryTree: () => null }))
// Inspect the adapter's ownership seam, with an object driver.
// This deliberately does not claim a NativeScript process or OS interaction.
import { createMobileStageHost } from '../src/mobile/mount.mobile'
import type { MountRequest } from '../src/session'
const request = (): MountRequest => ({
	story: { id: 'mobile/test', title: 'Mobile / Test' } as any,
	component: () => null,
	props: { label: 'old', state: { get: () => 1, set() {}, subscribe() {} } },
	providers: [],
	fixture: {},
	signal: { aborted: false, addEventListener() {}, removeEventListener() {} },
	onRenderError() {},
})

beforeEach(() => {
	driver.renders = []
	driver.unmounts = 0
	driver.fail = false
})

describe('native root ownership seam (object driver)', () => {
	it('preserves the compiled wrapper and providers/fixture on complete prop replacement', async () => {
		const r = request()
		const mounted = await createMobileStageHost({} as any).mount(r)
		mounted.update({ label: undefined, count: 2, state: r.props.state })
		expect(driver.renders[1].component).toBe(driver.renders[0].component)
		expect(driver.renders[1].props.request.providers).toBe(r.providers)
		expect(driver.renders[1].props.request.fixture).toBe(r.fixture)
		expect(driver.renders[1].props.request.props).toEqual({
			label: undefined,
			count: 2,
			state: r.props.state,
		})

		expect(driver.renders[1].props.request.props.state).toBe(r.props.state)
		mounted.unmount()
		mounted.unmount()
		mounted.update({ label: 'late' })
		expect(driver.unmounts).toBe(1)
		expect(driver.renders).toHaveLength(2)
	})

	it('reports driver update failure through the owning session boundary', async () => {
		const r = request()
		const errors: unknown[] = []
		r.onRenderError = (error) => errors.push(error)
		const mounted = await createMobileStageHost({} as any).mount(r)
		driver.fail = true
		expect(() => mounted.update({ count: 2 })).not.toThrow()
		expect(errors).toHaveLength(1)
	})

	it('unmounts a partially failed root before propagating mount failure', () => {
		driver.fail = true
		expect(() => createMobileStageHost({} as any).mount(request())).toThrow('native render failed')
		expect(driver.unmounts).toBe(1)
	})
})
