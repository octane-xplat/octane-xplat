import { createPortal, useEffect, useState } from 'octane';
import type { PopoverProps } from './props';
import { cx } from './cx';

type Position = { top: number; left: number };

/** Positions a body portal from the anchor's viewport rectangle. */
export function Popover(props: PopoverProps) @{
	const [position, setPosition] = useState<Position | null>(null);
	const anchor = props.anchor?.current ?? props.anchor;
	useEffect(() => {
		if (!props.open || !anchor?.getBoundingClientRect) { setPosition(null); return; }
		const update = () => {
			const rect = anchor.getBoundingClientRect();
			const gap = 8;
			let top = rect.bottom + gap;
			let left = rect.left;
			if (props.placement === 'top') top = rect.top - gap;
			if (props.placement === 'left') { top = rect.top; left = rect.left - gap; }
			if (props.placement === 'right') { top = rect.top; left = rect.right + gap; }
			setPosition({ top, left });
		};
		update();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
		};
	}, [props.open, anchor, props.placement]);
	@if (props.open && position) {
		<>{createPortal(
			<div className={cx('vx-popover', props.className)} style={{ ...props.style, position: 'fixed', top: position.top, left: position.left, transform: props.placement === 'top' ? 'translateY(-100%)' : props.placement === 'left' ? 'translateX(-100%)' : undefined }} {...props.web}>
				{props.children}
			</div>,
			document.body,
		)}</>
	}
}
