/** @jsxImportSource @octane-xplat/macos-renderer */
import { useImperativeHandle, useRef } from 'octane'
import type { WebViewProps } from './props'
import { cx } from './cx'
import { layoutChildProps } from './layout-child'

export function WebView(props: WebViewProps) @{
	const view = useRef<any>(null)
	const currentProps = useRef(props)
	currentProps.current = props
	useImperativeHandle(props.ref, () => ({
		reload: () => {
			if (currentProps.current.html !== undefined) {
				view.current?.loadHTMLStringBaseURL(currentProps.current.html, null)
			} else {
				view.current?.reload()
			}
		},
		goBack: () => view.current?.goBack(),
		goForward: () => view.current?.goForward(),
		stopLoading: () => view.current?.stopLoading(),
		get native() { return view.current },
	}), [])

	<webview
		ref={view}
		id={props.id}
		{...layoutChildProps(props)}
		className={cx('vx-webview', props.className)}
		style={props.style}
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
