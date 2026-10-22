/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle, styleRecord } from './style-merge'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { SizeProvider } from './size-context'
import { useContext, useEffect, useId, useRef, useState } from 'octane'
import { GridLayout, isAndroid, isIOS } from '@nativescript/core'
import { createPortal } from './native-portal'
import type { DialogHeaderProps, DialogProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyThemeClasses } from './theme/theme-host'
import { rootLayoutFor } from './root-layout'
import { createOverlayLifetime } from './overlay-lifetime'
import { createKeyboardOverlayHost } from './keyboard-overlay-host'
import { attachTapToBlur } from './tap-to-blur'
import { DialogContext, DialogProvider } from './dialog-context'
import { spacingStep } from './spacing'
import { Icon } from './Icon'
import { Pressable } from './Pressable'

/** The modal body rendered in a portal host — a centered
 *  (or `position`-anchored) panel on the page's RootLayout. `purpose`
 *  gates the shade tap; hardware back dismissal arrives via the host's
 *  `closed` event and reports through `onOpenChange(false)`. */
function DialogPanel(props: DialogProps & { layerDepth: number }) @{
	const titleId = useId()
	const purpose = props.purpose ?? 'info'
	const isFullscreen = props.variant === 'fullscreen'
	const padding = spacingStep(props.padding ?? 5) ?? 20
	const pos = props.position

	<masonview className="vx-dialog-host" width="100%" height="100%" style={{display: "grid", gridTemplateRows: "1fr", gridTemplateColumns: "1fr"}}>
		<masonview className={cx(
				'vx-dialog',
				isFullscreen && 'vx-dialog--fullscreen',
				props.className,
			)} width={isFullscreen ? '100%' : undefined} height={isFullscreen ? '100%' : undefined} accessible={true} accessibilityLabel={props.accessibilityLabel} accessibilityRole={purpose === 'required' ? 'alert' : undefined} style={mergeStyle({display: "flex"}, [{
				padding,
				width: typeof props.width === 'number' ? props.width : isFullscreen ? '100%' : undefined,
				height: isFullscreen ? '100%' : undefined,
				maxHeight: typeof props.maxHeight === 'number' ? props.maxHeight : undefined,
				marginLeft: typeof pos?.start === 'number' ? pos.start : undefined,
				marginRight: typeof pos?.end === 'number' ? pos.end : undefined,
				marginTop: typeof pos?.top === 'number' ? pos.top : undefined,
				marginBottom: typeof pos?.bottom === 'number' ? pos.bottom : undefined,
				...styleRecord(props.style) }, {justifySelf: 
				isFullscreen
					? 'stretch'
					: pos?.start != null
						? 'left'
						: pos?.end != null
							? 'right'
							: 'center'
			, alignSelf: 
				isFullscreen
					? 'stretch'
					: pos?.top != null
						? 'top'
						: pos?.bottom != null
							? 'bottom'
						: 'middle'
			}])}>
			<DialogProvider value={{ titleId, isModal: true, requestClose: props.onOpenChange }}>
				<LayerDepthProvider value={props.layerDepth}>
					<SizeProvider value={null}>{props.children}</SizeProvider>
				</LayerDepthProvider>
			</DialogProvider>
		</masonview>
	</masonview>
}

/** Inline (non-modal) rendering — panel chrome without overlay. */
function DialogInline(props: DialogProps) @{
	const titleId = useId()
	const padding = spacingStep(props.padding ?? 5) ?? 20

	<masonview className={cx('vx-dialog', 'vx-dialog--inline', props.className)} style={mergeStyle({display: "flex"}, { padding, width: typeof props.width === 'number' ? props.width : undefined, ...styleRecord(props.style) })} accessibilityLabel={props.accessibilityLabel}>
		<DialogProvider value={{ titleId, isModal: false, requestClose: props.onOpenChange }}>
			{props.children}
		</DialogProvider>
	</masonview>
}

/** Modal dialog (Astryx `Dialog`), native leaf — a GridLayout host on the
 *  RootLayout enclosing the declaring component (same ownership model as
 *  BottomSheet), with content portaled from the declaring root. Hardware
 *  back and shade taps go through the RootLayout's own dismissal path.
 *  `purpose` maps to shade `tapToClose` (Android back is not blockable through RootLayout —
 *  documented deviation). Focus restoration has no direct equivalent;
 *  `finalFocusRef` calls the target's focus method when the declaration closes. */
