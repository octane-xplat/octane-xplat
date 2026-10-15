/** @jsxImportSource @nativescript-community/octane */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { useMeasure } from './useMeasure.tsrx'
import type { MeasureBounds } from './props'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))

function Measured(props: { values: Array<MeasureBounds | null> }) @{
	const measurement = useMeasure()
	props.values.push(measurement.bounds)

	<flexboxlayout ref={measurement.ref} />
}

function mountWithHosts(host: (instance: any) => any) {
	const container = createObjectContainer('nativescript')
	const driver = createObjectDriver('nativescript')
	const base = driver.getPublicInstance.bind(driver)
	driver.getPublicInstance = (c: any, id: any) => host(base(c, id))
	const root = createUniversalRoot(container, driver)
	return { container, root }
}

it('reports bounds relative to the app surface origin, not the screen', () => {
	const surface = { parent: null, getLocationOnScreen: () => ({ x: 40, y: 60 }) }
	const { root } = mountWithHosts((instance) => {
		instance.parent = surface
		instance.getLocationOnScreen = () => ({ x: 50, y: 80 })
		instance.getActualSize = () => ({ width: 200, height: 100 })
		return instance
	})

	const values: Array<MeasureBounds | null> = []
	flushUniversalSync(() => root.render(Measured as any, { values }))
	root.unmount()
	expect(values.at(-1)).toEqual({ x: 10, y: 20, width: 200, height: 100 })
})

it('stays null until the host can report a usable layout', () => {
	const { root } = mountWithHosts((instance) => instance)
	const values: Array<MeasureBounds | null> = []
	flushUniversalSync(() => root.render(Measured as any, { values }))
	root.unmount()
	expect(values.length).toBeGreaterThan(0)
	expect(values.every((b) => b === null)).toBe(true)
})
