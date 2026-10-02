/** @jsxImportSource @nativescript-community/octane */
/** The probe page needs a registered native root to lay out its subtree. */
export function GridHost(props: { children?: any }) {
	return <rootlayout width="100%" height="100%">{props.children}</rootlayout>
}
