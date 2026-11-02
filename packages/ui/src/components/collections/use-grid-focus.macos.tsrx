/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useLayoutEffect, useMemo, useRef, useState } from 'octane'
import { createAppKitGridCellFocus } from './grid-cell-focus.macos'
import type { GridFocusOptions, GridFocusResult } from './use-grid-focus'
export type { GridFocusOptions, GridFocusResult } from './use-grid-focus'

/** Native marked-cell navigation. Source implementation; OS input remains unqualified. */
export function useGridFocus<T extends NSView = NSView>(
	options: GridFocusOptions,
): GridFocusResult<T> {
	const ref = useRef<T | null>(null), live = useRef(options); live.current = options
	const [focusIndex, setFocusIndex] = useState(0)
	const owner = useMemo(() => createAppKitGridCellFocus({ root: () => ref.current, options: () => live.current, changed: setFocusIndex }), [])
	useLayoutEffect(() => owner.start(), [])
	useLayoutEffect(() => owner.synchronize(), null)
	return { ref, focusIndex, onKeyDown: owner.onKeyDown,
		onFocusCell: owner.available() ? (index: number) => { owner.focusCell(index) } : undefined }
}
