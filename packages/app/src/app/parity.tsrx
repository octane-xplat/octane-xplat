import { Screen } from '@octane-xplat/ui';
import { ParityStage } from '../parity/stage.tsrx';

/** Parity route — root-level screen on web (/parity), pushable as 'parity'
 *  on native for the sweep step. Renders the fixture stage only; no app
 *  chrome so the stage is the whole measurable surface. */
export function Parity() @{
	<Screen className="vx-app">
		<ParityStage />
	</Screen>
}
