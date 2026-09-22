/** @jsxImportSource @nativescript-community/octane */
// Suffix-resolution probe: on Android this must win over
// PlatformBadge.native.tsrx (untested — no Android SDK in this env yet).

export function PlatformBadge(props: { className?: any }) @{
	console.log('[badge] android variant evaluated');
	<label className={props.className} text={"android"} />
}
