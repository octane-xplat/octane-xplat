import { useState } from 'octane'
import { Dialog, AlertDialog, BottomSheet, Button, Text } from '@octane-xplat/ui'

export function Surfaces() {
  // 1. Track which surface is open and clear it on dismissal.
  const [surface, setSurface] = useState<'dialog' | 'alert' | 'sheet' | null>(null)
  const onOpenChange = (open: boolean) => {
    if (!open) setSurface(null)
  }
  // 2. Let each action open a surface and connect its close callback.
  return (
    <>
      <Button onPress={() => setSurface('dialog')}>Trip details</Button>
      <Button onPress={() => setSurface('alert')}>Remove trip</Button>
      <Button onPress={() => setSurface('sheet')}>Bag details</Button>
      <Dialog isOpen={surface === 'dialog'} onOpenChange={onOpenChange}>
        <Text>Trip details</Text>
      </Dialog>
      <AlertDialog
        isOpen={surface === 'alert'}
        title="Remove trip?"
        actionLabel="Remove"
        onOpenChange={onOpenChange}
        onAction={() => {
          console.log('Confirmed')
          setSurface(null)
        }}
      />
      <BottomSheet label="Bag details" isOpen={surface === 'sheet'} onOpenChange={onOpenChange}>
        <Text>Carry-on</Text>
      </BottomSheet>
    </>
  )
}
