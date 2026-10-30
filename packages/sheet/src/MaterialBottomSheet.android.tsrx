/** @jsxImportSource @octane-xplat/jsx */
import { bindNativeHostAttachment } from './native-host-lifecycle.android'
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import {
	ComposeDataDriver,
	JetpackCompose,
	registerJetpackCompose,
} from '@nativescript/jetpack-compose'

import { Application, GridLayout } from '@nativescript/core'
import {
	createPortal as createUniversalPortal,
	type UniversalRenderable,
} from 'octane/universal/native'

import { useEffect, useRef, useState } from 'octane'
import type { MaterialBottomSheetProps } from './android/types'

declare const com: any

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatandroidsheet: Attributes<
			TElement,
			{
				composeId?: string
				data?: Record<string, unknown>
				onComposeEvent?: (event: { data?: unknown }) => void
			}
		>
	}
}

registerElement('xplatandroidsheet', JetpackCompose)
registerJetpackCompose(
	'xplat-material-sheet',
	(owner: any) => new ComposeDataDriver(new com.octanexplat.sheet.XplatSheetProvider(), owner),
)

// Dash-free ids — the registry keys feed the provider's AndroidView factory.
let seq = 0

function ContentRoot(props: { render: () => any }) @{
	<>{props.render()}</>
}

function createPortal(children: unknown, target: unknown) {
	return createUniversalPortal(children as UniversalRenderable, target)
}

/** Renders a Material 3 ModalBottomSheet whose content portals from the
 *  declaring tree through XplatViewRegistry + AndroidView into the dialog. */
export function MaterialBottomSheet(props: MaterialBottomSheetProps): unknown @{
	const contentId = useRef<string>('')
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null)
	if (!contentId.current) {
		contentId.current = `xplatsheet${++seq}`
	}

	useEffect(() => {
		const host = new GridLayout()
		// See context-menu: _setupAsRootView needs a real Context on Android.

		const context =
			(Application.android as any).foregroundActivity ?? (Application.android as any).startActivity

		const nativeHost = host as any

		nativeHost._setupAsRootView(context)
		const releaseAttachment = bindNativeHostAttachment(nativeHost)
		com.octanexplat.sheet.XplatViewRegistry.register(contentId.current, host.android)
		// Gate contentId on registration — AndroidView's factory resolves the
		// host once contentId arrives in updateData.
		setPortalHost(host)

		return () => {
			com.octanexplat.sheet.XplatViewRegistry.unregister(contentId.current)
			releaseAttachment()
			nativeHost.removeChildren?.()
		}
	}, [])

	<>
		<xplatandroidsheet
			id={props.id}
			className={props.className}
			style={props.style}
			composeId="xplat-material-sheet"
			data={{
				open: (props.open ?? false) ? 1 : 0,
				contentId: portalHost && props.content ? contentId.current : '',
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
		/>
		{props.content && portalHost
			? createPortal(<ContentRoot render={props.content} />, portalHost)
			: null}
	</>
}