export function Dialog(props: DialogProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) {
			setInternal(isOpen)
		}

		props.onOpenChange?.(isOpen)
	}

	const dismissal = useLayerDismissal({
		get active() {
			return !!open && !props.isInline
		},
		isPresent: () => !!shown.current,
		dismiss: () => requestChange(false),
		get behavior() {
			return props.purpose === 'required' ? 'block' : 'close'
		},
		getFocusTarget: () => props.finalFocusRef?.current,
		getHost: () => sentinel.current,
	})

	const sentinel = useRef<any>(null)
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null)
	const shown = useRef<{
		host: GridLayout
		lifetime: ReturnType<typeof createOverlayLifetime>
	} | null>(null)

	const dismiss = useRef(requestChange)
	dismiss.current = requestChange

	useEffect(() => {
		const cur = shown.current
		if (!open) {
			cur?.lifetime.close()
			return
		}

		const rl = rootLayoutFor(sentinel.current)
		if (!rl) {
			return
		}

		if (cur) {
			return
		}

		const { host, panel, bindKeyboard } = createKeyboardOverlayHost('stretch')
		const unbindTheme = applyThemeClasses(panel, 'vx-dialog-overlay')
		host.horizontalAlignment = 'stretch'
		host.verticalAlignment = 'stretch'
		const lifetime = createOverlayLifetime(rl, host, null, 'Dialog', (dismissed) => {
			if (shown.current?.host === host) {
				shown.current = null
				setPortalHost(null)
			}

			if (dismissed) {
				dismiss.current?.(false)
			}
		})

		lifetime.own(unbindTheme)
		// Keep the panel above the software keyboard and blur the field on
		// outside taps — same affordances the sheet host owns.
		lifetime.own(bindKeyboard())
		lifetime.own(attachTapToBlur(host))
		shown.current = { host, lifetime }
		setPortalHost(panel)

		const purpose = props.purpose ?? 'info'
		lifetime.open({
			shadeCover: {
				opacity: 0.4,
				tapToClose: purpose === 'info',
			},
			animation: {
				enterFrom: { opacity: 0, duration: 180 },
				exitTo: { opacity: 0, duration: 140 },
			},
		})
	}, [
		open,
		props.children,
		props.className,
		props.style,
		props.purpose,
		props.variant,
		props.width,
		props.maxHeight,
	])

	useEffect(() => () => shown.current?.lifetime.close(), [])

	// Zero-size sentinel — the dialog resolves its owning RootLayout from
	// the declaring component's ancestry.

	<>
		<masonview ref={(v: any) => { sentinel.current = v; }} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, { width: 0, height: 0 }))}/>
		{open && portalHost ? createPortal(
			<DialogPanel {...props} onOpenChange={requestChange} layerDepth={dismissal.depth} />,
			portalHost,
		) : null}
	</>
}

/** Dialog title row (Astryx `DialogHeader`), native leaf. */
export function DialogHeader(props: DialogHeaderProps) @{
	const ctx = useContext(DialogContext) // provider membership supplies the title id on web and the shared close request.
	const requestClose = props.onOpenChange ?? ctx?.requestClose

	<masonview className={cx('vx-dialog-header', props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style))} id={props.id}>
		<masonview style={mergeStyle({flexDirection: "row", alignItems: "center"}, {display: "flex"})}>
			{props.startContent != null && <masonview className="vx-dialog-header-start" style={{display: "flex"}}>{props.startContent}</masonview>}
			<masonview className="vx-dialog-header-text" style={mergeStyle({flexDirection: "column", flexGrow: 1}, {display: "flex"})}>
				{props.title != null && <label className="vx-dialog-title" textWrap={true}>{props.title}</label>}
				{props.subtitle != null && <label className="vx-dialog-subtitle" textWrap={true}>{props.subtitle}</label>}
			</masonview>
			{(props.endContent != null || requestClose != null) && (
				<masonview className="vx-dialog-header-end" style={mergeStyle({flexDirection: "row", alignItems: "center"}, {display: "flex"})}>
					{props.endContent}
					{requestClose && (
						<Pressable
							className="vx-dialog-close"
							accessibilityLabel="Close"
							onPress={() => requestClose(false)}
						>
							<Icon name="xplat-close" />
						</Pressable>
					)}
				</masonview>
			)}
		</masonview>
		{(props.hasDivider ?? true) && <masonview className="vx-dialog-divider" height={1} style={{display: "grid"}}/>}
	</masonview>
}
