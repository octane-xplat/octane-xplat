/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import { useState } from 'octane'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

// The universal renderer binds each host `on*` prop to a stable listener id
// and re-commits the handler under that id on every re-render — dispatch
// always reaches the newest committed closure, so a handler bound at mount
// never reads stale state once its owner re-renders. These tests pin that
// contract: freshness, replacement, removal (listener released, no
// duplicate subscriptions), and unmount cleanup.

function CounterButton(props: { seen: number[]; capture?: (bump: () => void) => void }) @{
	const [count, setCount] = useState(0)
	props.capture?.(() => setCount(count + 1))

	<button testID="counter" onTap={() => props.seen.push(count)} />
}

function SwapButton(props: { label: string; onTap: () => void }) @{
	<button testID="swap" text={props.label} onTap={props.onTap} />
}

function MaybeButton(props: { onTap?: () => void }) @{
	<button testID="maybe" onTap={props.onTap} />
}

const updateCommits = (container: any) =>
	container.commits.flatMap((commit: any) => commit.commands ?? [])

describe('event-prop freshness on the universal renderer', () => {
	it('dispatches the newest committed closure after a re-render', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const seen: number[] = []
		let bump: (() => void) | undefined
		try {
			flushUniversalSync(() =>
				root.render(CounterButton as any, { seen, capture: (b: () => void) => (bump = b) }),
			)

			const host = container.children[0]
			flushUniversalSync(() => container.dispatchEvent(host, 'tap', {}))
			flushUniversalSync(() => bump!())
			flushUniversalSync(() => container.dispatchEvent(host, 'tap', {}))
			expect(seen).toEqual([0, 1])
		} finally {
			root.unmount()
		}
	})

	it('rebinds a replaced handler without re-subscribing the listener', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const seen: string[] = []
		try {
			flushUniversalSync(() =>
				root.render(SwapButton as any, { label: 'a', onTap: () => seen.push('a') }),
			)

			const host = container.children[0]
			flushUniversalSync(() => container.dispatchEvent(host, 'tap', {}))
			container.commits.length = 0
			flushUniversalSync(() =>
				root.render(SwapButton as any, { label: 'b', onTap: () => seen.push('b') }),
			)

			// Only the handler closure changed — same listener id, same event
			// descriptor — so the batch re-commits the handler without an
			// `event` command. The driver never detaches/reattaches natively.
			expect(
				updateCommits(container).filter((command: any) => command.op === 'event'),
			).toEqual([])

			flushUniversalSync(() => container.dispatchEvent(host, 'tap', {}))
			expect(seen).toEqual(['a', 'b'])
		} finally {
			root.unmount()
		}
	})

	it('releases the listener exactly once when the handler prop disappears', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const seen: string[] = []
		try {
			flushUniversalSync(() => root.render(MaybeButton as any, { onTap: () => seen.push('x') }))
			const host = container.children[0]
			flushUniversalSync(() => container.dispatchEvent(host, 'tap', {}))
			container.commits.length = 0
			flushUniversalSync(() => root.render(MaybeButton as any, {}))
			expect(
				updateCommits(container).filter(
					(command: any) => command.op === 'event' && command.listener === null,
				),
			).toHaveLength(1)

			expect(() => container.dispatchEvent(host, 'tap', {})).toThrow('no "tap" listener')
			expect(seen).toEqual(['x'])
		} finally {
			root.unmount()
		}
	})

	it('drops every listener on unmount', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const seen: string[] = []
		flushUniversalSync(() => root.render(MaybeButton as any, { onTap: () => seen.push('x') }))
		const host = container.children[0]
		root.unmount()
		expect(container.children).toEqual([])
		expect(() => container.dispatchEvent(host, 'tap', {})).toThrow('unknown event target')
		expect(seen).toEqual([])
	})
})
