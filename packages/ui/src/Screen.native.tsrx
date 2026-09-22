/** @jsxImportSource @nativescript-community/octane */
// The screen shell is a RootLayout so getRootLayout().open() can layer
// overlays over it (decision #22).
export function Screen(props: { className?: any; style?: any; children?: any }) @{
	<rootlayout className={props.className} style={props.style}>
		{props.children}
	</rootlayout>
}
