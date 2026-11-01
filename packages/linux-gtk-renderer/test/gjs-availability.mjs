// Central availability gates for the real-GJS runtime tests. Check BEFORE
// building fixture bundles: without gjs (or the gitignored XplatMason
// artifacts) nothing downstream can execute, and probing first keeps CI
// machines without the GTK toolchain on the same skip path as css/mason.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
const MASON_LIB = process.platform === 'darwin' ? 'libxplatmason-gtk.dylib' : 'libxplatmason-gtk.so'

/** gjs on PATH. A missing binary yields status null (error ENOENT) — === 0 is false either way. */
export function gjsAvailable() {
	return spawnSync('gjs', ['--version']).status === 0
}

/** XplatMason-1.0.typelib — produced by native/xplatmason/build.sh, gitignored. */
export function masonTypelibPresent() {
	return existsSync(join(nativeDir, 'XplatMason-1.0.typelib'))
}

/** The shared library the typelib resolves — same gitignored build output. */
export function masonLibPresent() {
	return existsSync(join(nativeDir, MASON_LIB))
}

/** Everything needed to execute a bundled fixture under real GJS+GTK. */
export function gtkRuntimeReady() {
	return gjsAvailable() && masonTypelibPresent() && masonLibPresent()
}

export function xdotoolAvailable() {
	return spawnSync('xdotool', ['version']).status === 0
}

/** Real OS-input evidence additionally needs X11 on Linux. */
export function gtkOsInputReady() {
	return process.platform === 'linux' && !!process.env.DISPLAY && xdotoolAvailable()
}

/** Where bundles point GI_TYPELIB_PATH/XPLAT_MASON_TYPELIB when running. */
export const xplatMasonNativeDir = nativeDir
