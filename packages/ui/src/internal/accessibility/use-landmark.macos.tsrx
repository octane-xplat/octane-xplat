import { useCallback, useEffect, useRef } from 'octane'
import type { UseLandmarkOptions, LandmarkProps } from './use-landmark.tsrx'
import { createAppKitLandmarks } from './landmark-state.macos'
import { appKitFocusBoundary } from '../../components/overlays/FocusScope.macos.tsrx'
import type { NSView } from '@octane-xplat/platform/macos'
export type { UseLandmarkOptions, LandmarkProps } from './use-landmark.tsrx'
const landmarks = createAppKitLandmarks(appKitFocusBoundary)
const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot
hot?.dispose(() => landmarks.dispose())

/** Experimental native F6 region cycling; semantic props remain available without the bridge. */
export function useLandmark(options: UseLandmarkOptions): { landmarkProps: LandmarkProps } {
	const release = useRef<(() => void) | undefined>(undefined), current = useRef<NSView | null>(null)
	const ref = useCallback((view: NSView | null) => {
		if (view === current.current) return
		const previous = release.current; release.current = undefined; current.current = view
		previous?.()
		if (view) release.current = landmarks.register(view)
	}, [])
	useEffect(() => () => { const previous = release.current; release.current = undefined; current.current = null; previous?.() }, [])
	return { landmarkProps: { accessibilityRole: options.role, accessibilityLabel: options.label, ref } }
}
