// Temporary plugin-probe for @nativescript-community/ui-lottie — runs each
// audited finding against whatever build the dep resolves to (npm 6.0.0 or
// the octane-xplat fork dist). Records to documents/lottie-probe-results.json
// and logs each step as `[lottie-probe]` for logcat/sim capture.
import {
	Application,
	File,
	Frame,
	LayoutBase,
	Page,
	isAndroid,
	knownFolders,
	path,
} from '@nativescript/core'

// The vendored plugin class — resolved through the leaf's registered
// element so the probe exercises the same copy consumers get.
import '@octane-xplat/lottie'
import { ELEMENTS } from '@nativescript-community/octane'
import { navigate } from '@xplat/app'
import { getStack, routeFor } from '@octane-xplat/ui'

const DOCS_DIR = knownFolders.documents().path
const RESULTS = path.join(DOCS_DIR, 'lottie-probe-results.json')
const URL_SRC =
	'https://raw.githubusercontent.com/octane-xplat/ui-lottie/master/sample-effects/pinjump.json'

const records: Record<string, any>[] = []

const LottieView = ELEMENTS.get('xplatlottie') as any

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

let dirReady = false
function ensureDir() {
	if (dirReady) {
		return
	}

	if (isAndroid) {
		new java.io.File(DOCS_DIR).mkdirs()
	}

	dirReady = true
}

function flush() {
	try {
		ensureDir()
		File.fromPath(RESULTS).writeTextSync(JSON.stringify(records, null, 2))
	} catch (e) {
		console.log(`[lottie-probe] flush failed: ${e}`)
	}
}

function record(name: string, data: any) {
	const entry = { name, ...data }
	records.push(entry)
	console.log(`[lottie-probe] ${name}: ${JSON.stringify(data)}`)
	flush()
}

function mount(page: Page): any {
	const v = new LottieView()
	v.width = 120
	v.height = 120
	const content = page.content as any
	if (content instanceof LayoutBase) {
		content.addChild(v)
	} else if (content && typeof content.addChild === 'function') {
		content.addChild(v)
	}

	return v
}

function loaded(v: any): boolean {
	try {
		const nv: any = v.nativeViewProtected ?? (v as any).nativeView
		if (isAndroid) {
			return !!nv?.getComposition?.() || (v.duration ?? 0) > 0
		}

		return !!nv?.animation || (v.duration ?? 0) > 0
	} catch {
		return (v.duration ?? 0) > 0
	}
}

async function waitForPage(): Promise<Page> {
	for (let i = 0; i < 120; i++) {
		const p = Frame.topmost()?.currentPage
		if (p) {
			return p
		}

		await sleep(500)
	}

	throw new Error('no page')
}

