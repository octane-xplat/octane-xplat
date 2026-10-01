#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
	composeTargets,
	defaultTargets,
	resolveTargets,
	selectableTargets,
	targets,
} from './scaffold.mjs'

const argv = process.argv.slice(2)
const noInstall = argv.includes('--no-install')
const targetsIndex = argv.findIndex((arg) => arg === '--targets' || arg.startsWith('--targets='))
const targetsValueIndex =
	targetsIndex !== -1 && argv[targetsIndex] === '--targets' ? targetsIndex + 1 : -1

const targetsArg =
	targetsIndex === -1
		? undefined
		: targetsValueIndex !== -1
			? argv[targetsValueIndex]
			: argv[targetsIndex].slice('--targets='.length)

if (targetsIndex !== -1 && (targetsArg === undefined || targetsArg.startsWith('-'))) {
	console.error(`✗ --targets needs a comma list: ${selectableTargets.join(', ')}`)
	process.exit(1)
}

const positional = argv.filter((arg, i) => !arg.startsWith('-') && i !== targetsValueIndex)
const dir = resolve(positional[0] ?? 'octane-xplat-app')

if (existsSync(dir) && readdirSync(dir).length > 0) {
	console.error(`✗ ${dir} exists and is not empty`)
	process.exit(1)
}

const parseTargets = (value) => {
	const ids = value.split(',').map((s) => s.trim()).filter(Boolean)
	if (ids.length === 0) {
		throw new Error(`--targets needs a comma list: ${selectableTargets.join(', ')}`)
	}

	for (const id of ids) {
		if (!selectableTargets.includes(id)) {
			throw new Error(
				`unknown target "${id}" — expected a comma list of: ${selectableTargets.join(', ')}`,
			)
		}
	}

	return resolveTargets(ids)
}

let ids
if (targetsArg !== undefined) {
	try {
		ids = parseTargets(targetsArg)
	} catch (error) {
		console.error(`✗ ${error.message}`)
		process.exit(1)
	}
} else if (process.stdout.isTTY) {
	// Lazy: the extracted tarball has no installed deps — only the interactive
	// path needs @clack/prompts (verify-consumer runs the bin dep-free).
	const p = await import('@clack/prompts')
	p.intro('create-octane-xplat')
	const picked = await p.multiselect({
		message: 'Target platforms',
		options: selectableTargets.map((id) => ({
			value: id,
			label: targets[id].label,
			hint: targets[id].note,
		})),
		initialValues: [...defaultTargets],
		required: true,
	})

	if (p.isCancel(picked)) {
		p.cancel('Cancelled')
		process.exit(0)
	}

	ids = picked
} else {
	ids = defaultTargets
}

composeTargets(ids, dir)

console.log(`\n✓ scaffolded ${dir} (${[...new Set(resolveTargets(ids))].filter((id) => !targets[id].hidden).join(', ')})`)

if (noInstall) {
	console.log('\nSkipped install (--no-install). To run manually:')
	printNextSteps(dir, ids)
	process.exit(0)
}

const install = spawnSync('pnpm', ['install'], { cwd: dir, stdio: 'inherit' })
if (install.status !== 0) {
	console.log(`\nInstall didn't finish (pnpm missing?). To run manually:`)
	printNextSteps(dir, ids)
	process.exit(install.status ?? 1)
}

if (ids.includes('web')) {
	console.log('\n✓ installed — starting dev server (Ctrl+C to stop)\n')
	spawnSync('pnpm', ['dev'], { cwd: dir, stdio: 'inherit' })
} else {
	console.log('\n✓ installed. To run:')
	printNextSteps(dir, ids)
}

function printNextSteps(dir, ids) {
	console.log(`  cd ${dir}\n  pnpm install`)
	if (ids.includes('web')) {
		console.log('  pnpm dev')
	} else {
		// No web entry — `xplat dev` discovers whichever native targets exist.
		console.log('  pnpm xplat dev')
	}
}
