import type { WebViewHandle, WebViewProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';

/** Matches what NS WebView content can already do — scripts, forms, modal
 *  dialogs, its own origin — while top navigation, popups, and downloads
 *  stay contained. `sandbox`/`web.sandbox` override. */
const DEFAULT_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-modals';

/** Embedded web document — a sandboxed <iframe>. `html` renders through
 *  `srcdoc` and wins over `src` when both are set. The iframe `error`
 *  event is unreliable cross-browser, so `onError` is best-effort here. */
export function WebView(props: WebViewProps) @{
	const handle = (el: any): WebViewHandle => ({
		reload: () => {
			try {
				// Same-origin and srcdoc frames reload in place.
				el.contentWindow.location.reload();
			} catch {
				// Cross-origin frame — re-request the document instead.
				if (el.src) el.src = el.src;
			}
		},
		// history navigation is allowed cross-origin; location/stop are not.
		goBack: () => el.contentWindow?.history.back(),
		goForward: () => el.contentWindow?.history.forward(),
		stopLoading: () => {
			try {
				el.contentWindow?.stop();
			} catch { /* cross-origin frames can't be stopped */ }
		},
		native: el,
	});

	<iframe
		ref={(el: any) => {
			if (!el) return;
			applyEscapeProps(el, props);
			props.bind?.(handle(el));
		}}
		id={props.id}
		className={['vx-webview', props.className]}
		{...layoutChildProps(props)}
		srcDoc={props.html}
		src={props.html === undefined ? props.src : undefined}
		sandbox={props.sandbox === false ? undefined : props.sandbox ?? DEFAULT_SANDBOX}
		scrolling={props.scrollEnabled === false ? 'no' : undefined}
		title={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		onLoad={(e: any) => props.onLoad?.({ url: props.html === undefined ? e.currentTarget?.src : undefined })}
		onError={(e: any) => props.onError?.({ url: props.html === undefined ? e.currentTarget?.src : undefined, error: 'iframe failed to load' })}
	/>
}
