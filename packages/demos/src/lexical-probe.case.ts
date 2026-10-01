import type { ProbeContext } from '../../../scripts/probe/context';
import { runLexicalProbe } from './lexical-probe';

/** `pnpm probe run` entry for the lexical import-hygiene probe — the screen
 *  version lives at demos id `lexical-probe`; this runs the same steps
 *  standalone per target. */
export async function run(ctx: ProbeContext) {
	const steps = await runLexicalProbe();
	// Record everything first — assert() throws on the first failure and the
	// step details carry the real error text.
	ctx.record('steps', steps);
	for (const s of steps) {
		ctx.assert(s.label + (s.detail ? ' — ' + s.detail : ''), s.status, 'pass');
	}
}
