#!/usr/bin/env node
// package.mjs — assemble the runnable Linux app dir from the vite bundle.
// Output: dist-app/
//   bundle/                  built web bundle (served over xplat://)
//   host/gjs-host.js         the GJS/WebKitGTK host
//   host/bridge-selftest.linux.js
//   xplat.desktop            freedesktop entry + x-scheme-handler registration
//   run.sh                   launches gjs gjs-host.js xplat://localhost/
import { chmodSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(appRoot, 'dist-app')
const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
const scheme = pkg.xplat?.targets?.linux?.host?.scheme ?? 'xplat'
const appName = 'Octane xplat'

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'host'), { recursive: true })

cpSync(join(appRoot, 'dist'), join(out, 'bundle'), { recursive: true })
cpSync(join(appRoot, 'host', 'gjs-host.js'), join(out, 'host', 'gjs-host.js'))
cpSync(
	join(appRoot, 'host', 'bridge-selftest.linux.js'),
	join(out, 'host', 'bridge-selftest.linux.js'),
)

// %u receives scheme-activated URLs; installing this file + running
// `xdg-desktop-menu install` is what makes the host get the 'open' signal.
writeFileSync(
	join(out, `${scheme}.desktop`),
	`[Desktop Entry]
Type=Application
Name=${appName}
Exec=${join(out, 'run.sh')} %u
Terminal=false
Categories=Development;
MimeType=x-scheme-handler/${scheme};
`,
)

writeFileSync(
	join(out, 'run.sh'),
	`#!/bin/sh
cd "$(dirname "$0")"
exec gjs host/gjs-host.js "${scheme}://localhost/" "$@"
`,
)

chmodSync(join(out, 'run.sh'), 0o755)

console.log(`packaged linux app dir → ${out}`)
console.log(`run: sh ${join(out, 'run.sh')}`)
