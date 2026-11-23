import { useSignal$ } from 'octane/signals/client'
import { Pressable, Text, View, useClipboard } from '@octane-xplat/ui'

export function CopyTextDemo() @{
  // 1. Prepare text to copy and record whether the attempt failed.
  const failed$ = useSignal$(false)
  const { clipboardProps, isCopied } = useClipboard({
    getItems: () => 'Hello from Xplat',
    announce: 'Copied',
    onCopy: (success) => failed$.set(!success),
  })

  // 2. Apply the returned props and show the result to the user.
  <View>
    <Pressable {...clipboardProps}>
      <Text>{isCopied ? 'Copied' : 'Copy greeting'}</Text>
    </Pressable>
    @if (failed$.get() && !isCopied) {
      <Text>Copy unavailable</Text>
    }
  </View>
}
