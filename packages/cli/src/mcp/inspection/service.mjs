import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { contractError, toContractError } from '../contracts/errors.mjs'
import { CHROMIUM_INSPECTION_COVERAGE } from '../contracts/inspection.mjs'
import { connectPage } from './cdp.mjs'
import { inspectDOM } from './dom.web.mjs'

const exec = promisify(execFile)
const keyboardHelper = fileURLToPath(new URL('./keyboard.macos.swift', import.meta.url))

export function createInspectionService(context, options = {}) {
	const busy = new Set()
	const connect = options.connect ?? connectPage
	const osKey =
		options.osKey ??
		((pid, key) =>
			exec('swift', [keyboardHelper, String(pid), key], { timeout: 30000, maxBuffer: 4096 }))

	context.capabilities.register({
		platform: 'web',
		describe: () => [
			{
				capability: 'ui_inspection',
				status: 'partial',
				detail:
					'Owned Chromium sessions only: bounded named DOM hosts, main document only. No component tree, shadow roots or iframe coverage.',
			},
			{
				capability: 'interaction',
				status: 'partial',
				detail:
					'Stable-control click via CDP is dom-event evidence. Space/Enter OS keyboard input requires an owned headed Chromium on macOS, Swift, OS permission, and a desktop-input reservation.',
			},
			{
				capability: 'screenshot',
				status: 'partial',
				requiresPermission: 'visual-capture',
				detail:
					'Owned Chromium viewport capture only; capture requires current explicit approval and remains unqualified until an approved capture is run.',
			},
		],
	})

	const observe = async (kind, args) => {
		// Capture grant checked before any connection or capture command.
		const permission = context.policy.require(
			kind === 'screenshot' ? 'visual-capture' : 'runtime-actions',
		)

		if (!permission.granted) {
			return { error: permission.error }
		}

		const bound = context.runtime.observationTarget(args.sessionId)
		if (bound.error) {
			return bound
		}

		const { session, endpoint } = bound
		if (
			session.platform !== 'web' ||
			session.ownership !== 'owned' ||
			!endpoint?.browser?.devtoolsUrl
		) {
			return {
				error: contractError(
					'unsupported_capability',
					'Inspection needs the DevTools endpoint of an owned Chromium launch.',
					{
						recovery: {
							action:
								'Launch a web session with Chromium installed; native and attached-session inspection require independent adapters.',
						},
					},
				),
			}
		}

		if (busy.has(args.sessionId)) {
			return {
				error: contractError(
					'target_busy',
					'Another observation or interaction is running on this session.',
					{ retryable: true },
				),
			}
		}

		busy.add(args.sessionId)
		let channel
		const limitations = []
		try {
			channel = await connect(endpoint)
			const documentId = (await channel.send('Page.getFrameTree')).frameTree.frame.loaderId
			if (args.documentId && args.documentId !== documentId) {
				throw contractError(
					'stale_identity',
					'The document has changed since inspection. Inspect again before interacting.',
				)
			}

			const provenance = {
				appId: session.appId,
				platform: session.platform,
				targetId: session.targetId,
				sessionId: session.sessionId,
				buildIdentity: session.buildIdentity,
				mechanism: 'none',
				processKind: session.processKind,
				documentId,
			}

			if (kind === 'screenshot') {
				const image = await channel.send('Page.captureScreenshot', {
					format: 'png',
					captureBeyondViewport: false,
				})

				const evidence = context.evidence.record({
					kind,
					summary: 'Chromium viewport capture',
					provenance,
					artifact: Buffer.from(image.data, 'base64'),
					artifactName: 'viewport.png',
				})

				return { evidence }
			}

			const inspect = async (focus = false) => {
				const result = await channel.send('Runtime.evaluate', {
					expression: `(${inspectDOM.toString()})(${JSON.stringify({ control: args.control, offset: args.offset, limit: args.limit, focus })})`,
					returnByValue: true,
				})

				if (result.exceptionDetails || !result.result?.value) {
					throw contractError('execution_failure', 'The fixed host inspection failed.')
				}

				if (result.result.value.error) {
					throw result.result.value.error
				}

				return result.result.value
			}

			const before = await inspect()
			if (kind === 'interaction') {
				const host = before.controls[0]
				if (host.hidden || host.disabled || host.sensitive) {
					throw contractError(
						'unavailable',
						'Control is hidden, disabled, or private; no input was sent.',
					)
				}

				if (args.mechanism === 'os-input') {
					if (process.platform !== 'darwin' || endpoint.browser.headless || !endpoint.browser.pid) {
						throw contractError(
							'prerequisite_missing',
							'OS keyboard input needs owned headed Chromium on macOS. No input was sent.',
						)
					}

					const focused = await inspect(true)
					if (!focused.controls[0].focused) {
						throw contractError(
							'unavailable',
							'The selected host cannot receive keyboard focus. No input was sent.',
						)
					}

					const delivered = await osKey(endpoint.browser.pid, args.key)
					if (delivered?.stderr?.includes('focus restoration was not confirmed')) {
						limitations.push(
							'OS input was delivered; restoration of the previously active application was not confirmed.',
						)
					}

					provenance.mechanism = 'os-input'
				} else {
					if (!host.hitTarget) {
						throw contractError(
							'unavailable',
							'Control center is obscured or outside the viewport. No click was sent.',
						)
					}

					const x = host.frame.x + host.frame.width / 2
					const y = host.frame.y + host.frame.height / 2
					await channel.send('Input.dispatchMouseEvent', {
						type: 'mousePressed',
						x,
						y,
						button: 'left',
						clickCount: 1,
					})

					await channel.send('Input.dispatchMouseEvent', {
						type: 'mouseReleased',
						x,
						y,
						button: 'left',
						clickCount: 1,
					})

					provenance.mechanism = 'dom-event'
				}
			}

			const afterDocumentId = (await channel.send('Page.getFrameTree')).frameTree.frame.loaderId
			if (documentId !== afterDocumentId) {
				throw contractError(
					'stale_identity',
					'The document changed during the operation; any interaction outcome is uncertain. Inspect again.',
				)
			}

			const checked = context.sessions.requireUsable(args.sessionId)
			if (!checked.usable) {
				throw checked.error
			}

			const data = {
				documentId,
				...before,
				coverage: CHROMIUM_INSPECTION_COVERAGE,
				limitations,
				...(kind === 'interaction'
					? {
							inputSent: true,
							assertion: 'Input delivery only; inspect the intended app state separately.',
						}
					: {}),
			}

			const evidence = context.evidence.record({
				kind,
				summary: `${kind} of named Chromium hosts`,
				provenance,
				data,
			})

			return { ...data, evidence }
		} catch (error) {
			return { error: toContractError(error) }
		} finally {
			channel?.close()
			busy.delete(args.sessionId)
		}
	}

	return {
		inspect: (args) => observe('inspection', args),
		interact: (args) => observe('interaction', args),
		screenshot: (args) => observe('screenshot', args),
	}
}
