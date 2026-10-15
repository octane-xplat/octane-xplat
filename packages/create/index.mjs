#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
	composeLibrary,
	composeTargets,
	defaultTargets,
	resolveTargets,
	selectableTargets,
	targets,
} from './scaffold.mjs'

const argv = process.argv.slice(2)
const noInstall = argv.includes('--no-install')
const templateIndex = argv.findIndex((arg) => arg === '--template' || arg.startsWith('--template='))
const templateValueIndex =
	templateIndex !== -1 && argv[templateIndex] === '--template' ? templateIndex + 1 : -1

const templateArg =
	templateIndex === -1
		? 'app'
		: templateValueIndex !== -1
			? argv[templateValueIndex]
			: argv[templateIndex].slice('--template='.length)

const nameIndex = argv.findIndex((arg) => arg === '--name' || arg.startsWith('--name='))
const nameValueIndex = nameIndex !== -1 && argv[nameIndex] === '--name' ? nameIndex + 1 : -1
const nameArg =
	nameIndex === -1
		? undefined
		: nameValueIndex !== -1
			? argv[nameValueIndex]
			: argv[nameIndex].slice('--name='.length)

if (templateIndex !== -1 && (!templateArg || templateArg.startsWith('-'))) {
	console.error('✗ --template needs a value: app or library')
	process.exit(1)
}

if (!['app', 'library'].includes(templateArg)) {
	console.error(`✗ unknown template "${templateArg}" — expected app or library`)
	process.exit(1)
}

if (nameIndex !== -1 && (!nameArg || nameArg.startsWith('-'))) {
	console.error('✗ --name needs an npm package name')
	process.exit(1)
}

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

const optionValues = new Set(
	[targetsValueIndex, templateValueIndex, nameValueIndex].filter((index) => index !== -1),
)

const positional = argv.filter((arg, i) => !arg.startsWith('-') && !optionValues.has(i))
const defaultDir = templateArg === 'library' ? 'octane-xplat-library' : 'octane-xplat-app'
const dir = resolve(positional[0] ?? defaultDir)

if (templateArg === 'library' && targetsIndex !== -1) {
	console.error('✗ --targets applies to the app template; libraries start with web and native builds')
	process.exit(1)
}

if (templateArg === 'app' && nameIndex !== -1) {
	console.error('✗ --name applies only to the library template')
	process.exit(1)
}

if (existsSync(dir) && readdirSync(dir).length > 0) {
	console.error(`✗ ${dir} exists and is not empty`)
	process.exit(1)
}

const parseTargets = (value) => {
	const ids = value
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)

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

let ids = []
if (templateArg === 'library') {
	const packageName = nameArg ?? basename(dir)
	try {
		composeLibrary(dir, packageName)
	} catch (error) {
		console.error(`✗ ${error.message}`)
		process.exit(1)
	}

	console.log(`\n✓ scaffolded ${dir} (library: ${packageName}; web + iOS + Android)`)
} else {
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
	console.log(
		`\n✓ scaffolded ${dir} (${[...new Set(resolveTargets(ids))].filter((id) => !targets[id].hidden).join(', ')})`,
	)
}

if (noInstall) {
	console.log('\nSkipped install (--no-install). To run manually:')
	printNextSteps(dir, ids, templateArg)
	process.exit(0)
}

const install = spawnSync('pnpm', ['install'], { cwd: dir, stdio: 'inherit' })
if (install.status !== 0) {
	console.log(`\nInstall didn't finish (pnpm missing?). To run manually:`)
	printNextSteps(dir, ids, templateArg)
	process.exit(install.status ?? 1)
}

if (templateArg === 'app' && ids.includes('web')) {
	console.log('\n✓ installed — starting dev server (Ctrl+C to stop)\n')
	spawnSync('pnpm', ['dev'], { cwd: dir, stdio: 'inherit' })
} else {
	console.log('\n✓ installed. Next steps:')
	printNextSteps(dir, ids, templateArg)
}

function printNextSteps(dir, ids, template) {
	console.log(`  cd ${dir}\n  pnpm install`)
	if (template === 'library') {
		console.log('  pnpm typecheck\n  pnpm lint\n  pnpm typegen\n  pnpm test\n  pnpm test:packed')
		return
	}

	if (ids.includes('web')) {
		console.log('  pnpm dev')
	} else {
		// No web entry — `xplat dev` discovers whichever native targets exist.
		console.log('  pnpm xplat dev')
	}
}
