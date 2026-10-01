import { Application, Frame, ListView } from '@nativescript/core'
import { currentModalRoute, getStack, popRoute, routeFor } from '@octane-xplat/ui'

import { findInRootLayouts } from '@octane-xplat/ui/native'

import { DEMOS } from '@xplat/demos'
import { goBack, navigate } from './nav'
import { closeSheet, sheetHost } from './sheet'
import { VIRTUAL_LIST_BENCH_MODE } from './virtual-list-benchmark-mode'

// The catalog sweep stays gated on Android — its step chain asserts native
// Page/Frame objects (getStack().currentPage, navigated pages), which the
// Android path deliberately lacks: named-stack pushes live in the route
// store and render through the swap pane (TabViewItem-hosted Frames lose
// bookkeeping upstream — NativeScript#11444; fix ported as #11446 in the
// xplat core patch). The focused VirtualList check below uses the
// Android-safe swap-pane route.
const SKIP = Application.android != null
if (SKIP) {
	console.log(
		'[sweep] catalog sweep skipped on android — asserts native Page objects; swap-pane route used instead',
	)
}

// Demo-catalog sweep probe (native only — web twin is a no-op). Lives outside
// apps/mobile/src/index.ts so the harness probe timeline stays untouched.
// The catalog is a parallel stack: the Demos tab hosts its own Frame, so
// pushes/pop happen inside the tab and never move Frame.topmost() — all
// reads scope to getStack('demos').currentPage.
// NS gestures aren't events, so tap synthesis invokes the view's
// gesture-observer callback directly.
function fireTap(view: any) {
	const observers = view?.getGestureObservers?.(1) ?? []
	if (view && view.isLoaded === false) {
		// Unloaded views keep their JS observers but lose their native
		// recognizers — the dispatch works while a real tap would die.
		// Mark it so probe results can't silently pass against a dead twin.
		console.log(
			'[sweep] tap target ' +
				(view.id ?? view.constructor.name) +
				' isLoaded=false — dead view, JS dispatch only',
		)
	}

	for (const o of observers) {
		o.callback.call(o.context, { eventName: 'tap', object: view })
	}

	return observers.length
}

// GestureTypes.longPress = 64 — the native Hoverable trigger.
function fireLongPress(view: any) {
	const observers = view?.getGestureObservers?.(64) ?? []
	for (const o of observers) {
		o.callback.call(o.context, { eventName: 'longPress', object: view, state: 3 })
	}

	return observers.length
}

function collect(view: any, out: any[] = []): any[] {
	if (!view) {
		return out
	}

	out.push(view)
	view.eachChildView?.((c: any) => {
		collect(c, out)
		return true
	})

	return out
}

function viewTexts(view: any): string[] {
	return collect(view)
		.filter((v) => typeof v?.text === 'string' && v.text.length > 0)
		.map((v) => v.text)
}

function dump(hay: string[]): string {
	return ' texts=' + JSON.stringify(hay.slice(-14))
}

// App demos push into the 'demos' stack (Apps pane); seam-proof demos
// push into 'test' (Test pane). Steps resolve their stack from the
// catalog kind — the current step's stack drives every page lookup.
let stepStack = 'demos'
const stackFor = (id: string) =>
	DEMOS.find((d) => d.id === id)?.kind === 'proof' ? 'test' : 'demos'

// Self-drawn Tabs panes hold no Frame — their content lives inside the
// root Page's subtree, so fall back to it for text/probe reads.
const demosPage = () =>
	Application.android != null
		? getStack('root')?.currentPage
		: (getStack(stepStack)?.currentPage ?? getStack('root')?.currentPage)

// Frame stacks detect pushes via currentPage changes; swap-pane stacks
// keep the same Page — the route store is the honest signal for both.
const pushedRoute = () => routeFor(stepStack)

// Captured across checks — sheetHost() empties the moment closeSheet's
// finish() runs, so the detach assert needs the pre-close reference.
let lastSheetHost: any = null

function assertHas(name: string, needle: string, view: any = demosPage()) {
	const hay = viewTexts(view)
	const ok = hay.includes(needle)
	console.log(
		'[assert] ' +
			name +
			': ' +
			(ok ? 'OK' : 'FAIL') +
			' (' +
			JSON.stringify(needle) +
			')' +
			(ok ? '' : dump(hay)),
	)
}

function assertMatch(name: string, re: RegExp, view: any = demosPage()) {
	const hay = viewTexts(view)
	const ok = hay.some((t) => re.test(t))
	console.log(
		'[assert] ' + name + ': ' + (ok ? 'OK' : 'FAIL') + ' (' + re + ')' + (ok ? '' : dump(hay)),
	)
}

function tapTargetForText(view: any, text: string, path: any[] = []): any {
	if (!view) {
		return null
	}

	const nextPath = [...path, view]
	if (view.text === text) {
		// Prefer loaded ancestors: an unloaded view still lists its JS
		// gesture observers (they only splice on removeEventListener), so an
		// unloaded match is a dead target whose real taps can't fire.
		return (
			[...nextPath]
				.reverse()
				.find((v) => v?.isLoaded !== false && (v?.getGestureObservers?.(1)?.length ?? 0) > 0) ??
			null
		)
	}

	let found: any = null
	view.eachChildView?.((child: any) => {
		found = tapTargetForText(child, text, nextPath)
		return !found
	})

	return found
}

// Same climb as tapTargetForText but matches a specific gesture type —
// e.g. Hoverable's long-press observer sits on an outer Pressable while
// the tap observer is on a nested child.
function gestureTargetForText(view: any, text: string, type: number): any {
	const all = collect(view)
	const hit = all.find((v) => v?.text === text)
	let cur = hit
	while (cur && !(cur.getGestureObservers?.(type)?.length ?? 0)) {
		cur = cur.parent
	}

	return cur ?? null
}

function runNavLinkProbe() {
	// Self-drawn Tabs has no `items`/per-item views — the Home pane lives
	// inside the root Page's subtree.
	const homeView = getStack('root')?.currentPage
	const target = tapTargetForText(homeView, 'Detail →')
	const observers = fireTap(target)
	if (!observers) {
		console.log('[assert] NavLink tap target: FAIL (Detail → has no tap observer)')
		return
	}

	waitFor(
		() => routeFor('root')?.name === 'detail',
		() => {
			const route = routeFor('root')
			const ok = route?.name === 'detail' && route.params.from === 'home'
			console.log(
				'[assert] NavLink pushes detail page: ' +
					(ok ? 'OK' : 'FAIL') +
					(ok ? '' : ' — ' + JSON.stringify(route)),
			)

			if (ok) {
				popRoute('root')
			}
		},
	)
}

// Exercise the Home page's declarative NavLink through its real native tap
// observer, then return to the app shell before the nested-stack sweep.
if (!VIRTUAL_LIST_BENCH_MODE) {
	setTimeout(runNavLinkProbe, 5000)
}

// The +modal route: tap 'About ⤴' → manifest presentation:'modal' →
// showModal root (currentPage untouched), popRoute dismisses it.
function runModalRouteProbe() {
	const homeView = getStack('root')?.currentPage
	const target = tapTargetForText(homeView, 'About ⤴')
	const observers = fireTap(target)
	if (!observers) {
		console.log('[assert] modal route tap target: FAIL (About ⤴ has no tap observer)')
		return
	}

	waitFor(
		() => currentModalRoute()?.name === 'about',
		() => {
			const route = currentModalRoute()
			const ok = route?.name === 'about'
			console.log('[assert] +modal route opens showModal root: ' + (ok ? 'OK' : 'FAIL'))

			const modalView = (getStack('root')?.currentPage as any)?.modal
			const texts = modalView ? viewTexts(modalView) : []
			console.log(
				'[assert] modal route screen mounted: ' +
					(texts.some((t) => t.includes('About (modal route)')) ? 'OK' : 'FAIL') +
					(modalView ? '' : ' (no modal host on currentPage)'),
			)

			popRoute('root')
			setTimeout(() => {
				console.log(
					'[assert] modal route dismissed by popRoute: ' + (currentModalRoute() ? 'FAIL' : 'OK'),
				)
			}, 600)
		},
	)
}

