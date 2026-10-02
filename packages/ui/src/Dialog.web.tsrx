import { createPortal, useContext, useEffect, useId, useRef } from 'octane';
import type { DialogHeaderProps, DialogProps } from './props';
import { applyEscapeProps } from './escape-props';
import { useThemeScheme } from './theme/theme-scheme';
import { DialogContext, DialogProvider } from './dialog-context';
import { spacingStep } from './spacing';
import { cx } from './cx';
import { Icon } from './Icon.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';

const toPx = (v: number | string | undefined) =>
	v == null ? undefined : typeof v === 'number' ? `${v}px` : v;

/** Modal/inline panel rendered when isOpen — owns the real `<dialog>`
 *  element where the browser supports it (focus trap, top layer,
 *  ::backdrop, inert background are native platform behavior), plus a
 *  fallback fixed layer for engines without `HTMLDialogElement.showModal`. */
function DialogModal(props: DialogProps) @{
	const dark = useThemeScheme() === 'dark';
	const titleId = useId();
	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const layerRef = useRef<HTMLDivElement | null>(null);
	const restoreScroll = useRef<string | null>(null);
	const purpose = props.purpose ?? 'info';
	const isFullscreen = props.variant === 'fullscreen';
	const padding = spacingStep(props.padding ?? 5) ?? 20;
	const dismiss = useRef(props.onOpenChange);
	dismiss.current = props.onOpenChange;
	const pos = props.position;

	useEffect(() => {
		const dialog = dialogRef.current;
		const layer = layerRef.current;
		if (!dialog) {
			return;
		}

		const trigger = document.activeElement as HTMLElement | null;
		const canModal = typeof dialog.showModal === 'function';
		if (canModal) {
			try {
				dialog.showModal();
			} catch {
				dialog.setAttribute('open', '');
			}
		} else {
			dialog.setAttribute('open', '');
		}

		// Page scroll lock for the modal's lifetime.
		const root = document.documentElement;
		restoreScroll.current = root.style.overflow || '';
		root.style.overflow = 'hidden';

		// Initial focus: an explicit [data-autofocus] wins, then the
		// DialogHeader title, then the dialog itself (showModal already
		// focuses it; make that explicit for the fallback path).
		const autofocusEl = dialog.querySelector<HTMLElement>('[data-autofocus]');
		const titleEl = dialog.querySelector<HTMLElement>('[data-vx-dialog-title]');
		if (autofocusEl) {
			autofocusEl.focus({ preventScroll: true });
		} else if (titleEl) {
			titleEl.focus({ preventScroll: true });
		} else if (!canModal) {
			dialog.focus?.({ preventScroll: true });
		}

		// An open modal without a name is an a11y defect — warn once.
		if (
			!props.accessibilityLabel &&
			!dialog.hasAttribute('aria-labelledby') &&
			!titleEl
		) {
			console.warn(
				'[Dialog] an open modal dialog has no accessible name — provide `accessibilityLabel` or render a <DialogHeader> with a title.',
			);
		}

		// Escape: the UA fires `cancel` before closing. `required` swallows
		// it; other purposes report the dismissal through onOpenChange.
		const onCancel = (event: Event) => {
			event.preventDefault();
			if (purpose !== 'required') {
				dismiss.current?.(false);
			}
		};

		// Backdrop clicks land on the <dialog> itself (padding included).
		const onClick = (event: MouseEvent) => {
			if (event.target === event.currentTarget && purpose === 'info') {
				dismiss.current?.(false);
			}
		};

		// Fallback path (no showModal): no top layer, no inert — emulate the
		// essentials on the wrapper layer.
		let detachFallback: (() => void) | undefined;
		if (!canModal && layer) {
			const onKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape' && purpose !== 'required') {
					event.preventDefault();
					dismiss.current?.(false);
				}
			};

			const onLayerClick = (event: MouseEvent) => {
				if (event.target === layer && purpose === 'info') {
					dismiss.current?.(false);
				}
			};

			document.addEventListener('keydown', onKey);
			layer.addEventListener('mousedown', onLayerClick);
			detachFallback = () => {
				document.removeEventListener('keydown', onKey);
				layer.removeEventListener('mousedown', onLayerClick);
			};
		}

		dialog.addEventListener('cancel', onCancel);
		dialog.addEventListener('click', onClick);
		return () => {
			dialog.removeEventListener('cancel', onCancel);
			dialog.removeEventListener('click', onClick);
			detachFallback?.();
			root.style.overflow = restoreScroll.current ?? '';
			const target = props.finalFocusRef?.current ?? trigger;
			if (target?.isConnected !== false && typeof target?.focus === 'function') {
				target.focus({ preventScroll: true });
			}
		};
	}, []);

	return (
		<div ref={layerRef} className={cx('vx-dialog-layer', dark && 'dark')}>
			<DialogProvider value={{ titleId, isModal: true }}>
				<dialog
					ref={(el: HTMLDialogElement | null) => {
						dialogRef.current = el;
						applyEscapeProps(el, props);
						props.web?.ref?.(el);
					}}
					id={props.id}
					className={cx(
						'vx-dialog',
						isFullscreen && 'vx-dialog--fullscreen',
						pos && 'vx-dialog--anchored',
						props.className,
					)}
					style={{
						padding: `${padding}px`,
						width: isFullscreen ? '100%' : (toPx(props.width) ?? '400px'),
						height: isFullscreen ? '100%' : undefined,
						maxHeight: isFullscreen ? 'none' : (toPx(props.maxHeight) ?? '75dvh'),
						maxWidth: isFullscreen ? 'none' : undefined,
						...(pos
							? {
									position: 'fixed',
									margin: 0,
									top: toPx(pos.top),
									bottom: toPx(pos.bottom),
									insetInlineStart: toPx(pos.start),
									insetInlineEnd: toPx(pos.end),
								}
							: {}),
						...props.style,
					}}
					aria-label={props.accessibilityLabel}
					aria-labelledby={props.accessibilityLabel ? undefined : titleId}
					{...(purpose === 'required' ? { role: 'alertdialog' } : {})}
					tabIndex={-1}
				>
					{props.children}
				</dialog>
			</DialogProvider>
		</div>
	);
}

