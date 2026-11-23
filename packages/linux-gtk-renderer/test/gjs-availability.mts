// Central availability gates for the real-GJS runtime tests. Mason is
// required at createGtkRoot, so readiness means gjs plus a resolvable
// XplatMason binding: on Linux the shipped prebuilt for the host arch
// (emitted beside every fixture bundle by the linux-gtk Vite preset),
// anywhere else the XPLAT_MASON_TYPELIB override pointing at a
// native/xplatmason build.sh output directory.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const pkg = fileURLToPath(new URL('..', import.meta.url))
const MASON_LIB = 'libxplatmason-gtk.so'

/** gjs on PATH. A missing binary yields status null (error ENOENT) — === 0 is false either way. */
export function gjsAvailable() {
  return spawnSync('gjs', ['--version']).status === 0
}

/** Host architecture in `uname -m` spelling — the platforms/linux/prebuilt directory name. */
function hostArch() {
  try {
    return execFileSync('uname', ['-m'], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

/** The shipped prebuilt binding for this machine — Linux hosts only. */
function prebuiltDir() {
  if (process.platform !== 'linux') {
    return null
  }

  const dir = join(pkg, 'platforms', 'linux', 'prebuilt', hostArch())

  return existsSync(join(dir, 'XplatMason-1.0.typelib')) && existsSync(join(dir, MASON_LIB))
    ? dir
    : null
}

/** A developer override — XPLAT_MASON_TYPELIB naming a build.sh output dir. */
function masonOverride() {
  const dir = process.env.XPLAT_MASON_TYPELIB

  return dir && existsSync(join(dir, 'XplatMason-1.0.typelib')) ? dir : null
}

export function masonTypelibPresent() {
  return prebuiltDir() != null || masonOverride() != null
}

export function masonLibPresent() {
  const dir = prebuiltDir() ?? masonOverride()

  return dir != null && existsSync(join(dir, MASON_LIB))
}

/** Everything needed to execute a bundled fixture under real GJS+GTK. */
export function gtkRuntimeReady() {
  return gjsAvailable() && masonTypelibPresent()
}

/** The skip reason when gtkRuntimeReady() is false — names the override so
 *  non-Linux hosts (e.g. macOS Homebrew GJS) know how to opt in. */
export function gtkRuntimeUnavailableReason() {
  if (!gjsAvailable()) {
    return 'gjs is not installed'
  }

  if (masonOverride()) {
    return null
  }

  if (process.platform === 'linux') {
    return `no prebuilt XplatMason binding for ${hostArch()} — supported arches are x86_64 and aarch64`
  }

  return 'XplatMason ships for Linux only — set XPLAT_MASON_TYPELIB to a build.sh output dir to run under this host’s GJS'
}

export function xdotoolAvailable() {
  return spawnSync('xdotool', ['version']).status === 0
}

/** Real OS-input evidence additionally needs X11 on Linux. */
export function gtkOsInputReady() {
  return process.platform === 'linux' && !!process.env.DISPLAY && xdotoolAvailable()
}
