import { xplatMacOS } from '@octane-xplat/cli/macos/vite'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))
const fontAssetRoot = resolve(appRoot, '../../packages/app/src/assets/fonts')

export function bundledFontDefines() {
	return {
		__XPLAT_GEIST_FONT_BASE64__: JSON.stringify(
			readFileSync(join(fontAssetRoot, 'Geist-Variable.ttf')).toString('base64'),
		),
		__XPLAT_GEIST_FONT_LICENSE__: JSON.stringify(
			readFileSync(join(fontAssetRoot, 'OFL.txt'), 'utf8'),
		),
	}
}

export function createMacOSConfig({ packaged = false, hmr = false, rules } = {}) {
	const virtualListBench = hmr && process.env.OCTANE_MACOS_VLIST_BENCH === '1'
	const mode = process.env.OCTANE_MACOS_VLIST_MODE
	const entry = packaged
		? 'src/main.mjs'
		: virtualListBench
			? mode === 'variable'
				? 'src/VirtualListVariableWindowedBench.tsx'
				: mode === 'windowed'
					? 'src/VirtualListWindowedBench.tsx'
					: 'src/VirtualListBench.tsx'
			: 'src/App.tsx'
	return defineConfig(async ({ mode }) => {
		const config = await xplatMacOS(mode, { root: appRoot, packaged, hmr, rules, entry })
		return { ...config, define: { ...config.define, ...(packaged ? bundledFontDefines() : {}) } }
	})
}
