import '@nativescript/macos-node-api'
import { createUniversalRoot } from 'octane/universal/native'

const actionHandlers = new Map()
let nextActionId = 1

class ButtonActionTarget extends NSObject {
	static ObjCExposedMethods = {
		buttonPressed: { params: [NSButton], returns: interop.types.void },
	}

	static {
		NativeClass(this)
	}

	buttonPressed(sender) {
		const action = actionHandlers.get(sender.tag)
		if (action) action()
	}
}

const buttonActionTarget = ButtonActionTarget.new()

function makeStack(props) {
	const stack = NSStackView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 320 },
	})
	stack.orientation = NSUserInterfaceLayoutOrientation.Vertical
	stack.alignment = NSLayoutAttribute.CenterX
	stack.distribution = NSStackViewDistribution.Fill
	stack.spacing = Number(props.spacing ?? 14)
	stack.translatesAutoresizingMaskIntoConstraints = false
	return stack
}

function makeLabel() {
	const label = NSTextField.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 400, height: 32 },
	})
	label.bezeled = false
	label.drawsBackground = false
	label.editable = false
	label.selectable = false
	label.alignment = NSTextAlignment.Center
	label.translatesAutoresizingMaskIntoConstraints = false
	label.font = NSFont.systemFontOfSize(16)
	return label
}

function makeButton(props) {
	const button = NSButton.buttonWithTitleTargetAction(
		String(props.title ?? 'Button'),
		buttonActionTarget,
		'buttonPressed',
	)
	button.bezelStyle = NSBezelStyle.Rounded
	button.setButtonType(NSButtonType.MomentaryLight)
	button.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	button.tag = actionId
	actionHandlers.set(actionId, null)
	return { view: button, actionId }
}

function makeNode(container, id, type, props) {
	let view
	let actionId
	switch (type) {
		case 'stack':
			view = makeStack(props)
			break
		case 'label':
			view = makeLabel()
			break
		case 'button': {
			const button = makeButton(props)
			view = button.view
			actionId = button.actionId
			break
		}
		default:
			throw new Error('AppKit spike does not support <' + type + '>')
	}
	const node = { id, type, view, props: {}, parent: null, children: [], container, actionId }
	applyProps(node, props)
	return node
}

function applyProps(node, props) {
	node.props = { ...node.props, ...props }
	for (const [name, value] of Object.entries(props)) {
		switch (node.type) {
			case 'stack':
				if (name === 'spacing') node.view.spacing = Number(value ?? 0)
				else throw new Error('AppKit <stack> does not support the ' + name + ' prop')
				break
			case 'label':
				if (name === 'text') {
					node.view.stringValue = String(value ?? '')
					console.log('[macos-host] text=' + JSON.stringify(node.view.stringValue))
				} else if (name === 'fontSize') {
					node.view.font = NSFont.systemFontOfSize(Number(value ?? 16))
				} else {
					throw new Error('AppKit <label> does not support the ' + name + ' prop')
				}
				break
			case 'button':
				if (name === 'title') node.view.title = String(value ?? '')
				else if (name === 'enabled') node.view.enabled = value !== false
				else if (name === 'onPress') {
					actionHandlers.set(
						node.actionId,
						typeof value === 'function'
							? () => {
								try {
									node.container.root.eventScope('discrete', value)
								} catch (error) {
									console.error('[macos-event] button handler failed', error)
								}
							}
							: null,
					)
				} else throw new Error('AppKit <button> does not support the ' + name + ' prop')
				break
		}
	}
}

function detach(container, node) {
	const siblings = node.parent?.children ?? container.children
	const index = siblings.indexOf(node)
	if (index >= 0) siblings.splice(index, 1)
	if (node.parent?.type === 'stack') node.parent.view.removeArrangedSubview(node.view)
	node.view.removeFromSuperview()
	node.parent = null
}

