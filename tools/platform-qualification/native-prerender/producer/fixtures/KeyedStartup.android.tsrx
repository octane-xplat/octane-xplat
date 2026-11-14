/** @jsxImportSource @octane-xplat/jsx */
import './keyed-startup.css'
import { SharedStartup } from './ConfiguredStartup.shared.tsrx'
import type { ConfiguredStartupProps } from './ConfiguredStartup.shared.tsrx'

export type { ConfiguredStartupProps } from './ConfiguredStartup.shared.tsrx'

export function KeyedStartup(props: ConfiguredStartupProps) @{
  <SharedStartup {...props} title={`Android: ${props.title}`} />
}
