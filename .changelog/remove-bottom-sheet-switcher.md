### Use controlled sheets for multi-step flows

**Breaking change:** `BottomSheetSwitcher`, `BottomSheetSwitcherProps`, and `BottomSheet.sheetId` have been removed. Control each `BottomSheet` with `isOpen` and `onOpenChange`. Put drafts in the parent screen so they survive switching sheets. Each sheet owns its presentation; this change does not add Astryx’s animated sheet handoff.

```tsx
import { useState } from 'octane'
import { BottomSheet, Button } from '@octane-xplat/ui'

export function ShippingFlow() {
  const [step, setStep] = useState<string | null>(null)
  const closeStep = (id: string) => (open: boolean) => {
    if (!open) setStep(current => current === id ? null : current)
  }

  return <>
    <Button clickAction={() => setStep('shipping')}>Start</Button>
    <BottomSheet label="Shipping" isOpen={step === 'shipping'} onOpenChange={closeStep('shipping')}>
      <Button clickAction={() => setStep('payment')}>Continue</Button>
    </BottomSheet>
    <BottomSheet label="Payment" isOpen={step === 'payment'} onOpenChange={closeStep('payment')}>
      <Button clickAction={() => setStep(null)}>Done</Button>
    </BottomSheet>
  </>
}
```

[Bottom sheet examples](https://octane-xplat.goddardai.org/primitives#keep-drafts-when-switching-panels)
