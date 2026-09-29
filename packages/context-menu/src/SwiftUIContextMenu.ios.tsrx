/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI, SwiftUIManager } from '@nativescript/swift-ui'
import { GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { useEffect, useRef, useState } from 'octane'
import type { UniversalComponent } from 'octane/universal'
import type { SwiftUIContextMenuProps } from './ios/types'

declare const XplatContextMenuProvider: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatioscontextmenu: Attributes<typeof SwiftUI>
	}
}

registerElement('xplatioscontextmenu', SwiftUI)
registerSwiftUI('xplat-swiftui-contextmenu', (owner: any) =>
	new UIDataDriver(new XplatContextMenuProvider(), owner),
)

// Host views keyed by dash-free registry id — the provider's representable
// appends "-<uuid>" and the factory looks the host up by the first segment.
const hosts = new Map<string, GridLayout>()
const roots = new Map<string, { unmount?: () => void }>()

function mountSubtree(id: string, render: () => any): void {
	let host = hosts.get(id)
	if (!host) {
		host = new GridLayout()
		hosts.set(id, host)
		// Register the id the first time the host exists — the factory's
		// lifecycle resolves it back out of this map.
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
	root.render(TriggerRoot as unknown as UniversalComponent, { render })
}

function unmountSubtree(id: string): void {
	roots.get(id)?.unmount?.()
	roots.delete(id)
	hosts.delete(id)
}

function TriggerRoot(props: { render: () => any }) @{
	<>{props.render()}</>;
}

let seq = 0

/** Renders a SwiftUI .contextMenu whose activation element is a detached
 *  octane subtree embedded through the plugin's NativeScriptView-by-id
 *  factory. Menu items arrive as serialized data. */
export function SwiftUIContextMenu(props: SwiftUIContextMenuProps) @{
	const triggerId = useRef<string>('')
	if (!triggerId.current) {
		triggerId.current = `ctxmenu${++seq}`
	}
	const [ready, setReady] = useState(false)

	useEffect(() => {
		mountSubtree(triggerId.current, props.trigger)
		// Gate triggerId on registration — the representable resolves the id
		// through NativeScriptViewFactory on first composition.
		setReady(true)

		return () => {
			unmountSubtree(triggerId.current)
			setReady(false)
		}
	}, [])

	useEffect(() => {
		mountSubtree(triggerId.current, props.trigger)
	}, [props.trigger])

	useEffect(() => {
		if (props.preview) {
			mountSubtree(`${triggerId.current}preview`, props.preview)
		}
	}, [props.preview])

	const items = props.items ?? []

	<xplatioscontextmenu
		id={props.id}
		className={props.className}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
		swiftId="xplat-swiftui-contextmenu"
		data={{
			triggerId: ready ? triggerId.current : '',
			previewId: ready && props.preview ? `${triggerId.current}preview` : '',
			items: items.map((item) => ({
				id: item.id,
				title: item.title,
				destructive: item.destructive ? 1 : 0,
				disabled: item.disabled ? 1 : 0,
				divider: item.divider ? 1 : 0,
			})),
		}}
		onSwiftUIEvent={(event: any) => {
			const item = event.data?.item
			if (typeof item === 'string' && item) {
				props.onItemSelected?.(item)
			}
		}}
	/>;
}
