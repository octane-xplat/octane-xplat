#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Lockstep version bump for the release workflow: sets every publishable
// package to the same version and regenerates the compatibility manifest and
// starter pins, including the framework patches config dependency.
// tsrx-typegen keeps its own cadence and is untouched.
// Package versions use text-level edits; compatibility outputs are generated.
//
// Usage: node scripts/bump-versions.ts <version>

import { readFileSync, writeFileSync } from 'node:fs'
import { lockstepPackages } from './publishable.ts'
import { compatibility } from '../packages/create/compatibility.ts'
import { syncCompatibility } from './sync-compatibility.ts'

const version = process.argv[2]?.replace(/^v/, '')
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
	console.error('usage: node scripts/bump-versions.ts <semver>')
	process.exit(1)
}

const setKey = (raw, key, value) => {
	const next = raw.replace(new RegExp(`"${key}":\\s*"[^"]*"`), `"${key}": "${value}"`)
	if (next === raw) {
		throw new Error(`"${key}" not found`)
	}

	return next
}

for (const { name, dir } of lockstepPackages()) {
	const file = `${dir}/package.json`
	writeFileSync(file, setKey(readFileSync(file, 'utf8'), 'version', version))
	console.log(`${name} -> ${version}`)
}

compatibility.frameworkVersion = version
syncCompatibility()
console.log('compatibility set and starter pins -> ' + version)
