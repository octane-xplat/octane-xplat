/** @jsxImportSource @nativescript-community/octane */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx';
import { useContext, useEffect, useId, useRef } from 'octane';
import { GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { DialogHeaderProps, DialogProps } from './props';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout';
import { createOverlayLifetime } from './overlay-lifetime';
import { bindBottomInsetToKeyboard } from './keyboard-inset';
import { attachTapToBlur } from './tap-to-blur';
import { DialogContext, DialogProvider } from './dialog-context';
import { spacingStep } from './spacing';
import { Icon } from './Icon';
import { Pressable } from './Pressable';

/** The modal body rendered inside the dedicated overlay root — a centered
 *  (or `position`-anchored) panel on the page's RootLayout. `purpose`
 *  gates the shade tap; hardware back dismissal arrives via the host's
 *  `closed` event and reports through `onOpenChange(false)`. */
function DialogPanel(props: DialogProps & { layerDepth: number }) @{
	const titleId = useId();
	const purpose = props.purpose ?? 'info';
	const isFullscreen = props.variant === 'fullscreen';
	const padding = spacingStep(props.padding ?? 5) ?? 20;
	const pos = props.position;

	<gridlayout
		className="vx-dialog-host"
		rows="*"
		columns="*"
		width="100%"
		height="100%"
	>
		<flexboxlayout
			flexDirection="column"
			className={cx(
				'vx-dialog',
				isFullscreen && 'vx-dialog--fullscreen',
				props.className,
			)}
			style={{
				padding,
				width: typeof props.width === 'number' ? props.width : isFullscreen ? '100%' : undefined,
				height: isFullscreen ? '100%' : undefined,
				maxHeight:
					typeof props.maxHeight === 'number'
						? props.maxHeight
						: undefined,
				marginLeft: typeof pos?.start === 'number' ? pos.start : undefined,
				marginRight: typeof pos?.end === 'number' ? pos.end : undefined,
				marginTop: typeof pos?.top === 'number' ? pos.top : undefined,
				marginBottom: typeof pos?.bottom === 'number' ? pos.bottom : undefined,
				...props.style,
			}}
			verticalAlignment={
				isFullscreen
					? 'stretch'
					: pos?.top != null
						? 'top'
						: pos?.bottom != null
							? 'bottom'
						: 'middle'
			}
			horizontalAlignment={
				isFullscreen
					? 'stretch'
					: pos?.start != null
						? 'left'
						: pos?.end != null
							? 'right'
							: 'center'
			}
			width={isFullscreen ? '100%' : undefined}
			height={isFullscreen ? '100%' : undefined}
			accessible={true}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={purpose === 'required' ? ('alert' as any) : undefined}
		>
			<DialogProvider value={{ titleId, isModal: true }}>
				<LayerDepthProvider value={props.layerDepth}>{props.children}</LayerDepthProvider>
			</DialogProvider>
		</flexboxlayout>
	</gridlayout>
}

/** Inline (non-modal) rendering — panel chrome without overlay. */
function DialogInline(props: DialogProps) @{
	const titleId = useId();
	const padding = spacingStep(props.padding ?? 5) ?? 20;

	<flexboxlayout
		flexDirection="column"
		className={cx('vx-dialog', 'vx-dialog--inline', props.className)}
		style={{ padding, width: typeof props.width === 'number' ? props.width : undefined, ...props.style }}
		accessibilityLabel={props.accessibilityLabel}
	>
		<DialogProvider value={{ titleId, isModal: false }}>
			{props.children}
		</DialogProvider>
	</flexboxlayout>
}

/** Modal dialog (Astryx `Dialog`), native leaf — a GridLayout host on the
 *  RootLayout enclosing the declaring component (same ownership model as
 *  BottomSheet) with a dedicated Octane root. Hardware back / shade taps
 *  go through the RootLayout's own dismissal path; `purpose` maps to
 *  shade `tapToClose` (Android back is not blockable through RootLayout —
 *  documented deviation). Focus restoration has no direct equivalent;
 *  `finalFocusRef` calls the target's focus method when the declaration closes. */
export function Dialog(props: DialogProps) @{
	const dismissal = useLayerDismissal({ get active() { return !!props.isOpen && !props.isInline }, isPresent: () => !!shown.current, dismiss: () => props.onOpenChange?.(false), get behavior() { return props.purpose === 'required' ? 'block' : 'close' }, getFocusTarget: () => props.finalFocusRef?.current });

	const sentinel = useRef<any>(null);
	const shown = useRef<{
		host: GridLayout;
		root: any;
		lifetime: ReturnType<typeof createOverlayLifetime>;
	} | null>(null);

	const dismiss = useRef(props.onOpenChange);
	dismiss.current = props.onOpenChange;

	useEffect(() => {
		const cur = shown.current;
		if (!props.isOpen) {
			cur?.lifetime.close();
			return;
		}

		const rl = rootLayoutFor(sentinel.current);
		if (!rl) return;

		if (cur) {
			cur.root.render(DialogPanel as unknown as UniversalComponent, { ...props, layerDepth: dismissal.depth });
			return;
		}

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, 'vx-dialog-overlay');
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		const root = createNativeScriptRoot(host);
		const lifetime = createOverlayLifetime(rl, host, root, 'Dialog', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) dismiss.current?.(false);
		});

		lifetime.own(unbindTheme);
		// Keep the panel above the software keyboard and blur the field on
		// outside taps — same affordances the sheet host owns.
		lifetime.own(bindBottomInsetToKeyboard(host));
		lifetime.own(attachTapToBlur(host));
		shown.current = { host, root, lifetime };
		root.render(DialogPanel as unknown as UniversalComponent, { ...props, layerDepth: dismissal.depth });

		const purpose = props.purpose ?? 'info';
		lifetime.open({
			shadeCover: {
				opacity: 0.4,
				tapToClose: purpose === 'info',
			},
			animation: {
				enterFrom: { opacity: 0, duration: 180 },
				exitTo: { opacity: 0, duration: 140 },
			},
		});
	}, [
		props.isOpen,
		props.children,
		props.className,
		props.style,
		props.purpose,
		props.variant,
		props.width,
		props.maxHeight,
	]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	// Zero-size sentinel — the dialog resolves its owning RootLayout from
	// the declaring component's ancestry.
	<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
}

