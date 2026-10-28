// xplat-disable element-vocabulary — lingui extraction probe fixture, not shipped UI
import { t } from '@lingui/core/macro'

// Padding keeps the tagged template on authored line 10, distinct from its
// compiled output location — the origin assertion catches regressions to
// compiled-output line numbers.
export function App() @{
	return (
		<main>
			<p>{t`Extraction probe from tsrx`}</p>
		</main>
	)
}
