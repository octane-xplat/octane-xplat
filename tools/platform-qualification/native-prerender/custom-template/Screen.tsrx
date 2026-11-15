/** @jsxImportSource @octane-xplat/jsx */
import './screen.css'
import { SafeArea, Text, VStack } from '@octane-xplat/ui'

export interface ScreenProps {
  title: string
  items: string[]
}

export function Screen(props: ScreenProps) @{
  <SafeArea id="screen-safe-area">
    <VStack id="screen" className="screen">
      <Text id="screen-title" className="screen-copy">
        {props.title}
      </Text>
      @for (const item of props.items; key item) {
        <Text className="screen-copy">{item}</Text>
      }
    </VStack>
  </SafeArea>
}
