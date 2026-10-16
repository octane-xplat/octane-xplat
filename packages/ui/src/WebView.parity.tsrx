// Measured parity fixtures — assertions live in WebView.parity.check.ts.
import { WebView } from './WebView'
import type { ParityFixture } from './parity'

function WebViewFixture() @{
	<WebView
		className="parity-webview-root"
		style={{ width: 220, height: 120, backgroundColor: '#f5f5f5' }}
		html="<html><body></body></html>"
		scrollEnabled={false}
		accessibilityLabel="Parity document"
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'webview-inline-document', component: 'WebView', renderer: WebViewFixture, props: {}, height: 136 },
]
