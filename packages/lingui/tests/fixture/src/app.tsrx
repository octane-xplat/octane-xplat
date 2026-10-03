// xplat-disable element-vocabulary — lingui extraction probe fixture, not shipped UI
import { t } from '@lingui/core/macro'

// Two padding lines push the tagged template to authored line 8 while the
// compiled output keeps it on line 5 — the origin assertion would catch a
// regression to compiled-output line numbers.
export function App() @{
	return <main><p>{t`Extraction probe from tsrx`}</p></main>
}
