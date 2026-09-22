/** @jsxImportSource @nativescript-community/octane */
// Suffix-resolution probe: on iOS this must win over PlatformBadge.native.tsrx.

export function PlatformBadge(props: { className?: any }) @{
	console.log('[badge] ios variant evaluated');
	<label className={props.className} text={"ios"} />
}
