/** @jsxImportSource @octane-xplat/jsx */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI, SwiftUIManager } from '@nativescript/swift-ui'
import { GridLayout } from '@nativescript/core'
import {
	getSwiftUIHostLifecycle,
	registerSwiftUIHost,
	unregisterSwiftUIHost,
} from '@octane-xplat/lib'

import {
	createPortal as createUniversalPortal,
	type UniversalRenderable,
} from 'octane/universal/native'

import { useEffect, useRef, useState } from 'octane'
import type { SwiftUIBottomSheetProps } from './ios/types'

declare const XplatSheetProvider: any
declare const NativeScriptViewFactory: any

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatiossheet: Attributes<
			TElement,
			{
				swiftId?: string
				data?: Record<string, unknown>
				onSwiftUIEvent?: (event: { data?: unknown }) => void
			}
		>
	}
}

registerElement('xplatiossheet', SwiftUI)
registerSwiftUI(
	'xplat-swiftui-sheet',
	(owner: any) => new UIDataDriver(new XplatSheetProvider(), owner),
)

function createPortal(children: unknown, target: unknown) {
	return createUniversalPortal(children as UniversalRenderable, target)
}

function ensureNativeScriptViewFactory(): void {
	if (!NativeScriptViewFactory.shared) {
		NativeScriptViewFactory.initShared()
	}
}

function registerHost(id: string, host: GridLayout): void {
	ensureNativeScriptViewFactory()
	registerSwiftUIHost(id, { create: () => host })
	SwiftUIManager.registerNativeScriptViews({ [id]: true }, getSwiftUIHostLifecycle())
}

function ContentRoot(props: { render: () => any }) @{
	<>{props.render()}</>
}

let seq = 0

/** Renders a SwiftUI .sheet whose content portals from the declaring Octane
 *  tree into a NativeScript host resolved through NativeScriptViewFactory.
 *  `fitToContents` uses the
 *  ported size-reader → `.presentationDetents([.height(size)])`. */
export function SwiftUIBottomSheet(props: SwiftUIBottomSheetProps): unknown @{
	const contentId = useRef<string>('')
	if (!contentId.current) {
		contentId.current = `xplatsheet${++seq}`
	}

	const [portalHost, setPortalHost] = useState<GridLayout | null>(null)

	useEffect(() => {
		const host = new GridLayout()
		registerHost(contentId.current, host)
		setPortalHost(host)

		return () => {
			unregisterSwiftUIHost(contentId.current)
		}
	}, [])

	<>
		<xplatiossheet
			id={props.id}
			className={props.className}
			style={props.style}
			swiftId="xplat-swiftui-sheet"
			data={{
				isPresented: props.open ?? false,
				contentId: portalHost && props.content ? contentId.current : '',
				fitToContents: props.fitToContents ?? false,
				detents: props.detents ?? ['medium'],
				customHeight: props.customHeight,
				customFraction: props.customFraction,
				showDragIndicator: props.showDragIndicator ?? false,
				interactiveDismissDisabled: props.interactiveDismissDisabled ?? false,
			}}
			onSwiftUIEvent={(event: any) => {
				if (event.data?.dismissed) {
					props.onDismissed?.()
					return
				}

				const presented = event.data?.isPresented
				if (typeof presented === 'boolean') {
					props.onPresentedChange?.(presented)
				}
			}}
		/>
		{portalHost && props.content
			? createPortal(<ContentRoot render={props.content} />, portalHost)
			: null}
	</>
}
