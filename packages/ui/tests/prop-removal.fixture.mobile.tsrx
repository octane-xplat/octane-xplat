/** @jsxImportSource @nativescript-community/octane */
export function PropRemoval(props: { text?: string; className?: string; style?: any }) @{
	<stacklayout>
		<label id="target" text={props.text} className={props.className} style={props.style} />
	</stacklayout>
}
