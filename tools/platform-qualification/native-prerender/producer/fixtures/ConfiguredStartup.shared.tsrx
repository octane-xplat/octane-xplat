/** @jsxImportSource @octane-xplat/jsx */
import { Text, VStack } from '@octane-xplat/ui'
import './configured-startup.css'

export interface ConfiguredStartupProps {
  title: string
  labels: string[]
}

export function SharedStartup(props: ConfiguredStartupProps) @{
  <VStack id="configured-startup" className="configured-startup">
    <Text id="configured-title" className="configured-copy">{props.title}</Text>
    @for (const label of props.labels; key label) {
      <Text className="configured-copy">{label}</Text>
    }
  </VStack>
}
