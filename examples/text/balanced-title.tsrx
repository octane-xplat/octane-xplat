import { BalancedText, View } from '@octane-xplat/ui'

export function BalancedTitle() @{
  // 1. Give the title and caption a shared width to wrap within.
  <View style={{ maxWidth: 280 }}>
    // 2. Set a heading level so the title is announced as a heading.
    <BalancedText level={2} align="center" text="Make room for the work that matters" />
    // 3. Leave out the heading level for the caption.
    <BalancedText
      align="center"
      color="secondary"
      text="Plan your projects and keep important details close."
    />
  </View>
}
