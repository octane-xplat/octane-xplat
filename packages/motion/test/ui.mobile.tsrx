/** @jsxImportSource @nativescript-community/octane */
// Host-only primitives isolate universal lifecycle tests from NativeScript's OS runtime.
export function View(props: any) @{
	<masonview display="flex" ref={props.ref} id={props.id} onTap={props.onPress}>{props.children}</masonview>
}

export { View as Row, View as Pressable }
