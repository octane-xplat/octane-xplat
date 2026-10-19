/** @jsxImportSource @nativescript-community/octane */
import { expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { useKeyboardInset } from './use-keyboard-inset.tsrx'

const subscriptions = vi.hoisted(() => new Set<(value: number) => void>())
vi.mock('./keyboard-inset', () => ({
	subscribeKeyboardInset: (listener: (value: number) => void) => {
		subscriptions.add(listener)
		listener(0)
		return () => subscriptions.delete(listener)
	},
}))

function Reader(props: { values: number[]; enabled?: boolean }) @{
	const inset = useKeyboardInset({ enabled: props.enabled })
	props.values.push(inset)

	<label text={String(inset)} />
}

it('compiled hook readers update independently across roots and unsubscribe on unmount', async () => {
	const first = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	const second = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	const a: number[] = [],
		b: number[] = []

	try {
		first.render(Reader as any, { values: a })
		second.render(Reader as any, { values: b })
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(subscriptions.size).toBe(2))
		flushUniversalSync(() => subscriptions.forEach((listener) => listener(240)))
		await vi.waitFor(() => {
			expect(a.at(-1)).toBe(240)
			expect(b.at(-1)).toBe(240)
		})

		first.unmount()
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(subscriptions.size).toBe(1))
		flushUniversalSync(() => subscriptions.forEach((listener) => listener(0)))
		await vi.waitFor(() => expect(b.at(-1)).toBe(0))
		expect(a.at(-1)).toBe(240)
	} finally {
		first.unmount()
		second.unmount()
		flushUniversalSync(() => {})
	}

	await vi.waitFor(() => expect(subscriptions.size).toBe(0))
})

it('disabled readers remain unsubscribed and release an enabled subscription when toggled off', async () => {
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	const values: number[] = []
	try {
		root.render(Reader as any, { values, enabled: false })
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(values.at(-1)).toBe(0))
		expect(subscriptions.size).toBe(0)
		root.render(Reader as any, { values, enabled: true })
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(subscriptions.size).toBe(1))
		flushUniversalSync(() => subscriptions.forEach((listener) => listener(240)))
		await vi.waitFor(() => expect(values.at(-1)).toBe(240))
		root.render(Reader as any, { values, enabled: false })
		flushUniversalSync(() => {})
		await vi.waitFor(() => {
			expect(subscriptions.size).toBe(0)
			expect(values.at(-1)).toBe(0)
		})
	} finally {
		root.unmount()
		flushUniversalSync(() => {})
	}

	expect(subscriptions.size).toBe(0)
})
