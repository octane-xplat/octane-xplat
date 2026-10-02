import { useCallback, useContext, useEffect, useId, useRef, useState } from 'octane';
import type { MobileNavProps, MobileNavToggleProps } from './props';
import { applyEscapeProps } from './escape-props';
import { Button } from './Button.web.tsrx';
import { Icon } from './Icon.web.tsrx';
import { Text } from './Text.web.tsrx';
import { AppShellMobileContext, useAppShellMobile } from './nav-contexts';

export { AppShellMobileContext, useAppShellMobile };

/** Read the dialog's slide-out duration for the delayed close. */
function closeDelay(dialog: HTMLDialogElement | null): number {
	const raw = dialog ? getComputedStyle(dialog).getPropertyValue('--_mobilenav-close-ms') : '';
	const ms = parseFloat(raw);
	return Number.isFinite(ms) ? ms : 220;
}

/** MobileNav — the navigation drawer. Inside AppShell its open state comes
 *  from context (and its `id` is shared with the toggle); standalone it
 *  takes `isOpen`/`onOpenChange`. Uses a native `<dialog>` for focus
 *  containment, backdrop, and Escape/cancel semantics. */
export function MobileNav(props: MobileNavProps) @{
	const appShell = useContext(AppShellMobileContext);
	const fallbackId = useId();
	const id = props.id ?? appShell.mobileNavId ?? fallbackId;

	const isControlled = props.isOpen != null;
	const isOpen = isControlled ? props.isOpen : appShell.isMobileNavOpen;

	const onOpenChange = useCallback(
		(next: boolean) => {
			if (props.onOpenChange) {
				props.onOpenChange(next);
			} else if (next) {
				appShell.openMobileNav();
			} else {
				appShell.closeMobileNav();
			}
		},
		[props.onOpenChange, appShell],
	);

	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const closeTimer = useRef<any>(null);
	const prevScrollLock = useRef<string | null>(null);
	const [resolvedSide, setResolvedSide] = useState<'start' | 'end'>(props.side === 'auto' || props.side == null ? 'end' : props.side);

	// Resolve which edge the drawer slides from — `auto` reads the trigger's
	// position (the focused element at open time).
	useEffect(() => {
		if (!isOpen) return;
		const side = props.side ?? 'auto';
		if (side === 'auto') {
			const trigger = document.activeElement as HTMLElement | null;
			if (trigger && trigger !== document.body) {
				const rect = trigger.getBoundingClientRect();
				const center = rect.left + rect.width / 2;
				setResolvedSide(center < window.innerWidth / 2 ? 'start' : 'end');
			}
		} else {
			setResolvedSide(side);
		}
	}, [isOpen, props.side]);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen) {
			if (!dialog.open) {
				try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
			}

			prevScrollLock.current ??= document.documentElement.style.overflow;
			document.documentElement.style.overflow = 'clip';
		} else if (dialog.open || dialog.hasAttribute('open')) {
			document.documentElement.style.overflow = prevScrollLock.current ?? '';
			prevScrollLock.current = null;
			closeTimer.current = setTimeout(() => {
				try { dialog.close(); } catch { dialog.removeAttribute('open'); }
			}, closeDelay(dialog));
		}

		return () => {
			if (closeTimer.current) {
				clearTimeout(closeTimer.current);
				closeTimer.current = null;
			}

			document.documentElement.style.overflow = prevScrollLock.current ?? '';
			prevScrollLock.current = null;
		};
	}, [isOpen]);

	// Unmount safety — close a still-open dialog so a remount can re-open.
	useEffect(() => {
		const dialog = dialogRef.current;
		return () => {
			try {
				if (dialog?.open) dialog.close();
			} catch {}
		};
	}, []);

	const handleCancel = useCallback(
		(e: any) => {
			e.preventDefault?.();
			onOpenChange(false);
		},
		[onOpenChange],
	);

	const handleDialogClick = useCallback(
		(e: any) => {
			if (e.target === e.currentTarget) {
				onOpenChange(false);
			}
		},
		[onOpenChange],
	);

	const ariaLabel = props.label ?? (typeof props.header === 'string' ? props.header : 'Navigation');

	<dialog
		ref={(el: HTMLDialogElement | null) => { dialogRef.current = el; if (el) applyEscapeProps(el, props); }}
		id={id}
		className={['vx-mobilenav', 'vx-mobilenav--' + resolvedSide, isOpen && 'vx-mobilenav--open', props.className]}
		style={{ width: props.width ?? 320, ...props.style }}
		aria-label={ariaLabel}
		onClick={handleDialogClick}
		onCancel={handleCancel}
	>
		<div className="vx-mobilenav-drawer" style={{ width: props.width ?? 320 }}>
			@if (props.header != null) {
				<div className="vx-mobilenav-header">
					{typeof props.header === 'string' ? <Text className="vx-mobilenav-heading">{props.header}</Text> : props.header}
				</div>
			}
			<div className="vx-mobilenav-content">{props.children}</div>
		</div>
	</dialog>
}

/** MobileNavToggle — the hamburger. Renders nothing unless the AppShell
 *  mobile context says the drawer is enabled and mobile layout is active. */
export function MobileNavToggle(props: MobileNavToggleProps) @{
	const { isMobile, isMobileNavEnabled, toggleMobileNav, mobileNavId, isMobileNavOpen } = useAppShellMobile();

	@if (!isMobile || !isMobileNavEnabled) {
		null
	} @else {
		<Button
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={['vx-mobilenav-toggle', props.className]}
			style={props.style}
			accessibilityLabel={props.label ?? 'Open navigation'}
			web={{ 'aria-expanded': isMobileNavOpen, 'aria-controls': mobileNavId, ...props.web }}
			onPress={toggleMobileNav}
		>
			{props.children ?? <Icon name="xplat-menu" size={20} />}
		</Button>
	}
}
