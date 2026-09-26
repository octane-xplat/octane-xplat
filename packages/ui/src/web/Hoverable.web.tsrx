import { useEffect, useRef, useState } from 'octane';
import { Popover } from '../Popover.web.tsrx';
import { View } from '../View.web.tsrx';
import type { HoverableProps } from '../props';

type Binding = { node: HTMLElement; enter: () => void; leave: () => void };

/**
 * Delayed hover intent with a card that remains open while the pointer moves
 * through the body portal to the card. `bind` is used instead of delegated
 * events so the anchor and portaled card can be tracked independently.
 *
 * Web-only (the `ui/web` subpath) — hover has no touch-platform semantic and
 * the old native leaf's long-press→popover stand-in was fake parity.
 */
export function Hoverable(props: HoverableProps) @{
	const [open, setOpen] = useState(false);
	const anchor = useRef<any>(null);
	const anchorBinding = useRef<Binding | null>(null);
	const cardBinding = useRef<Binding | null>(null);
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

	const scheduleClose = () => {
		clearClose();
		closeTimer.current = setTimeout(() => {
			closeTimer.current = null;
			setOpen(false);
		}, Math.max(0, props.closeDelay ?? 120));
	};

	const startOpen = () => {
		clearClose();
		clearOpen();
		openTimer.current = setTimeout(() => {
			openTimer.current = null;
			setOpen(true);
		}, Math.max(0, props.openDelay ?? 500));
	};

	const unbind = (binding: Binding | null) => {
		if (!binding) return;
		binding.node.removeEventListener('mouseenter', binding.enter);
		binding.node.removeEventListener('mouseleave', binding.leave);
	};

	const bindAnchor = (node: HTMLElement | null) => {
		anchor.current = node;
		if (anchorBinding.current?.node === node) return;
		unbind(anchorBinding.current);
		anchorBinding.current = null;
		if (!node) return;
		const binding = { node, enter: startOpen, leave: () => { clearOpen(); scheduleClose(); } };
		node.addEventListener('mouseenter', binding.enter);
		node.addEventListener('mouseleave', binding.leave);
		anchorBinding.current = binding;
	};

	const bindCard = (node: HTMLElement | null) => {
		if (cardBinding.current?.node === node) return;
		unbind(cardBinding.current);
		cardBinding.current = null;
		if (!node) return;
		const binding = { node, enter: clearClose, leave: scheduleClose };
		node.addEventListener('mouseenter', binding.enter);
		node.addEventListener('mouseleave', binding.leave);
		cardBinding.current = binding;
	};

	useEffect(() => () => {
		clearOpen();
		clearClose();
		unbind(anchorBinding.current);
		unbind(cardBinding.current);
	}, []);

	<View className={props.className} style={props.style} bind={bindAnchor} web={props.web}>
		{props.children}
		<Popover
			open={open}
			anchor={anchor}
			placement={props.placement ?? 'bottom'}
			dismissOnOutsideTap={false}
		>
			<View bind={bindCard} className={props.cardClassName} style={props.cardStyle}>{props.card}</View>
		</Popover>
	</View>
}