// Root-stack modal — not a nested-stack push, so it runs on Android too.
if (!VIRTUAL_LIST_BENCH_MODE) {
	setTimeout(runModalRouteProbe, 6500)
}

// Chips live on the demos stack's current page; the sheet host sits on the
// app's RootLayout, a sibling of every page — read it from there.
const find = (id: string) => demosPage()?.getViewById?.(id)
// Imperative hosts (sheet/overlay) mount on the CURRENT page's rootlayout —
// search the demos page first, then the first-mounted rootlayout.
const findOnRoot = (id: string) => demosPage()?.getViewById?.(id) ?? findInRootLayouts(id)

function virtualListRowMetrics(list: any) {
	return collect(list)
		.filter((view) => /^row-r\d+$/.test(String(view.id ?? '')))
		.map((view) => {
			const size = view.getActualSize?.() ?? {}
			const screenPoint = view.getLocationOnScreen?.() ?? {}
			return {
				id: String(view.id),
				y: Number(screenPoint.y),
				height: Number(size.height),
			}
		})
}

function visibleVirtualListRows(list: any) {
	const listY = Number(list?.getLocationOnScreen?.()?.y)
	const listHeight = Number(list?.getActualSize?.()?.height)
	if (!Number.isFinite(listY) || !Number.isFinite(listHeight) || listHeight <= 0) {
		return []
	}

	return virtualListRowMetrics(list).filter(
		(row) =>
			Number.isFinite(row.y) &&
			row.height > 0 &&
			row.y + row.height > listY &&
			row.y < listY + listHeight,
	)
}

function runVirtualListHeightProbe() {
	const list: any = find('vlist')
	setVirtualListOffset(list, 960)
	const heightAnchorReady = () => {
		const offset = Number(list?.verticalOffset)
		const listY = Number(list?.getLocationOnScreen?.()?.y)
		const row15 = virtualListRowMetrics(list).find((row) => row.id === 'row-r15')
		const anchor = visibleVirtualListRows(list).find((row) => Number(row.id.slice(5)) > 15)
		return (
			row15 != null &&
			Number.isFinite(offset) &&
			offset >= 900 &&
			offset < 1300 &&
			Number.isFinite(listY) &&
			row15.y + row15.height <= listY &&
			anchor != null
		)
	}

	waitFor(
		heightAnchorReady,
		() => {
			if (!heightAnchorReady()) {
				console.log('[assert] VirtualList height anchor setup: FAIL')
				return
			}

			const before = visibleVirtualListRows(list).find((row) => Number(row.id.slice(5)) > 15)
			const row15: any = find('row-r15')
			const oldHeight = Number(row15?.getActualSize?.().height ?? 0)
			const rowMetrics = virtualListRowMetrics(list)
			const variableHeights = new Set(rowMetrics.map((row) => row.height)).size > 1

			console.log(
				'[assert] VirtualList measures variable row heights: ' + (variableHeights ? 'OK' : 'FAIL'),
			)

			if (!before || oldHeight <= 0) {
				console.log('[assert] VirtualList height anchor captured: FAIL')
				return
			}

			console.log('[assert] VirtualList height anchor captured: OK (' + before.id + ')')
			fireTap(tapTargetForText(demosPage(), 'Grow r15'))
			let previousAnchorY = Number.NaN
			let stableAnchorSamples = 0
			const heightAnchorSettled = () => {
				const newHeight = Number((find('row-r15') as any)?.getActualSize?.().height ?? 0)
				const after = virtualListRowMetrics(list).find((row) => row.id === before.id)
				if (newHeight < oldHeight + 23 || !after) {
					stableAnchorSamples = 0
					return false
				}

				if (Math.abs(after.y - before.y) > 2) {
					stableAnchorSamples = 0
				} else if (Math.abs(after.y - previousAnchorY) <= 0.5) {
					stableAnchorSamples += 1
				} else {
					stableAnchorSamples = 0
				}

				previousAnchorY = after.y
				return stableAnchorSamples >= 2
			}

			waitFor(
				heightAnchorSettled,
				() => {
					const after = virtualListRowMetrics(list).find((row) => row.id === before.id)
					const newHeight = Number((find('row-r15') as any)?.getActualSize?.().height ?? 0)
					const visible = visibleVirtualListRows(list)
					const mounted = collect(list).filter((view) =>
						String(view.className ?? '')
							.split(/\s+/)
							.includes('vx-virtual-list-row'),
					)

					const drift = after ? Math.abs(after.y - before.y) : Number.POSITIVE_INFINITY

					console.log(
						'[assert] VirtualList records the changed row height: ' +
							(newHeight >= oldHeight + 23 ? 'OK' : 'FAIL') +
							' (' +
							oldHeight +
							' → ' +
							newHeight +
							' dip)',
					)

					console.log(
						'[assert] VirtualList corrects a measured row above the anchor within 2 dip: ' +
							(drift <= 2 ? 'OK' : 'FAIL') +
							' (' +
							(Number.isFinite(drift) ? drift.toFixed(2) : 'missing') +
							' dip)',
					)

					console.log(
						'[assert] VirtualList height update keeps a bounded nonblank window: ' +
							(visible.length > 0 && mounted.length < 40 ? 'OK' : 'FAIL') +
							' (' +
							visible.length +
							' visible, ' +
							mounted.length +
							' mounted)',
					)

					const slotTexts = viewTexts(list)
					const separators = collect(list).filter((view) =>
						String(view.className ?? '')
							.split(/\s+/)
							.includes('vx-virtual-list-separator'),
					)

					const hasSeparatorContent = separators.some((separator) => collect(separator).length > 1)
					const hasSlots =
						slotTexts.includes('Variable-height rows · tap rows, then reverse') &&
						slotTexts.includes('End of 500 rows') &&
						hasSeparatorContent

					console.log(
						'[assert] VirtualList renders header, footer, and separators: ' +
							(hasSlots ? 'OK' : 'FAIL'),
					)

					const emptyTarget = tapTargetForText(demosPage(), 'Empty')
					if (!emptyTarget) {
						console.log('[assert] VirtualList renders its empty state: FAIL (button missing)')
						return
					}

					fireTap(emptyTarget)
					waitFor(
						() => viewTexts(find('vlist')).includes('No rows'),
						() => {
							const emptyRendered = viewTexts(find('vlist')).includes('No rows')
							console.log(
								'[assert] VirtualList renders its empty state: ' + (emptyRendered ? 'OK' : 'FAIL'),
							)

							const restoreTarget = tapTargetForText(demosPage(), 'Restore')
							if (!restoreTarget) {
								console.log(
									'[assert] VirtualList restores rows after the empty state: FAIL (button missing)',
								)

								return
							}

							fireTap(restoreTarget)
							waitFor(
								() =>
									viewTexts(demosPage()).some((text) => text.startsWith('500 rows ·')) &&
									collect(find('vlist')).some((view) =>
										String(view.className ?? '')
											.split(/\s+/)
											.includes('vx-virtual-list-row'),
									),
								() => {
									const restored =
										viewTexts(demosPage()).some((text) => text.startsWith('500 rows ·')) &&
										collect(find('vlist')).some((view) =>
											String(view.className ?? '')
												.split(/\s+/)
												.includes('vx-virtual-list-row'),
										)

									console.log(
										'[assert] VirtualList restores rows after the empty state: ' +
											(restored ? 'OK' : 'FAIL'),
									)
								},
								40,
							)
						},
						40,
					)
				},
				40,
			)
		},
		40,
	)
}

