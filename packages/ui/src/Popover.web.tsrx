import { createPortal, useEffect, useRef, useState } from 'octane';
import type { PopoverProps } from './props';
import { cx } from './cx';
import { positionPopover } from './popover-position';

type Position = { left: number; top: number };

function PopoverLayer(props: PopoverProps & { anchorElement: any }) @{
	const panelRef = useRef<any>(null);
	const [position, setPosition] = useState<Position | null>(null);
	const update = () => {
		const anchor = props.anchorElement;
		if (!anchor?.getBoundingClientRect) return;
		const anchorRect = anchor.getBoundingClientRect();
		const panelRect = panelRef.current?.getBoundingClientRect?.();
		const placed = positionPopover(
			{
				left: anchorRect.left,
				top: anchorRect.top,
				width: anchorRect.width,
				height: anchorRect.height,
			},
			{ width: panelRect?.width ?? 0, height: panelRect?.height ?? 0 },
			{ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
			props.placement ?? 'bottom',
		);
		setPosition((current) =>
			current?.left === placed.left && current?.top === placed.top
				? current
				: placed,
		);
	};
	useEffect(() => {
		if (!props.open || !props.anchorElement?.getBoundingClientRect) {
			setPosition(null);
			return;
		}
		update();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		const observer = typeof ResizeObserver === 'undefined' || !panelRef.current
			? null
			: new ResizeObserver(update);
		if (observer && panelRef.current) observer.observe(panelRef.current);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
			observer?.disconnect();
		};
	}, [props.open, props.anchorElement, props.placement, props.children, position === null]);
	const stopPointer = (event: PointerEvent) => event.stopPropagation();
	const dismiss = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		props.onDismiss?.();
	};
	@if (props.open && position) {
		<>{createPortal(
		<div
			className="vx-popover-layer"
			style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}
		>
			{(props.dismissOnOutsideTap ?? true) && <div
				className="vx-popover-backdrop"
				style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}
				onPointerDown={stopPointer}
				onClick={dismiss}
			/>}
			<div
				ref={panelRef}
				className={cx('vx-popover', props.className)}
				style={{
					...props.style,
					position: 'fixed',
					top: position.top,
					left: position.left,
					zIndex: 1,
					pointerEvents: 'auto',
				}}
				{...props.web}
			>
				{props.children}
			</div>
			</div>,
			document.body,
		)}</>
	}
}

/** Positions a body portal from its anchor and dismisses on outside taps. */
export function Popover(props: PopoverProps) @{
	const [anchorElement, setAnchorElement] = useState<any>(null);
	useEffect(() => {
		const next = props.anchor?.current ?? null;
		if (next !== anchorElement) setAnchorElement(next);
	}, [props.anchor, props.open, anchorElement]);
	@if (props.open && anchorElement) {
		<PopoverLayer {...props} anchorElement={anchorElement} />
	}
}
