import { createObjectDriver } from 'octane/universal/native'

/** Exercise core portal ownership with a recording host. Foreign native views
 * share the driver's physical root, while retaining distinct portal handles. */
export function createPortalObjectDriver(renderer = 'nativescript') {
	const object = createObjectDriver(renderer)
	const targets = new WeakMap<object, number>()
	let sequence = 0
	const driver: typeof object = {
		...object,
		portals: {
			prepareTarget(context) {
				if (!context.target || typeof context.target !== 'object') {
					throw new TypeError('Expected an object portal target')
				}
				if (!targets.has(context.target)) {
					targets.set(context.target, ++sequence)
				}
				return {
					handle: context.createPortalTargetHandle(targets.get(context.target)!),
					release() {},
				}
			},
		},
		prepareBatch(container, batch, context) {
			const commands = batch.commands.map((command) =>
				'parent' in command && command.parent !== null && typeof command.parent === 'object'
					? { ...command, parent: null }
					: command,
			)
			return object.prepareBatch(container, { ...batch, commands }, context)
		},
	}
	return driver
}