function setVirtualListOffset(list: any, offset: number) {
	const nativeView = list?.nativeViewProtected
	const makePoint = (globalThis as any).CGPointMake
	if (
		typeof nativeView?.setContentOffsetAnimated === 'function' &&
		typeof makePoint === 'function'
	) {
		const current = nativeView.contentOffset
		nativeView.setContentOffsetAnimated(makePoint(current.x, offset), false)
	} else {
		list?.scrollToVerticalOffset?.(offset, false)
	}
}

function waitForVirtualListDeepRowVisible(
	list: any,
	minIndex: number,
	then: (target: any, rowId: string, rowText: string) => void,
) {
	let previousSignature = ''
	let positionSamples: number[] = []
	let lastCandidate: { id: string; y: number; height: number } | null = null
	let lastOffset = Number.NaN
	let lastListY = Number.NaN
	let lastListHeight = Number.NaN
	let lastVisibleSignature = ''
	let lastSampleSpread = Number.NaN
	const readVisibleWindow = () => {
		const listY = Number(list?.getLocationOnScreen?.()?.y)
		const listHeight = Number(list?.getActualSize?.()?.height)
		if (!Number.isFinite(listY) || !Number.isFinite(listHeight) || listHeight <= 0) {
			return null
		}

		const rows = virtualListRowMetrics(list).filter(
			(row) =>
				Number.isFinite(row.y) &&
				row.height > 0 &&
				row.y + row.height > listY &&
				row.y < listY + listHeight,
		)

		const fullyVisible = rows.filter(
			(row) => row.y >= listY && row.y + row.height <= listY + listHeight,
		)

		const candidate = fullyVisible.find((row) => Number(row.id.slice(5)) >= minIndex)
		return { listY, listHeight, rows, candidate }
	}

	const visibleWindowIsStable = () => {
		const current = readVisibleWindow()
		if (!current?.candidate) {
			previousSignature = ''
			positionSamples = []
			lastCandidate = current?.candidate ?? null
			return false
		}

		const signature = current.rows.map((row) => row.id).join(',')
		if (signature !== previousSignature) {
			previousSignature = signature
			positionSamples = []
		}

		positionSamples.push(current.candidate.y)
		if (positionSamples.length > 20) {
			positionSamples.shift()
		}

		lastSampleSpread = Math.max(...positionSamples) - Math.min(...positionSamples)
		lastCandidate = current.candidate
		lastOffset = Number(list?.verticalOffset ?? 0)
		lastListY = current.listY
		lastListHeight = current.listHeight
		lastVisibleSignature = signature
		return positionSamples.length === 20 && lastSampleSpread <= 2
	}

	waitFor(
		visibleWindowIsStable,
		() => {
			if (!visibleWindowIsStable() || !lastCandidate) {
				console.log(
					'[assert] VirtualList stable deep visible row: FAIL (offset=' +
						lastOffset +
						', candidate=' +
						(lastCandidate?.id ?? 'missing') +
						', y=' +
						(lastCandidate?.y ?? Number.NaN) +
						', listY=' +
						lastListY +
						', listHeight=' +
						lastListHeight +
						', window=' +
						lastVisibleSignature +
						', sampleSpread=' +
						lastSampleSpread +
						')',
				)

				return
			}

			const rowView = find(lastCandidate.id)
			const rowText = viewTexts(rowView).find((value) => /^Row \d+ · \d+$/.test(value))
			const target = rowText ? tapTargetForText(list, rowText) : null
			if (!rowText || !target) {
				console.log(
					'[assert] VirtualList stable deep visible row: FAIL (' +
						lastCandidate.id +
						', text=' +
						rowText +
						')',
				)

				return
			}

			console.log('[assert] VirtualList stable deep visible row: OK (' + lastCandidate.id + ')')
			then(target, lastCandidate.id, rowText)
		},
		160,
	)
}

function runVirtualListStateProbe() {
	let list: any
	const hasViewport = () => {
		list = find('vlist')
		return list?.isLoaded !== false && Number(list?.getActualSize?.()?.height ?? 0) > 0
	}

	waitFor(
		hasViewport,
		() => {
			if (!hasViewport()) {
				const size = list?.getActualSize?.()
				console.log(
					'[assert] VirtualList lays out a nonzero viewport: FAIL (' +
						'loaded=' +
						String(list?.isLoaded) +
						' size=' +
						Number(size?.width ?? 0) +
						'x' +
						Number(size?.height ?? 0) +
						')',
				)

				return
			}

			list?.scrollToVerticalOffset?.(10800, false)
			const rowMountedAtTarget = () => {
				const row: any = find('row-r200')
				return (
					Number(list?.verticalOffset ?? 0) >= 9000 &&
					row?.isLoaded !== false &&
					Number(row?.getActualSize?.()?.height ?? 0) > 0 &&
					tapTargetForText(list, 'Row 200 · 0') != null
				)
			}

			waitFor(
				rowMountedAtTarget,
				() => {
					if (!rowMountedAtTarget()) {
						console.log('[assert] VirtualList row 200 mounts at a deep programmatic offset: FAIL')
						return
					}

					console.log('[assert] VirtualList row 200 mounts at a deep programmatic offset: OK')
					waitForVirtualListDeepRowVisible(list, 100, (rowTarget, rowId, rowText) => {
						const rowIndex = Number(rowId.slice(5))
						const rowLabel = rowText.slice(0, rowText.lastIndexOf(' · '))
						const priorPressCount = Number(rowText.slice(rowText.lastIndexOf(' · ') + 3))
						const pressedText = rowLabel + ' · ' + (priorPressCount + 1)
						fireTap(rowTarget)
						waitFor(
							() => viewTexts(demosPage()).includes(pressedText),
							() => {
								const rowPressed = viewTexts(demosPage()).includes(pressedText)
								console.log(
									'[assert] VirtualList row-r' +
										rowIndex +
										' press updates local state: ' +
										(rowPressed ? 'OK' : 'FAIL'),
								)

								const anchorBefore = visibleVirtualListRows(list)[0]
								const prependTarget = tapTargetForText(demosPage(), 'Prepend')
								fireTap(prependTarget)
								let previousAnchorY = Number.NaN
								let stableAnchorSamples = 0
								const prependAnchorStable = () => {
									const prepended = viewTexts(demosPage()).some((text) =>
										text.startsWith('501 rows ·'),
									)

									const stayed = viewTexts(demosPage()).includes(pressedText)
									const after = virtualListRowMetrics(list).find(
										(row) => row.id === anchorBefore?.id,
									)

									if (!prepended || !stayed || !anchorBefore || !after) {
										stableAnchorSamples = 0
										return false
									}

									if (Math.abs(after.y - anchorBefore.y) > 2) {
										stableAnchorSamples = 0
									} else if (Math.abs(after.y - previousAnchorY) <= 0.5) {
										stableAnchorSamples += 1
									} else {
										stableAnchorSamples = 0
									}

									previousAnchorY = after.y
									return stableAnchorSamples >= 2
								}

								waitFor(
									prependAnchorStable,
									() => {
										const prepended = viewTexts(demosPage()).some((text) =>
											text.startsWith('501 rows ·'),
										)

										console.log(
											'[assert] VirtualList prepend updates the rendered item count: ' +
												(prepended ? 'OK' : 'FAIL'),
										)

										const rowTextsAfterPrepend = viewTexts(demosPage()).filter((text) =>
											text.startsWith(rowLabel + ' · '),
										)

										const stayed = rowTextsAfterPrepend.includes(pressedText)
										console.log(
											'[assert] VirtualList keyed row state survives prepend: ' +
												(stayed ? 'OK' : 'FAIL (' + JSON.stringify(rowTextsAfterPrepend) + ')'),
										)

										const anchorAfter = virtualListRowMetrics(list).find(
											(row) => row.id === anchorBefore?.id,
										)

										const anchorDrift =
											anchorBefore && anchorAfter
												? Math.abs(anchorAfter.y - anchorBefore.y)
												: Number.POSITIVE_INFINITY

										console.log(
											'[assert] VirtualList preserves the visible row across prepend within 2 dip: ' +
												(anchorDrift <= 2 ? 'OK' : 'FAIL') +
												' (' +
												(Number.isFinite(anchorDrift) ? anchorDrift.toFixed(2) : 'missing') +
												' dip)',
										)

										runVirtualListHeightProbe()
									},
									60,
								)
							},
							40,
						)
					})
				},
				80,
			)
		},
		60,
	)
}

