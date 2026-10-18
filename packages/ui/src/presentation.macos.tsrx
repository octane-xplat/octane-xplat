/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useLayoutEffect, useRef, useState } from 'octane'
import { createPortal } from './native-portal'
import { useThemeScheme } from './theme/theme-scheme'

/** Registrations publish new content independently of parent prop updates. */
interface PresentationRegistry {
	subscribe: (notify: () => void) => () => void
	resolve: () => { isOpen: boolean; panelProps: any; options: any }
}

function SurfaceContent(props: { target: unknown; component: any; panelProps: any; dark: boolean; committed: () => void }) {
	const Component = props.component
	useLayoutEffect(() => { props.committed() })
	return createPortal(<Component {...props.panelProps} dark={props.dark} />, props.target)
}

/** Present AppKit surfaces through portals owned by the declaring component. */
export function usePresentation(isOpen: boolean, component: any, panelProps: any, options: any) {
	const owner = useRef<any>(null)
	const [target, setTarget] = useState<any>(null)
	const surface = useRef<any>(null)
	const latest = useRef(options)
	const dark = useThemeScheme() === 'dark'
	latest.current = { isOpen, component, panelProps, options, dark }
	const update = () => {
		const current = latest.current
		const resolved = current
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
			surface.current = present({ ...next, owner: owner.current,
				// Declarative content renders directly below this hook. Publishing
				// it through an imperative store here would feed updates back into
				// the component that publishes them on every render.
				createContentRoot: (host: any) => {
					setTarget(host)
					return { render() {}, unmount() { setTarget((current: any) => current === host ? null : current) } }
				}, onDismiss: () => {
				const current = latest.current
				const options = current.options
				options.onDismiss?.()
			} })
		}
	}

	useEffect(() => { update() }, [isOpen, component, panelProps, options, dark])

	useEffect(() => () => { surface.current?.close(); surface.current = null }, [])
	return <>
		<masonview display="flex" ref={owner} style={{ width: 0, height: 0 }} />
		{target ? <SurfaceContent target={target} component={component}
			panelProps={panelProps} dark={dark} committed={() => surface.current?.update({})} /> : null}
	</>
}

/** Registry-driven sheets and toast stacks retain their existing roots until
 * their portal registration/update feedback has separate runtime qualification. */
export function useDetachedPresentation(isOpen: boolean, component: any, panelProps: any, options: any, registry?: PresentationRegistry) @{
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
