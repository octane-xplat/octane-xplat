/** @jsxImportSource @nativescript-community/octane */
export function PropRemoval(props: { text?: string; className?: string; style?: any }) @{
	<masonview flexDirection="column" style={{display: "flex"}}>
		<label id="target" text={props.text} className={props.className} style={props.style} />
	</masonview>
}
