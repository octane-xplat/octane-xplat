/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI, SwiftUIManager } from '@nativescript/swift-ui'
import { GridLayout } from '@nativescript/core'
import { getSwiftUIHostLifecycle, registerSwiftUIHost, unregisterSwiftUIHost } from '@octane-xplat/lib'
import { createPortal as createUniversalPortal, type UniversalRenderable } from 'octane/universal/native'
import { useEffect, useRef, useState } from 'octane'
import type { SwiftUIContextMenuProps } from './ios/types'

declare const XplatContextMenuProvider: any
declare const NativeScriptViewFactory: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatioscontextmenu: Attributes<typeof SwiftUI>
	}
}

registerElement('xplatioscontextmenu', SwiftUI)
registerSwiftUI('xplat-swiftui-contextmenu', (owner: any) =>
	new UIDataDriver(new XplatContextMenuProvider(), owner),
)

function createPortal(children: unknown, target: unknown) {
	return createUniversalPortal(children as UniversalRenderable, target)
}

function ensureNativeScriptViewFactory(): void {
	if (!NativeScriptViewFactory.shared) {
		NativeScriptViewFactory.initShared()
	}
}

function registerHosts(
	triggerId: string,
	trigger: GridLayout,
	previewId: string,
	preview: GridLayout,
): void {
	ensureNativeScriptViewFactory()
	registerSwiftUIHost(triggerId, { create: () => trigger })
	registerSwiftUIHost(previewId, { create: () => preview })
	SwiftUIManager.registerNativeScriptViews(
		{ [triggerId]: true, [previewId]: true },
		getSwiftUIHostLifecycle(),
	)
}

function TriggerRoot(props: { render: () => any }) @{
	<>{props.render()}</>;
}

let seq = 0

/** Renders a SwiftUI .contextMenu whose trigger and optional preview portal
 *  from the declaring Octane tree into NativeScript hosts. Menu items arrive
 *  as serialized data. */
export function SwiftUIContextMenu(props: SwiftUIContextMenuProps) @{
	const triggerId = useRef<string>('')
	if (!triggerId.current) {
		triggerId.current = `ctxmenu${++seq}`
	}

	const previewId = `${triggerId.current}preview`
	const [portalHosts, setPortalHosts] = useState<{
		trigger: GridLayout
		preview: GridLayout
	} | null>(null)

	useEffect(() => {
		const trigger = new GridLayout()
		const preview = new GridLayout()
		registerHosts(triggerId.current, trigger, previewId, preview)
		setPortalHosts({ trigger, preview })

		return () => {
			unregisterSwiftUIHost(triggerId.current)
			unregisterSwiftUIHost(previewId)
		}
	}, [])

	const items = props.items ?? []

	<>
		<xplatioscontextmenu
			id={props.id}
			className={props.className}
			style={props.style}
			accessibilityLabel={props.accessibilityLabel}
			swiftId="xplat-swiftui-contextmenu"
			data={{
				triggerId: portalHosts ? triggerId.current : '',
				previewId: portalHosts && props.preview ? previewId : '',
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
		/>
		{portalHosts && props.trigger
			? createPortal(<TriggerRoot render={props.trigger} />, portalHosts.trigger)
			: null}
		{portalHosts && props.preview
			? createPortal(<TriggerRoot render={props.preview} />, portalHosts.preview)
			: null}
	</>;
}
