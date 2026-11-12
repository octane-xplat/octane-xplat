/** @jsxImportSource @octane-xplat/jsx */
// Raw intrinsic control keeps public Text out of the comparison.
export function NativeVisibility() @{
  <masonview>
    <label id="raw-visible" text="Visible" />
    <label id="raw-hidden" text="Hidden" style={{ visibility: 'hidden' }} />
    <label id="raw-class-hidden" text="Class hidden" className="visibility-hidden" />
    <label id="raw-collapse" text="Collapsed" style={{ visibility: 'collapse' }} />
  </masonview>
}
