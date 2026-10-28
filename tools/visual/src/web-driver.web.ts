import { page } from 'vitest/browser'
import { mountStory } from './adapter.web'
import { assertSwitchGeometry } from './geometry'

declare const __WEB_ALTERED__: boolean

export const WEB_PROFILE = {
	id: 'switch-light-96x64@1',
	width: 96,
	height: 64,
	scale: 1,
} as const

const READINESS_TIMEOUT = 2000

/** Real web capture: bounded readiness, then Playwright pixels of the stage. */
export async function launchWeb(storyId: string, args?: Record<string, unknown>) {
	const mounted = mountStory(
		storyId,
		__WEB_ALTERED__ && storyId === 'switch--unchecked-light' ? { ...args, checked: true } : args,
	)

	try {
		await waitForReady(mounted)
		return {
			host: mounted.host,
			storyId: mounted.storyId,
			get args() {
				return mounted.args
			},
			update: mounted.update,
			dispose: mounted.dispose,
			capture: await captureStage(mounted),
			async recapture() {
				await waitForReady(mounted)
				return captureStage(mounted)
			},
		}
	} catch (error) {
		mounted.dispose()
		throw error
	}
}

async function waitForReady(mounted: {
	host: HTMLElement
	storyId: string
	args: Record<string, unknown>
}) {
	const expectedChecked = String(Boolean(mounted.args.checked))
	const deadline = performance.now() + READINESS_TIMEOUT
	let stage: Element | null = null
	let control: Element | null | undefined = null
	for (;;) {
		stage = mounted.host.querySelector('.visual-stage')
		control = stage?.querySelector('[role="switch"]')
		if (
			stage?.getAttribute('data-story-id') === mounted.storyId &&
			control?.getAttribute('aria-checked') === expectedChecked
		) {
			break
		}

		if (performance.now() >= deadline) {
			throw new Error(
				`Readiness timed out for ${mounted.storyId}: stage=${stage?.getAttribute('data-story-id')}, aria-checked=${control?.getAttribute('aria-checked')}, expected=${expectedChecked}`,
			)
		}

		await new Promise(requestAnimationFrame)
	}

	const fontsReady = Promise.race([
		document.fonts.ready.then(() => true),
		new Promise<false>((resolve) => setTimeout(() => resolve(false), READINESS_TIMEOUT)),
	])

	if (!(await fontsReady)) {
		throw new Error(`Font readiness timed out for ${mounted.storyId}`)
	}

	const first = stage!.getBoundingClientRect()
	await new Promise(requestAnimationFrame)
	const second = stage!.getBoundingClientRect()
	if (
		first.width !== second.width ||
		first.height !== second.height ||
		first.x !== second.x ||
		first.y !== second.y
	) {
		throw new Error(`Unstable stage layout for ${mounted.storyId}`)
	}

	if (
		second.width !== WEB_PROFILE.width ||
		second.height !== WEB_PROFILE.height ||
		second.x !== 0 ||
		second.y !== 0
	) {
		throw new Error(
			`Stage geometry ${second.width}x${second.height}@${second.x},${second.y} does not match ${WEB_PROFILE.id}`,
		)
	}

	if (window.devicePixelRatio !== WEB_PROFILE.scale) {
		throw new Error(`devicePixelRatio ${window.devicePixelRatio} does not match ${WEB_PROFILE.id}`)
	}

	const track = control!.getBoundingClientRect()
	const thumb = control!.firstElementChild?.getBoundingClientRect()
	if (!thumb) {
		throw new Error(`Switch thumb missing for ${mounted.storyId}`)
	}

	assertSwitchGeometry(
		{
			stage: {
				x: second.x,
				y: second.y,
				width: second.width,
				height: second.height,
			},
			track: {
				x: track.x - second.x,
				y: track.y - second.y,
				width: track.width,
				height: track.height,
			},
			thumb: {
				x: thumb.x - second.x,
				y: thumb.y - second.y,
				width: thumb.width,
				height: thumb.height,
			},
		},
		Boolean(mounted.args.checked),
		Number(mounted.args.displacement ?? 0),
	)
}

async function captureStage(mounted: { host: HTMLElement; storyId: string }) {
	const stage = mounted.host.querySelector('.visual-stage')
	if (!stage) {
		throw new Error(`Stage missing at capture for ${mounted.storyId}`)
	}

	const pngBase64 = await page.screenshot({ element: stage, save: false })
	const decoded = await decodePng(pngBase64)
	if (decoded.width !== WEB_PROFILE.width || decoded.height !== WEB_PROFILE.height) {
		throw new Error(
			`Incompatible capture geometry ${decoded.width}x${decoded.height} for ${WEB_PROFILE.id}`,
		)
	}

	if (!hasVariation(decoded.data)) {
		throw new Error(`Blank capture for ${mounted.storyId}`)
	}

	return {
		pngBase64,
		provenance: 'real' as const,
		storyId: mounted.storyId,
		target: 'web' as const,
		profile: WEB_PROFILE.id,
		width: decoded.width,
		height: decoded.height,
	}
}

export async function decodePng(pngBase64: string) {
	const image = new Image()
	image.src = `data:image/png;base64,${pngBase64}`
	await image.decode()
	const canvas = document.createElement('canvas')
	canvas.width = image.naturalWidth
	canvas.height = image.naturalHeight
	const context = canvas.getContext('2d')
	if (!context) {
		throw new Error('Canvas 2D context unavailable for capture decode')
	}

	context.drawImage(image, 0, 0)
	return context.getImageData(0, 0, canvas.width, canvas.height)
}

export function pixelsEqual(a: ImageData, b: ImageData) {
	if (a.width !== b.width || a.height !== b.height) {
		return false
	}

	for (let i = 0; i < a.data.length; i++) {
		if (a.data[i] !== b.data[i]) {
			return false
		}
	}

	return true
}

function hasVariation(data: Uint8ClampedArray) {
	const r = data[0]
	const g = data[1]
	const b = data[2]
	const a = data[3]
	for (let i = 4; i < data.length; i += 4) {
		if (data[i] !== r || data[i + 1] !== g || data[i + 2] !== b || data[i + 3] !== a) {
			return true
		}
	}

	return false
}
