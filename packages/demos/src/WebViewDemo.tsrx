import { useRef, useState } from 'octane';
import { Pressable, HStack, SafeArea, Screen, Text, WebView } from '@octane-xplat/ui';
import type { WebViewHandle } from '@octane-xplat/ui';

// Inline document so the demo works without network; tall enough to prove
// scrollEnabled on both targets.
const INLINE_HTML = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
	body { font-family: system-ui, sans-serif; margin: 16px; }
	.box { border: 1px solid #ccc; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
</style></head><body>
	<h2>Inline HTML</h2>
	<div class="box">This document arrives through the shared <code>html</code> prop — srcdoc on web, loadData on native.</div>
	<div class="box">Row 1 — scroll me</div>
	<div class="box">Row 2 — scroll me</div>
	<div class="box">Row 3 — scroll me</div>
	<div class="box">Row 4 — scroll me</div>
	<div class="box">Row 5 — bottom of content</div>
</body></html>`;

/** WebView seam demo — html/src loading, onLoad/onError reporting,
 *  scrollEnabled, and the imperative handle (reload/back/forward). */
export function WebViewDemo() @{
	const [status, setStatus] = useState('idle');
	const [remote, setRemote] = useState(false);
	const [scroll, setScroll] = useState(true);
	const [matchContents, setMatchContents] = useState(false);
	const [ignoreSafeArea, setIgnoreSafeArea] = useState(false);
	const [contentSize, setContentSize] = useState('not measured');
	const handle = useRef<WebViewHandle | null>(null);

	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-xl font-semibold">WebView</Text>
		<HStack className="demo-menu">
			<Pressable className="btn btn-secondary" onPress={() => { setStatus('loading…'); setRemote(!remote); }}>
				<Text>{remote ? 'Inline HTML' : 'Remote URL'}</Text>
			</Pressable>
			<Pressable className="btn btn-secondary" onPress={() => setScroll(!scroll)}>
				<Text>{scroll ? 'Freeze scroll' : 'Unfreeze scroll'}</Text>
			</Pressable>
			<Pressable className="btn btn-secondary" onPress={() => handle.current?.reload()}>
				<Text>Reload</Text>
			</Pressable>
			<Pressable className="btn btn-secondary" onPress={() => handle.current?.goBack()}>
				<Text>Back</Text>
			</Pressable>
			<Pressable className="btn btn-secondary" onPress={() => setMatchContents(!matchContents)}>
				<Text>{matchContents ? 'Fill frame' : 'Match content height'}</Text>
			</Pressable>
			<Pressable className="btn btn-secondary" onPress={() => setIgnoreSafeArea(!ignoreSafeArea)}>
				<Text>{ignoreSafeArea ? 'Respect safe area' : 'Ignore safe area'}</Text>
			</Pressable>
		</HStack>
		<Text className="text-sm text-muted">{'status: ' + status + ' · content: ' + contentSize}</Text>
		<SafeArea className="flex-1" ignoreSafeArea={ignoreSafeArea}>
			<WebView
				ref={handle}
				className={'webview-demo-frame' + (matchContents ? '' : ' flex-1')}
				html={remote ? undefined : INLINE_HTML}
				src={remote ? 'https://example.com' : undefined}
				scrollEnabled={scroll}
				matchContents={matchContents}
				onLayoutContent={(size) => setContentSize(`${Math.round(size.width)} × ${Math.round(size.height)}`)}
				onLoad={(e) => setStatus('loaded' + (e.url ? ' ' + e.url : ''))}
				onError={(e) => setStatus('error ' + (e.error ?? '') + (e.url ? ' ' + e.url : ''))}
			/>
		</SafeArea>
	</Screen>
}
