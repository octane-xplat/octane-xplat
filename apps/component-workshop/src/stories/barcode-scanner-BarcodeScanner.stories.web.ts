import { BarcodeScanner as Example } from '@octane-xplat/barcode-scanner'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'barcode-scanner-barcodescanner/basic',
  title: 'BarcodeScanner (barcode-scanner) / Basic',
  componentId: '@octane-xplat/barcode-scanner#BarcodeScanner',
  targets: ['web'],
  capabilities: ['camera-and-barcode-support'],
  component: Example,
  args: {},
})
