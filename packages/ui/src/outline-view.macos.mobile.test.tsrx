/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { useOutlineFromView } from './outline-view.macos.tsrx'

it('AppKit discovery hook snapshots once per native root and clears/recollects on rendered ref changes', async () => {
	const original = Object.getOwnPropertyDescriptor(globalThis, '__xplatAppKit')
	let calls = 0, captured: any[] = [], label = 'Intro'
	const reader = () => { calls++; return [{ id: 'intro', label, level: 2 }] }
	Object.defineProperty(globalThis, '__xplatAppKit', { configurable: true, value: { readOutlineHeadings: reader } })
	function Probe(props: any) { captured = useOutlineFromView(props.container); return <label text="Snapshot reader" /> }
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = async (view: unknown) => {
		flushUniversalSync(() => root.render(Probe, { container: view }))
		for (let index = 0; index < 8; index++) await Promise.resolve()
		flushUniversalSync(() => {})
	}
	try {
		const view = {}; await render({ current: { native: view } }); expect(captured).toEqual([{ id: 'intro', label: 'Intro', level: 2 }]); expect(calls).toBe(1)
		const first = captured; label = 'Changed'; await render({ current: view }); expect(captured).toBe(first); expect(calls).toBe(1)
		await render({ current: {} }); expect(captured[0].label).toBe('Changed'); expect(calls).toBe(2)
		await render({ current: null }); expect(captured).toEqual([])
	} finally { root.unmount(); if (original) Object.defineProperty(globalThis, '__xplatAppKit', original); else Reflect.deleteProperty(globalThis, '__xplatAppKit') }
})