interface Step {
	id: string
	/** ms to hold the pushed page before goBack. Default 900. */
	hold?: number
	checks: { at: number; run: () => void }[]
}

const STEPS: Step[] = [
	{
		id: 'counter',
		hold: 3200,
		checks: [
			{ at: 350, run: () => assertHas('demo counter', 'Demo count: 0') },
			{ at: 400, run: () => assertHas('if else mount', 'arm-B') },
			{ at: 550, run: () => fireTap(find('if-toggle')) },
			{ at: 800, run: () => assertHas('if then swap', 'arm-A') },
			// Same component, third root: open this demo inside the sheet.
			{ at: 900, run: () => fireTap(find('demo-sheet')) },
			{
				at: 1900,
				run: () => {
					// The host ref survives even when its owning rootlayout
					// unloads (tab-pane shells churn) — assert on it directly.
					lastSheetHost = sheetHost() ?? findOnRoot('sheet-host')
					const ok = collect(lastSheetHost).some(
						(v) => typeof v?.text === 'string' && v.text.includes('Demo count'),
					)

					console.log(
						'[assert] sheet hosts demo: ' +
							(ok ? 'OK' : 'FAIL') +
							' — same component in sheet root',
					)

					// Regression probe for the re-entrant RootLayout.close: the
					// 'closed' notify fires before removeChild, so a close()
					// issued from inside it double-removes and throws 'View not
					// added to this instance'. Programmatic close is the safe
					// path — the detach assert below catches leftovers.
					closeSheet()
				},
			},
			{
				at: 2700,
				run: () => {
					const ok = lastSheetHost != null && lastSheetHost.parent == null
					console.log(
						'[assert] sheet close detaches host: ' +
							(ok ? 'OK' : 'FAIL (parent=' + lastSheetHost?.parent?.constructor?.name + ')'),
					)
				},
			},
		],
	},
	{ id: 'watch', checks: [{ at: 800, run: () => assertMatch('demo watch', /\d{2}:\d{2}:\d{2}/) }] },
	{ id: 'stopwatch', checks: [{ at: 800, run: () => assertHas('demo stopwatch', '0:00.0') }] },
	{
		id: 'todo',
		checks: [{ at: 800, run: () => assertHas('demo todo', 'Nothing yet — add one.') }],
	},
	{ id: 'ttt', checks: [{ at: 800, run: () => assertHas('demo ttt', 'X to play') }] },
	{ id: 'dialer', checks: [{ at: 800, run: () => assertHas('demo dialer', 'Enter number') }] },
	{
		id: 'vlist',
		hold: 45000,
		checks: [
			{
				at: 500,
				run: () => {
					const list: any = find('vlist')
					const rows = collect(list).filter((view) =>
						String(view.className ?? '')
							.split(/\s+/)
							.includes('vx-virtual-list-row'),
					)

					const bounded = rows.length > 0 && rows.length < 40
					console.log(
						'[assert] VirtualList bounds mounted rows: ' +
							(bounded ? 'OK' : 'FAIL') +
							' (' +
							rows.length +
							'/500)',
					)

					runVirtualListStateProbe()
				},
			},
		],
	},
	// Fake fetch resolves ~600ms post-mount. The 'Loading…' transient isn't
	// asserted: nav-push settle polling eats it (page mounts at navigate()
	// time, becomes the frame's currentPage ~500ms later — the loading
	// state can lapse mid-transition). Data arrival is the meaningful check.
	{
		id: 'weather',
		checks: [{ at: 1000, run: () => assertMatch('demo weather data', /°/) }],
	},
	{ id: 'anim', checks: [{ at: 800, run: () => assertHas('demo anim', 'active: none') }] },
	{
		id: 'probe',
		checks: [
			{ at: 300, run: () => assertHas('demo probe mount', 'plain-a n=0 renders=1') },
			{ at: 450, run: () => fireTap(find('rp-a')) },
			// memo-b's props are unchanged by the A bump — renders must stay 1.
			{ at: 950, run: () => assertHas('probe memo-b skipped', 'memo-b n=0 renders=1') },
		],
	},
	// --- primitives sprint demos ---
	{
		id: 'list-demo',
		hold: 2100,
		checks: [
			{ at: 400, run: () => assertHas('demo list contract', 'Doors open') },
			{ at: 500, run: () => fireTap(find('list-demo-reverse')) },
			// onEndReached ← ListView loadMoreItems (a real event — notify
			// reaches it). NS auto-refires while the last item stays visible,
			// so more than one batch may append.
			{
				at: 1100,
				run: () => {
					const lv = collect(demosPage()).find((v) => v instanceof ListView)
					console.log('[probe] list-demo listview=' + (lv ? lv.constructor.name : 'none'))
					lv?.notify({ eventName: 'loadMoreItems', object: lv } as any)
				},
			},
			// Single settled read — ListView rebuilds cells async around the
			// reverse/append rebinds. Cell tree order is NOT visual order for
			// a recycled list — collect text views with their screen y and
			// sort. 'Encore' before 'Water station' proves the reversal
			// applied; 'Added event' proves onEndReached appended.
			{
				at: 1800,
				run: () => {
					const hay = collect(demosPage())
						.filter((v) => typeof v?.text === 'string' && v.text.length > 0)
						.map((v) => ({
							text: v.text as string,
							y: v.getLocationOnScreen?.()?.y ?? 9999,
						}))
						.sort((a, b) => a.y - b.y)
						.map((v) => v.text)

					const enc = hay.indexOf('Encore')
					const water = hay.indexOf('Water station: Available by the entrance.')
					console.log(
						'[assert] list rebind order: ' +
							(enc >= 0 && water >= 0 && enc < water ? 'OK' : 'FAIL') +
							dump(hay),
					)

					console.log(
						'[assert] list onEndReached: ' +
							(hay.some((t) => t.startsWith('Added event')) ? 'OK' : 'FAIL'),
					)
				},
			},
		],
	},
	{
		id: 'scrollbox',
		checks: [
			{ at: 500, run: () => assertHas('scrollbox inline content', 'ScrollBox row 1') },
			{
				at: 650,
				run: () => {
					const list = collect(demosPage()).find((v) => v.id === 'scrollbox-demo-list')
					let parent = list?.parent
					let nested = false
					while (parent) {
						nested ||= parent.constructor?.name === 'ScrollView'
						parent = parent.parent
					}

					console.log(
						'[assert] ScrollBox keeps List out of ScrollView: ' +
							(!nested && list ? 'OK' : 'FAIL') +
							' (list=' +
							(list?.constructor?.name ?? 'none') +
							' nested=' +
							nested +
							')',
					)
				},
			},
		],
	},
	{
		id: 'rich-text',
		hold: 1700,
		checks: [
			{ at: 500, run: () => assertHas('rich text mount', 'Last tapped: Nothing tapped yet') },
			{
				at: 650,
				run: () => {
					const label = find('rich-text-sample') as any
					const spans = label?.formattedText?.spans ?? []
					const link = spans.find((span: any) => span.text === '@octane')
					const style = link?.style
					const styled =
						style?.color != null &&
						style?.fontWeight === 'bold' &&
						style?.textDecoration === 'underline'

					console.log(
						'[assert] rich text formatted spans: ' +
							(spans.length === 5 && styled ? 'OK' : 'FAIL') +
							' (count=' +
							spans.length +
							' styled=' +
							styled +
							' color=' +
							String(style?.color) +
							' weight=' +
							String(style?.fontWeight) +
							')',
					)

					link?.notify?.({ eventName: 'linkTap', object: link } as any)
				},
			},
			{ at: 1000, run: () => assertHas('rich text span tap', 'Last tapped: @octane') },
		],
	},
	{
		id: 'tiptap-probe',
		hold: 6000,
		checks: [
			{ at: 3500, run: () => assertMatch('tiptap probe', /probe \d+\/\d+ (PASS|FAIL)/) },
			{ at: 4500, run: () => assertMatch('tiptap probe pass', /probe \d+\/\d+ PASS/) },
		],
	},
	{
		id: 'lexical-probe',
		hold: 6000,
		checks: [
			{ at: 3500, run: () => assertMatch('lexical probe', /probe \d+\/\d+ (PASS|FAIL)/) },
			{ at: 4500, run: () => assertMatch('lexical probe pass', /probe \d+\/\d+ PASS/) },
		],
	},
	{
		// iOS leaf is a stub until the Swift facade lands — the demo must
		// still mount and report 'unsupported'.
		id: 'richtext-editor',
		checks: [
			{
				at: 800,
				run: () => assertHas('richtext ios stub', 'Rich text editing is not supported on iOS yet.'),
			},
			{ at: 800, run: () => assertMatch('richtext ios status', /unsupported/) },
		],
	},
	{
		id: 'tiptap-editor',
		checks: [
			{
				at: 800,
				run: () => assertHas('tiptap ios stub', 'Rich text editing is not supported on iOS yet.'),
			},
			{ at: 800, run: () => assertMatch('tiptap ios status', /unsupported/) },
		],
	},
	{
		id: 'layout',
		checks: [
			{ at: 400, run: () => assertHas('demo layout', 'Layout primitives') },
			{ at: 400, run: () => assertHas('layout grid span', 'Sidebar') },
			// Attached-prop forwarding: the span cell must carry row/col/colSpan.
			{
				at: 450,
				run: () => {
					const span = collect(demosPage()).some(
						(v) => v.row === 1 && v.col === 0 && v.colSpan === 2,
					)

					console.log('[assert] grid attached props: ' + (span ? 'OK' : 'FAIL'))
				},
			},
			{ at: 450, run: () => assertHas('layout stack z-order', 'Top layer') },
			{ at: 450, run: () => assertHas('layout spacer footer', 'Footer') },
		],
	},
	{
		id: 'overlay',
		hold: 6800,
		checks: [
			// Overlay content mounts on the demos page's RootLayout — a
			// sibling inside the page tree.
			{
				at: 400,
				run: () => {
					const t = tapTargetForText(demosPage(), 'Toggle anchored popover')
					console.log('[probe] popover tap target: ' + (t ? t.constructor.name : 'none'))

					fireTap(t)
				},
			},
			{
				at: 500,
				run: () => assertMatch('useMeasure bounds', /Bounds \d+×\d+ @ \d+,\d+/),
			},
			{
				at: 900,
				run: () => {
					const hay = viewTexts(demosPage())
					const ok = hay.includes('Anchored to the button')
					console.log('[assert] popover anchored: ' + (ok ? 'OK' : 'FAIL') + dump(hay))
				},
			},
			// Toasts queue FIFO: bottom (2500ms) → top → anchored (1200ms).
			{ at: 1100, run: () => fireTap(tapTargetForText(demosPage(), 'Show toast')) },
			{ at: 1200, run: () => fireTap(tapTargetForText(demosPage(), 'Toast top')) },
			{ at: 1300, run: () => fireTap(tapTargetForText(demosPage(), 'Toast anchored')) },
			// Hoverable's touch contract is passthrough — the trigger renders
			// but long-press mounts nothing (pointer platforms own the card).
			{
				at: 1400,
				run: () => {
					const t = gestureTargetForText(demosPage(), 'Hoverable trigger', 64)
					const n = t ? fireLongPress(t) : 0
					console.log('[probe] hoverable longPress observers=' + n)
				},
			},
			{
				at: 1600,
				run: () => {
					const ok = viewTexts(demosPage()).includes('A toast from the demo')
					console.log('[assert] toast shows: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
			{
				at: 2200,
				run: () => {
					// Hoverable passes through on touch — the shared OverlayDemo
					// renders the trigger but never mounts a card. Presence is
					// informational — absence is expected, not a failure.
					const ok = viewTexts(demosPage()).includes('Hint card text')
					console.log(
						'[assert] hoverable card on long-press: ' + (ok ? 'OK' : 'INFO (passthrough on touch)'),
					)
				},
			},
			{ at: 2600, run: () => fireTap(tapTargetForText(demosPage(), 'Open shade overlay')) },
			{
				at: 3200,
				run: () => {
					const hay = viewTexts(demosPage())
					const ok = hay.includes('Overlay is open')
					console.log('[assert] overlay opens: ' + (ok ? 'OK' : 'FAIL') + dump(hay))
				},
			},
			{
				at: 4300,
				run: () => {
					const ok = viewTexts(demosPage()).includes('Top toast')
					console.log('[assert] toast position=top: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
			{
				at: 5600,
				run: () => {
					const ok = viewTexts(demosPage()).includes('Anchored toast')
					console.log('[assert] toast anchored: ' + (ok ? 'OK' : 'FAIL'))
				},
			},
		],
	},
	{
		id: 'components',
		checks: [
			{ at: 500, run: () => assertHas('demo components', 'Button') },
			{ at: 500, run: () => assertHas('components wayfinding', 'Wayfinding') },
			{ at: 500, run: () => assertHas('components data display', 'Data display') },
		],
	},
	{
		id: 'device',
		hold: 1800,
		checks: [
			{ at: 400, run: () => assertMatch('safe area insets', /top \d+ ·/) },
			{ at: 400, run: () => assertHas('drawer main', 'Main content') },
			{ at: 500, run: () => fireTap(tapTargetForText(demosPage(), 'Open drawer')) },
			{
				at: 1200,
				run: () => {
					const d = collect(demosPage()).find((v) => typeof v.isOpened === 'function')
					console.log('[assert] drawer opens: ' + (d?.isOpened?.('left') ? 'OK' : 'FAIL'))
				},
			},
		],
	},
	{
		id: 'modal',
		hold: 4000,
		checks: [
			// Presenter: nested 'demos' frame resolves its own page; fall back to
			// the root frame's current page in case topmost() resolves outermost.
			{ at: 400, run: () => fireTap(tapTargetForText(demosPage(), 'Open children modal')) },
			{
				at: 1000,
				run: () => {
					const m = demosPage()?.modal ?? Frame.topmost()?.currentPage?.modal
					const ok = m && viewTexts(m).includes('Declarative children')
					console.log('[assert] modal children: ' + (ok ? 'OK' : 'FAIL'))
					if (ok) {
						fireTap(tapTargetForText(m, 'Close modal'))
					}
				},
			},
			{ at: 1600, run: () => fireTap(tapTargetForText(demosPage(), 'Open imperative picker')) },
			{
				at: 2200,
				run: () => {
					const m = demosPage()?.modal ?? Frame.topmost()?.currentPage?.modal
					const ok = m && viewTexts(m).includes('Choose a color')
					console.log('[assert] imperative modal: ' + (ok ? 'OK' : 'FAIL'))
					if (ok) {
						fireTap(tapTargetForText(m, 'Red'))
					}
				},
			},
			// openModal resolves in the modal's onClosed — after the dismiss
			// transition (~300ms) + promise tick, so read well after the tap.
			{ at: 3600, run: () => assertHas('modal result', 'Picked: Red') },
		],
	},
	{
		// Flex/text divergence probes — measured, not text-matched. The goal
		// is documented, comparable numbers for web↔native reasoning; FAILs
		// here mark real divergences the framework should absorb.
		id: 'divergence',
		checks: [
			{
				at: 900,
				run: () => {
					const m = (id: string) => {
						const v = collect(demosPage()).find((x) => x.id === id)
						if (!v) {
							return null
						}

						const s = v.getActualSize?.() ?? {}
						const p = v.getLocationOnScreen?.() ?? {}
						return {
							w: Math.round(s.width ?? -1),
							h: Math.round(s.height ?? -1),
							x: Math.round(p.x ?? -1),
							y: Math.round(p.y ?? -1),
						}
					}

					for (const id of [
						'dv-grow',
						'dv-grow-fill',
						'dv-lh',
						'dv-lh2',
						'dv-auto',
						'dv-auto-fix',
						'dv-wide',
						'dv-sib',
						'dv-wide-fix',
						'dv-sib-fix',
						'dv-collapse-row',
						'dv-coll-avatar',
						'dv-coll-body',
						'dv-coll-text',
						'dv-coll-actions',
						'dv-collapse-allgrow',
						'dv-ag-text',
					]) {
						const r = m(id)
						console.log('[probe] ' + id + ' ' + (r ? `${r.w}x${r.h}@${r.x},${r.y}` : 'MISSING'))
					}

					const collText = m('dv-coll-text')
					console.log(
						'[assert] Text wraps by default: ' +
							(collText && collText.h >= 30 ? 'OK' : 'FAIL') +
							(collText ? ` (${collText.h})` : ''),
					)

					const agRow = m('dv-collapse-allgrow')
					console.log(
						'[assert] auto-height grow row keeps content height: ' +
							(agRow && agRow.h >= 40 ? 'OK' : 'FAIL') +
							(agRow ? ` (${agRow.h})` : ''),
					)

					const grow = m('dv-grow-fill')
					console.log(
						'[assert] grow child keeps height: ' +
							(grow && grow.h >= 40 ? 'OK' : 'FAIL') +
							(grow ? ` (${grow.h})` : ''),
					)

					// The shared `* {flex-shrink:0}` normalization (RN semantics)
					// keeps the fixed sibling at 88 in BOTH rows — the `shrink` +
					// `min-w-0` opt-in on the fix row is what lets the wide text
					// compress instead of overflowing.
					const sib = m('dv-sib')
					console.log(
						'[assert] default shrink-0 keeps fixed sibling: ' +
							(sib && sib.w >= 88 ? 'OK' : 'FAIL') +
							(sib ? ` (${sib.w}@${sib.x})` : ''),
					)

					const sibFix = m('dv-sib-fix')
					console.log(
						'[assert] shrink+min-w-0 row keeps fixed sibling: ' +
							(sibFix && sibFix.w >= 88 ? 'OK' : 'FAIL') +
							(sibFix ? ` (${sibFix.w}@${sibFix.x})` : ''),
					)

					const wide = m('dv-wide')
					const wideFix = m('dv-wide-fix')
					// iOS quirk: the shrink pass re-measures the child at the
					// compressed spec (the text re-wraps taller) but the laid-out
					// frame keeps the natural width — the height delta is the
					// observable signal that shrink engaged.
					console.log(
						'[assert] shrink opt-in compresses grow child: ' +
							(wide && wideFix && wideFix.h > wide.h ? 'OK' : 'FAIL') +
							(wide && wideFix ? ` (h ${wideFix.h} vs ${wide.h})` : ''),
					)

					// Diagnostic — read the computed flexShrink off the views to
					// tell a missing class application apart from a measure bug.
					const fs = (id: string) => {
						const v = collect(demosPage()).find((x) => x.id === id)
						return v ? String(v.flexShrink ?? v.style?.flexShrink) : 'MISSING'
					}

					console.log(
						`[probe] flexShrink dv-wide=${fs('dv-wide')} dv-wide-fix=${fs('dv-wide-fix')} dv-sib=${fs('dv-sib')} grow-fill=${fs('dv-grow-fill')}`,
					)

					// Real divergence: auto margins are ignored on native — the
					// build warns; this stays FAIL until a shim exists.
					const auto = m('dv-auto')
					console.log(
						'[assert] margin-left:auto pushes trail right: ' +
							(auto && auto.x > 200 ? 'OK' : 'FAIL') +
							(auto ? ` (x=${auto.x})` : ''),
					)

					// justifyContent prop is the portable path — it must push the
					// trailing item right on native the same as web.
					const autoFix = m('dv-auto-fix')
					console.log(
						'[assert] justifyContent=space-between pushes trail right: ' +
							(autoFix && autoFix.x > 200 ? 'OK' : 'FAIL') +
							(autoFix ? ` (x=${autoFix.x})` : ''),
					)
				},
			},
		],
	},
	{
		id: 'props',
		checks: [
			{ at: 400, run: () => assertHas('demo props', 'Input is editable') },
			{
				at: 450,
				run: () => {
					const sec = collect(demosPage()).some((v) => v.secure === true)
					console.log('[assert] secure input: ' + (sec ? 'OK' : 'FAIL'))
				},
			},
			{ at: 550, run: () => fireTap(tapTargetForText(demosPage(), 'Press, hold, or double tap')) },
			{ at: 950, run: () => assertHas('press state', 'Pressed') },
			{
				at: 1000,
				run: () => {
					const b = collect(demosPage()).find((v) => v.accessibilityLabel === 'Save profile')
					console.log(
						'[assert] a11y hint+value: ' +
							(b?.accessibilityHint === 'Saves the current profile details' &&
							b?.accessibilityValue === 'Ready to save'
								? 'OK'
								: 'FAIL'),
					)
				},
			},
		],
	},
	{
		// Pan isn't a notify()-able event — drive the pan observer's callback
		// directly (fireTap's idiom for GestureTypes.pan=8), with the payload
		// shape the leaf's usePan consumes: {state:int, deltaX, deltaY, view}.
		// GestureStateTypes: cancelled=0, began=1, changed=2, ended=3.
		id: 'reorder',
		hold: 2600,
		checks: [
			{ at: 400, run: () => assertHas('demo reorder', 'Neon Coastline') },
			{
				at: 600,
				run: () => {
					const row: any = find('reorder-a')
					const obs = row?.getGestureObservers?.(8) ?? []
					console.log('[probe] reorder-a pan observers=' + obs.length)
					for (const o of obs) {
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 1,
							deltaX: 0,
							deltaY: 0,
						})

						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 2,
							deltaX: 0,
							deltaY: 90,
						})
					}
				},
			},
			{
				at: 900,
				run: () => {
					const row: any = find('reorder-a')
					console.log(
						'[assert] pan translates row: ' +
							(row?.translateY === 90 ? 'OK' : 'FAIL (' + row?.translateY + ')'),
					)

					console.log(
						'[assert] drag lifts z-index: ' +
							(row?.style?.zIndex === 1 ? 'OK' : 'FAIL (' + row?.style?.zIndex + ')') +
							' layer.zPosition=' +
							row?.nativeViewProtected?.layer?.zPosition,
					)

					// Pitch is row height (52) + gap (8) = 60 dips; dy=90 → hover=2,
					// so the two rows the drag crossed each shift up one slot.
					const b: any = find('reorder-b')
					console.log(
						'[assert] sibling makes room: ' +
							(b?.translateY === -60 ? 'OK' : 'FAIL (' + b?.translateY + ')'),
					)
				},
			},
			{
				at: 950,
				run: () => {
					const row: any = find('reorder-a')
					const obs = row?.getGestureObservers?.(8) ?? []
					for (const o of obs) {
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 3,
							deltaX: 0,
							deltaY: 90,
						})
					}
				},
			},
			{
				at: 1500,
				run: () => {
					const order = collect(demosPage())
						.filter((v) => typeof v?.id === 'string' && v.id.startsWith('reorder-'))
						.map((v) => v.id)

					console.log(
						'[assert] drop commits reorder: ' +
							(order[0] === 'reorder-b' && order[2] === 'reorder-a'
								? 'OK'
								: 'FAIL (' + JSON.stringify(order) + ')'),
					)

					const row: any = find('reorder-a')
					console.log(
						'[assert] shifts cleared on drop: ' +
							(row?.translateY === 0 && row?.style?.zIndex !== 1 ? 'OK' : 'FAIL'),
					)
				},
			},
			// Cancelled gesture: began+moved then state:0 — no commit, shifts
			// restore.
			{
				at: 1700,
				run: () => {
					const row: any = find('reorder-b')
					const obs = row?.getGestureObservers?.(8) ?? []
					for (const o of obs) {
						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 1,
							deltaX: 0,
							deltaY: 0,
						})

						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 2,
							deltaX: 0,
							deltaY: -80,
						})

						o.callback.call(o.context, {
							eventName: 'pan',
							object: row,
							view: row,
							state: 0,
							deltaX: 0,
							deltaY: -80,
						})
					}
				},
			},
			{
				at: 2200,
				run: () => {
					const order = collect(demosPage())
						.filter((v) => typeof v?.id === 'string' && v.id.startsWith('reorder-'))
						.map((v) => v.id)

					const row: any = find('reorder-b')
					console.log(
						'[assert] cancelled pan restores order+shifts: ' +
							(order[0] === 'reorder-b' && row?.translateY === 0 ? 'OK' : 'FAIL'),
					)
				},
			},
		],
	},
	{
		id: 'glass',
		checks: [
			{
				at: 800,
				run: () => {
					// The LiquidGlass leaf's root IS a UIVisualEffectView —
					// identity-check proves registerElement + host swap worked
					// (the glass material itself is a visual, not assertable).
					const EffectView = (globalThis as any).UIVisualEffectView
					const lg = find('glass-regular')
					const lgc = find('glass-container')

					console.log(
						'[assert] liquidglass root is UIVisualEffectView: ' +
							(lg && EffectView && lg.nativeViewProtected instanceof EffectView ? 'OK' : 'FAIL'),
					)

					console.log(
						'[assert] liquidglasscontainer root is UIVisualEffectView: ' +
							(lgc && EffectView && lgc.nativeViewProtected instanceof EffectView ? 'OK' : 'FAIL'),
					)

					// iOS 26+: the effect objects themselves are live —
					// UIGlassEffect on the layout, UIGlassContainerEffect on
					// the merged region. On <26 these read plain UIVisualEffect.
					console.log(
						'[assert] liquidglass carries UIGlassEffect: ' +
							(lg?.nativeViewProtected?.effect?.constructor?.name === 'UIGlassEffect'
								? 'OK'
								: 'FAIL (' + lg?.nativeViewProtected?.effect?.constructor?.name + ')'),
					)

					console.log(
						'[assert] container carries UIGlassContainerEffect: ' +
							(lgc?.nativeViewProtected?.effect?.constructor?.name === 'UIGlassContainerEffect'
								? 'OK'
								: 'FAIL (' + lgc?.nativeViewProtected?.effect?.constructor?.name + ')'),
					)

					// The `glass` prop writes iosGlassEffect on the host — config
					// object round-trips through the Property setter.
					const prop: any = find('glass-prop')

					console.log(
						'[assert] glass prop sets iosGlassEffect: ' +
							(prop?.iosGlassEffect?.variant === 'regular' ? 'OK' : 'FAIL'),
					)
				},
			},
		],
	},
	// Controls last: pushing it currently wedges the JS loop (infinite
	// microtask drain — under investigation), so it sits at the end where
	// it can't starve the rest of the sweep.
	{
		id: 'controls',
		checks: [
			{ at: 400, run: () => assertMatch('demo controls', /Slider:\s*\d+/) },
			{ at: 400, run: () => assertHas('heading levels', 'Heading 6') },
			{
				at: 600,
				run: () => {
					const svgs = collect(demosPage()).filter((v) => v?.constructor?.name === 'SVGView')

					const sized = svgs.filter((v) => {
						const s = v.getActualSize?.() ?? {}
						return (s.width ?? 0) > 0 && (s.height ?? 0) > 0
					})

					console.log(
						'[assert] icon svgview glyphs: ' +
							(svgs.length >= 2 && sized.length === svgs.length ? 'OK' : 'FAIL') +
							` (${svgs.length} svgview, ${sized.length} sized)`,
					)
				},
			},
		],
	},
]

