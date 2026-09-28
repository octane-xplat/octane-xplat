/** @jsxImportSource @nativescript-community/octane */
import { isAndroid, isIOS } from '@nativescript/core';
import { useEffect, useRef } from 'octane';
import type { WebViewProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { layoutChildProps } from './layout-child';

/** Embedded web document — NS <webview> (WKWebView / android.webkit.WebView).
 *  `html` flows through the `src` property: values that aren't http/file
 *  URLs take its `_loadData` path. NS reports failures as `loadFinished`
 *  with an `error` field — there is no separate error event, so the leaf
 *  splits it into onLoad/onError.
 *  `scrollEnabled={false}` is leaf-applied, not an NS prop: iOS clears the
 *  WKWebView scrollView's scrollEnabled; Android has no settings flag, so
 *  a touch listener eats ACTION_MOVE (DOWN/UP still reach the page, so
 *  link taps work but drag text selection inside the frame does not). */
export function WebView(props: WebViewProps) @{
	const el = useRef<any>(null);
	useEffect(() => {
		const v = el.current;
		if (!v) return;
		if (isIOS) {
			v.ios.scrollView.scrollEnabled = props.scrollEnabled !== false;
		} else if (isAndroid) {
			v.android.setOnTouchListener(props.scrollEnabled === false
				? new android.view.View.OnTouchListener({
						onTouch: (_view: any, event: any) =>
							event.getActionMasked() === android.view.MotionEvent.ACTION_MOVE,
					})
				: null);
		}
	}, [props.scrollEnabled]);

	<webview
		ref={(v: any) => {
			el.current = v;
			if (!v) return;
			applyEscapeProps(v, props);
			props.bind?.({
				reload: () => v.reload(),
				goBack: () => v.goBack(),
				goForward: () => v.goForward(),
				stopLoading: () => v.stopLoading(),
				native: v,
			});
		}}
		id={props.id}
		{...layoutChildProps(props)}
		className={cx('vx-webview', props.className)}
		style={props.style}
		src={props.html !== undefined ? props.html : props.src}
		onLoadFinished={(e: any) => {
			if (e.error) props.onError?.({ url: e.url, error: e.error });
			else props.onLoad?.({ url: e.url });
		}}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	/>
}
