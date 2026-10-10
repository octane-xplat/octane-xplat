const { readFileSync, writeFileSync, existsSync } = require('node:fs')
const { join } = require('node:path')

const START = '// xplat-updates:start'
const END = '// xplat-updates:end'
function replaceBlock(source, content, insert) {
	const start = source.indexOf(START)
	if (start >= 0) {
		const end = source.indexOf(END, start)
		if (end < 0) {
			throw new Error('Incomplete xplat OTA boot block')
		}

		return source.slice(0, start) + START + '\n' + content + '\n' + source.slice(end)
	}

	return insert(source, START + '\n' + content + '\n' + END + '\n')
}

/** Idempotent after-prepare wiring; refuse unknown runtime templates. */
module.exports = function prepare({ projectDir, platform }) {
	platform = platform?.toLowerCase()
	if (platform === 'ios') {
		const xcconfig = join(projectDir, 'App_Resources/iOS/build.xcconfig')
		if (existsSync(xcconfig) && /NS_SWIFTUI_BOOT\s*=\s*1\b/.test(readFileSync(xcconfig, 'utf8'))) {
			throw new Error(
				'OTA requires the stock iOS main.m startup; SwiftUI boot needs an explicit integration',
			)
		}

		const file = join(projectDir, 'platforms/ios/internal/main.m')
		if (!existsSync(file)) {
			throw new Error('OTA: generated iOS main.m not found')
		}

		let source = readFileSync(file, 'utf8')
		const guard = readFileSync(join(__dirname, 'native/boot.m'), 'utf8')
		source = replaceBlock(source, guard, (text, block) => {
			const offset = text.search(/int\s+main\s*\(/)
			if (offset < 0) {
				throw new Error('OTA: unsupported iOS main.m template')
			}

			return text.slice(0, offset) + block + '\n' + text.slice(offset)
		})

		if (!source.includes('baseDir = XplatOTABoot(baseDir);')) {
			const anchor = /NSString\s*\*\s*baseDir\s*=\s*\[\[NSBundle mainBundle\] resourcePath\];/
			if (!anchor.test(source)) {
				throw new Error('OTA: unsupported iOS baseDir initialization')
			}

			source = source.replace(anchor, '$&\n    baseDir = XplatOTABoot(baseDir);')
		}

		writeFileSync(file, source)
	} else if (platform === 'android') {
		const manifest = join(projectDir, 'platforms/android/app/src/main/AndroidManifest.xml')
		const xml = readFileSync(manifest, 'utf8')
		const application = xml.match(/<application\b[^>]*>/s)?.[0]
		if (!application?.match(/android:name\s*=\s*["']com\.tns\.NativeScriptApplication["']/)) {
			throw new Error(
				'OTA requires the stock NativeScriptApplication; custom Android Application startup needs an explicit integration',
			)
		}

		const file = join(
			projectDir,
			'platforms/android/app/src/main/java/com/tns/NativeScriptApplication.java',
		)

		let source = readFileSync(file, 'utf8')
		const guard = readFileSync(join(__dirname, 'native/boot.java'), 'utf8')
		source = replaceBlock(source, guard, (text, block) => {
			const offset = text.lastIndexOf('}')
			if (offset < 0) {
				throw new Error('OTA: unsupported Android Application template')
			}

			return text.slice(0, offset) + block + text.slice(offset)
		})

		if (!source.includes('xplatOTABoot();')) {
			const anchor = 'com.tns.Runtime runtime = RuntimeHelper.initRuntime(this);'
			if (!source.includes(anchor)) {
				throw new Error('OTA: unsupported Android runtime initialization')
			}

			source = source.replace(anchor, 'xplatOTABoot();\n            ' + anchor)
		}

		writeFileSync(file, source)
	} else {
		throw new Error('OTA prepare supports only ios and android')
	}
}
