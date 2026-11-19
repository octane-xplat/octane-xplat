/** @jsxImportSource @octane-xplat/jsx */
import { useEffect } from 'octane'
import {
  Button,
  HStack,
  NavLink,
  Screen,
  ScrollableArea,
  Tabs,
  Text,
  View,
  setThemePreference,
  useThemeScheme,
} from '@octane-xplat/ui'

import type { TabSpec, Renderable } from '@octane-xplat/ui'
import { storage } from '@octane-xplat/platform'
import { MotionPatterns } from '@octane-xplat/demos'
import { DataWorkspace } from './DataWorkspace.tsrx'
import { DocumentStudio } from './DocumentStudio.tsrx'
import { Conversation } from './Conversation.tsrx'
import { Fieldwork } from './Fieldwork.tsrx'

function Experience(props: { children?: Renderable }) @{
  <ScrollableArea className="sc-experience-scroll flex-1 min-h-0">
    <View className="sc-experience-body sc-column">{props.children}</View>
  </ScrollableArea>
}

const renderWorkspace = () => (
  <Experience>
    <DataWorkspace />
  </Experience>
)

const renderDocument = () => (
  <Experience>
    <DocumentStudio />
  </Experience>
)

const renderConversation = () => (
  <Experience>
    <Conversation />
  </Experience>
)

const renderFieldwork = () => (
  <Experience>
    <Fieldwork />
  </Experience>
)

const renderMotion = () => (
  <Experience>
    <View className="sc-column">
      <View className="sc-intro sc-column">
        <Text className="sc-eyebrow">05 / MOTION & INTERACTION</Text>
        <Text className="sc-title">Motion that listens.</Text>
        <Text className="sc-lede">
          Interrupt a transition, change direction, and request reduced motion. The interface should
          always respond to you.
        </Text>
      </View>
      <MotionPatterns />
    </View>
  </Experience>
)

const EXPERIENCES: TabSpec[] = [
  { key: 'workspace', title: 'Workspace', render: renderWorkspace },
  { key: 'documents', title: 'Documents', render: renderDocument },
  { key: 'conversation', title: 'Conversation', render: renderConversation },
  { key: 'fieldwork', title: 'Fieldwork', render: renderFieldwork },
  { key: 'motion', title: 'Motion', render: renderMotion },
]

export function Showcase() @{
  const scheme = useThemeScheme()

  useEffect(() => {
    const preference = storage.getString('theme-preference')

    if (preference === 'dark' || preference === 'light') {
      setThemePreference(preference)
    }
  }, [])

  <Screen className={['vx-app', 'sc-root', scheme === 'dark' ? 'dark ns-dark' : '']}>
    <HStack className="sc-masthead">
      <View className="sc-column sc-brand">
        <Text className="sc-brand-name">octane / xplat</Text>
        <Text className="sc-muted">Put the hard parts to work.</Text>
      </View>
      <HStack className="sc-actions">
        <NavLink to="/harness" className="sc-harness-link">
          <Text>Sanity harness ↗</Text>
        </NavLink>
        <Button
          label={scheme === 'dark' ? 'Light' : 'Dark'}
          variant="secondary"
          size="sm"
          onPress={() => {
            const next = scheme === 'dark' ? 'light' : 'dark'

            storage.setString('theme-preference', next)
            setThemePreference(next)
          }}
        />
      </HStack>
    </HStack>
    <Tabs
      id="showcase-tabs"
      tabs={EXPERIENCES}
      defaultSelectedKey="workspace"
      className="sc-experiences flex-1"
    />
  </Screen>
}
