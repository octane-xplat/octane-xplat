import { describe, expect, it, vi } from 'vitest'
import { bindDrawer } from './native-binding'
import type { DrawerProps } from './props'

function setup(initial: DrawerProps = {}) {
	let props = initial
	let opened = false
	const host = {
		isOpened: () => opened,
		open: vi.fn(async () => {
			opened = true
		}),
		close: vi.fn(async () => {
			opened = false
		}),
	}
	const binding = bindDrawer(host, () => props)
	return {
		host,
		binding,
		update(next: DrawerProps) {
			props = next
			binding.sync()
		},
		settle(value: boolean) {
			opened = value
			binding.settled(value)
		},
	}
}

describe('native Drawer state ownership', () => {
	it('waits for layout, applies defaultOpen once and does not echo programmatic transitions', () => {
		const change = vi.fn()
		const dismiss = vi.fn()
		const { host, binding, settle, update } = setup({
			defaultOpen: true,
			onOpenChange: change,
			onDismiss: dismiss,
		})
		binding.sync()
		expect(host.open).not.toHaveBeenCalled()
		binding.ready()
		expect(host.open).toHaveBeenCalledOnce()
		settle(true)
		expect(change).not.toHaveBeenCalled()
		settle(false)
		expect(change).toHaveBeenLastCalledWith(false)
		expect(dismiss).toHaveBeenCalledOnce()
		update({ defaultOpen: true, onOpenChange: change })
		expect(host.open).toHaveBeenCalledOnce()
	})
	it('reports edge opening and closing in uncontrolled mode', () => {
		const change = vi.fn()
		const { binding, settle } = setup({ onOpenChange: change })
		binding.ready()
		settle(true)
		settle(false)
		expect(change.mock.calls).toEqual([[true], [false]])
	})
	it('restores controlled visibility when the owner rejects a gesture', async () => {
		const change = vi.fn()
		const { host, binding, settle } = setup({ open: false, onOpenChange: change })
		binding.ready()
		settle(true)
		expect(change).toHaveBeenLastCalledWith(true)
		await Promise.resolve()
		expect(host.close).toHaveBeenCalledOnce()
		settle(false)
		expect(change).toHaveBeenCalledOnce()
	})
	it('lets a controlled owner accept a gesture in its queued render', async () => {
		const change = (open: boolean) => queueMicrotask(() => update({ open, onOpenChange: change }))
		const { host, binding, settle, update } = setup({ open: false, onOpenChange: change })
		binding.ready()
		settle(true)
		await Promise.resolve()
		expect(host.close).not.toHaveBeenCalled()
		settle(false)
		await Promise.resolve()
		expect(host.open).not.toHaveBeenCalled()
	})
	it('serializes rapid prop changes behind animation completion events', () => {
		const change = vi.fn()
		const { host, binding, settle, update } = setup({ open: true, onOpenChange: change })
		binding.ready()
		update({ open: false, onOpenChange: change })
		expect(host.close).not.toHaveBeenCalled()
		settle(true)
		expect(host.close).toHaveBeenCalledOnce()
		settle(false)
		expect(change).not.toHaveBeenCalled()
	})
	it('uses zero duration for reduced motion, reports errors, and stops after disposal', async () => {
		const error = new Error('interrupted')
		const onError = vi.fn()
		const { host, binding, update } = setup({ open: true, reducedMotion: true, onError })
		host.open.mockRejectedValueOnce(error)
		binding.ready()
		expect(host.open).toHaveBeenCalledWith('left', 0)
		await Promise.resolve()
		expect(onError).toHaveBeenCalledWith(error)
		binding.dispose()
		update({ open: false })
		expect(host.close).not.toHaveBeenCalled()
	})
})
