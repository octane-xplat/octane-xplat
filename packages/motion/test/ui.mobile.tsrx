/** @jsxImportSource @octane-xplat/jsx */
// Host-only primitives isolate universal lifecycle tests from NativeScript's OS runtime.
// `style` is forwarded so first-frame style baking stays observable in emitted props.
export function View(props: any) @{
  <masonview
    ref={props.ref}
    id={props.id}
    onTap={props.onPress}
    style={{ display: 'flex', ...props.style }}
  >
    {props.children}
  </masonview>
}

export { View as Row, View as Pressable }
