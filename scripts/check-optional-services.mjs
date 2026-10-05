// Focused adapter verification. Native typechecks and mocked API tests do not
// qualify system browsers, hardware, providers, push delivery or audio routes.
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = await mkdtemp(join(root, 'node_modules/.optional-services-check-'))
try {
	for (const target of ['web', 'mobile']) {
		const files =
			target === 'mobile'
				? [
						'apps/mobile/references.d.ts',
						'apps/mobile/types/globals.d.ts',
						'packages/platform/src/auth-session.ts',
						'packages/media/src/media.ts',
						'packages/recorder/src/index.ts',
						'packages/recorder/src/recorder.ios.ts',
						'packages/recorder/src/recorder.android.ts',
					]
				: [
						'packages/platform/src/auth-session.web.ts',
						'packages/media/src/media.web.ts',
						'packages/audio/src/audio.web.ts',
						'packages/sounds/src/sounds.web.ts',
						'packages/recorder/src/recorder.web.ts',
					]

		const config = join(scratch, `${target}.json`)
		await writeFile(
			config,
			JSON.stringify({
				extends: join(root, `apps/${target}/tsconfig.json`),
				include: [],
				files: files.map((file) => join(root, file)),
				...(target === 'web' ? { compilerOptions: { types: [] } } : {}),
			}),
		)

		execFileSync(
			process.execPath,
			[join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', config],
			{ cwd: root, stdio: 'inherit' },
		)

		console.log(`Optional service ${target} adapter types pass`)
	}

	execFileSync(
		process.execPath,
		[
			'--test',
			'packages/platform/tests/auth-session.test.mjs',
			'packages/media/tests/cleanup.test.mjs',
			'examples/auth/server-verification.test.mjs',
			'packages/audio/tests/audio.ios.test.mjs',
		],
		{ cwd: root, stdio: 'inherit' },
	)

	for (const browser of ['chromium', 'firefox', 'webkit']) {
		execFileSync(process.execPath, ['apps/web/scripts/optional-services.mjs'], {
			cwd: root,
			stdio: 'inherit',
			env: {
				...process.env,
				XPLAT_WEB_BROWSER: browser,
				XPLAT_WEB_AUDIO_MODE: browser === 'firefox' ? 'metadata' : 'playback',
			},
		})
	}
} finally {
	await rm(scratch, { recursive: true, force: true })
}
