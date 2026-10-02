/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import { GridLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { LightboxProps, LightboxMedia } from './props';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout';
import { createOverlayLifetime } from './overlay-lifetime';
import { Icon } from './Icon';
import { Pressable } from './Pressable';
import { Text } from './Text';

const clampIndex = (i: number, count: number) =>
	count <= 0 ? 0 : Math.min(Math.max(i, 0), count - 1);

/** The overlay-root body: dark stage, centered media, swipe to navigate,
 *  buttons + counter + caption chrome. */
function LightboxPanel(props: {
	media: LightboxMedia[];
	index: number;
	setIndex: (i: number) => void;
	onClose: () => void;
	hasZoom: boolean;
	ios?: Record<string, any>;
	android?: Record<string, any>;
	className?: any;
}) @{
	const { media, index } = props;
	const count = media.length;
	const item = media[index];
	const [zoomed, setZoomed] = useState(false);
	const isVideo = item?.type === 'video';
	const stage = useRef<any>(null);

	// Pan to pan while zoomed — accumulate translate on the image view.
	const imgView = useRef<any>(null);
	const panAcc = useRef({ x: 0, y: 0 });
	const onStagePan = (e: any) => {
		const el = imgView.current;
		if (!zoomed || !el) return;
		if (e.state === 1) {
			return;
		}

		if (e.state === 0 || e.state === 3) {
			return;
		}

		panAcc.current = { x: e.deltaX, y: e.deltaY };
		el.translateX = e.deltaX;
		el.translateY = e.deltaY;
	};

	const toggleZoom = () => {
		const el = imgView.current;
		const next = !zoomed;
		setZoomed(next);
		if (el?.animate) {
			el.animate({
				scale: next ? { x: 2, y: 2 } : { x: 1, y: 1 },
				translate: { x: 0, y: 0 },
				duration: 160,
			});
		} else if (el) {
			el.scaleX = next ? 2 : 1;
			el.scaleY = next ? 2 : 1;
			el.translateX = 0;
			el.translateY = 0;
		}

		panAcc.current = { x: 0, y: 0 };
	};

	const onSwipe = (e: any) => {
		// SwipeDirection: right=1, left=2
		if (e.direction === 2) {
			props.setIndex(Math.min(index + 1, count - 1));
		} else if (e.direction === 1) {
			props.setIndex(Math.max(index - 1, 0));
		}
	};

	<gridlayout
		ref={(v: any) => {
			stage.current = v;
		}}
		className={cx('vx-lightbox', props.className)}
		rows="*"
		columns="*"
		width="100%"
		height="100%"
		onSwipe={onSwipe}
		onPan={onStagePan}
		accessibilityLabel={item?.alt ?? 'Media viewer'}
	>
		{/* Tap the backdrop edges to close; the centered media eats its own
		 *  taps through the double-tap zoom. */}
		{count > 0 && (
			<gridlayout
				rows="*,auto"
				columns="*"
				verticalAlignment="stretch"
				horizontalAlignment="stretch"
			>
				<gridlayout row={0} verticalAlignment="stretch" horizontalAlignment="stretch">
					{item != null && (
						isVideo ? (
							// No in-package video player — @octane-xplat/video owns the
							// video widget. Honest fallback: show the alt text.
							<flexboxlayout
								flexDirection="column"
								className="vx-lightbox-video-fallback"
								verticalAlignment="middle"
								horizontalAlignment="center"
							>
								<label className="vx-lightbox-caption" textWrap={true}>
									{item.alt}
								</label>
							</flexboxlayout>
						) : (
							<image
								ref={(v: any) => {
									imgView.current = v;
								}}
								src={item.src}
								stretch="aspectFit"
								className="vx-lightbox-media"
								verticalAlignment="middle"
								horizontalAlignment="center"
								accessibilityLabel={item.alt}
								onDoubleTap={props.hasZoom ? toggleZoom : undefined}
							/>
						)
					)}
				</gridlayout>
				<flexboxlayout row={1} flexDirection="row" className="vx-lightbox-footer" justifyContent="space-between" alignItems="center">
					<Pressable
						className="vx-lightbox-nav"
						accessibilityLabel="Previous"
						onPress={() => props.setIndex(Math.max(index - 1, 0))}
						disabled={index <= 0}
					>
						<Icon name="xplat-chevron-left" />
					</Pressable>
					<flexboxlayout flexDirection="column" alignItems="center" flexGrow={1}>
						{count > 1 && <Text className="vx-lightbox-counter">{`${index + 1} of ${count}`}</Text>}
						{item?.caption != null && (
							typeof item.caption === 'string' ? (
								<Text className="vx-lightbox-caption">{item.caption}</Text>
							) : (
								item.caption
							)
						)}
					</flexboxlayout>
					<flexboxlayout flexDirection="row" alignItems="center">
						<Pressable
							className="vx-lightbox-nav"
							accessibilityLabel="Next"
							onPress={() => props.setIndex(Math.min(index + 1, count - 1))}
							disabled={index >= count - 1}
						>
							<Icon name="xplat-chevron-right" />
						</Pressable>
						<Pressable
							className="vx-lightbox-close"
							accessibilityLabel="Close"
							onPress={() => props.onClose()}
						>
							<Icon name="xplat-close" />
						</Pressable>
					</flexboxlayout>
				</flexboxlayout>
			</gridlayout>
		)}
	</gridlayout>
}

/** Full-screen media viewer (Astryx `Lightbox`), native leaf — a dedicated
 *  overlay root on the declaring component's RootLayout, shaded + tap-to-
 *  close through the RootLayout scrim, swipe gestures for prev/next,
 *  double-tap zoom on images. `type:'video'` falls back to alt text — the
 *  video widget lives in the `@octane-xplat/video` leaf package. */
export function Lightbox(props: LightboxProps) @{
	const sentinel = useRef<any>(null);
	const shown = useRef<{
		host: GridLayout;
		root: any;
		lifetime: ReturnType<typeof createOverlayLifetime>;
	} | null>(null);

	const [internal, setInternal] = useState(props.defaultIndex ?? 0);
	const indexRef = useRef(internal);
	const mediaRef = useRef(props.media);
	const dismiss = useRef(props.onOpenChange);
	dismiss.current = props.onOpenChange;
	const onIndexChange = useRef(props.onIndexChange);
	onIndexChange.current = props.onIndexChange;

	const count = props.media.length;
	const index = clampIndex(props.index ?? internal, count);
	indexRef.current = index;
	mediaRef.current = props.media;

	const renderPanel = (root: any) => {
		const panel = (panelProps: any) => (
			<LightboxPanel
				media={mediaRef.current}
				index={indexRef.current}
				setIndex={setIndex}
				onClose={() => dismiss.current(false)}
				hasZoom={props.hasZoom ?? true}
				className={props.className}
			/>
		);

		root.render(panel as unknown as UniversalComponent, {});
	};

	const setIndex = (i: number) => {
		const clamped = clampIndex(i, count);
		if (props.index == null) {
			setInternal(clamped);
		}

		if (clamped !== indexRef.current) {
			onIndexChange.current?.(clamped);
		}

		indexRef.current = clamped;
		if (shown.current) {
			renderPanel(shown.current.root);
		}
	};

	useEffect(() => {
		const cur = shown.current;
		if (!props.isOpen || count === 0) {
			cur?.lifetime.close();
			return;
		}

		if (cur) {
			renderPanel(cur.root);
			return;
		}

		const rl = rootLayoutFor(sentinel.current);
		if (!rl) return;

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, 'vx-lightbox-host');
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		const root = createNativeScriptRoot(host);
		const lifetime = createOverlayLifetime(rl, host, root, 'Lightbox', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) dismiss.current?.(false);
		});

		lifetime.own(unbindTheme);
		shown.current = { host, root, lifetime };
		renderPanel(root);
		lifetime.open({
			shadeCover: { opacity: 0.85, tapToClose: true },
			animation: {
				enterFrom: { opacity: 0, duration: 160 },
				exitTo: { opacity: 0, duration: 140 },
			},
		});
	}, [props.isOpen, props.media, props.index, props.className]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
}