/** Poll until `cond` or give up (~2s), then continue. Nested-frame push/pop
 *  transitions update frame.currentPage asynchronously — fixed offsets
 *  race them. */
function waitFor(cond: () => boolean, then: () => void, tries = 20) {
	const tick = () => {
		if (cond() || --tries <= 0) {
			then()
		} else {
			setTimeout(tick, 100)
		}
	}

	tick()
}

let galleryPage: any = null

// Shared Tabs is self-drawn (decision #44) — tab switching is a Pressable
// tap, not a `selectedIndexChanged` notify, and the non-active pane is
// unmounted. `selectTab` taps the tab chip so the stack's page exists
// before its chips are probed.
const TAB_LABEL: Record<string, string> = { demos: 'Apps', test: 'Test' }
function selectTab(stack: string) {
	const root = getStack('root')?.currentPage
	const target = tapTargetForText(root, TAB_LABEL[stack])
	if (!target) {
		console.log('[sweep] selectTab ' + stack + ' — no tap target for "' + TAB_LABEL[stack] + '"')
		return
	}

	fireTap(target)
}

if (!SKIP && !VIRTUAL_LIST_BENCH_MODE) {
	setTimeout(() => {
		selectTab('demos')
	}, 9600)

	// Poll for the frame's default page AND its first chip's views — pane
	// attach + first-navigation + native-attach latency can run seconds
	// past the CORE trace; pushing while appearance is still settling
	// stalls bookkeeping (setCurrent) and leaves chips without observers.
	setTimeout(() => {
		waitFor(
			() => {
				const chip = find('menu-counter')
				// A dead gallery twin (unloaded subtree) satisfies getViewById
				// but can never take a real tap — wait for the live one.
				return demosPage() != null && chip != null && chip.isLoaded !== false
			},
			() => {
				galleryPage = demosPage()
				console.log(
					'[sweep] demos stack=' +
						(getStack('demos') ? 'frame' : 'swap-pane') +
						' gallery=' +
						(galleryPage ? galleryPage.constructor.name : 'none'),
				)

				setTimeout(() => runStep(0), 400)
			},
			60,
		)
	}, 9600)
}

