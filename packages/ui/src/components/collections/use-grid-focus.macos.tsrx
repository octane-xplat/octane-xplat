/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useLayoutEffect, useMemo, useRef, useState } from 'octane'
import { createAppKitGridCellFocus } from './grid-cell-focus.macos'
import type { GridFocusOptions, GridFocusResult } from './use-grid-focus'
export type { GridFocusOptions, GridFocusResult } from './use-grid-focus'

/** Native marked-cell navigation. Source implementation; OS input remains unqualified. */
export function useGridFocus<T = NSView>(options: GridFocusOptions): GridFocusResult<T> {
	const ref = useRef<NSView | null>(null), live = useRef(options); live.current = options
	const [focusIndex, setFocusIndex] = useState(0)
	const owner = useMemo(() => createAppKitGridCellFocus({ root: () => ref.current, options: () => live.current, changed: setFocusIndex }), [])
	useLayoutEffect(() => owner.start(), [])
	useLayoutEffect(() => owner.synchronize(), null)
	// The shared API permits an opaque host type; the native owner retains its NSView.
	return { ref: ref as unknown as { current: T | null }, focusIndex, onKeyDown: owner.onKeyDown,
		onFocusCell: owner.available() ? (index: number) => { owner.focusCell(index) } : undefined }
}
