import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { withWorkshopMobile, MOBILE_CATALOG_ID, mobileCatalogCode } from '../dist/build/vite-mobile.js'
import { transformMobileRegex } from '../dist/build/mobile-regex.js'
import { mobilePrerequisites, mobileLaunchSpec } from '../dist/build/mobile-node.js'

function consumer() {
	const root = mkdtempSync(join(tmpdir(), 'workshop-mobile-'))
	writeFileSync(join(root, 'package.json'), JSON.stringify({ main: 'main.ts' }))
	return root
}

describe('native workshop Vite seam', () => {
	it('production config is identical with no workshop target', () => {
		const config = { plugins: [{ name: 'octane' }], resolve: { conditions: ['native'] } }
		expect(withWorkshopMobile(config)).toBe(config)
	})

	it.each(['ios', 'android'])(
		'prepends pre HMR before compiler for %s and keeps the consumer config',
		(target) => {
			const root = consumer()
			const compiler = { name: 'octane', hotUpdate: { order: 'pre' } }
			const config = {
				plugins: [compiler],
				resolve: { conditions: ['native'] },
				define: { APP: true },
			}

			const next = withWorkshopMobile(config, { cwd: root, target })
			expect(next.plugins.at(-1)).toBe(compiler)
			expect(next.resolve).toBe(config.resolve)
			const plugin = next.plugins[0]
			expect(plugin.hotUpdate.order).toBe('pre')
			const module = { id: MOBILE_CATALOG_ID, isSelfAccepting: true }
			let invalidated
			const context = {
				environment: {
					name: 'native-host',
					moduleGraph: {
						getModuleById: () => module,
						invalidateModule(m) {
							invalidated = m
						},
					},
				},
			}

			expect(
				plugin.hotUpdate.handler.call(context, { file: join(root, 'component.tsrx') }),
			).toEqual([module])

			expect(invalidated).toBe(module)
			const entry = plugin.load(join(root, 'main.ts'))
			expect(entry).toContain('@octane-xplat/workshop/mobile')
			expect(entry).toContain(`target: "${target}"`)
			expect(entry).not.toContain('/web')
			expect(plugin.load(join(root, 'other.ts'))).toBeUndefined()
		},
	)

	it('static target filtering excludes foreign loaders before evaluation', () => {
		const root = consumer()
		writeFileSync(
			join(root, 'only.stories.ios.tsrx'),
			`throw new Error('MUST NOT EVALUATE'); export const Basic = defineStory({id:'ios/only',title:'Only iOS',targets:['ios'],component:C,args:{}})`,
		)

		const code = mobileCatalogCode(root, {}, 'android')
		expect(code).toContain('ios/only')
		expect(code).not.toContain('import("/@fs/')
		expect(code).toContain('import.meta.hot.accept')
	})

	it('doctor stays read-only and reports unknown host qualification truthfully', () => {
		const root = consumer()
		const result = mobilePrerequisites(root, 'ios', 'linux', {})
		expect(result.status).toBe('remote-host-required')
		expect(result.note).toContain('qualification remain open')
	})
})

it('requires explicit device and passes the installed CLI argv without a shell', () => {
	const root = consumer()
	expect(() => mobileLaunchSpec({ root, target: 'ios', config: {} })).toThrow('--device')
	expect(() => mobileLaunchSpec({ root, target: 'android', device: '--all', config: {} })).toThrow(
		'--device',
	)

	const cli = join(root, 'node_modules', 'nativescript')
	mkdirSync(cli, { recursive: true })
	writeFileSync(
		join(cli, 'package.json'),
		JSON.stringify({ name: 'nativescript', bin: { ns: 'bin/ns.js' } }),
	)

	const spec = mobileLaunchSpec({
		root,
		target: 'android',
		device: 'owned-device;literal',
		story: 'shared/basic',
		config: { stories: { include: ['*.stories.tsrx'] } },
	})

	expect(spec.args.slice(1)).toEqual(['run', 'android', '--device', 'owned-device;literal'])
	expect(spec.options.shell).toBe(false)
	expect(spec.options.env.XPLAT_WORKSHOP_TARGET).toBe('android')
	expect(spec.options.env.XPLAT_WORKSHOP_STORY).toBe('shared/basic')
	expect(JSON.parse(spec.options.env.XPLAT_WORKSHOP_CONFIG).stories.include).toEqual([
		'*.stories.tsrx',
	])
})

it('lowers Unicode properties in literals and constant constructors without patching globals', async () => {
	const result = await transformMobileRegex(
		`const a = /\\p{Emoji}/u; const b = new RegExp('\\\\p{Letter}', 'u')`,
	)

	expect(result.code).not.toContain('\\p{')
	expect(result.code).not.toContain('new RegExp')
	const shadowed = await transformMobileRegex(
		`function f(RegExp) { return new RegExp('\\\\p{Letter}', 'u') }`,
	)

	expect(shadowed.code).toContain('new RegExp')
})
