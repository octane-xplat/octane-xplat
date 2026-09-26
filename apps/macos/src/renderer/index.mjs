import '@nativescript/macos-node-api'
import { createUniversalRoot } from 'octane/universal/native'

function makeLabel() {
	const label = NSTextField.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 80 },
	})
	label.bezeled = false
	label.drawsBackground = false
	label.editable = false
	label.selectable = false
	label.alignment = NSTextAlignment.Center
	label.translatesAutoresizingMaskIntoConstraints = false
	label.font = NSFont.systemFontOfSize(28)
	return label
}

function makeNode(id, type, props) {
	if (type !== 'label') throw new Error(`AppKit spike does not support <${type}>`)
	const view = makeLabel()
	const node = { id, type, view, props: {}, parent: null, children: [] }
	applyProps(node, props)
	return node
}

function applyProps(node, props) {
	node.props = { ...node.props, ...props }
	for (const [name, value] of Object.entries(props)) {
		if (name !== 'text') throw new Error(`AppKit <label> does not support the ${name} prop`)
		node.view.stringValue = String(value ?? '')
		console.log(`[macos-host] text=${JSON.stringify(node.view.stringValue)}`)
	}
}

function detach(container, node) {
	const siblings = node.parent?.children ?? container.children
	const index = siblings.indexOf(node)
	if (index >= 0) siblings.splice(index, 1)
	node.view.removeFromSuperview()
	node.parent = null
}

function insert(container, parentId, node, beforeId) {
	detach(container, node)
	const parent = parentId === null ? null : container.nodes.get(parentId)
	if (parentId !== null && !parent) throw new Error(`Unknown AppKit parent ${parentId}`)
	const siblings = parent ? parent.children : container.children
	const beforeIndex = beforeId === null ? -1 : siblings.findIndex((child) => child.id === beforeId)
	const index = beforeIndex < 0 ? siblings.length : beforeIndex
	siblings.splice(index, 0, node)
	node.parent = parent
	const parentView = parent?.view ?? container.hostView
	parentView.addSubview(node.view)
	if (parentView === container.hostView) {
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
	node.view.removeFromSuperview()
	node.parent = null
}

function applyCommand(container, command) {
	switch (command.op) {
		case 'create': {
			container.nodes.set(command.id, makeNode(command.id, command.type, command.props))
			return
		}
		case 'update': {
			const node = container.nodes.get(command.id)
			if (!node) throw new Error(`Unknown AppKit node ${command.id}`)
			applyProps(node, command.props)
			return
		}
		case 'insert':
		case 'move': {
			const node = container.nodes.get(command.id)
			if (!node) throw new Error(`Unknown AppKit node ${command.id}`)
			insert(container, command.parent, node, command.before)
			return
		}
		case 'remove': {
			const node = container.nodes.get(command.id)
			if (node) remove(container, command.parent, node)
			return
		}
		case 'destroy':
			container.nodes.delete(command.id)
			return
		case 'visibility': {
			const node = container.nodes.get(command.id)
			if (node) node.view.hidden = command.state === 'hidden'
			return
		}
		case 'ensure-public-instance':
			return
		case 'recreate': {
			const node = container.nodes.get(command.id)
			if (!node) throw new Error(`Unknown AppKit node ${command.id}`)
			const replacement = makeNode(command.id, command.type, command.props)
			const parent = node.parent
			const siblings = parent ? parent.children : container.children
			const index = siblings.indexOf(node)
			const beforeId = index < 0 ? null : (siblings[index + 1]?.id ?? null)
			remove(container, parent?.id ?? null, node)
			container.nodes.set(command.id, replacement)
			insert(container, parent?.id ?? null, replacement, beforeId)
			return
		}
		default:
			throw new Error(`AppKit spike does not support host command ${command.op}`)
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
	const container = { hostView, nodes: new Map(), children: [] }
	const root = createUniversalRoot(container, macOSDriver, {
		scheduleMicrotask: (callback) => queueMicrotask(callback),
	})
	return root
}

export * from 'octane/universal/native'