if (SKIP && !VIRTUAL_LIST_BENCH_MODE) {
	setTimeout(() => {
		// The Android route probe intentionally finishes on a root-level demo.
		// Return to the tab shell before opening the Apps pane's swap-pane route.
		if (routeFor('root') != null) {
			goBack()
		}

		waitFor(
			() => routeFor('root') == null,
			() => {
				if (routeFor('root') != null) {
					console.log('[assert] Android VirtualList returned to tab shell: FAIL')
					return
				}

				console.log('[assert] Android VirtualList returned to tab shell: OK')
				selectTab('demos')
				waitFor(
					() => {
						const chip = findInRootLayouts('menu-vlist')
						return chip != null && chip.isLoaded !== false
					},
					() => {
						stepStack = 'demos'
						const chip = findInRootLayouts('menu-vlist')
						if (!chip || chip.isLoaded === false) {
							console.log('[assert] Android VirtualList gallery chip: FAIL')
							return
						}

						navigate('demo/:id', { id: 'vlist' }, { into: 'demos' })
						waitFor(
							() => routeFor('demos')?.params?.id === 'vlist' && find('vlist') != null,
							() => {
								const routeOk = routeFor('demos')?.params?.id === 'vlist'
								const list: any = find('vlist')
								const mounted = list
									? collect(list).filter((view) =>
											String(view.className ?? '')
												.split(/\s+/)
												.includes('vx-virtual-list-row'),
										)
									: []

								console.log(
									'[assert] Android VirtualList route renders: ' + (routeOk ? 'OK' : 'FAIL'),
								)

								console.log(
									'[assert] VirtualList bounds mounted rows: ' +
										(mounted.length > 0 && mounted.length < 40 ? 'OK' : 'FAIL') +
										' (' +
										mounted.length +
										'/500)',
								)

								if (list) {
									runVirtualListStateProbe()
								}
							},
							80,
						)
					},
					80,
				)
			},
			100,
		)
	}, 60_000)
}

