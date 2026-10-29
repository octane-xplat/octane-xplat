/** @jsxImportSource @octane-xplat/jsx */
import './AppKitSheet.macos.css'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import { createPortal, type UniversalRenderable } from 'octane/universal/native'
import { cx } from '@octane-xplat/lib'
import type { AppKitSheetProps } from './macos/types'
import { createSheetOwner, type SheetPrepare } from './sheet-owner.macos'

const host = (): any => (globalThis as any).__xplatAppKit ?? {}

function ContentRoot(props: AppKitSheetProps) @{
	<masonview className={cx('xplat-appkit-sheet-content', props.className)} style={props.style}>
		{props.content?.()}
	</masonview>
}

/** Portals from the declaring tree into its anchor's document-modal window sheet. */
export function AppKitSheet(props: AppKitSheetProps) @{
	const live = useRef(props); live.current = props
	const [, rerender] = useState(0)
	const owner = useMemo(() => createSheetOwner({
		props: () => live.current,
		prepare: () => typeof host().presentSheet === 'function' ? host().presentSheet as SheetPrepare : undefined,
		changed: () => rerender((n) => n + 1),
	}), [])
	useLayoutEffect(() => owner.update(), null)
	useEffect(() => () => owner.dispose(), [])
	const target = owner.getTarget()
	// The portal must commit before native fitting-size measurement/presentation.
	useEffect(() => { if (target) owner.commit(target) }, [target])

	<>
		<masonview ref={owner.bind} id={props.id} className="xplat-appkit-sheet-anchor">
			@if (props.open && owner.getStatus() === 'unavailable') {
				<label text="This sheet is unavailable in this app. Close and reopen to retry." accessibilityLiveRegion="polite" />
			}
		</masonview>
		{props.open && target ? createPortal(<ContentRoot {...props} /> as UniversalRenderable, target) : null}
	</>
}
