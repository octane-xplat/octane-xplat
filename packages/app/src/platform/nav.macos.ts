import { popRoute, pushRoute } from '@octane-xplat/ui'
import type { NavigateArgs, RouteName } from '../routes'

export function navigate(...args: NavigateArgs): void {
	const [name, params, options] = args as [
		RouteName,
		Record<string, unknown>?,
		{ into?: string; presentation?: 'push' | 'modal' | 'fade' }?,
	]
	const stack = options?.into ?? 'root'
	pushRoute({ stack, name, params: params ?? {}, presentation: options?.presentation })
	console.log('[probe] nav macos → ' + name + ' into ' + stack)
}

export function goBack(options: { into?: string } = {}): void {
	popRoute(options.into ?? 'root')
	console.log('[probe] nav macos back ' + (options.into ?? 'root'))
}
