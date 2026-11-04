import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
export function nativeInputs(root) {
	const files = ['packages/cli/go', 'tools/cli-go'].flatMap((directory) =>
		readdirSync(join(root, directory), { recursive: true })
			.filter((file) => /\.(go|mod|sum|json|mjs|py|txt)$/.test(file))
			.map((file) => directory + '/' + file.replaceAll('\\', '/')),
	)
	for (const directory of ['packages/cli/src/agent', 'packages/cli/src/mcp/contracts']) {
		for (const file of readdirSync(join(root, directory))) {
			if (file.endsWith('.ts')) {
				files.push(directory + '/' + file)
			}
		}
	}
	files.push(
		'packages/cli/src/commands/routes.ts',
		'packages/cli/src/commands/typecheck.ts',
		'packages/cli/src/commands/fmt.ts',
		'packages/cli/src/commands/lint.ts',
		'packages/cli/src/commands/build.ts',
		'packages/cli/src/commands/clean.ts',
		'packages/cli/src/commands/patches.ts',
		'packages/cli/src/commands/doctor.ts',
		'packages/cli/src/commands/upgrade.ts',
		'packages/cli/src/upgrade-worker.ts',
		'packages/cli/src/doctor-checks.ts',
		'packages/cli/src/doctor-tool.ts',
		'packages/cli/src/compatibility.ts',
		'packages/cli/src/compatibility-check.ts',
		'packages/cli/src/mason-engine.ts',
		'packages/cli/src/targets.ts',
		'packages/create/compatibility.ts',
		'packages/macos-build/package.json',
		'packages/macos-build/vite.package.config.ts',
		'packages/macos-build/runtime-paths.ts',
		'packages/macos-build/project-package-root.ts',
		'packages/cli/src/macos/jsc-host/prebuilt/manifest.json',
		'packages/cli/src/patches.ts',
		'packages/cli/src/fmt-plan.ts',
		'packages/cli/src/tsconfig-envs.ts',
		'packages/cli/src/env.ts',
		'packages/cli/src/typecheck-globals/native.d.ts',
		'packages/cli/src/typecheck-globals/macos.d.ts',
		'packages/build/package.json',
		'packages/build/vite.package.config.ts',
		'packages/cli/src/linux/package.ts',
		'packages/cli/src/linux/config.ts',
		'packages/cli/src/linux/host/gjs-host.js',
		'packages/cli/src/linux/host/bridge-selftest.linux.js',
		'tools/cli-nim/route-templates.mjs',
		'packages/cli/package.json',
		'packages/create/compatibility.json',
		'packages/cli/src/cli-channel.ts',
		'packages/cli/src/package-manager.ts',
		'packages/cli/src/package-root.ts',
		'packages/cli/src/mcp/discovery.ts',
		'packages/cli/src/mcp/status.ts',
		'packages/cli/src/mcp/code-scope.ts',
		'packages/cli/src/mcp/code-service.ts',
		'packages/cli/src/mcp/code-retrieval.ts',
		'packages/cli/src/mcp/code-index.ts',
		'packages/cli/src/mcp/docs-binding.ts',
		'packages/cli/src/mcp/release-map.ts',
		'packages/cli/src/mcp/docs-retrieval.ts',
		'packages/cli/src/mcp/docs-guidance.ts',
		'packages/cli/src/mcp/docs-snapshots.ts',
		'packages/cli/src/mcp/docs-service.ts',
		'packages/docs-search/src/chunks.ts',
		'packages/docs-search/src/model.ts',
		'packages/docs-search/src/inference.ts',
		'tools/cli-nim/model-fixtures.mjs',
		'tools/cli-nim/ort-fixtures.mjs',
		'tools/cli-nim/ort-runtime.json',
		'packages/cli/src/mcp/contract.ts',
		'tools/cli-nim/scratch.mjs',
	)
	for (const file of readdirSync(join(root, 'packages/cli/src/macos'), { recursive: true })) {
		if (/\.(ts|js)$/.test(file)) {
			files.push('packages/cli/src/macos/' + file.replaceAll('\\', '/'))
		}
	}
	for (const file of readdirSync(join(root, 'packages/cli/test/fixtures/macos-native-leaves/c'), {
		recursive: true,
	})) {
		if (/\.(json|c|h)$/.test(file)) {
			files.push('packages/cli/test/fixtures/macos-native-leaves/c/' + file.replaceAll('\\', '/'))
		}
	}
	for (const file of readdirSync(join(root, 'packages/cli/patches'))) {
		if (/\.(json|patch)$/.test(file)) {
			files.push('packages/cli/patches/' + file)
		}
	}
	for (const file of readdirSync(join(root, 'packages/cli/src'))) {
		if (/^(?:route.*|build-worker|markdown)\.ts$/.test(file)) {
			files.push('packages/cli/src/' + file)
		}
	}
	return Object.fromEntries(
		files.sort().map((file) => [file, sha256(readFileSync(join(root, file)))]),
	)
}
