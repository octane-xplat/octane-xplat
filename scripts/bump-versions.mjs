#!/usr/bin/env node
// Lockstep version bump for the release workflow: sets every publishable
// package to the same version and repins the create template's @octane-xplat/*
// deps to ^<version>. tsrx-typegen keeps its own cadence and is untouched.
// Edits are text-level so each file's formatting survives untouched.
//
// Usage: node scripts/bump-versions.mjs <version>

import { readFileSync, writeFileSync } from 'node:fs'
import { lockstepPackages } from './publishable.mjs'

const version = process.argv[2]?.replace(/^v/, '')
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
	console.error('usage: node scripts/bump-versions.mjs <semver>')
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

const templateFile = 'packages/create/template/package.json'
const template = readFileSync(templateFile, 'utf8').replace(
	/"(@octane-xplat\/[^"]+)":\s*"[^"]*"/g,
	`"$1": "^${version}"`,
)

writeFileSync(templateFile, template)
console.log('create template @octane-xplat/* pins -> ^' + version)
