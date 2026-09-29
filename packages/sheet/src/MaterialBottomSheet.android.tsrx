/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { ComposeDataDriver, JetpackCompose, registerJetpackCompose } from '@nativescript/jetpack-compose'
import { Application, GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { useEffect, useRef, useState } from 'octane'
import type { UniversalComponent } from 'octane/universal'
import type { MaterialBottomSheetProps } from './android/types'

declare const com: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatandroidsheet: Attributes<typeof JetpackCompose>
	}
}

registerElement('xplatandroidsheet', JetpackCompose)
registerJetpackCompose('xplat-material-sheet', (owner: any) =>
	new ComposeDataDriver(new com.octanexplat.sheet.XplatSheetProvider(), owner),
)

// Dash-free ids — the registry keys feed the provider's AndroidView factory.
let seq = 0

function ContentRoot(props: { render: () => any }) @{
	<>{props.render()}</>;
}

/** Renders a Material 3 ModalBottomSheet whose content is a detached
 *  octane subtree hosted via XplatViewRegistry + AndroidView inside the
 *  sheet's dialog window. */
export function MaterialBottomSheet(props: MaterialBottomSheetProps) @{
	const contentId = useRef<string>('')
	if (!contentId.current) {
		contentId.current = `xplatsheet${++seq}`
	}

	const mounted = useRef<{ host: any; root: any } | null>(null)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		const host = new GridLayout()
		// See context-menu: _setupAsRootView needs a real Context on Android.

		const context = (Application.android as any).foregroundActivity ?? (Application.android as any).startActivity
		const nativeHost = host as any

		nativeHost._setupAsRootView(context)
		nativeHost.callLoaded()
		const root = createNativeScriptRoot(host)
		if (props.content) {
			root.render(ContentRoot as unknown as UniversalComponent, { render: props.content })
		}

		com.octanexplat.sheet.XplatViewRegistry.register(contentId.current, host.android)
		mounted.current = { host, root }
		// Gate contentId on registration — AndroidView's factory resolves the
		// host once contentId arrives in updateData.
		setReady(true)

		return () => {
			com.octanexplat.sheet.XplatViewRegistry.unregister(contentId.current)
			root.unmount?.()
			mounted.current = null
			setReady(false)
		}
	}, [])

	useEffect(() => {
		if (props.content) {
			mounted.current?.root?.render(ContentRoot as unknown as UniversalComponent, {
				render: props.content,
			})
		}
	}, [props.content])

	<xplatandroidsheet
		id={props.id}
		className={props.className}
		style={props.style}
		composeId="xplat-material-sheet"
		data={{
			open: (props.open ?? false) ? 1 : 0,
			contentId: ready && props.content ? contentId.current : '',
			skipPartiallyExpanded: (props.skipPartiallyExpanded ?? false) ? 1 : 0,
			showDragHandle: (props.showDragHandle ?? true) ? 1 : 0,
			sheetGesturesEnabled: (props.sheetGesturesEnabled ?? true) ? 1 : 0,
			shouldDismissOnBackPress: (props.shouldDismissOnBackPress ?? true) ? 1 : 0,
			shouldDismissOnClickOutside: (props.shouldDismissOnClickOutside ?? true) ? 1 : 0,
			containerColor: props.containerColor,
			contentColor: props.contentColor,
			scrimColor: props.scrimColor,
		}}
		onComposeEvent={(event: any) => {
			if (event.data?.dismissed) {
				props.onDismissed?.()
			}
		}}
	/>;
}
