/** @jsxImportSource @octane-xplat/jsx */
export function Button(props: {
  accessibilityLabel?: string
  clickAction?: () => void
  children?: unknown
}) {
  return (
    <masonview accessibilityLabel={props.accessibilityLabel} onTap={props.clickAction}>
      {props.children}
    </masonview>
  )
}
