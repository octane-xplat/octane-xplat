/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useContext } from 'octane';
import { GridLayout, isAndroid, isIOS } from '@nativescript/core';
import type { RootLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { ShowToastFn, ToastDismissFn, ToastEntry, ToastOptions, ToastPosition } from './props';
import { ToastViewportContext } from './toast-context';
import { dismissToast, pushToast, toastStore, toastTiming } from './toast-store';
import { topRootLayout } from './root-layout';
import { applyThemeClasses } from './theme/theme-scheme';
import { Popover } from './Popover';
import { Toast } from './Toast';

/** Edge gap + inter-toast gap in dips. */
const EDGE_GAP = 16;
const STACK_GAP = 8;

interface ToastHost {
	host: GridLayout
	root: any
	timer: ReturnType<typeof setTimeout> | null
	unbindTheme: () => void
	position: ToastPosition
	rl: RootLayout
	closing: boolean
}

/** A viewport's registration — its declaring RootLayout hosts the toasts
 *  routed to it. Written by `ToastViewport` (toast-viewport.tsrx). */
interface NativeViewport {
	rl: RootLayout
	position: ToastPosition
	maxVisible: number
}

const nativeViewports = new Map<string, NativeViewport>()
const hosts = new Map<string, ToastHost>()
let syncing = false
let storeSubscribed = false

export function registerNativeToastViewport(
	id: string,
	viewport: NativeViewport,
): () => void {
	nativeViewports.set(id, viewport)
	sync()
	return () => {
		nativeViewports.delete(id)
		// Entries routed here orphan to the fallback (top RootLayout).
		sync()
	}
}

const positionFor = (entry: ToastEntry): ToastPosition =>
	entry.options.position ??
	(entry.viewportId ? nativeViewports.get(entry.viewportId)?.position : undefined) ??
	'bottomEnd'

const rootLayoutFor = (entry: ToastEntry): RootLayout | undefined =>
	(entry.viewportId ? nativeViewports.get(entry.viewportId)?.rl : undefined) ?? topRootLayout()

const maxVisibleFor = (entry: ToastEntry): number =>
	(entry.viewportId ? nativeViewports.get(entry.viewportId)?.maxVisible : undefined) ?? 5

/** Hosts for one RootLayout+edge bucket, oldest → newest. Newest sits at
 *  the edge; earlier entries offset inward by the newer entries' measured
 *  heights. */
function relayoutBucket(bucket: ToastEntry[]) {
	const rlEntries = bucket
		.map((e) => ({ entry: e, host: hosts.get(e.id) }))
		.filter((x): x is { entry: ToastEntry; host: ToastHost } => x.host != null)

	let offset = 0
	for (let i = rlEntries.length - 1; i >= 0; i--) {
		const { host } = rlEntries[i]
		const top = host.position.startsWith('top')
		const margin = EDGE_GAP + offset
		if (top) {
			host.host.marginTop = margin
		} else {
			host.host.marginBottom = margin
		}

		offset += (host.host.getActualSize?.().height || 0) + STACK_GAP
	}
}

function detach(entry: ToastEntry) {
	const cur = hosts.get(entry.id)
	if (!cur) return
	hosts.delete(entry.id)
	if (cur.timer) clearTimeout(cur.timer)
	cur.unbindTheme()
	cur.root.unmount?.()
	const owner = cur.host.parent as any
	if (owner?.hasChild?.(cur.host)) {
		if (typeof owner.getPopupIndex === 'function' && owner.getPopupIndex(cur.host) === -1) {
			owner.removeChild?.(cur.host)
		} else if (!cur.closing) {
			cur.closing = true

			;(owner.close?.(cur.host) as Promise<unknown> | undefined)?.catch((error: unknown) => {
				console.error('[Toast] close failed', error)
				if (owner.hasChild?.(cur.host)) owner.removeChild?.(cur.host)
			})
		}
	}

	syncBuckets()
}

/** Recompute bucket margins for every live host (a toast measuring in or
 *  leaving shifts the rest). */
function syncBuckets() {
	const list = toastStore.get()
	const groups = new Map<string, ToastEntry[]>()
	for (const e of list) {
		const host = hosts.get(e.id)
		if (!host) continue
		const key = `${host.rl}:${positionFor(e)}`
		const bucket = groups.get(key) ?? []
		bucket.push(e)
		groups.set(key, bucket)
	}

	for (const bucket of groups.values()) relayoutBucket(bucket)
}

function mount(entry: ToastEntry) {
	const rl = rootLayoutFor(entry)
	if (!rl) {
		console.warn('[Toast] RootLayout is not mounted; toast was skipped')
		return
	}

	const position = positionFor(entry)
	const top = position.startsWith('top')
	const host = new GridLayout()
	const unbindTheme = applyThemeClasses(host, 'vx-toast-host')
	host.horizontalAlignment = position.endsWith('Start') ? 'left' : 'right'
	host.verticalAlignment = top ? 'top' : 'bottom'
	if (top) {
		host.marginTop = EDGE_GAP
	} else {
		host.marginBottom = EDGE_GAP
	}

	Object.assign(host, isIOS ? entry.options.ios : isAndroid ? entry.options.android : undefined)

	const root = createNativeScriptRoot(host)
	const rec: ToastHost = { host, root, timer: null, unbindTheme, position, rl, closing: false }
	hosts.set(entry.id, rec)
	// 'closed' marks RootLayout-side removal already in flight — detach
	// must not re-enter close(). There is no scrim dismissal for toasts.

	const timing = toastTiming(entry.options)
	if (timing.isAutoHide) {
		rec.timer = setTimeout(() => dismissToast(entry.id, 'auto'), timing.autoHideDuration)
	}

	root.render(ToastEntryView as unknown as UniversalComponent, { entry })

	host.on('layoutChanged', () => syncBuckets())

	rl.open(host).catch((error: unknown) => {
		console.error('[Toast] open failed', error)
		detach(entry)
		dismissToast(entry.id, 'manual')
	})
}

/** Reconcile per-toast hosts with the store: mount visible newcomers,
 *  re-render the rest so `exiting` reaches the card, unmount entries that
 *  left the store or fell outside their bucket's `maxVisible` window
 *  (they resurface when the stack drains — upstream parity). */
export function sync() {
	if (syncing) return
	syncing = true
	try {
		const list = toastStore.get()

		// The visible window per (RootLayout, edge) bucket: the last
		// `maxVisible` entries, counted per entry's own viewport limit.
		const visible = new Set<string>()
		const buckets = new Map<string, ToastEntry[]>()
		for (const e of list) {
			const key = `${rootLayoutFor(e) ?? ''}:${positionFor(e)}:${e.options.anchor ? 'a' : ''}`
			const bucket = buckets.get(key) ?? []
			bucket.push(e)
			buckets.set(key, bucket)
		}

		for (const bucket of buckets.values()) {
			for (let i = 0; i < bucket.length; i++) {
				if (i >= bucket.length - maxVisibleFor(bucket[i])) {
					visible.add(bucket[i].id)
				}
			}
		}

		for (const entry of list) {
			const cur = hosts.get(entry.id)
			if (!visible.has(entry.id)) {
				if (cur) detach(entry)
				continue
			}

			if (cur) {
				cur.root.render(ToastEntryView as unknown as UniversalComponent, { entry })
				continue
			}

			mount(entry)
		}

		for (const id of [...hosts.keys()]) {
			if (!list.some((e) => e.id === id)) {
				detach({ id, options: {} })
			}
		}

		syncBuckets()
	} finally {
		syncing = false
	}
}

/** The mounted card for one entry — the component identity the root
 *  re-renders against. (Top-level so a store update re-renders it.) */
function ToastEntryView(props: { entry: ToastEntry }) @{
	const entry = props.entry
	const top = positionFor(entry).startsWith('top')
	const anchored = entry.options.anchor != null

	@if (anchored) {
		<Popover
			open={!entry.exiting}
			anchor={entry.options.anchor!}
			placement={entry.options.placement ?? (top ? 'top' : 'bottom')}
			dismissOnOutsideTap={false}
			onDismiss={() => dismissToast(entry.id, 'manual')}
		>
			<Toast
				type={entry.options.type ?? 'info'}
				body={entry.options.body}
				endContent={entry.options.endContent}
				renderContent={entry.options.renderContent}
				isExiting={entry.exiting}
				onDismiss={(reason: 'auto' | 'manual') => dismissToast(entry.id, reason)}
			/>
		</Popover>
	} @else {
		<Toast
			type={entry.options.type ?? 'info'}
			body={entry.options.body}
			endContent={entry.options.endContent}
			renderContent={entry.options.renderContent}
			isExiting={entry.exiting}
			onDismiss={(reason: 'auto' | 'manual') => dismissToast(entry.id, reason)}
		/>
	}
}

function ensureSubscribed() {
	if (storeSubscribed) return
	storeSubscribed = true
	toastStore.subscribe(sync)
}

function show(options: ToastOptions, viewportId?: string): ToastDismissFn {
	ensureSubscribed()
	const id = pushToast(options, viewportId)
	sync()
	return () => dismissToast(id, 'manual')
}

/** Module-level toast (Astryx `useToast` fallback path as a function):
 *  lands on the current top RootLayout's edge stack. Returns the toast's
 *  dismiss function. */
export const showToast: ShowToastFn = (options) => show(options, undefined)

/** Imperative toast control (Astryx `useToast`), native leaf. Inside a
 *  `ToastViewport` toasts dock on that viewport's RootLayout at its
 *  configured edge; outside one they land on the top RootLayout stack. */
export function useToast(): ShowToastFn {
	const ctx = useContext(ToastViewportContext)
	return useCallback((options: ToastOptions) => show(options, ctx?.id), [ctx?.id])
}
