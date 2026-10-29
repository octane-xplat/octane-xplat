/** @jsxImportSource @octane-xplat/jsx */
import { isAndroid, isIOS } from '@nativescript/core'
import { useImperativeHandle, useEffect, useRef } from 'octane'
import type { WebViewProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { layoutChildProps } from '../layout/layout-child'
import { android } from '@octane-xplat/platform/android'
import { WEBVIEW_DRAIN_SCRIPT, parseMessageBatch } from './webview-post'

/** `postToHost` queues `window.__xplatWebViewOutbox`; the leaf drains it on
 *  a poll because the NS WebView leaves no JS-reachable push channel —
 *  a JS-defined WKScriptMessageHandler crashes the iOS host at dispatch
 *  (see .agents/docs/parity/hosted-engine-editor.md). */
const MESSAGE_POLL_MS = 200

function evaluateScript(view: any, script: string, onValue: (value: any) => void) {
	if (isIOS) {
		view?.ios?.evaluateJavaScriptCompletionHandler?.(script, (value: any, error: any) => {
			if (!error) {
				onValue(value)
			}
		})
	} else if (isAndroid) {
		view?.android?.evaluateJavascript?.(
			script,
			new android.webkit.ValueCallback({
				onReceiveValue: (value: any) => onValue(value),
			}),
		)
	}
}

function reportContentLayout(view: any, props: WebViewProps) {
	let width = Number(view?.getActualSize?.()?.width ?? 0)
	let height = 0
	if (isIOS) {
		const size = view?.ios?.scrollView?.contentSize
		width = Number(size?.width ?? width)
		height = Number(size?.height ?? 0)
	} else if (isAndroid) {
		height =
			Number(view?.android?.getContentHeight?.() ?? 0) * Number(view?.android?.getScale?.() ?? 1)
	}

	if (!Number.isFinite(width) || !Number.isFinite(height) || height <= 0) {
		return
	}

	props.onLayoutContent?.({ width, height })
	if (props.matchContents) {
		view.height = height
		view.style.height = height
	}
}

function applyNativeScrollEnabled(view: any, enabled: boolean | undefined) {
	if (isIOS) {
		const scrollView = view?.ios?.scrollView
		if (scrollView) {
			scrollView.scrollEnabled = enabled !== false
		}
	} else if (isAndroid) {
		const nativeView = view?.android
		if (!nativeView?.setOnTouchListener) {
			return
		}

		nativeView.setOnTouchListener(
			enabled === false
				? new android.view.View.OnTouchListener({
						onTouch: (_view: any, event: any) =>
							event.getActionMasked() === android.view.MotionEvent.ACTION_MOVE,
					})
				: null,
		)
	}
}

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
	const el = useRef<any>(null)
	const loaded = useRef(false)
	const currentProps = useRef(props)
	currentProps.current = props
	// Bumped on each main-frame navigation so in-flight drains from a dead
	// document never emit into the new session.
	const generation = useRef(0)
	const lastUrl = useRef<string | undefined>(undefined)

	const drainOutbox = () => {
		const view = el.current
		const atGeneration = generation.current
		if (!view || !loaded.current) {
			return
		}

		evaluateScript(view, WEBVIEW_DRAIN_SCRIPT, (value) => {
			if (generation.current !== atGeneration || value == null) {
				return
			}

			// Android's ValueCallback carries the result JSON-encoded;
			// iOS hands the evaluated value through directly.
			const batch = parseMessageBatch(value, isAndroid)
			if (!batch?.length) {
				return
			}

			const latest = currentProps.current
			const url = latest.html === undefined ? lastUrl.current : undefined
			for (const data of batch) {
				latest.onMessage?.({ data, url })
			}
		})
	}

	const wantsMessages = props.onMessage !== undefined
	useEffect(() => {
		if (!wantsMessages) {
			return
		}

		const timer = setInterval(drainOutbox, MESSAGE_POLL_MS)
		return () => clearInterval(timer)
	}, [wantsMessages])

	useEffect(() => {
		const v = el.current
		if (!v) {
			return
		}

		applyNativeScrollEnabled(v, props.scrollEnabled)
		if (props.matchContents && loaded.current) {
			reportContentLayout(v, props)
		}
	}, [props.scrollEnabled, props.matchContents])

	useImperativeHandle(
		props.ref,
		() => ({
			reload: () => el.current.reload(),
			goBack: () => el.current.goBack(),
			goForward: () => el.current.goForward(),
			stopLoading: () => el.current.stopLoading(),
			native: el.current,
		}),
		[],
	)

	<webview
		ref={(v: any) => {
			el.current = v
			if (!v) {
				return
			}

			applyEscapeProps(v, props)
		}}
		id={props.id}
		{...layoutChildProps(props, props.style)}
		className={cx('vx-webview', props.className)}
		src={props.html !== undefined ? props.html : props.src}
		onLoaded={() => applyNativeScrollEnabled(el.current, props.scrollEnabled)}
		onLoadStarted={() => {
			generation.current++
			loaded.current = false
			lastUrl.current = undefined
		}}
		onLoadFinished={(e: any) => {
			applyNativeScrollEnabled(e.object ?? el.current, props.scrollEnabled)
			if (e.error) {
				props.onError?.({ url: e.url, error: e.error })
			} else {
				loaded.current = true
				lastUrl.current = e.url
				reportContentLayout(e.object ?? el.current, props)
				props.onLoad?.({ url: e.url })
				drainOutbox()
			}
		}}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState)}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
	/>
}
