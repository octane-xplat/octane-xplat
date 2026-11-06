/** @jsxImportSource @octane-xplat/jsx */
export default function Actions(props: any) {
  return (
    <masonview style={{ display: 'flex', flexDirection: 'column', width: 240 }}>
      <button id="lease-native" text="Action" isEnabled={props.nativeEnabled} onTap={props.press} />
      <button
        id="lease-clears"
        {...(props.clearButton
          ? {}
          : {
              text: 'Clear me',
              isEnabled: false,
              accessibilityLabel: 'Clear label',
              onTap: props.press,
            })}
      />
      <textfield
        id="lease-field"
        text="Editing"
        editable={props.editable}
        onTextChange={props.edit}
        onSubmit={props.submit}
      />
      <masonview
        id="lease-press"
        accessibilityRole="button"
        accessibilityLabel="Press"
        onTap={props.press}
        accessibilityState={props.state}
        style={{ width: 120, height: 24 }}
      />
      <masonview
        id="lease-ax-only"
        accessibilityRole="adjustable"
        accessibilityLabel="Volume"
        accessibilityValue="5"
        {...{
          onAccessibilityIncrement: props.increment,
          onAccessibilityDecrement: props.decrement,
        }}
        accessibilityState={props.state}
        style={{ width: 120, height: 24 }}
      />
      {/* Match the private span transport used by ui/Text on AppKit. */}
      <label id="lease-link-a">
        <span text="Same" {...{ onLinkTap: props.firstLink }} />
      </label>
      <label id="lease-link-b">
        <span text="Same" {...{ onLinkTap: props.secondLink }} />
      </label>
    </masonview>
  )
}
