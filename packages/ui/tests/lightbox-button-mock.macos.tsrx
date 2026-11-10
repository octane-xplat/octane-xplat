/** @jsxImportSource @octane-xplat/jsx */
export function Button(props: {
  accessibilityLabel?: string
  onPress?: () => void
  children?: unknown
}) {
  return (
    <masonview accessibilityLabel={props.accessibilityLabel} onTap={props.onPress}>
      {props.children}
    </masonview>
  )
}
