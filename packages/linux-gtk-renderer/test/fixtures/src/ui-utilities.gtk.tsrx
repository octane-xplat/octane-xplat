/** @jsxImportSource @octane-xplat/jsx */
import { LinkProvider, View } from '@octane-xplat/ui'
import { Inner } from './ui-utilities-inner.ts'

export function Probe() @{
	<LinkProvider component={View}>
		<Inner />
	</LinkProvider>
}
