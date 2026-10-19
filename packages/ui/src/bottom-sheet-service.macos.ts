import { type ContentOwner } from './owned-content'
import { appKitHost, hostGlobal } from './host-bridge'
import { ImperativeSheetPanel } from './bottom-sheet-panel.macos.tsrx'
import type {
	BottomSheetHandle,
	BottomSheetOpenOptions,
	ModalOpenResult,
	OpenBottomSheet,
} from './props'

interface ActiveSheet {
	controller?: { close(): void; closedPromise: Promise<unknown> }
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

export function closeBottomSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** Dedicated root in the key window's bottom-docked AppKit surface. */
export const openBottomSheet: OpenBottomSheet = (Component, params, options) =>
	openBottomSheetWithOwner(null, Component, params, options)

/** Internal presenter shared by standalone services and declaring-tree outlets. */
export function openBottomSheetWithOwner(
	owner: ContentOwner | null,
	...[Component, params, options = {}]: Parameters<OpenBottomSheet>
): BottomSheetHandle {
	if (owner?.disposed) {
		return Object.assign(Promise.reject(new Error('The content outlet has been removed')), {
			close() {},
		}) as BottomSheetHandle
	}

	let closeSheet: ((result?: ModalOpenResult) => void) | undefined
	const handle = new Promise<ModalOpenResult>((resolve, reject) => {
		let finished = false
		const entry: ActiveSheet = {
			finish(result) {
				if (finished) {
					return
				}

				finished = true
				active.delete(entry)
				try {
					entry.controller?.close()
				} finally {
					resolve(result)
				}
			},
		}

		active.add(entry)
		closeSheet = entry.finish
		try {
			const present = appKitHost()?.presentSurface
			if (!present) {
				throw new Error('AppKit host has no shared sheet presenter')
			}

			entry.controller = present({
				owner: owner?.host,
				createContentRoot: owner
					? (host: unknown) => owner.createRoot(host, () => entry.finish())
					: undefined,
				kind: 'sheet',
				modal: options.hasScrim ?? true,
				snapPoints: options.snapPoints,
				label: options.label ?? 'Sheet',
				component: ImperativeSheetPanel,
				props: { component: Component, params, close: entry.finish },
				onDismiss: () => entry.finish('closed'),
			})

			// Content can close synchronously during its first render.
			if (finished) {
				entry.controller?.close()
			}

			void entry.controller?.closedPromise.then(() => entry.finish('closed'))
		} catch (error) {
			active.delete(entry)
			entry.controller?.close()
			reject(error)
		}
	}) as BottomSheetHandle

	handle.close = (result?: ModalOpenResult) => closeSheet?.(result)
	return handle
}

export function bottomSheetHost(): null {
	return null
}
