/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useMemo, useState } from 'octane'
import type { OutlineFromViewCapabilities, OutlineItem } from '../../props'
import { appKitHost } from '../../internal/platform/host-bridge'
import { appKitOutlineRoot, createAppKitOutlineSnapshot } from './outline-snapshot.macos'

/** Renderer-backed snapshot discovery. Older/missing hosts remain explicit. */
export function getOutlineFromViewCapabilities(): OutlineFromViewCapabilities {
	const isSupported = typeof appKitHost()?.readOutlineHeadings === 'function'
	return { isSupported, mode: isSupported ? 'snapshot' : 'unsupported' }
}

/** Collect after the bound native root changes on a render. Accept a native
 * root, ref object or ScrollableArea handle. This does not observe mutations;
 * use portable document data for dynamic contents. Navigation is separate. */
export function useOutlineFromView(containerRef?: unknown): OutlineItem[] {
	const [items, setItems] = useState<OutlineItem[]>([])
	const snapshot = useMemo(() => createAppKitOutlineSnapshot(), [])
	useEffect(() => {
		const host = appKitHost(), reader = host?.readOutlineHeadings
		const next = snapshot.read(appKitOutlineRoot(containerRef), typeof reader === 'function' ? reader : undefined)
		if (next !== items) setItems(next)
	})
	return items
}
