// @ts-nocheck — GJS shell for the GTK workshop: window + stdin automation
// protocol; chrome renders through @octane-xplat/linux-gtk.
// GJS 1.90 supplies no queueMicrotask — octane's universal runtime requires
// one on the global object (the renderer's root options cover the scheduler,
// but compiled plan code references the global name).
globalThis.queueMicrotask ??= (cb) => Promise.resolve().then(cb)

import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import Gio from 'gi://Gio'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalsClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'
import * as renderer from '@octane-xplat/linux-gtk'
import { NativeWorkshopController } from '../../native/controller.ts'
import { NativeWorkshopChrome } from '../../native/chrome.tsrx'
import { createGtkStageHost } from '../../native/stage.gtk.ts'
import { UNSET } from '../../controls.ts'

// The compiled story bundle requires these exact instances after each edit.
// Never bundle a second renderer/core runtime into the story revision.
const modules = {
	'octane/universal/native': native,
	'octane/signals': signals,
	'octane/signals/client': signalsClient,
	'octane/internal/client': internal,
	'@octane-xplat/linux-gtk': renderer,
}

// Story externals arrive either as bare specifiers ('octane/universal/native')
// or as the preset's resolved absolute paths ('…/octane/dist/node/universal-native.js').
const RESOLVED_MODULE = [
	[/octane\/dist\/.*universal-native/, 'octane/universal/native'],
	[/octane\/dist\/.*signals.*client/, 'octane/signals/client'],
	[/octane\/dist\/.*internal.*client/, 'octane/internal/client'],
	[/octane\/dist\/.*signals/, 'octane/signals'],
	[/linux-gtk(-renderer)?\//, '@octane-xplat/linux-gtk'],
]

const requireModule = (specifier) => {
	if (specifier.startsWith('gi://')) {
		const [name, query] = specifier.slice(5).split('?')
		const version = new URLSearchParams(query ?? '').get('version')
		if (version) {
			imports.gi.versions[name] = version
		}

		return imports.gi[name]
	}
	let key = specifier
	if (!modules[key]) {
		for (const [pattern, mapped] of RESOLVED_MODULE) {
			if (pattern.test(specifier)) {
				key = mapped
				break
			}
		}
	}
	const found = modules[key]
	if (!found) {
		throw new Error(`workshop story bundle requires unknown module ${specifier}`)
	}
	return found
}

/** Evaluate a compiled CJS story bundle — the GJS analogue of the macOS
 *  host's __hostRunFile. Runtime singletons resolve through `modules`. */
function runStoryBundle(file) {
	const [ok, contents] = GLib.file_get_contents(file)
	if (!ok) {
		throw new Error(`cannot read story bundle ${file}`)
	}

	const code = new TextDecoder().decode(contents)
	const module = { exports: {} }
	const fn = new Function('require', 'module', 'exports', code)
	fn(requireModule, module, module.exports)
	return module.exports
}

const eachChild = (widget, visit) => {
	if (visit(widget)) {
		return true
	}
	for (let child = widget?.get_first_child?.(); child; child = child.get_next_sibling()) {
		if (eachChild(child, visit)) {
			return true
		}
	}
	return false
}

export function startGtkWorkshop({ bundleFile, initialStoryId = null } = {}) {
	globalThis.__xplatDevModules = modules
	const app = new Gtk.Application({
		application_id: 'org.octane.xplat.workshop',
		flags: Gio.ApplicationFlags.FLAGS_NONE,
	})

	let mounted = false
	app.connect('activate', () => {
		if (mounted) {
			mounted.window.present()
			return
		}
		mounted = true

		const window = new Gtk.ApplicationWindow({
			application: app,
			title: 'Octane Xplat workshop — GTK (qualification preview)',
			default_width: 1100,
			default_height: 720,
		})
		const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 0 })
		window.set_child(content)

		let firstRevision = runStoryBundle(bundleFile)
		let stage = null
		const controller = new NativeWorkshopController({
			host: {
				mount(request) {
					if (!stage) {
						throw new Error('Workshop stage slot has not been attached')
					}
					return createGtkStageHost(stage).mount(request)
				},
			},
			target: 'linux',
			catalog: firstRevision.catalog ?? [],
			globalProviders: firstRevision.providers ?? [],
		})

		const { root } = renderer.createGtkRoot(content)
		root.render(NativeWorkshopChrome, {
			controller,
			target: 'linux',
			onStage(view) {
				stage = view
			},
			focus(view) {
				view?.grab_focus?.()
			},
		})

		const keys = new Gtk.EventControllerKey()
		keys.connect('key-pressed', (_c, keyval) => {
			// Escape dismisses a shell overlay only when one is active; GTK has
			// no public preedit state on the window — an IMContext would own it.
			if (keyval !== Gdk.KEY_Escape) {
				return false
			}
			return controller.dismissOverlay() !== null
		})
		window.add_controller(keys)

		const layout = () => controller.resize(window.get_width(), window.get_height())
		window.connect('notify::default-width', layout)
		window.connect('notify::default-height', layout)
		layout()

		let reloads = Promise.resolve()
		let closed = false
		const reload = () => {
			reloads = reloads
				.then(async () => {
					if (closed) {
						return
					}
					try {
						const loaded = firstRevision ?? runStoryBundle(bundleFile)
						firstRevision = null
						controller.updateCatalog(loaded.catalog, loaded.diagnostics)
						if (!controller.selectedId && initialStoryId) {
							await controller.select(initialStoryId)
						}
					} catch (error) {
						try {
							print(
								'WORKSHOP_ERROR ' +
									String(error?.message ?? error) +
									' :: ' +
									String(error?.stack ?? ''),
							)
						} catch {}

						controller.session.markCompileError(error)
					}
				})
				.catch((error) => {
					try {
						print(
							'WORKSHOP_ERROR ' +
								String(error?.message ?? error) +
								' :: ' +
								String(error?.stack ?? ''),
						)
					} catch {}
					controller.session.markCompileError(error)
				})
			return reloads
		}

		const close = async () => {
			if (closed) {
				return
			}
			closed = true
			await reloads
			await controller.dispose()
			root.unmount()
			window.close()
		}
		window.connect('close-request', () => {
			void close()
			return false
		})

		let cmdSeq = 0
		let dumpSeq = 0
		const dump = () => {
			try {
				print(
					'WORKSHOP_STATE ' +
						JSON.stringify({
							seq: cmdSeq,
							d: ++dumpSeq,
							...controller.inspect(),
							catalogCollapsed: controller.state.catalogCollapsed,
							controlsCollapsed: controller.state.controlsCollapsed,
						}),
				)
			} catch (error) {
				print('WORKSHOP_STATE {"inspectError":' + JSON.stringify(String(error)) + '}')
			}
		}

		// Dispatches the widget's real activation: emits 'clicked' on the
		// stage widget matching accessible label / widget name / label text.
		const pressLabel = (label, scope = stage) => {
			let target = null
			eachChild(scope, (widget) => {
				try {
					// GTK4 exposes no readable accessible name here; match the
					// widget name, the button label, or a child GtkLabel's text.
					if (
						widget.accessible_label === label ||
						widget.name === label ||
						widget.label === label ||
						widget.child?.label === label
					) {
						target = widget
						return true
					}
				} catch {}
				return false
			})
			if (!target) {
				print(`WORKSHOP_PRESS_MISS "${label}"`)
				const dumpTree = (w, depth) => {
					try {
						print(
							'  '.repeat(depth) +
								`${w?.$gtype?.name ?? typeof w} name=${w?.name ?? ''} label=${w?.label ?? w?.child?.label ?? ''}`,
						)
					} catch {}
					for (let c = w?.get_first_child?.(); c; c = c.get_next_sibling()) {
						dumpTree(c, depth + 1)
					}
				}

				dumpTree(stage, 0)
				return
			}
			try {
				if (target instanceof Gtk.Button) {
					target.emit('clicked')
				} else {
					// The match may be an inner GtkLabel — the tap gesture lives
					// on an ancestor. Walk up until a widget carries one.
					let cursor = target
					let fired = false
					while (cursor && !fired) {
						const controllers = cursor.observe_controllers()
						for (let i = 0; i < controllers.get_n_items(); i++) {
							const c = controllers.get_item(i)
							if (c instanceof Gtk.GestureClick) {
								c.emit('released', 1, 0, 0)
								fired = true
							}
						}

						cursor = cursor.get_parent?.()
					}

					if (!fired) {
						print(`WORKSHOP_PRESS_MISS "${label}"`)
					}
				}
			} catch {
				print(`WORKSHOP_PRESS_MISS "${label}"`)
			}
		}

		const run = async (command) => {
			++cmdSeq
			const [verb, ...rest] = command.split(' ')
			const arg = rest.join(' ')
			try {
				if (verb === 'catalog') {
					print(
						'WORKSHOP_CATALOG ' +
							JSON.stringify(
								controller.catalog.map((entry) => ({
									id: entry.id,
									title: entry.title,
									applicable: entry.applicable,
									reason: entry.reason ?? null,
									exportName: entry.exportName,
								})),
							),
					)
				} else if (verb === 'select' && arg) {
					await controller.select(arg)
				} else if (verb === 'control' && arg) {
					const space = arg.indexOf(' ')
					controller.control(arg.slice(0, space), JSON.parse(arg.slice(space + 1)))
				} else if (verb === 'unset' && arg) {
					controller.control(arg, UNSET)
				} else if (verb === 'chrome-press' && arg) {
					pressLabel(arg, content)
				} else if (verb === 'press' && arg) {
					pressLabel(arg)
				} else if (verb === 'reset') {
					await controller.reset()
				} else if (verb === 'query') {
					controller.query = arg
				} else if (verb === 'panel') {
					controller.panel = arg === 'none' ? null : arg
				} else if (verb === 'stage-only') {
					controller.stageOnly = arg !== 'off'
				}
			} catch (error) {
				try {
					print(
						'WORKSHOP_ERROR ' +
							String(error?.message ?? error) +
							' :: ' +
							String(error?.stack ?? ''),
					)
				} catch {}

				controller.session.markCompileError(error)
			}
			dump()
		}

		// stdin line protocol — same verbs as the macOS shell; a GLib I/O watch
		// on fd 0 (the classic GJS stdin loop).
		const stdinChannel = GLib.IOChannel.unix_new(0)
		// Nonblocking: read_line yields AGAIN on partial input instead of
		// stalling the main loop inside the watch callback.
		const dispatchLine = (line) => {
			try {
				if (line === 'reload') {
					void reload().then(dump)
				} else if (line === 'rebuilding') {
					controller.session.markRebuilding()
					dump()
				} else if (line.startsWith('compile-error ')) {
					controller.session.markCompileError(line.slice('compile-error '.length))
					dump()
				} else if (line === 'close') {
					void close()
					return false
				} else {
					void run(line)
				}
			} catch (error) {
				controller.session.markCompileError(error)
				dump()
			}
			return true
		}
		GLib.io_add_watch(
			stdinChannel,
			GLib.PRIORITY_DEFAULT,
			GLib.IOCondition.IN | GLib.IOCondition.HUP,
			(_channel, condition) => {
				if (condition & GLib.IOCondition.HUP) {
					void close()
					return false
				}
				try {
					// One line per watch invocation — IOCondition.IN re-fires
					// while data remains. A blocking second read inside this
					// callback would starve the main loop and microtasks.
					const [status, strbuf] = stdinChannel.read_line()
					if (status === GLib.IOStatus.EOF) {
						void close()
						return false
					}

					if (status === GLib.IOStatus.NORMAL) {
						return dispatchLine(strbuf.replace(/[\r\n]+$/, '')) !== false
					}
				} catch (error) {
					controller.session.markCompileError(error)
					dump()
				}
				return true
			},
		)

		print('WORKSHOP_GTK_HOST')
		void reload().then(dump)
		window.present()
	})

	app.run(null)
}
