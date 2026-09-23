import { command } from '@alloc/cmd-ts';
import { existsSync, rmSync } from 'node:fs';
import * as p from '@clack/prompts';

const DIRS = ['dist', 'platforms', '.ns-vite-build', 'node_modules/.vite'];

export const clean = command({
	name: 'clean',
	description: 'Remove build outputs (dist, platforms, vite caches)',
	args: {},
	handler: async () => {
		const cwd = process.cwd();
		const found = DIRS.filter((d) => existsSync(`${cwd}/${d}`));
		if (found.length === 0) { p.log.info('Nothing to clean'); return; }

		if (process.stdout.isTTY) {
			const ok = await p.confirm({ message: `Remove ${found.join(', ')}?` });
			if (p.isCancel(ok) || !ok) { p.cancel('Cancelled'); return; }
		}
		for (const d of found) rmSync(`${cwd}/${d}`, { recursive: true, force: true });
		p.log.success(`Cleaned ${found.join(', ')}`);
	},
});
