// Scaffold an independent app linked to this checkout for the opt-in MCP acceptance lane.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeTargets } from '../../create/scaffold.ts'

const dir = process.argv[2] && resolve(process.argv[2])
if (!dir || existsSync(dir)) {
	throw new Error('Supply a new directory: node tests/prepare-consumer.mjs /tmp/new-xplat-mcp-app')
}

const frameworkRoot = fileURLToPath(new URL('../../../', import.meta.url))
composeTargets(['web'], dir)
const manifestPath = join(dir, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
for (const section of ['dependencies', 'devDependencies']) {
	for (const name of Object.keys(manifest[section] ?? {})) {
		if (name.startsWith('@octane-xplat/')) {
			manifest[section][name] = `link:${join(frameworkRoot, 'packages', name.split('/')[1])}`
		}
	}
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n')
const entry = join(dir, 'src/main.web.tsrx')
writeFileSync(
	entry,
	readFileSync(entry, 'utf8') +
		`
// App-owned acceptance fixture; the production build removes the declaration and handler.
if (import.meta.env.DEV) {
	const { registerDevAction } = await import('@octane-xplat/platform/dev-actions');
	registerDevAction({
		id: 'fixture.describe-counter',
		title: 'Describe the starter counter',
		description: 'Return the bounded starter fixture identity without external effects.',
		result: { fields: { label: { type: 'string' }, controls: { type: 'integer' } } },
		effects: { summary: 'Read fixture identity; changes no app state.' },
		run: () => ({ label: 'starter-counter', controls: 3 }),
	});
	// Nonvisual privacy/ambiguity fixtures for host inspection.
	const privateHost = document.createElement('div');
	privateHost.id = 'fixture.private';
	const privateChild = document.createElement('span');
	privateChild.setAttribute('data-xplat-private', '');
	privateChild.textContent = 'PRIVATE_FIXTURE_VALUE';
	privateHost.append(privateChild);
	privateHost.hidden = true;
	document.body.append(privateHost);
	for (let i = 0; i < 2; i++) {
		const duplicate = document.createElement('span');
		duplicate.setAttribute('data-testid', 'fixture.duplicate');
		duplicate.hidden = true;
		document.body.append(duplicate);
	}
}
`,
)

console.log(
	`Scaffolded ${dir}. Run bun --cwd ${dir} install, then tests/consumer-workflow.mjs ${dir}.`,
)
