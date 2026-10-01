import type { ProbeContext } from '../../../scripts/probe/context';
import { runLexicalProbe } from './lexical-probe';

/** `pnpm probe run` entry for the lexical import-hygiene probe — the screen
 *  version lives at demos id `lexical-probe`; this runs the same steps
 *  standalone per target, then exercises the leaf's shipped json-bridge
 *  (deep source import keeps the octane-bound component out of the case
 *  bundle). */
export async function run(ctx: ProbeContext) {
	const steps = await runLexicalProbe();
	// Record everything first — assert() throws on the first failure and the
	// step details carry the real error text.
	ctx.record('steps', steps);
	for (const s of steps) {
		ctx.assert(s.label + (s.detail ? ' — ' + s.detail : ''), s.status, 'pass');
	}

	// The leaf's actual bridge — same modules, but through the shipping code.
	const bridge = await import('../../lexical/src/json-bridge');
	const ok = await bridge.ensureJSONBridge();
	ctx.assert('leaf json-bridge loads', ok, true);
	if (ok) {
		const html =
			'<h1>B</h1><p>hi <a href="https://x.test">there</a></p><p style="text-align: right">r</p>';

		const doc = bridge.htmlToJSON(html);
		const types = ((doc?.root as any)?.children ?? []).map((c: any) => c.type).join(',');
		ctx.assert('leaf bridge HTML→JSON — ' + types, types, 'heading,paragraph,paragraph');
		const out = bridge.jsonToHTML(doc!);
		ctx.assert(
			'leaf bridge JSON→HTML keeps link + align',
			Boolean(out?.includes('href="https://x.test"') && out?.includes('text-align')),
			true,
		);
	}
}
