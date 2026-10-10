import { Application, File, Label, Page, knownFolders, path } from '@nativescript/core'
import { createUpdates } from '../../src/index'
import { createClient } from '../../src/client'
import { nativeEnvironment } from '../../src/native.mobile'

// Test-only transport: a local fixture server replaces the production HTTPS
// origin. The native HTTP implementation, manifest validation and storage stay real.
export function start(port: number) {
	const env = nativeEnvironment()
	const request = env.request
	env.request = (url, timeout) =>
		request(url.replace('https://ota.test', `http://127.0.0.1:${port}`), timeout)

	const options = { endpoint: 'https://ota.test', embeddedVersion: '1.0.0' }
	const publicClient = createUpdates(options)
	const client = createClient(options, env)
	const phaseFile = File.fromPath(path.join(knownFolders.documents().path, 'ota-test-phase.txt'))
	const phase = phaseFile.readTextSync() || 'baseline'
	const marker = (globalThis as any).__otaTestVersion ?? 1
	const assert = (condition: boolean, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	const report = async (name: string) => {
		const body = {
			name,
			marker,
			phase,
			publicSupported: publicClient.supported,
			status: publicClient.status(),
		}

		await request(
			`http://127.0.0.1:${port}/event?body=${encodeURIComponent(JSON.stringify(body))}`,
			10000,
		)
	}

	const run = async () => {
		try {
			assert(publicClient.supported, 'Release client unsupported')
			if (phase === 'baseline') {
				assert(marker === 1, 'Baseline must be embedded')
				const update = await client.check()
				assert(update.available, 'Missing first manifest')
				if (update.available) {
					await client.install(update.manifest)
				}

				publicClient.markHealthy()
				assert(publicClient.status().currentVersion === '1.0.0', 'Staging mutated current version')
				phaseFile.writeTextSync('awaiting-v2')
				await report('staged-good')
			} else if (phase === 'awaiting-v2') {
				assert(marker === 2 && publicClient.status().needsConfirmation, 'Expected unconfirmed v2')
				publicClient.markHealthy()
				assert(!publicClient.status().needsConfirmation, 'Confirmation did not persist')
				await report('healthy-v2')
				// The test server returns v3 only after observing healthy-v2.
				const update = await client.check()
				assert(update.available, 'Missing failing manifest')
				if (update.available) {
					await client.install(update.manifest)
				}

				phaseFile.writeTextSync('awaiting-recovery')
				await report('staged-bad')
			} else if (phase === 'awaiting-recovery') {
				assert(
					marker === 2 && publicClient.status().currentVersion === '2.0.0',
					'Failed boot did not restore v2',
				)

				assert(!publicClient.status().needsConfirmation, 'Recovery left an unconfirmed journal')
				const check = await client.check()
				assert(!check.available && check.reason === 'rejected', 'Bad SHA not quarantined')
				await report('recovered-v2')
				publicClient.rollback()
				phaseFile.writeTextSync('awaiting-embedded')
				await report('rollback-requested')
			} else if (phase === 'awaiting-embedded') {
				assert(
					marker === 1 && publicClient.status().currentVersion === '1.0.0',
					'Embedded recovery failed',
				)

				assert(!publicClient.status().needsConfirmation, 'Embedded recovery left pending state')
				phaseFile.writeTextSync('done')
				await report('embedded-restored')
			} else {
				throw new Error('Unknown fixture phase ' + phase)
			}
		} catch (error) {
			await request(
				`http://127.0.0.1:${port}/event?body=${encodeURIComponent(JSON.stringify({ name: 'failed', message: String(error), phase, marker }))}`,
				10000,
			)

			throw error
		}
	}

	const page = new Page()
	const label = new Label()
	label.text = `OTA test v${marker}`
	page.content = label
	let started = false
	page.on(Page.loadedEvent, () => {
		if (started) {
			return
		}

		started = true
		void run()
	})

	Application.run({ create: () => page })
}
