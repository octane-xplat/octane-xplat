/** @jsxImportSource @octane-xplat/jsx/dom */
// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file ProposedTabList.web.tsrx
 * @input Selected tab value, the lab's tuned move tokens
 * @output A tab strip with ONE strip-owned indicator that travels on transform
 * @position Motion Lab "after" pane for the sliding-indicator comparison
 *
 * Upstream ships a swizzled copy of core's TabList under
 * `motion-lab/proposed/TabList/` — one behavioural change: the strip owns a
 * single indicator, positioned over the selected tab and moved with
 * `transform`, instead of every tab cross-fading its own. Opt-in via
 * `hasTravellingIndicator`, which this file treats as always on — the lab's
 * before pane runs the real Octane `TabList`, so the flag exists only to keep
 * the upstream call sites compiling.
 *
 * This is an app-owned demonstration of the same contract, not a port of the
 * swizzled source: Octane's TabList is a different implementation, so the
 * "difference is the diff" property upstream relies on cannot transfer. What
 * does transfer is the thing under test — one indicator, travelling on
 * `--ease-move`, compositor-only.
 */

import { useLayoutEffect, useRef, createContext, useContext } from 'octane'

const ProposedContext = createContext<{ value: string; onChange: (v: string) => void } | null>(
	null,
)

export function TabList(props: {
	value: string
	onChange: (value: string) => void
	hasTravellingIndicator?: boolean
	children?: any
}) {
	const stripRef = useRef<HTMLDivElement | null>(null)
	const indicatorRef = useRef<HTMLSpanElement | null>(null)

	useLayoutEffect(() => {
		const strip = stripRef.current
		const indicator = indicatorRef.current
		if (strip == null || indicator == null) {
			return
		}
		const selected = strip.querySelector<HTMLElement>('[data-selected="true"]')
		if (selected == null) {
			indicator.style.width = '0'
			return
		}
		const stripRect = strip.getBoundingClientRect()
		const rect = selected.getBoundingClientRect()
		indicator.style.transform = `translateX(${rect.left - stripRect.left}px)`
		indicator.style.width = `${rect.width}px`
	})

	return (
		<ProposedContext value={{ value: props.value, onChange: props.onChange }}>
			<div ref={stripRef} role="tablist" className="ml-tabRow">
				{props.children}
				<span ref={indicatorRef} className="ml-indicator" aria-hidden="true" />
			</div>
		</ProposedContext>
	)
}

export function Tab(props: { value: string; label: string }) {
	const ctx = useContext(ProposedContext)
	const selected = ctx?.value === props.value
	return (
		<button
			type="button"
			role="tab"
			aria-selected={selected}
			data-selected={selected}
			tabIndex={selected ? 0 : -1}
			className={selected ? 'ml-tab ml-tabSelected' : 'ml-tab'}
			onClick={() => ctx?.onChange(props.value)}
		>
			{props.label}
		</button>
	)
}