function insert(container, parentId, node, beforeId) {
	detach(container, node)
	const parent = parentId === null ? null : container.nodes.get(parentId)
	if (parentId !== null && !parent) throw new Error('Unknown AppKit parent ' + parentId)
	if (parent && parent.type !== 'stack') {
		throw new Error('AppKit <' + parent.type + '> cannot contain child views')
	}
	const siblings = parent ? parent.children : container.children
	const beforeIndex = beforeId === null ? -1 : siblings.findIndex((child) => child.id === beforeId)
	const index = beforeIndex < 0 ? siblings.length : beforeIndex
	siblings.splice(index, 0, node)
	node.parent = parent
	const parentView = parent?.view ?? container.hostView
	if (parent) {
		parentView.addViewInGravity(node.view, NSStackViewGravity.Center)
	} else {
		parentView.addSubview(node.view)
		node.view.centerXAnchor.constraintEqualToAnchor(parentView.centerXAnchor).active = true
		node.view.centerYAnchor.constraintEqualToAnchor(parentView.centerYAnchor).active = true
	}
}

function remove(container, parentId, node) {
	const expectedParent = parentId === null ? null : container.nodes.get(parentId)
	if (node.parent !== expectedParent) return
	const siblings = expectedParent ? expectedParent.children : container.children
	const index = siblings.indexOf(node)
	if (index >= 0) siblings.splice(index, 1)
	if (expectedParent?.type === 'stack') expectedParent.view.removeArrangedSubview(node.view)
	node.view.removeFromSuperview()
	node.parent = null
}

function destroy(node) {
	if (node.actionId !== undefined) actionHandlers.delete(node.actionId)
}

function applyCommand(container, command) {
	switch (command.op) {
		case 'create':
			container.nodes.set(command.id, makeNode(container, command.id, command.type, command.props))
			return
		case 'update': {
			const node = container.nodes.get(command.id)
			if (!node) throw new Error('Unknown AppKit node ' + command.id)
			applyProps(node, command.props)
			return
		}
		case 'insert':
		case 'move': {
			const node = container.nodes.get(command.id)
			if (!node) throw new Error('Unknown AppKit node ' + command.id)
			insert(container, command.parent, node, command.before)
			return
		}
		case 'remove': {
			const node = container.nodes.get(command.id)
			if (node) remove(container, command.parent, node)
			return
		}
		case 'destroy': {
			const node = container.nodes.get(command.id)
			if (node) destroy(node)
			container.nodes.delete(command.id)
			return
		}
		case 'visibility': {
			const node = container.nodes.get(command.id)
			if (node) node.view.hidden = command.state === 'hidden'
			return
		}
		case 'ensure-public-instance':
			return
		case 'recreate': {
			const node = container.nodes.get(command.id)
			if (!node) throw new Error('Unknown AppKit node ' + command.id)
			const replacement = makeNode(container, command.id, command.type, command.props)
			const parent = node.parent
			const siblings = parent ? parent.children : container.children
			const index = siblings.indexOf(node)
			const beforeId = index < 0 ? null : (siblings[index + 1]?.id ?? null)
			remove(container, parent?.id ?? null, node)
			destroy(node)
			container.nodes.set(command.id, replacement)
			insert(container, parent?.id ?? null, replacement, beforeId)
			return
		}
		default:
			throw new Error('AppKit spike does not support host command ' + command.op)
	}
}

const macOSDriver = {
	id: 'macos',
	prepareBatch(container, batch) {
		return {
			apply() {
				for (const command of batch.commands) applyCommand(container, command)
			},
			abort() {},
		}
	},
	getPublicInstance(container, id) {
		return container.nodes.get(id)?.view ?? null
	},
}

export function createMacOSRoot(hostView) {
	const container = { hostView, nodes: new Map(), children: [], root: null }
	const root = createUniversalRoot(container, macOSDriver, {
		scheduleMicrotask: (callback) => queueMicrotask(callback),
		onUncaughtError: (error) => console.error('[macos-runtime] uncaught render error', error),
	})
	container.root = root
	if (process.env.OCTANE_MACOS_AUTOMATION === '1') {
		Object.defineProperty(root, '__macosDebug', {
			value: {
				snapshot() {
					return {
						labels: [...container.nodes.values()]
							.filter((node) => node.type === 'label')
							.map((node) => node.view.stringValue),
						buttons: [...container.nodes.values()]
							.filter((node) => node.type === 'button')
							.map((node) => node.view.title),
					}
				},
				pressButton(title) {
					const node = [...container.nodes.values()].find(
						(candidate) => candidate.type === 'button' && candidate.view.title === title,
					)
					if (!node) throw new Error('No AppKit button titled ' + title)
					node.view.performClick(null)
				},
			},
		})
	}
	return root
}

export * from 'octane/universal/native'
