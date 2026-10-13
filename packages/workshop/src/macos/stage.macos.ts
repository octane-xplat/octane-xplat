import { defineUniversalComponent, universalChildren, universalComponent, universalTry } from 'octane/universal/native'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import type { StageHost, MountRequest, MountedStory } from '../session'

const RENDERER = 'macos'
const UNIVERSAL_COMPONENT = Symbol.for('octane.universal.component')

/** Compiler output is already defined; plain functions need the stamp before
 * the root will mount them (same rule hmrUniversalComponent applies). */
const asComponent = (component: any) =>
	component?.[UNIVERSAL_COMPONENT]
		? component
		: defineUniversalComponent(RENDERER, component, { module: '@octane-xplat/workshop/macos-stage' } as any)

/**
 * Provider/story composition in explicit universal-runtime calls — the same
 * ABI the TSRX compiler emits, but dynamic components stay data. Compiled
 * components are invoked by the root, never called as plain functions.
 */
function storyTree(request: MountRequest, args: Record<string, unknown>) {
	const component = asComponent(request.component)
	let tree: unknown = universalComponent(RENDERER, component, args as any)
	for (const provider of [...request.providers].reverse() as any[]) {
		const inner = tree
		tree = universalComponent(RENDERER, asComponent(provider), {
			fixture: request.fixture,
			children: universalChildren(RENDERER, () => inner as any),
		})
	}

	// The catch body runs inside the render pass — octane rejects store
	// updates there, so report after the pass commits (same rule as web).
	return universalTry(
		() => tree as any,
		null,
		(error) => {
			queueMicrotask(() => request.onRenderError(error))
			return null
		},
	)
}

/** Universal roots mount compiler-defined components only — the stage root
 * is a static wrapper; story/props arrive through its props. */
const StoryTreeRoot = defineUniversalComponent(RENDERER,
	(p: { request: MountRequest; args: Record<string, unknown> }) =>
		storyTree(p.request, p.args),
	{ module: '@octane-xplat/workshop/macos-stage' } as any)

export interface MacOSStageOptions {
	/** An isolated native stage view; shell layout may move/resize it without remounting. */
	view: any
	/** The shell's window — story-owned windows and sheets anchor to it. */
	parentWindow: any
	fontFamily?: string
}

/** Session-owned AppKit root. Full bags remove omitted props, including Unset. */
export function createMacOSStageHost(options: MacOSStageOptions): StageHost {
	return {
		mount(request: MountRequest): MountedStory {
			const root = createMacOSRoot(options.view, { fontFamily: options.fontFamily })
			let disposed = false
			const bridge = globalThis as any
			const previousOpen = bridge.__xplatAppKitOpenWindow
			const previousSheet = bridge.__xplatAppKitMountSheet
			const windows = new Set<any>()
			const open = (settings: any = {}) => {
				if (disposed || request.signal.aborted) { throw new Error('Story generation has retired') }
				if (typeof previousOpen !== 'function') { throw new Error('Consumer AppKit window service is unavailable') }
				const win = previousOpen({ ...settings, parent: settings.parent ?? options.parentWindow,
					...(settings.component ? { component: StoryTreeRoot, props: {
						request: { ...request, component: settings.component },
						args: { ...request.props, ...settings.props },
					} } : {}),
				})

				if (!win || typeof win.close !== 'function') {
					throw new Error('Consumer AppKit window service must return an owned closeable controller')
				}

				windows.add(win)
				return win
			}

			const sheet = (component: any, props: any, settings: any) => open({ ...settings, kind: 'dialog', component, props })
			bridge.__xplatAppKitOpenWindow = open
			bridge.__xplatAppKitMountSheet = sheet
			const unmount = () => {
				if (disposed) { return }
				disposed = true
				if (bridge.__xplatAppKitOpenWindow === open) { bridge.__xplatAppKitOpenWindow = previousOpen }
				if (bridge.__xplatAppKitMountSheet === sheet) { bridge.__xplatAppKitMountSheet = previousSheet }
				const failures: unknown[] = []
				for (const win of windows) { try { win.close() } catch (error) { failures.push(error) } }
				windows.clear()
				try { root.unmount() } catch (error) { failures.push(error) }
				if (failures.length) { throw new AggregateError(failures, 'AppKit story disposal failed') }
			}

			const render = (args: Record<string, unknown>) => root.render(StoryTreeRoot as any, {
				request, args, parentWindow: options.parentWindow,
			} as any)

			try {
				render(request.props)
			} catch (error: any) {
				try { unmount() } catch (cleanup) {
					throw new AggregateError([error, cleanup], 'AppKit mount and rollback failed')
				}

				throw error
			}

			return {
				update(args) { if (!disposed) { render({ ...args }) } },
				unmount,
			}
		},
	}
}
