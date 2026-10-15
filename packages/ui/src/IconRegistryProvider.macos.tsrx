/** @jsxImportSource @octane-xplat/macos-renderer */
import type { IconRegistryProviderProps } from './props'
import { IconRegistryProvider as IconRegistryContext } from './icon-registry-context'

export function IconRegistryProvider(props: IconRegistryProviderProps) @{
	<IconRegistryContext value={props.value}>{props.children}</IconRegistryContext>
}
