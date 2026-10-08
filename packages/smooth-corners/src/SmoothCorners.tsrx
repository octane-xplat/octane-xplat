/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef } from 'octane';
import { isIOS } from '@nativescript/core';
import { applySmoothClip as applyIosClip, applySmoothShadow as applyIosShadow } from './apply.ios';
import { applySmoothClip as applyAndroidClip, applySmoothShadow as applyAndroidShadow } from './apply.android';
import { outerLayoutProps, paintedStyle } from './layout-child';
import type { SmoothCornersProps } from './props';

const applyClip = isIOS ? applyIosClip : applyAndroidClip;
const applyShadow = isIOS ? applyIosShadow : applyAndroidShadow;

/** SmoothCorners — one generated corner curve, clipped natively.
 *  Two nested gridlayouts: the inner carries the clip (layer mask on iOS,
 *  drawable+outline on Android); the outer carries the iOS drop shadow
 *  (a masked layer can't show its own). Radius comes from `corners`, not
 *  `border-radius`. Parent-layout metadata lands on the outer grid — the
 *  node the parent reads as its child. The flex-container props are
 *  web/macOS-only here: the inner host is a gridlayout, which has no flex
 *  vocabulary. */
export function SmoothCorners(props: SmoothCornersProps) @{
	const state = useRef<{ inner: any; outer: any; props: SmoothCornersProps }>({
		inner: null,
		outer: null,
		props,
	});

	state.current.props = props;

	const apply = useCallback(() => {
		const s = state.current;
		if (s.inner) applyClip(s.inner, s.props);
		if (s.outer) applyShadow(s.outer, s.props);
	}, []);

	const bind = useCallback(
		(which: 'inner' | 'outer') => (view: any) => {
			const s = state.current;
			const prev = s[which];
			if (prev && prev !== view) {
				prev.off?.('loaded', apply);
				prev.off?.('layoutChanged', apply);
			}

			s[which] = view;
			if (!view) return;
			view.on?.('loaded', apply);
			view.on?.('layoutChanged', apply);
			apply();
		},
		[apply],
	);

	const bindInner = useRef(bind('inner'));
	const bindOuter = useRef(bind('outer'));

	// Prop changes without a layout event still need a re-clip.
	useEffect(() => apply());

	return (
		<gridlayout ref={bindOuter.current} {...outerLayoutProps(props)}>
			<gridlayout
				ref={bindInner.current}
				id={props.id}
				className={props.className}
				style={paintedStyle(props.style)}
			>
				{props.children}
			</gridlayout>
		</gridlayout>
	);
}