/** Dialog title row (Astryx `DialogHeader`), native leaf. */
export function DialogHeader(props: DialogHeaderProps) @{
	useContext(DialogContext); // keep provider membership for parity — the id only matters on web.

	<flexboxlayout flexDirection="column" className={cx('vx-dialog-header', props.className)} style={props.style} id={props.id}>
		<flexboxlayout flexDirection="row" alignItems="center">
			{props.startContent != null && <flexboxlayout className="vx-dialog-header-start">{props.startContent}</flexboxlayout>}
			<flexboxlayout flexDirection="column" flexGrow={1} className="vx-dialog-header-text">
				{props.title != null && <label className="vx-dialog-title" textWrap={true}>{props.title}</label>}
				{props.subtitle != null && <label className="vx-dialog-subtitle" textWrap={true}>{props.subtitle}</label>}
			</flexboxlayout>
			{(props.endContent != null || props.onOpenChange != null) && (
				<flexboxlayout flexDirection="row" alignItems="center" className="vx-dialog-header-end">
					{props.endContent}
					{props.onOpenChange && (
						<Pressable
							className="vx-dialog-close"
							accessibilityLabel="Close"
							onPress={() => props.onOpenChange?.(false)}
						>
							<Icon name="xplat-close" />
						</Pressable>
					)}
				</flexboxlayout>
			)}
		</flexboxlayout>
		{(props.hasDivider ?? true) && <gridlayout className="vx-dialog-divider" height={1} />}
	</flexboxlayout>
}
