/** @jsxImportSource @nativescript-community/octane */
import type { IconRegistryProviderProps } from './props'
import { IconRegistryProvider as IconRegistryContext } from './icon-registry-context'

/**
 * Provides an `IconRegistry` to descendants — `Icon` name lookups resolve through the nearest provider. Import from `@octane-xplat/ui`.
 *
 * @see createIconRegistry, registerIcons, IconProps.
 */
export function IconRegistryProvider(props: IconRegistryProviderProps) @{
	<IconRegistryContext value={props.value}>{props.children}</IconRegistryContext>
}
