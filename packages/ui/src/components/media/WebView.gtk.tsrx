/** @jsxImportSource @octane-xplat/jsx */
import { useImperativeHandle, useRef } from 'octane'
import type { WebViewProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { layoutChildProps } from '../layout/layout-child'

/** Embedded web document — WebKitGTK 6.0 `WebKit.WebView` through the
 *  renderer's `webview` intrinsic (same stack as the DOM-in-WebKitGTK
 *  Linux runtime). `html` flows through the `html` prop's
 *  `load_html`/`load_uri` split in the renderer; load failures surface on
 *  `load-failed`, which the renderer splits into onLoad/onError. The web
 *  process needs a session D-Bus for WebKitGTK's bubblewrap sandbox —
 *  headless runs without one stall mid-load. */
export function WebView(props: WebViewProps) @{
	const view = useRef<any>(null)
	const currentProps = useRef(props)
	currentProps.current = props
	useImperativeHandle(
		props.ref,
		() => ({
			reload: () => {
				// reload() re-requests the current URL — inline documents would
				// reload about:blank, so they go back through load_html.
				if (currentProps.current.html !== undefined) {
					view.current?.load_html?.(currentProps.current.html, null)
				} else {
					view.current?.reload?.()
				}
			},
			goBack: () => view.current?.go_back?.(),
			goForward: () => view.current?.go_forward?.(),
			stopLoading: () => view.current?.stop_loading?.(),
			get native() {
				return view.current
			},
		}),
		[],
	)

	<webview
		ref={view}
		id={props.id}
		{...layoutChildProps(props, props.style)}
		className={cx('vx-webview', props.className)}
		src={props.src}
		html={props.html}
		scrollEnabled={props.scrollEnabled}
		matchContents={props.matchContents}
		onLoad={props.onLoad}
		onError={props.onError}
		onLayoutContent={props.onLayoutContent}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState}
	/>
}
