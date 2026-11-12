/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, HStack, Text, VStack } from '@octane-xplat/ui'
import './home.css'

export interface HomeProps {
  name: string
  initialCompleted: number
}

/** Real shared-component target; separate from the two-label mechanism probe. */
export function Home(props: HomeProps) @{
  const [completed, setCompleted] = useState(props.initialCompleted)
  const [status, setStatus] = useState('Ready when you are.')

  <VStack id="prerender-home" className="prerender-home">
    <VStack className="prerender-home-header">
      <Text className="prerender-home-eyebrow">YOUR DAY</Text>
      <Text id="home-greeting" className="prerender-home-title">{`Welcome back, ${props.name}`}</Text>
      <Text className="prerender-home-muted">A little progress goes a long way.</Text>
    </VStack>

    <VStack className="prerender-home-card">
      <HStack className="prerender-home-summary">
        <Text className="prerender-home-card-title">Today’s progress</Text>
        <Text className="prerender-home-badge">TODAY</Text>
      </HStack>
      <Text id="home-completed" className="prerender-home-count">{String(completed)}</Text>
      <Text className="prerender-home-muted">Steps completed</Text>
    </VStack>

    <VStack className="prerender-home-actions">
      <Button
        id="home-complete"
        label="Complete a step"
        variant="primary"
        onPress={() => {
          setCompleted(completed + 1)
          setStatus('One more step completed.')
        }}
      />
      <Button
        id="home-reset"
        label="Start again"
        variant="secondary"
        onPress={() => {
          setCompleted(props.initialCompleted)
          setStatus('Ready when you are.')
        }}
      />
    </VStack>
    <Text id="home-status" className="prerender-home-muted">{status}</Text>
  </VStack>
}
