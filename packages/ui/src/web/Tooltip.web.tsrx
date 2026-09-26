import { useEffect, useRef, useState } from 'octane';
import { Popover } from '../Popover.web.tsrx';
import { View } from '../View.web.tsrx';
import type { TooltipProps } from '../props';
import { cx } from '../cx';

let nextTooltipId = 0;

const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex],[contenteditable="true"]';

type Binding = {
	node: HTMLElement;
	enter: () => void;
	leave: () => void;
	focusIn: (event: FocusEvent) => void;
	focusOut: () => void;
};

/**
 * Delayed hover-intent tooltip anchored through Popover. `focusin`/`focusout`
 * bubble, so keyboard focus on a focusable child opens it without forcing a
 * tab stop on the wrapper; while open the resolved focusable element gets
 * `aria-describedby` pointing at the `role="tooltip"` panel. Escape, blur,
 * and scroll (capture, so nested scrollers count) dismiss.
 *
 * Web-only (the `ui/web` subpath) — hover/focus intent has no touch-platform
 * semantic and a long-press stand-in would repeat the Hoverable trap
 * (decision #47).
 */
export function Tooltip(props: TooltipProps) @{
	const [open, setOpen] = useState(false);
	const anchor = useRef<HTMLElement | null>(null);
	const binding = useRef<Binding | null>(null);
	const described = useRef<HTMLElement | null>(null);
	const tooltipId = useRef<string>('');
	if (!tooltipId.current) tooltipId.current = `vx-tooltip-${++nextTooltipId}`;
	const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearOpen = () => {
		if (openTimer.current !== null) clearTimeout(openTimer.current);
		openTimer.current = null;
	};

	const clearClose = () => {
		if (closeTimer.current !== null) clearTimeout(closeTimer.current);
		closeTimer.current = null;
	};

	const startOpen = () => {
		if (props.disabled) return;
		clearClose();
		clearOpen();
		openTimer.current = setTimeout(() => {
			openTimer.current = null;
			setOpen(true);
		}, Math.max(0, props.openDelay ?? 500));
	};

	const scheduleClose = () => {
		clearClose();
		closeTimer.current = setTimeout(() => {
			closeTimer.current = null;
			setOpen(false);
		}, Math.max(0, props.closeDelay ?? 100));
	};

	const openNow = () => {
		if (props.disabled) return;
		clearClose();
		clearOpen();
		setOpen(true);
	};

	const closeNow = () => {
		clearOpen();
		clearClose();
		setOpen(false);
	};

	const bindAnchor = (node: HTMLElement | null) => {
		anchor.current = node;
		if (binding.current?.node === node) return;
		const old = binding.current;
		if (old) {
			old.node.removeEventListener('mouseenter', old.enter);
			old.node.removeEventListener('mouseleave', old.leave);
			old.node.removeEventListener('focusin', old.focusIn);
			old.node.removeEventListener('focusout', old.focusOut);
		}

		binding.current = null;
		if (!node) return;
		const next: Binding = {
			node,
			enter: startOpen,
			leave: () => { clearOpen(); scheduleClose(); },
			focusIn: openNow,
			focusOut: closeNow,
		};

		node.addEventListener('mouseenter', next.enter);
		node.addEventListener('mouseleave', next.leave);
		node.addEventListener('focusin', next.focusIn);
		node.addEventListener('focusout', next.focusOut);
		binding.current = next;
	};

	useEffect(() => () => {
		clearOpen();
		clearClose();
		const current = binding.current;
		if (current) {
			current.node.removeEventListener('mouseenter', current.enter);
			current.node.removeEventListener('mouseleave', current.leave);
			current.node.removeEventListener('focusin', current.focusIn);
			current.node.removeEventListener('focusout', current.focusOut);
		}
	}, []);

	useEffect(() => {
		if (!open) return;
		const host = anchor.current;
		const target = (host?.matches?.(FOCUSABLE) ? host : host?.querySelector?.(FOCUSABLE) ?? host) as HTMLElement | null;
		if (target) {
			target.setAttribute('aria-describedby', tooltipId.current);
			described.current = target;
		}

		const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeNow(); };
		const onScroll = () => closeNow();
		window.addEventListener('keydown', onKey);
		window.addEventListener('scroll', onScroll, true);
		return () => {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('scroll', onScroll, true);
			described.current?.removeAttribute('aria-describedby');
			described.current = null;
		};
	}, [open]);

	<View className={props.className} style={props.style} bind={bindAnchor} web={props.web}>
		{props.trigger}
		<Popover
			open={open}
			anchor={anchor}
			placement={props.placement ?? 'top'}
			dismissOnOutsideTap={false}
			className={cx('vx-tooltip', props.contentClassName)}
			style={{ pointerEvents: 'none', ...props.contentStyle }}
			web={{ role: 'tooltip', id: tooltipId.current }}
		>
			{props.content}
		</Popover>
	</View>
}