/** Inline (non-modal) rendering — same panel chrome, no overlay. */
function DialogInline(props: DialogProps) @{
	const titleId = useId();
	const padding = spacingStep(props.padding ?? 5) ?? 20;

	return (
		<DialogProvider value={{ titleId, isModal: false }}>
			<div
				ref={(el: any) => applyEscapeProps(el, props)}
				id={props.id}
				className={cx('vx-dialog', 'vx-dialog--inline', props.className)}
				style={{
					padding: `${padding}px`,
					width: toPx(props.width) ?? '400px',
					maxHeight: toPx(props.maxHeight),
					...props.style,
				}}
				role={props.purpose === 'required' ? 'alertdialog' : 'dialog'}
				aria-label={props.accessibilityLabel}
				aria-labelledby={props.accessibilityLabel ? undefined : titleId}
			>
				{props.children}
			</div>
		</DialogProvider>
	);
}

/** Modal dialog (Astryx `Dialog`). Web leaf renders a real `<dialog>` in
 *  the top layer: background inertness, focus trap, Escape→cancel and
 *  `::backdrop` come from the platform. `purpose` gates dismissal —
 *  'info' allows backdrop tap + Escape, 'form' keeps Escape only,
 *  'required' blocks both and carries `role="alertdialog"`. */
export function Dialog(props: DialogProps) @{
	@if (props.isInline) {
		<DialogInline {...props} />
	} @else {
		@if (props.isOpen) {
			<>{createPortal(<DialogModal {...props} />, document.body)}</>
		}
	}
}

/** Dialog title row (Astryx `DialogHeader`). The title carries the
 *  dialog's label id and the modal autofocus marker; `onOpenChange`
 *  supplies the close affordance. */
export function DialogHeader(props: DialogHeaderProps) @{
	const ctx = useContext(DialogContext);
	const pad = spacingStep(5) ?? 20;
	const compensate =
		props.endContentEdgeCompensation === 'inline' ||
		props.endContentEdgeCompensation === 'all';

	<>
		<div className={cx('vx-dialog-header', props.className)} style={props.style} id={props.id}>
			{props.startContent != null && (
				<div className="vx-dialog-header-start">{props.startContent}</div>
			)}
			<div className="vx-dialog-header-text">
				{props.title != null && (
					<div
						className="vx-dialog-title"
						id={ctx?.titleId}
						data-vx-dialog-title={ctx?.isModal ? '' : undefined}
						tabIndex={ctx?.isModal ? -1 : undefined}
					>
						{props.title}
					</div>
				)}
				{props.subtitle != null && <div className="vx-dialog-subtitle">{props.subtitle}</div>}
			</div>
			{(props.endContent != null || props.onOpenChange != null) && (
				<div
					className="vx-dialog-header-end"
					style={compensate ? { marginInlineEnd: `${-pad / 2}px` } : undefined}
				>
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
				</div>
			)}
		</div>
		{(props.hasDivider ?? true) && <div className="vx-dialog-divider" />}
	</>;
}
