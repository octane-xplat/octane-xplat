/** @jsxImportSource @octane-xplat/jsx */
import './screen.css'
import {
  Button,
  HStack,
  Pressable,
  SafeArea,
  Screen as ScreenShell,
  ScrollableArea,
  Text,
  View,
  VStack,
} from '@octane-xplat/ui'

export interface ScreenProps {
  title: string
  items: string[]
}

export function Screen(props: ScreenProps) @{
  <ScreenShell id="screen-shell">
    <SafeArea id="screen-safe-area">
      <VStack id="screen" className="screen">
        <View id="screen-header" className="screen-header">
          <Text id="screen-title" className="screen-copy">
            {props.title}
          </Text>
        </View>
        <ScrollableArea id="screen-list" className="screen-list">
          @for (const item of props.items; key item) {
            <Text className="screen-copy">{item}</Text>
          }
        </ScrollableArea>
        <Pressable
          id="screen-action"
          className="screen-action"
          accessibilityLabel="Template action"
          onPress={() => {}}
        >
          <Text className="screen-action-label">Template action</Text>
        </Pressable>
        <Button id="screen-disabled" label="Disabled action" isDisabled />
        <HStack id="spinner-row">
          <VStack id="hydration-spinner" className="spinner" />
        </HStack>
      </VStack>
    </SafeArea>
  </ScreenShell>
}
