/** @jsxImportSource @octane-xplat/jsx */
import { SharedStartup } from './ConfiguredStartup.shared.tsrx'
import type { ConfiguredStartupProps } from './ConfiguredStartup.shared.tsrx'
export type { ConfiguredStartupProps } from './ConfiguredStartup.shared.tsrx'

export function ConfiguredStartup(props: ConfiguredStartupProps) @{
  <SharedStartup {...props} title={`iOS: ${props.title}`} />
}