// Android leaf probes — the catalog sweep is gated off on Android, so the
// richtext (Aztec) and tiptap-facade proofs get explicit swap-pane visits.
// Scheduled early: the later steps hand the app to external activities
// (camera intent, WebView renderer) and a backgrounded process may never
// come back on an emulator.
if (SKIP && !VIRTUAL_LIST_BENCH_MODE) {
	setTimeout(runAndroidLeafProbes, 30_000)
}

function runAndroidLeafProbes() {
	stepStack = 'test'
	selectTab('test')
	waitFor(
		() => {
			const chip = findInRootLayouts('menu-richtext-editor')
			return chip != null && chip.isLoaded !== false
		},
		() => {
			navigate('demo/:id', { id: 'richtext-editor' }, { into: 'test' })
			waitFor(
				() => routeFor('test')?.params?.id === 'richtext-editor',
				() => setTimeout(probeAztecLeaf, 1200),
				80,
			)
		},
		80,
	)
}

function probeAztecLeaf() {
	const el: any = findInRootLayouts('richtext-editor') ?? find('richtext-editor')
	const aztec = el?.nativeView ?? el?.android
	console.log('[assert] Android Aztec leaf mounts: ' + (aztec ? 'OK' : 'FAIL'))
	assertMatch('richtext editor status', /ready/)

	const text = aztec?.getText?.()?.toString?.() ?? ''
	console.log(
		'[assert] Android Aztec renders initial HTML: ' +
			(text.includes('WordPress Aztec') && text.includes('first item') ? 'OK' : 'FAIL') +
			' (' +
			text.length +
			' chars)',
	)

	if (!aztec) {
		return
	}

	const len = aztec.getText().length()
	aztec.setSelection(0, len)
	const FORMAT_BOLD = (globalThis as any).org.wordpress.aztec.AztecTextFormat.FORMAT_BOLD
	aztec.toggleFormatting(FORMAT_BOLD)
	const styles = aztec.getAppliedStyles(0, len)
	let bold = false
	for (let i = 0; i < (styles?.size?.() ?? 0); i++) {
		if (styles.get(i) === FORMAT_BOLD) {
			bold = true
		}
	}

	console.log('[assert] Android Aztec toggleFormatting applies bold: ' + (bold ? 'OK' : 'FAIL'))

	// Aztec's undo stack only batches keyboard-driven input — neither format
	// toggles nor programmatic edits register. Probe is informational: the
	// sweep documents what undo covers instead of asserting a revert it
	// cannot produce.
	const beforeInsert = aztec.getText().length()
	aztec.getText().insert(beforeInsert, '!')

	const grew = aztec.getText().length() === beforeInsert + 1
	console.log('[assert] Android Aztec programmatic insert edits text: ' + (grew ? 'OK' : 'FAIL'))

	aztec.undo()
	console.log(
		'[probe] Android Aztec undo() ran; length ' +
			aztec.getText().length() +
			' (was ' +
			beforeInsert +
			' — keyboard-only history on this backend)',
	)

	navigate('demo/:id', { id: 'tiptap-editor' }, { into: 'test' })
	waitFor(
		() => routeFor('test')?.params?.id === 'tiptap-editor',
		() => setTimeout(probeTiptapFacade, 3000),
		80,
	)
}

