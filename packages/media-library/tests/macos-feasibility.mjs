import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const repo = process.env.XPLAT_NATIVE_TEST_REPO
assert.ok(repo, 'Select the skymac.local checkout with XPLAT_NATIVE_TEST_REPO')
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const ts = createRequire(join(repo, 'package.json'))('typescript')
const hostRoot = join(repo, 'packages/cli/src/macos/jsc-host')
const bundle = join(hostRoot, 'prebuilt/macos-arm64')
const directory = await mkdtemp(join(tmpdir(), 'xplat-photos-feasibility-'))
try {
	const modules = []
	for (const name of ['types', 'observer.photos', 'backend.photos', 'photos-runtime.macos']) {
		const source = await readFile(join(packageRoot, 'src', `${name}.ts`), 'utf8')
		const code = ts.transpile(source, {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		})
		modules.push(
			`registry[${JSON.stringify(`./${name}`)}] = (() => { const exports = {}; ${code}; return exports })();`,
		)
	}
	const script = join(directory, 'case.cjs')
	await writeFile(
		script,
		`(function () {
const registry = {};
const require = name => name === '@octane-xplat/platform/macos' ? globalThis : name === '@octane-xplat/lib/capability' ? { UnavailabilityError: class extends Error {} } : registry[name];
${modules.join('\n')}
NSApplication.sharedApplication;
setTimeout(async () => {
 try {
  const host = registry['./photos-runtime.macos'].appleHost;
  const backend = registry['./backend.photos'].createPhotosBackend(host);
  if (!backend.isAvailable()) throw new Error('PhotoKit is unavailable');
  const permission = await backend.permissions(false, false);
  if (permission.status !== 'undetermined') throw new Error('Refusing data queries under an already authorized host identity');
  let rejected = false;
  try { await backend.query({ filters: [], order: [], offset: 0, limit: 1 }); } catch { rejected = true; }
  if (!rejected) throw new Error('Read guard did not reject an unauthorized query');
  let configured = false;
  try { await backend.permissions(true, false); } catch (error) { configured = error.message.includes('NSPhotoLibraryUsageDescription'); }
  if (!configured) throw new Error('Missing usage description did not reject before prompting');
  const observer = host.observer(() => {}); observer.release(); observer.release();
  console.log('PHOTOS_FEASIBILITY ' + JSON.stringify({ available: true, status: 0, observer: true, detail: '' }));
 } catch (error) { console.error('PHOTOS_BACKEND_FAIL ' + error.message); }
 finally { globalThis.__xplatStopHost(); }
}, 0);
})();`,
	)
	const bytes = await readFile(join(bundle, 'host'))
	const manifest = JSON.parse(await readFile(join(hostRoot, 'prebuilt/manifest.json'), 'utf8'))
	assert.equal(
		createHash('sha256').update(bytes).digest('hex'),
		manifest.sha256['macos-arm64/host'],
	)
	const executable = join(directory, 'host')
	await writeFile(executable, bytes, { mode: 0o755 })
	const bootstrap = join(directory, 'bootstrap.js')
	await writeFile(bootstrap, await readFile(join(hostRoot, 'shim.js')))
	const run = spawnSync(
		executable,
		[
			join(bundle, 'NativeScript.framework/Versions/A/NativeScript'),
			script,
			join(bundle, 'metadata.nsmd'),
			bootstrap,
		],
		{ encoding: 'utf8', timeout: 15000 },
	)
	assert.equal(run.status, 0, `${run.stdout}${run.stderr}`)
	const line = `${run.stdout}${run.stderr}`
		.split('\n')
		.find((line) => line.startsWith('PHOTOS_FEASIBILITY '))
	assert.ok(line, `${run.stdout}${run.stderr}`)
	const result = JSON.parse(line.slice('PHOTOS_FEASIBILITY '.length))
	assert.ok(result.available, 'PhotoKit metadata/runtime unavailable')
	assert.ok(Number.isInteger(result.status))
	assert.ok(result.observer, result.detail)
	console.log(
		'AppKit source adapter: availability, nonprompting permissions, denied read guard, missing-purpose guard and observer release passed; no assets were queried.',
	)
} finally {
	await rm(directory, { recursive: true, force: true })
}
