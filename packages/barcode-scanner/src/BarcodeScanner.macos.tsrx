/** @jsxImportSource @octane-xplat/jsx */
// Live barcode scanner — AppKit stub. Still-image decoding works through
// barcodeScanner.scanImage (Vision); live camera scanning needs an
// AVCaptureVideoDataOutput frame path the camera leaf does not expose yet
// (decision #140). Renders nothing and reports once via onError.
import { useEffect } from 'octane'
import type { BarcodeScannerProps } from './props'

export function BarcodeScanner(props: BarcodeScannerProps): unknown @{
  useEffect(() => {
    props.onError?.({ message: 'unsupported: live barcode scanning is not wired on macOS' })
  }, [])

  <masonview style={props.style} className={props.className} />
}
