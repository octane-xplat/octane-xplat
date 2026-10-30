/** @jsxImportSource @octane-xplat/jsx/dom */
import type { IconRegistryProviderProps } from '../../props'
import { IconRegistryProvider as IconRegistryContext } from './icon-registry-context'
import type { JSX } from 'octane/jsx-runtime'

export function IconRegistryProvider(props: IconRegistryProviderProps): JSX.Element @{
	<IconRegistryContext value={props.value}>{props.children}</IconRegistryContext>
}
