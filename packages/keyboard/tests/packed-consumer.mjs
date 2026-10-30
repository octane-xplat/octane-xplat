import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const temporary = mkdtempSync(join(tmpdir(), 'xplat-keyboard-consumer-'))
const run = (command, args, cwd = root) => {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
}

try {
	const modules = join(temporary, 'node_modules')
	mkdirSync(join(modules, '@octane-xplat'), { recursive: true })
	// Copy actual tarballs: workspace source links cannot conceal missing declarations.
	for (const name of ['platform', 'ui', 'keyboard']) {
		const output = join(temporary, 'pack', name)
		mkdirSync(output, { recursive: true })
		run(
			'bun',
			['pm', 'pack', '--ignore-scripts', '--destination', output],
			join(root, 'packages', name),
		)

		const archive = readdirSync(output).find((file) => file.endsWith('.tgz'))
		assert.ok(archive)
		run('tar', ['-xzf', join(output, archive), '-C', output])
		cpSync(join(output, 'package'), join(modules, '@octane-xplat', name), { recursive: true })
	}

	for (const [name, owner] of [
		['octane', 'keyboard'],
		['@octane-xplat/lib', 'ui'],
	]) {
		const destination = join(modules, name)
		mkdirSync(dirname(destination), { recursive: true })
		symlinkSync(join(root, 'packages', owner, 'node_modules', name), destination, 'dir')
	}

	writeFileSync(join(temporary, 'package.json'), JSON.stringify({ type: 'module' }))
	writeFileSync(
		join(temporary, 'consumer.ts'),
		`
import { KeyboardController, FocusedInputController, KeyboardProvider, KeyboardScrollController, KeyboardAwareScrollView, KeyboardStickyView } from '@octane-xplat/keyboard'
import type { KeyboardSnapshot, KeyboardAwareScrollViewProps, KeyboardStickyViewProps, KeyboardProviderProps } from '@octane-xplat/keyboard'
import { KeyboardAvoiding, useKeyboardInset, useKeyboard } from '@octane-xplat/ui'
import { ChatLayout, useChatNewMessages } from '@octane-xplat/ui/chat'
import type { ChatLayoutProps } from '@octane-xplat/ui/chat'
const form: KeyboardAwareScrollViewProps = {clearance:12,extraScrollSpace:32,manualScroll:'pause',keyboardClose:'preserve',ref(binding){binding?.recheck()}}
const sticky: KeyboardStickyViewProps = {openOffset:8,closedOffset:0,enabled:true}
const provider: KeyboardProviderProps = {enabled:false,children:'Retained'}
const chat: ChatLayoutProps = {keyboardFollow:'when-at-end',bottomPanelHeight:240,scrollRef:{current:null}}
// @ts-expect-error policies are shared literal contracts on every platform
const badChat: ChatLayoutProps = {keyboardFollow:'automatic'}
// @ts-expect-error software keyboard scrolling does not accept arbitrary close policies
const badForm: KeyboardAwareScrollViewProps = {keyboardClose:'top'}
function observe(host:object){
 const release=KeyboardController.activate()
 const state:KeyboardSnapshot=KeyboardController.getSnapshot(host)
 const off=KeyboardController.onMove(host,s=>{const phase:typeof state.phase=s.phase;void phase})
 const stop=FocusedInputController.subscribe(host,s=>{const end:number|undefined=s.selection?.end;void end})
 const binding=KeyboardScrollController.bind(host,form);binding.update({manualScroll:'follow'});binding.recheck();binding.release()
 off();stop();release()
}
void [KeyboardProvider,KeyboardAwareScrollView,KeyboardStickyView,KeyboardAvoiding,useKeyboardInset,useKeyboard,ChatLayout,useChatNewMessages,form,sticky,provider,chat,badChat,badForm,observe]
`,
	)

	for (const conditions of [
		['web'],
		['native', 'ios'],
		['native', 'android'],
		['macos'],
		['linux'],
		['windows'],
	]) {
		for (const mode of ['bundler', 'NodeNext']) {
			writeFileSync(
				join(temporary, 'tsconfig.json'),
				JSON.stringify({
					compilerOptions: {
						strict: true,
						noEmit: true,
						skipLibCheck: true,
						target: 'ES2022',
						module: mode === 'bundler' ? 'ESNext' : 'NodeNext',
						moduleResolution: mode,
						customConditions: conditions,
					},
					files: ['consumer.ts'],
				}),
			)

			run(
				process.execPath,
				[
					join(root, 'packages/keyboard/node_modules/typescript/lib/tsc.js'),
					'-p',
					join(temporary, 'tsconfig.json'),
				],
				temporary,
			)

			console.log(`packed keyboard + UI consumer: ${conditions.join('/')} ${mode}`)
		}
	}

	const keyboard = JSON.parse(
		readFileSync(join(modules, '@octane-xplat/keyboard/package.json'), 'utf8'),
	)

	assert.ok(!keyboard.dependencies?.react && !keyboard.dependencies?.['react-native'])
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
