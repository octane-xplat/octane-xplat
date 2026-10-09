#!/usr/bin/env node
// Rewrites missing `node_modules/.bin` shims for `link:`-protocol dependencies.
//
// pnpm reads a link: dep's manifest while resolving, before the app's own
// install hooks run. When the spec points through a path a `preinstall` hook
// only creates mid-install (e.g. a sibling symlink to a local checkout), the
// dep records as an empty package: pnpm writes the node_modules symlink but no
// .bin shims, and later installs report "Already up to date" without
// re-linking (GH#16). pnpm 12 re-resolves these deps and is unaffected.
//
// Run from the app root — once by hand, or from `postinstall` after the
// link-target hook so the first install lands shims too:
//
//   node node_modules/@octane-xplat/cli/src/link-bins.mjs
//
// Only bins missing from .bin are written; existing pnpm shims are untouched.
import {
	chmodSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { join, relative, sep } from 'node:path'

const appRoot = process.cwd()
const DEP_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies']

const readJson = (file) => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

const binEntries = (name, bin) => {
	if (typeof bin === 'string') {
		return [[name.startsWith('@') ? name.split('/')[1] : name, bin]]
	}

	return Object.entries(bin ?? {})
}

const shCommand = (rel) =>
	`#!/bin/sh\nexec node "$(dirname "$0")/${rel}" "$@"\n`

const cmdShim = (rel) =>
	`@ECHO off\nnode "%~dp0\\${rel.replaceAll('/', '\\')}" %*\n`

const ps1Shim = (rel) =>
	`#!/usr/bin/env pwsh\n& node "$PSScriptRoot/${rel}" @args\nexit $LASTEXITCODE\n`

const manifest = readJson(join(appRoot, 'package.json'))
if (!manifest) {
	console.error('link-bins: no readable package.json in', appRoot)
	process.exit(1)
}

const linkDeps = DEP_FIELDS.flatMap((field) =>
	Object.entries(manifest[field] ?? {}).filter(([, spec]) => spec.startsWith('link:')),
).map(([name]) => name)

if (linkDeps.length === 0) {
	console.log('link-bins: no link: dependencies declared — nothing to do')
	process.exit(0)
}

const binDir = join(appRoot, 'node_modules', '.bin')
const linked = []
const skipped = []

for (const name of linkDeps) {
	const depDir = join(appRoot, 'node_modules', ...name.split('/'))
	const depManifest = readJson(join(depDir, 'package.json'))
	if (!depManifest) {
		skipped.push(`${name} (unreadable node_modules/${name}/package.json)`)
		continue
	}

	for (const [binName, entry] of binEntries(name, depManifest.bin)) {
		const target = join(depDir, entry)
		const shim = join(binDir, binName)
		if (!existsSync(target)) {
			skipped.push(`${binName} (missing ${entry} in ${name})`)
			continue
		}

		if (existsSync(shim) || lstatSync(shim, { throwIfNoEntry: false })) {
			continue
		}

		mkdirSync(binDir, { recursive: true })
		const rel = relative(binDir, target).split(sep).join('/')
		if (process.platform === 'win32') {
			writeFileSync(shim, shCommand(rel))
			writeFileSync(`${shim}.cmd`, cmdShim(rel))
			writeFileSync(`${shim}.ps1`, ps1Shim(rel))
			chmodSync(shim, 0o755)
		} else {
			symlinkSync(rel, shim)
			chmodSync(target, 0o755)
		}

		linked.push(binName)
	}
}

for (const note of skipped) {
	console.warn(`link-bins: skipped ${note}`)
}

console.log(
	linked.length ? `link-bins: wrote .bin shims for ${linked.join(', ')}` : 'link-bins: .bin already complete',
)
