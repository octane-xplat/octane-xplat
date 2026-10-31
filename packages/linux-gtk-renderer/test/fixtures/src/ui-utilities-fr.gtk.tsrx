/** @jsxImportSource @octane-xplat/jsx */
import { InternationalizationProvider, frFR } from '@octane-xplat/ui'
import { FrInner } from './ui-utilities-inner.ts'

export function FrProbe() @{
	<InternationalizationProvider locale="fr" messages={{ fr: frFR }}>
		<FrInner />
	</InternationalizationProvider>
}
