/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { ComposeDataDriver, JetpackCompose, registerJetpackCompose } from '@nativescript/jetpack-compose'
import { Application, GridLayout } from '@nativescript/core'
import { createPortal as createUniversalPortal, type UniversalRenderable } from 'octane/universal/native'
import { useEffect, useRef, useState } from 'octane'
import type { MaterialContextMenuProps } from './android/types'

declare const com: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatandroidcontextmenu: Attributes<typeof JetpackCompose>
	}
}

registerElement('xplatandroidcontextmenu', JetpackCompose)
registerJetpackCompose('xplat-material-contextmenu', (owner: any) =>
	new ComposeDataDriver(new com.octanexplat.contextmenu.XplatContextMenuProvider(), owner),
)

// Dash-free ids — the host-side representable appends "-<uuid>" and the
// registry lookup splits on the first dash.
let seq = 0

function TriggerRoot(props: { render: () => any }) @{
	<>{props.render()}</>;
}

function createPortal(children: unknown, target: unknown) {
	return createUniversalPortal(children as UniversalRenderable, target)
}

/** Renders a Material 3 DropdownMenu anchored to a NativeScript-hosted
 *  trigger subtree portaled from the declaring Octane tree. */
export function MaterialContextMenu(props: MaterialContextMenuProps) @{
	const triggerId = useRef<string>('')
	if (!triggerId.current) {
		triggerId.current = `ctxmenu${++seq}`
	}

	const mounted = useRef<{ host: any } | null>(null)
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null)
	const [expanded, setExpanded] = useState(false)

	useEffect(() => {
		const host = new GridLayout()
		// Detached subtree — the plugin's generateNativeView shortcut passes
		// `{}` as the native context, which fails to marshal on Android; the
		// view factory needs a real android.content.Context to build its
		// native view.

		const context = (Application.android as any).foregroundActivity ?? (Application.android as any).startActivity
		const nativeHost = host as any

		nativeHost._setupAsRootView(context)
		nativeHost.callLoaded()
		com.octanexplat.contextmenu.XplatViewRegistry.register(triggerId.current, host.android)
		mounted.current = { host }

		// Gate triggerId on registration — the provider only composes the
		// AndroidView host once triggerId is non-empty, so the factory must
		// find the view in the registry on first read.
		setPortalHost(host)

		return () => {
			com.octanexplat.contextmenu.XplatViewRegistry.unregister(triggerId.current)
			mounted.current = null
			nativeHost.callUnloaded?.()
			nativeHost.removeChildren?.()
		}
	}, [])

	// Activation is an NS gesture on the trigger host — the hosted subtree
	// consumes pointer input before Compose's gesture detectors could resolve
	// it, so expanded is pushed through data instead. Rebind when the
	// activation prop or the mounted host changes.
	useEffect(() => {
		const host = mounted.current?.host
		if (!portalHost || !host) return
		const open = () => setExpanded(true)
		const event = (props.activation ?? 'longPress') === 'singlePress' ? 'tap' : 'longPress'
		host.on(event, open)
		return () => host.off(event, open)
	}, [portalHost, props.activation])

	const items = props.items ?? []

	<>
		<xplatandroidcontextmenu
			id={props.id}
			className={props.className}
			style={props.style}
			accessibilityLabel={props.accessibilityLabel}
			composeId="xplat-material-contextmenu"
			data={{
				triggerId: portalHost ? triggerId.current : '',
				expanded: expanded ? 1 : 0,
				items: items.map((item) => ({
					id: item.id,
					title: item.title,
					// The bridge's dataSerialize throws on booleans; send numbers.
					destructive: item.destructive ? 1 : 0,
					disabled: item.disabled ? 1 : 0,
					divider: item.divider ? 1 : 0,
				})),
			}}
			onComposeEvent={(event: any) => {
				if (event.data?.dismissed) {
					setExpanded(false)
					return
				}

				const item = event.data?.item
				if (typeof item === 'string' && item) {
					setExpanded(false)
					props.onItemSelected?.(item)
				}
			}}
		/>
		{portalHost && props.trigger
			? createPortal(<TriggerRoot render={props.trigger} />, portalHost)
			: null}
	</>;
}
