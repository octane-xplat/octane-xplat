import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('@octane-xplat/macos-renderer', () => ({ setLayoutProjectionScale: vi.fn() }))

import { attachHost } from './host.macos'

function host() {
	const values = new Map<string, number>([
		['transform.translation.x', 0],
		['transform.translation.y', 0],
		['transform.rotation.z', 0],
		['transform.scale.x', 1],
		['transform.scale.y', 1],
	])

	const transaction = { begin: vi.fn(), setDisableActions: vi.fn(), commit: vi.fn() }
	vi.stubGlobal('CATransaction', transaction)
	const node = {
		alphaValue: 0.8,
		wantsLayer: false,
		layer: {
			valueForKeyPath: (path: string) => values.get(path),
			setValueForKeyPath: vi.fn((value: number, path: string) => values.set(path, value)),
		},
	}

	return { node, values, transaction }
}

afterEach(() => vi.unstubAllGlobals())

describe('AppKit Motion channels', () => {
	it('writes all native channels in one transaction, with scale composition and native units', () => {
		const { node, values, transaction } = host()
		attachHost(node).write({
			opacity: 0.5,
			x: 50,
			y: 20,
			rotate: 15,
			scale: 1.1,
			scaleX: 2,
			scaleY: 0.5,
		})

		expect(node.alphaValue).toBe(0.5)
		expect(node.wantsLayer).toBe(true)
		expect(values.get('transform.translation.x')).toBe(50)
		expect(values.get('transform.translation.y')).toBe(-20)
		expect(values.get('transform.rotation.z')).toBeCloseTo(Math.PI / 12)
		expect(values.get('transform.scale.x')).toBe(2.2)
		expect(values.get('transform.scale.y')).toBe(0.55)
		expect(transaction.begin).toHaveBeenCalledOnce()
		expect(transaction.setDisableActions).toHaveBeenCalledWith(true)
		expect(transaction.commit).toHaveBeenCalledOnce()
		expect(node).not.toHaveProperty('opacity')
		expect(node).not.toHaveProperty('translateX')
	})

	it('retains omitted native channels, clamps opacity, and restores the native baseline', () => {
		const { node, values } = host()
		const adapter = attachHost(node)
		expect(adapter.read()).toEqual({
			opacity: 0.8,
			x: 0,
			y: -0,
			rotate: 0,
			scale: 1,
			scaleX: 1,
			scaleY: 1,
		})

		adapter.write({ x: 50, y: 20, rotate: 15, scale: 1.1 })
		adapter.write({ opacity: 2 })
		expect(node.alphaValue).toBe(1)
		expect(values.get('transform.translation.x')).toBe(50)
		expect(values.get('transform.scale.y')).toBe(1.1)
		adapter.write({ opacity: -1 })
		expect(node.alphaValue).toBe(0)
		adapter.restore()
		expect(node.alphaValue).toBe(0.8)
		expect([...values.values()]).toEqual([0, 0, 0, 1, 1])
	})

	it.each([
		'transform.translation.x',
		'transform.translation.y',
		'transform.rotation.z',
		'transform.scale.x',
		'transform.scale.y',
	])('rejects an existing native transform: %s', (path) => {
		const { node, values } = host()
		values.set(path, 2)
		expect(() => attachHost(node)).toThrow('put existing transforms on an outer container')
	})

	it('creates a backing layer when transforms first write', () => {
		const { node } = host()
		let wantsLayer = false
		const view = {
			alphaValue: 1,
			get layer() {
				return wantsLayer ? node.layer : null
			},
			set wantsLayer(value: boolean) {
				wantsLayer = value
			},
		}

		const adapter = attachHost(view)
		adapter.write({ x: 12 })
		expect(wantsLayer).toBe(true)
		expect(node.layer.valueForKeyPath('transform.translation.x')).toBe(12)
	})

	it('commits the transaction if a native setter throws', () => {
		const { node, transaction } = host()
		node.layer.setValueForKeyPath.mockImplementation(() => {
			throw new Error('native write failed')
		})

		expect(() => attachHost(node).write({ x: 1 })).toThrow('native write failed')
		expect(transaction.commit).toHaveBeenCalledOnce()
	})
})
