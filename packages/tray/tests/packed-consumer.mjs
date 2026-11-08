import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
	mkdtempSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
	symlinkSync,
	rmSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const temporary = mkdtempSync(join(tmpdir(), 'xplat-tray-consumer-'))
const run = (command, args, cwd = temporary) =>
	execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 90_000,
		maxBuffer: 4 * 1024 * 1024,
	})

try {
	run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', temporary], root)
	const tarball = readdirSync(temporary).find((name) => name.endsWith('.tgz'))
	run('tar', ['-xzf', join(temporary, tarball), '-C', temporary])
	const scope = join(temporary, 'node_modules/@octane-xplat')
	mkdirSync(scope, { recursive: true })
	symlinkSync(join(temporary, 'package'), join(scope, 'tray'), 'dir')

	writeFileSync(join(temporary, 'package.json'), JSON.stringify({ type: 'module' }))
	writeFileSync(
		join(temporary, 'consumer.ts'),
		`
import {
	getTrayAvailability,
	createTray,
	showAppWindows,
	hideAppWindows,
	toggleAppWindows,
	areAppWindowsVisible,
	keepAppResident,
	TrayError,
	type AppResidency,
	type Tray,
	type TrayAvailability,
	type TrayActionItem,
	type TrayCheckboxItem,
	type TrayErrorCode,
	type TrayIcon,
	type TrayMenuItem,
	type TrayOptions,
	type TrayPlatformIcons,
	type TrayRadioGroupItem,
	type TrayRadioOption,
	type TraySectionItem,
	type TraySeparatorItem,
	type TraySubmenuItem,
	type TrayUnavailableReason,
	type TrayUpdate,
} from '@octane-xplat/tray'

const menu: TrayMenuItem[] = [
	{type:'action',key:'a',label:'A',onSelect(){},isDisabled:false},
	{type:'checkbox',key:'c',label:'C',value:true,onValueChange(v:boolean){void v}},
	{type:'radio-group',key:'r',label:'R',value:'x',onValueChange(v:string){void v},items:[{key:'o',label:'O',value:'x'}]},
	{type:'submenu',key:'s',label:'S',items:[{type:'action',key:'sa',label:'SA'}]},
	{type:'section',key:'sec',label:'Sec',items:[{type:'separator',key:'s1'}]},
	{type:'separator',key:'s2'},
]
const icon: TrayIcon = {type:'file',path:'/tmp/i.png',isTemplate:true}
const icons: TrayPlatformIcons = {macos:icon,linux:{type:'named',name:'star'}}
const opts: TrayOptions = {id:'app',icon:icons,tooltip:'t',title:'T',menu,onActivate(){}}
const update: TrayUpdate = {tooltip:null,title:null,menu:null,onActivate:null,icon}
const reason: TrayUnavailableReason = 'no-session-bus'
const code: TrayErrorCode = 'registration-failed'
const action: TrayActionItem = menu[0] as TrayActionItem
const checkbox: TrayCheckboxItem = menu[1] as TrayCheckboxItem
const radio: TrayRadioGroupItem = menu[2] as TrayRadioGroupItem
const option: TrayRadioOption = radio.items[0]
const submenu: TraySubmenuItem = menu[3] as TraySubmenuItem
const section: TraySectionItem = menu[4] as TraySectionItem
const separator: TraySeparatorItem = menu[5] as TraySeparatorItem
const error = new TrayError('invalid-options','bad')
export async function probe(): Promise<TrayAvailability> {
	const availability = await getTrayAvailability()
	if (!availability.available) console.log(availability.reason, availability.message)
	const tray: Tray = await createTray(opts)
	tray.update(update)
	tray.destroy()
	console.log(tray.id, tray.isDestroyed, error.code, reason, code, action, checkbox, radio, option, submenu, section, separator)
	showAppWindows(); hideAppWindows(); toggleAppWindows(); areAppWindowsVisible()
	const residency: AppResidency = keepAppResident({hideWindowsOnClose:true})
	residency.release()
	return availability
}
`,
	)

	for (const condition of ['web', 'browser', 'macos', 'gtk', 'windows', 'native']) {
		for (const mode of ['Bundler', 'NodeNext']) {
			writeFileSync(
				join(temporary, 'tsconfig.json'),
				JSON.stringify({
					compilerOptions: {
						strict: true,
						noEmit: true,
						target: 'ES2022',
						lib: ['ES2022'],
						types: [],
						module: mode === 'Bundler' ? 'ESNext' : 'NodeNext',
						moduleResolution: mode,
						customConditions: [condition],
						skipLibCheck: false,
					},
					files: ['consumer.ts'],
				}),
			)

			// The consumer intentionally has no DOM or platform ambient types.
			writeFileSync(
				join(temporary, 'console.d.ts'),
				'declare const console: { log(...args: unknown[]): void }\n',
			)

			const config = JSON.parse(readFileSync(join(temporary, 'tsconfig.json')))
			config.files.push('console.d.ts')
			writeFileSync(join(temporary, 'tsconfig.json'), JSON.stringify(config))
			run(process.execPath, [
				join(root, 'node_modules/typescript/bin/tsc'),
				'-p',
				join(temporary, 'tsconfig.json'),
			])
		}

		const resolved = run(process.execPath, [
			`--conditions=${condition}`,
			'--input-type=module',
			'-e',
			"console.log(import.meta.resolve('@octane-xplat/tray'))",
		])

		assert.match(
			resolved,
			new RegExp(
				`index${condition === 'native' ? '' : condition === 'browser' ? '\\.web' : `\\.${condition}`}\\.js`,
			),
		)
	}

	for (const condition of ['macos', 'gtk', 'windows']) {
		const resolved = run(process.execPath, [
			'--conditions=browser',
			`--conditions=${condition}`,
			'--input-type=module',
			'-e',
			"console.log(import.meta.resolve('@octane-xplat/tray'))",
		])

		assert.ok(
			resolved.trim().endsWith(`index.${condition}.js`),
			'Native host must win over Vite browser defaults',
		)
	}

	await run(process.execPath, [
		'--input-type=module',
		'-e',
		`
import {createTray,getTrayAvailability,TrayError} from '@octane-xplat/tray'
const availability = await getTrayAvailability()
if (availability.available) throw Error('default consumer must be unsupported')
try { await createTray({id:'x',icon:{type:'named',name:'star'}}); throw Error('unexpected support') }
catch(error) { if (!(error instanceof TrayError) || error.code !== 'unsupported-platform') throw error }
`,
	])

	console.log(
		'Packed consumer: six conditions × Bundler/NodeNext, closed ambient-free declarations, ESM resolution and unsupported-host failure passed.',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
