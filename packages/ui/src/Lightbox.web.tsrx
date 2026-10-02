import { createPortal, useCallback, useEffect, useRef, useState } from 'octane';
import type { LightboxMedia, LightboxProps } from './props';
import { cx } from './cx';
import { isolateModalFocus } from './modal-focus.web';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';
import { Text } from './Text.web.tsrx';

const clampIndex = (i: number, count: number) =>
	count <= 0 ? 0 : Math.min(Math.max(i, 0), count - 1);

/** The open viewer — rendered once per Lightbox while `isOpen`. Handles
 *  keyboard nav, scroll lock, focus isolation, and image zoom/pan. */
function LightboxLayer(props: {
	media: LightboxMedia[];
	index: number;
	setIndex: (i: number) => void;
	onClose: () => void;
	hasZoom: boolean;
	hasAutoPlay: boolean;
	finalFocusRef?: { current: any };
	className?: any;
	style?: any;
	id?: string;
	web?: Record<string, any>;
}) @{
	const { media, index } = props;
	const count = media.length;
	const item = media[index];
	const layer = useRef<HTMLDivElement | null>(null);
	const stage = useRef<HTMLDivElement | null>(null);
	const imgEl = useRef<HTMLImageElement | null>(null);
	const [zoomed, setZoomed] = useState(false);
	const pan = useRef({ x: 0, y: 0 });
	const drag = useRef<{ x: number; y: number } | null>(null);
	const onClose = useRef(props.onClose);
	onClose.current = props.onClose;
	const setIndex = useRef(props.setIndex);
	setIndex.current = props.setIndex;

	const isVideo = item?.type === 'video';
	const zoomOn = (props.hasZoom ?? true) && !isVideo;

	const next = useCallback(() => {
		setIndex.current(clampIndex(props.index + 1, count) === props.index ? props.index : props.index + 1);
	}, [props.index, count]);

	const prev = useCallback(() => {
		setIndex.current(props.index - 1 >= 0 ? props.index - 1 : props.index);
	}, [props.index]);

	useEffect(() => {
		const el = layer.current;
		const panel = stage.current;
		if (!el || !panel) return;

		const restoreScroll = document.documentElement.style.overflow || '';
		document.documentElement.style.overflow = 'hidden';
		const releaseFocus = isolateModalFocus(el, panel, () => {
			const target = props.finalFocusRef?.current;
			onClose.current();
		});

		const rtl = getComputedStyle(el).direction === 'rtl';
		const onKey = (event: KeyboardEvent) => {
			if (event.isComposing) return;
			const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
			const back = rtl ? 'ArrowRight' : 'ArrowLeft';
			if (event.key === fwd) {
				setIndex.current(Math.min(index + 1, count - 1));
			} else if (event.key === back) {
				setIndex.current(Math.max(index - 1, 0));
			}
		};

		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
			releaseFocus();
			document.documentElement.style.overflow = restoreScroll;
			const target = props.finalFocusRef?.current;
			if (target && typeof target.focus === 'function' && target.isConnected !== false) {
				target.focus({ preventScroll: true });
			}
		};
	}, [index, count]);

	// Zoom: click toggles 1↔2.5, drag pans while zoomed.
	const applyZoom = (on: boolean, keepPan = false) => {
		const el = imgEl.current;
		if (!el) return;
		setZoomed(on);
		if (!keepPan) {
			pan.current = { x: 0, y: 0 };
		}

		el.style.transform = on
			? `scale(2.5) translate(${pan.current.x}px, ${pan.current.y}px)`
			: '';

		el.style.cursor = on ? 'grab' : 'zoom-in';
	};

	const onMediaClick = () => {
		if (zoomOn) {
			applyZoom(!zoomed);
		}
	};

	const onPointerDown = (event: PointerEvent) => {
		if (!zoomed || !imgEl.current) return;
		drag.current = { x: event.clientX, y: event.clientY };
		imgEl.current.setPointerCapture?.(event.pointerId);
		imgEl.current.style.cursor = 'grabbing';
	};

	const onPointerMove = (event: PointerEvent) => {
		const start = drag.current;
		const el = imgEl.current;
		if (!start || !el) return;
		pan.current = {
			x: pan.current.x + (event.clientX - start.x) / 2.5,
			y: pan.current.y + (event.clientY - start.y) / 2.5,
		};

		drag.current = { x: event.clientX, y: event.clientY };
		el.style.transform = `scale(2.5) translate(${pan.current.x}px, ${pan.current.y}px)`;
	};

	const onPointerUp = () => {
		drag.current = null;
		if (imgEl.current) {
			imgEl.current.style.cursor = zoomed ? 'grab' : 'zoom-in';
		}
	};

	return (
		<div
			ref={layer}
			id={props.id}
			className={cx('vx-lightbox-layer', props.className)}
			style={props.style}
			role="dialog"
			aria-modal={true}
			aria-label={item?.alt ?? 'Media viewer'}
			onClick={(e: MouseEvent) => {
				if (e.target === e.currentTarget) {
					onClose.current();
				}
			}}
			{...props.web}
		>
			<div ref={stage} className="vx-lightbox-stage" tabIndex={-1}>
				{item != null && (
					isVideo ? (
						<video
							className="vx-lightbox-media"
							src={item.src}
							controls
							autoPlay={props.hasAutoPlay}
							aria-label={item.alt}
						/>
					) : (
						<img
							ref={imgEl}
							className="vx-lightbox-media"
							src={item.src}
							alt={item.alt}
							draggable={false}
							style={{ cursor: zoomOn ? (zoomed ? 'grab' : 'zoom-in') : undefined }}
							onClick={onMediaClick}
							onPointerDown={onPointerDown}
							onPointerMove={onPointerMove}
							onPointerUp={onPointerUp}
							onPointerCancel={onPointerUp}
						/>
					)
				)}
				{count > 1 && (
					<>
						<Pressable
							className="vx-lightbox-nav vx-lightbox-prev"
							accessibilityLabel="Previous"
							onPress={() => setIndex.current(Math.max(index - 1, 0))}
							disabled={index <= 0}
						>
							<Icon name="xplat-chevron-left" />
						</Pressable>
						<Pressable
							className="vx-lightbox-nav vx-lightbox-next"
							accessibilityLabel="Next"
							onPress={() => setIndex.current(Math.min(index + 1, count - 1))}
							disabled={index >= count - 1}
						>
							<Icon name="xplat-chevron-right" />
						</Pressable>
					</>
				)}
				<Pressable
					className="vx-lightbox-close"
					accessibilityLabel="Close"
					onPress={() => onClose.current()}
				>
					<Icon name="xplat-close" />
				</Pressable>
				{count > 1 && (
					<div className="vx-lightbox-counter" aria-live="polite">
						{index + 1} of {count}
					</div>
				)}
				{item?.caption != null && (
					<div className="vx-lightbox-caption">
						{typeof item.caption === 'string' ? <Text>{item.caption}</Text> : item.caption}
					</div>
				)}
			</div>
		</div>
	);
}

/** Full-screen media viewer (Astryx `Lightbox`), web leaf — portal layer
 *  with platform focus trap/scroll lock, keyboard navigation
 *  (Escape/←/→), backdrop click, click-zoom + drag-pan on images. */
export function Lightbox(props: LightboxProps) @{
	const [internal, setInternal] = useState(props.defaultIndex ?? 0);
	const count = props.media.length;
	const index = clampIndex(props.index ?? internal, count);
	const setIndex = (i: number) => {
		const clamped = clampIndex(i, count);
		if (props.index == null) {
			setInternal(clamped);
		}

		if (clamped !== index) {
			props.onIndexChange?.(clamped);
		}
	};

	@if (props.isOpen && count > 0) {
		<>{createPortal(
			<LightboxLayer
				media={props.media}
				index={index}
				setIndex={setIndex}
				onClose={() => props.onOpenChange(false)}
				hasZoom={props.hasZoom ?? true}
				hasAutoPlay={props.hasAutoPlay ?? false}
				finalFocusRef={props.finalFocusRef}
				className={props.className}
				style={props.style}
				id={props.id}
				web={props.web}
			/>,
			document.body,
		)}</>
	}
}
