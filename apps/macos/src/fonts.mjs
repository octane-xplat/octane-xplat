import '@nativescript/macos-node-api'
import { registerFontFamily } from '@xplat/macos/renderer'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const injectedGeistFontBase64 =
	typeof __XPLAT_GEIST_FONT_BASE64__ === 'string' ? __XPLAT_GEIST_FONT_BASE64__ : null

const injectedGeistLicense =
	typeof __XPLAT_GEIST_FONT_LICENSE__ === 'string' ? __XPLAT_GEIST_FONT_LICENSE__ : null

const geistFontDescriptors = new Map()
const GEIST_WEIGHT_FACES = [
	[100, 'Geist-Thin'],
	[200, 'Geist-ExtraLight'],
	[300, 'Geist-Light'],
	[400, 'Geist-Regular'],
	[500, 'Geist-Medium'],
	[600, 'Geist-SemiBold'],
	[700, 'Geist-Bold'],
	[800, 'Geist-ExtraBold'],
	[Infinity, 'Geist-Black'],
]

function sourceFontPath(filename) {
	const candidates = [
		resolve(process.cwd(), 'packages/app/src/assets/fonts', filename),
		resolve(process.cwd(), '../../packages/app/src/assets/fonts', filename),
	]

	return candidates.find(existsSync)
}

function loadBundledGeistFonts() {
	const fontBytes = injectedGeistFontBase64
		? Buffer.from(injectedGeistFontBase64, 'base64')
		: (() => {
				const path = sourceFontPath('Geist-Variable.ttf')
				return path ? readFileSync(path) : null
			})()

	if (!fontBytes) {
		throw new Error('Could not find the bundled Geist font asset')
	}

	const licenseText =
		injectedGeistLicense ??
		(() => {
			const path = sourceFontPath('OFL.txt')
			if (!path) {
				throw new Error('Could not find the Geist font license')
			}

			return readFileSync(path, 'utf8')
		})()

	const digest = createHash('sha256').update(fontBytes).digest('hex')
	const fontDirectory = join(homedir(), 'Library', 'Caches', 'octane-xplat', 'macos', 'fonts')
	const fontPath = join(fontDirectory, `Geist-Variable-${digest}.ttf`)
	const licensePath = join(fontDirectory, 'Geist-OFL.txt')
	mkdirSync(fontDirectory, { recursive: true })
	if (!existsSync(fontPath)) {
		writeFileSync(fontPath, fontBytes)
	}

	if (!existsSync(licensePath)) {
		writeFileSync(licensePath, licenseText, 'utf8')
	}

	const descriptors = CTFontManagerCreateFontDescriptorsFromURL(NSURL.fileURLWithPath(fontPath))
	for (let index = 0; index < Number(descriptors?.count ?? 0); index++) {
		const descriptor = descriptors.objectAtIndex(index)
		const postScriptName = String(descriptor.postscriptName ?? '')
		const descriptorURL = CTFontDescriptorCopyAttribute(descriptor, kCTFontURLAttribute)
		if (postScriptName.startsWith('Geist-') && descriptorURL?.path === fontPath) {
			geistFontDescriptors.set(postScriptName, descriptor)
		}
	}

	for (const postScriptName of [
		'Geist-Thin',
		'Geist-ExtraLight',
		'Geist-Light',
		'Geist-Regular',
		'Geist-Medium',
		'Geist-SemiBold',
		'Geist-Bold',
		'Geist-ExtraBold',
		'Geist-Black',
	]) {
		if (!geistFontDescriptors.has(postScriptName)) {
			throw new Error(`Failed to load the bundled ${postScriptName} font face`)
		}
	}
}

loadBundledGeistFonts()
registerFontFamily(
	'Geist',
	GEIST_WEIGHT_FACES.map(([weight, name]) => ({
		weight: Number.isFinite(weight) ? weight : 900,
		descriptor: geistFontDescriptors.get(name),
	})),
)

export const harnessFontOptions = { fontFamily: 'Geist' }
