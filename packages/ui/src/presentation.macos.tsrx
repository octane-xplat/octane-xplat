/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import { useThemeScheme } from './theme/theme-scheme'

/** Registrations publish updates without rerendering their declaring root. */
interface PresentationRegistry {
	subscribe: (notify: () => void) => () => void
	resolve: () => { isOpen: boolean; panelProps: any; options: any }
}

/** Own one detached AppKit root. Updates retain the root; declarations own
 * disposal, while only native user dismissal calls back into controlled state. */
export function usePresentation(isOpen: boolean, component: any, panelProps: any, options: any, registry?: PresentationRegistry) @{
	const owner = useRef<any>(null)
	const surface = useRef<any>(null)
	const latest = useRef(options)
	const dark = useThemeScheme() === 'dark'
	latest.current = { isOpen, component, panelProps, options, dark, registry }
	const update = () => {
		const current = latest.current
		const resolved = current.registry?.resolve() ?? current
		if (!resolved.isOpen) {
			surface.current?.close()
			surface.current = null
			return
		}

		const next = { ...resolved.options, component: current.component, props: { ...resolved.panelProps, dark: current.dark }, dark: current.dark }
		if (surface.current && !surface.current.closed) surface.current.update(next)
		else {
			const present = (globalThis as any).__xplatAppKit?.presentSurface
			if (!present) throw new Error('AppKit host has no shared surface presenter')
			surface.current = present({ ...next, owner: owner.current, onDismiss: () => {
				const current = latest.current
				const options = current.registry?.resolve().options ?? current.options
				options.onDismiss?.()
			} })
		}
	}

	useEffect(() => {
		if (!registry) { update(); return }
		let mounted = true
		queueMicrotask(() => { if (mounted) update() })
		return () => { mounted = false }
	}, [isOpen, component, panelProps, options, dark])

	// Registry notifications update the detached root without rerendering the
	// declaring root, whose child templates register fresh props after a render.
	useEffect(() => {
		if (!registry) return
		let mounted = true
		const unsubscribe = registry.subscribe(() => queueMicrotask(() => { if (mounted) update() }))
		return () => { mounted = false; unsubscribe() }
	}, [registry?.subscribe])

	useEffect(() => () => { surface.current?.close(); surface.current = null }, [])
	return owner
}