function probeTiptapFacade() {
	assertMatch('tiptap facade status', /ready/)
	const hay = viewTexts(demosPage())
	const jsonOk = hay.some((t) => t.includes('json ok'))
	console.log('[assert] Android tiptap facade json bridge: ' + (jsonOk ? 'OK' : 'FAIL') + dump(hay))

	navigate('demo/:id', { id: 'lexical-probe' }, { into: 'test' })
	waitFor(
		() => routeFor('test')?.params?.id === 'lexical-probe',
		() => setTimeout(probeLexicalImports, 4500),
		80,
	)
}

function probeLexicalImports() {
	assertMatch('lexical probe pass', /probe \d+\/\d+ PASS/)
}

function runStep(i: number) {
	if (i >= STEPS.length) {
		console.log('[sweep] done')

		// Parity step waits on this — a root push mid-sweep corrupts the
		// sweep's page lookups. The paritysweep module registers the slot.
		;(globalThis as any).__xplatSweepDone?.()

		return
	}

	const step = STEPS[i]
	stepStack = stackFor(step.id)

	// The swap-pane Tabs unmounts the non-active stack's page — select the
	// tab for this step's stack and poll until its gallery + chip are live.
	selectTab(stepStack)
	waitFor(
		() => {
			const chip = find('menu-' + step.id)
			return demosPage() != null && chip != null && chip.isLoaded !== false
		},
		() => runStepBody(step, i),
		30,
	)
}

function runStepBody(step: Step, i: number) {
	const chip = find('menu-' + step.id)
	// Hit-area probe: a view drawn outside its parent's bounds still renders
	// (iOS doesn't clip by default) but hitTest never reaches it — the
	// candidate mechanism for chips that highlight yet never fire onPress.
	// loaded=false marks the JS view as dead (recognizers detached).
	let chipInfo = ''
	if (chip) {
		const cSize = (chip as any).getActualSize?.()
		const pSize = (chip.parent as any)?.getActualSize?.()
		const rel = (chip as any).getLocationRelativeTo?.(chip.parent)
		const outOfParent =
			rel && pSize && cSize
				? rel.x < -1 ||
					rel.y < -1 ||
					rel.x + cSize.width > pSize.width + 1 ||
					rel.y + cSize.height > pSize.height + 1
				: 'n/a'

		chipInfo = ' loaded=' + chip.isLoaded + ' outOfParent=' + outOfParent
	}

	console.log(
		'[sweep] menu-' +
			step.id +
			' stack=' +
			stepStack +
			' tap observers=' +
			fireTap(chip) +
			chipInfo,
	)

	waitFor(
		() => pushedRoute() != null,
		() => {
			console.log('[sweep] pushed ' + step.id + ' — ' + JSON.stringify(pushedRoute()?.params))
			for (const c of step.checks) {
				setTimeout(c.run, c.at)
			}

			setTimeout(() => {
				console.log('[sweep] goBack ' + step.id)
				goBack({ into: stepStack })
				waitFor(
					() => pushedRoute() == null,
					() => {
						// The route store pops before the pane subtree detaches —
						// read the gallery a beat later or its texts still show
						// the outgoing demo.
						setTimeout(() => {
							// 'Last opened' echo lives on the Apps Gallery only —
							// proof steps land on the Test pane's proof row instead.
							assertHas(
								'lastDemo ' + step.id,
								stepStack === 'test' ? 'Seam proofs' : 'Last opened: ' + step.id,
							)
						}, 250)

						setTimeout(() => runStep(i + 1), 400)
					},
				)
			}, step.hold ?? 900)
		},
		Application.android != null ? 100 : 20,
	)
}
