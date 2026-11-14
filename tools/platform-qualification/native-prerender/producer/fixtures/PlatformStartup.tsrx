/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
import './platform-startup.css'

export function PlatformStartup(props: { title: string }) @{
  <Text className="platform-copy">{props.title}</Text>
}
