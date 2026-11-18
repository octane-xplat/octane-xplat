/** @jsxImportSource @octane-xplat/jsx */
import './screen.css'
import { useState } from 'octane'
import { motion } from '@octane-xplat/motion'
import { storage } from '@octane-xplat/platform'
import {
  Button,
  HStack,
  Icon,
  Image,
  Pressable,
  SafeArea,
  Screen as ScreenShell,
  ScrollableArea,
  Spinner,
  Text,
  View,
  VStack,
} from '@octane-xplat/ui'

export interface ScreenProps {
  title: string
  items: string[]
}

export function Screen(props: ScreenProps) @{
  // Persisted launch input: the producer renders one logical tree per
  // declared value, and native startup picks the matching tree before mount.
  const [preference] = useState(() => storage.getString('theme-preference'))
  <ScreenShell id="screen-shell">
    <SafeArea id="screen-safe-area">
      <motion.View id="screen-motion" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <VStack
          id="screen"
          className={preference ? 'screen screen-preference-' + preference : 'screen'}
        >
          <View id="screen-header" className="screen-header">
            <Spinner id="screen-spinner" size="sm" />
            <Icon id="screen-icon" name="xplat-check" />
            <Image
              id="screen-image"
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4nGPQz3/7H4QZYAwAVZ4KKR7n/GkAAAAASUVORK5CYII="
              alt="check"
              style={{ width: 40, height: 40 }}
            />
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
          <Button id="screen-loading" label="Loading action" isLoading />
          <HStack id="spinner-row">
            <VStack id="hydration-spinner" className="spinner" />
          </HStack>
        </VStack>
      </motion.View>
    </SafeArea>
  </ScreenShell>
}
