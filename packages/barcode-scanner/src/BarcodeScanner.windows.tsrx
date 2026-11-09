/** @jsxImportSource @octane-xplat/jsx */
// Live barcode scanner — Windows leaf. No ML Kit camera path exists on
// Windows; renders an empty host and reports once via onError.
import { useEffect } from 'octane'
import type { BarcodeScannerProps } from './props'

export function BarcodeScanner(props: BarcodeScannerProps): unknown @{
  useEffect(() => {
    props.onError?.({ message: 'unsupported: live barcode scanning is not available on windows' })
  }, [])

  <masonview style={props.style} className={props.className} />
}