async function run() {
	const page = await waitForPage()
	record('meta', {
		platform: isAndroid ? 'android' : 'ios',
		hasPauseResume: typeof (LottieView.prototype as any).pauseAnimation === 'function',
		resultsFile: RESULTS,
	})

	// Read the bundled probe json once — source for inline/file/src variants.
	ensureDir()
	const appJsonPath = path.join(knownFolders.currentApp().path, 'assets', 'lottie-probe.json')
	const jsonText = File.exists(appJsonPath) ? File.fromPath(appJsonPath).readTextSync() : ''
	record('asset-read', { bytes: jsonText.length, exists: File.exists(appJsonPath) })
	const tmpJson = path.join(DOCS_DIR, 'probe-inline.json')
	File.fromPath(tmpJson).writeTextSync(jsonText)

	// 1. sync src (async=false default) — broken factory guard on Android.
	{
		const v = mount(page)
		v.src = jsonText // inline JSON hits fromJsonStringSync on Android
		await sleep(400)
		record('sync-inline-json', { loaded: loaded(v), duration: v.duration })
	}

	{
		const v = mount(page)
		v.src = tmpJson // file path, still sync
		await sleep(400)
		record('sync-file-json', { loaded: loaded(v), duration: v.duration })
	}

	{
		const v = mount(page)
		v.src = '~/assets/lottie-probe.json' // app bundle path, sync
		await sleep(400)
		record('sync-bundle-json', { loaded: loaded(v), duration: v.duration })
	}

	// 2. completionBlock on cancel — before: [false, true]; after: [false].
	{
		const v = mount(page)
		const calls: boolean[] = []
		v.completionBlock = (finished: boolean) => calls.push(finished)
		v.src = tmpJson
		await sleep(300)
		v.playAnimation()
		await sleep(150)
		v.cancelAnimation()
		await sleep(400)
		record('completion-on-cancel', { calls })
	}

	// 3. pause/resume plumbing.
	{
		const v = mount(page)
		v.src = tmpJson
		await sleep(300)
		v.playAnimation()
		await sleep(250)
		const apiPresent = typeof (v as any).pauseAnimation === 'function'
		const nativePausePresent = isAndroid
			? typeof (v.nativeViewProtected as any)?.pauseAnimation === 'function'
			: typeof (v.nativeViewProtected as any)?.pause === 'function'

		let midProgress = -1
		let afterResume = -1
		if (apiPresent) {
			;(v as any).pauseAnimation()
			await sleep(200)
			const p = isAndroid
				? (v.nativeViewProtected as any).getProgress()
				: (v.nativeViewProtected as any).currentProgress

			midProgress = p
			const stillPaused = !v.isAnimating()

			;(v as any).resumeAnimation()
			await sleep(250)
			afterResume = isAndroid
				? (v.nativeViewProtected as any).getProgress()
				: (v.nativeViewProtected as any).currentProgress

			record('pause-resume', {
				apiPresent,
				nativePausePresent,
				stillPaused,
				midProgress,
				afterResume,
			})
		} else {
			record('pause-resume', { apiPresent, nativePausePresent })
		}
	}

	// 4. compositionLoaded event (iOS missing before fix).
	{
		const v = mount(page)
		let fired = false
		v.on('compositionLoaded', () => {
			fired = true
		})

		v.src = tmpJson
		await sleep(500)
		record('composition-loaded-event', { fired, loaded: loaded(v) })
	}

	// 5. loadFailed event on corrupt JSON.
	{
		const v = mount(page)
		let failed = false
		v.on('loadFailed', () => {
			failed = true
		})

		v.src = '{"v":"x","broken":'
		await sleep(500)
		record('load-failed-event', { failed })
	}

	// 6. remote URL src.
	{
		const v = mount(page)
		let loadedEv = false
		v.on('compositionLoaded', () => {
			loadedEv = true
		})

		v.src = URL_SRC
		await sleep(4000)
		record('url-src', { loaded: loaded(v), duration: v.duration, loadedEvent: loadedEv })
	}

	// 7. file-path .lottie/.zip (Android fix target; iOS skipped — handled by
	// CompatibleAnimation's own path, different container handling).
	if (isAndroid) {
		const v = mount(page)
		const zipPath = path.join(DOCS_DIR, 'probe.lottie')
		const fos = new java.io.FileOutputStream(zipPath)
		const zos = new java.util.zip.ZipOutputStream(fos)
		zos.putNextEntry(new java.util.zip.ZipEntry('animation.json'))
		const bytes = new java.lang.String(jsonText).getBytes()
		zos.write(bytes, 0, bytes.length)
		zos.closeEntry()
		zos.close()
		v.src = zipPath
		await sleep(600)
		record('file-zip', { loaded: loaded(v), duration: v.duration })
	}

	// 8. async + autoPlay (Android: never fired before fix).
	if (isAndroid) {
		const v = mount(page)
		v.async = true
		v.autoPlay = true
		v.src = tmpJson
		await sleep(1200)
		record('async-autoplay', { animating: v.isAnimating(), loaded: loaded(v) })
	}

	// 9. duration units (documented divergence — leaf normalizes).
	{
		const v = mount(page)
		v.src = tmpJson
		await sleep(400)
		record('duration-units', { duration: v.duration, note: 'android=ms ios=s' })
	}

	// 10. setOpacity smoke — scale correctness needs eyes; here we only
	// verify no throw + value-callback acceptance.
	{
		const v = mount(page)
		v.src = tmpJson
		await sleep(300)
		try {
			v.setOpacity(0.5, ['**', 'Opacity'])
			v.setOpacity(0, ['**', 'Opacity'])
			record('setopacity-smoke', { ok: true })
		} catch (e) {
			record('setopacity-smoke', { ok: false, error: String(e) })
		}
	}

	// leaf smoke — mount @octane-xplat/lottie through the demo route, then
	// read the status Text and check a LottieView landed in the tree.
	{
		try {
			navigate('demo/:id', { id: 'lottie' })
			await sleep(3500)
			const page = getStack('root')?.currentPage as any
			const texts: string[] = []
			let leafViews = 0
			const walk = (view: any) => {
				if (!view) {
					return
				}

				if (typeof view.text === 'string' && view.text) {
					texts.push(view.text)
				}

				// Duck-typed — the leaf's plugin dep may resolve to a different
				// copy (npm 6.0.0) than the app's fork override.
				if (typeof view.isAnimating === 'function' && typeof view.playAnimation === 'function') {
					leafViews++
				}

				view.eachChildView?.((c: any) => {
					walk(c)
					return true
				})
			}

			walk(page)
			record('leaf-demo', {
				route: routeFor('root')?.name,
				lottieViews: leafViews,
				status: texts.filter((t) => /loaded|error|ended|stopped|idle|seek/.test(t)),
			})
		} catch (e) {
			record('leaf-demo', { error: String(e) })
		}
	}

	record('done', { count: records.length })
}

Application.on(Application.launchEvent, () => {
	console.log('[lottie-probe] launchEvent fired')
	// Let the octane root mount first.
	setTimeout(() => {
		run().catch((e) => {
			ensureDir()
			record('probe-error', { error: String(e), stack: e?.stack })
		})
	}, 4000)
})

console.log('[lottie-probe] module loaded')
