import { Button, ToastViewport, useToast, showToast } from '@octane-xplat/ui'

// 1. Send an app action to the nearest mounted toast viewport.
function SaveButton() {
  const toast = useToast()
  return <Button onPress={() => toast({ body: 'Trip saved' })}>Save</Button>
}

// 2. Mount the viewport and show a fallback-routed background notice.
export function SaveNotice() {
  return (
    <>
      <ToastViewport>
        <SaveButton />
      </ToastViewport>
      <Button onPress={() => showToast({ body: 'Background save complete' })}>
        Show background notice
      </Button>
    </>
  )
}
