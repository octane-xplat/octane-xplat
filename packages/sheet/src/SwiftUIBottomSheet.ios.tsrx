/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI, SwiftUIManager } from '@nativescript/swift-ui'
import { GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { useEffect, useRef } from 'octane'
import type { UniversalComponent, UniversalRoot } from 'octane/universal'
import type { SwiftUIBottomSheetProps } from './ios/types'

declare const XplatSheetProvider: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatiossheet: Attributes<typeof SwiftUI>
	}
}

registerElement('xplatiossheet', SwiftUI)
registerSwiftUI('xplat-swiftui-sheet', (owner: any) =>
	new UIDataDriver(new XplatSheetProvider(), owner),
)

// Host views keyed by dash-free registry id — same mechanism as the
// context-menu leaf (kept leaf-local while the shared-bridge question is open).
const hosts = new Map<string, GridLayout>()
const roots = new Map<string, UniversalRoot>()

function mountSubtree(id: string, render: () => any): void {
	let host = hosts.get(id)
	if (!host) {
		host = new GridLayout()
		hosts.set(id, host)

		SwiftUIManager.registerNativeScriptViews(
			{ [id]: true },
			{
				create: (fullId: string) => hosts.get(fullId.split('-')[0]) as any,
				destroy: (fullId: string) => {
					hosts.delete(fullId.split('-')[0])
				},
			} as any,
		)
	}

	let root = roots.get(id)
	if (!root) {
		root = createNativeScriptRoot(host)
		roots.set(id, root)
	}

	root.render(ContentRoot as unknown as UniversalComponent, { render })
}

function unmountSubtree(id: string): void {
	roots.get(id)?.unmount?.()
	roots.delete(id)
	hosts.delete(id)
}

function ContentRoot(props: { render: () => any }) @{
	<>{props.render()}</>;
}

let seq = 0

/** Renders a SwiftUI .sheet whose content is a detached octane subtree
 *  embedded through NativeScriptViewFactory-by-id. `fitToContents` uses the
 *  ported size-reader → `.presentationDetents([.height(size)])`. */
export function SwiftUIBottomSheet(props: SwiftUIBottomSheetProps) @{
	const contentId = useRef<string>('')
	if (!contentId.current) {
		contentId.current = `xplatsheet${++seq}`
	}

	useEffect(() => {
		if (props.content) {
			mountSubtree(contentId.current, props.content)
		}

		return () => {
			unmountSubtree(contentId.current)
		}
	}, [])

	useEffect(() => {
		if (props.content) {
			mountSubtree(contentId.current, props.content)
		}
	}, [props.content])

	<xplatiossheet
		id={props.id}
		className={props.className}
		style={props.style}
		swiftId="xplat-swiftui-sheet"
		data={{
			isPresented: props.open ?? false,
			contentId: props.content ? contentId.current : '',
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
	/>;
}
