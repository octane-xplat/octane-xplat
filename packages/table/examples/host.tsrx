/** @jsxImportSource @octane-xplat/jsx */
/** The probe page needs a registered native root to lay out its subtree. */
export function GridHost(props: { children?: any }) {
	return <rootlayout style={{ width: '100%', height: '100%' }}>{props.children}</rootlayout>
}
