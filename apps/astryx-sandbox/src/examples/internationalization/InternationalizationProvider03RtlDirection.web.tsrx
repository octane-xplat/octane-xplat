/** @jsxImportSource @octane-xplat/jsx/dom */
// Port of InternationalizationProvider examples, Astryx 0.6.4 (Meta Platforms, MIT).
import {
	InternationalizationProvider,
	Pagination,
	SegmentedControl,
	useLocale,
	useDirection,
} from '@octane-xplat/ui'

import { useState } from 'octane'

function Scope() @{
	const locale = useLocale()
	const direction = useDirection()

	<p data-locale-scope>
		{locale} / {direction}
	</p>
}

export function InternationalizationProvider03RtlDirection() @{
	const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr')
	const [page, setPage] = useState(3)

	<InternationalizationProvider locale="en" dir={direction}>
		<div dir={direction} data-direction-scope>
			<SegmentedControl
				label="Direction"
				accessibilityLabel="Direction"
				value={direction}
				onValueChange={(next) => setDirection(next as 'ltr' | 'rtl')}
				options={[
					{ value: 'ltr', label: 'LTR' },
					{ value: 'rtl', label: 'RTL' },
				]}
			/>
			<Scope />
			<Pagination page={page} onPageChange={setPage} pageCount={20} />
			<InternationalizationProvider locale="fr-FR" dir="ltr">
				<div dir="ltr" data-nested-scope>
					<Scope />
					<Pagination page={1} pageCount={2} />
				</div>
			</InternationalizationProvider>
		</div>
	</InternationalizationProvider>
}
