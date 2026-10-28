// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
export function sourceIdentity() {
	const hash = createHash('sha256')
	for (const path of [
		'tools/visual/src/scenario.ts',
		'tools/visual/src/Switch.stories.web.tsrx',
		'apps/mobile/src/tests/visual/Switch.stories.ios.tsrx',
		'packages/ui/src/Switch.tsrx',
		'packages/ui/src/Switch.web.tsrx',
		'tools/visual/src/stage.web.css',
		'apps/mobile/src/tests/visual/stage.ios.css',
		'packages/ui/src/theme/tokens.css',
		'packages/ui/src/theme/chrome.css',
	]) {
		hash
			.update(path)
			.update('\0')
			.update(readFileSync(join(repository, path)))
			.update('\0')
	}

	return {
		revision: execFileSync('git', ['rev-parse', 'HEAD'], {
			cwd: repository,
			encoding: 'utf8',
		}).trim(),
		scenarioHash: hash.digest('hex'),
		sourceDirty:
			execFileSync('git', ['status', '--porcelain'], { cwd: repository, encoding: 'utf8' }).trim()
				.length > 0,
	}
}
