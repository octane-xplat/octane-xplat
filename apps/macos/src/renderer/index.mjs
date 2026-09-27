import '@nativescript/macos-node-api'
import { createUniversalRoot } from 'octane/universal/native'

const actionHandlers = new Map()
const actionIdsByView = new WeakMap()
const accessibilityLabels = new Map()
const accessibilityRoles = new Map()
let nextActionId = 1

function invokeAction(actionId) {
	const action = actionHandlers.get(actionId)
	if (action) action()
}

class ButtonActionTarget extends NSObject {
	static ObjCExposedMethods = {
		buttonPressed: { params: [NSButton], returns: interop.types.void },
		viewPressed: { params: [NSObject], returns: interop.types.void },
	}

	static {
		NativeClass(this)
	}

	buttonPressed(sender) {
		invokeAction(sender.tag)
	}

	viewPressed(sender) {
		invokeAction(actionIdsByView.get(sender.view))
	}
}

const buttonActionTarget = ButtonActionTarget.new()

class AccessibleStackView extends NSStackView {
	static ObjCExposedMethods = {
		accessibilityPerformPress: { params: [], returns: interop.types.bool },
		accessibilityRole: { params: [], returns: interop.types.id },
		accessibilityLabel: { params: [], returns: interop.types.id },
		accessibilityIsIgnored: { params: [], returns: interop.types.bool },
	}

	static {
		NativeClass(this)
	}

	accessibilityPerformPress() {
		const actionId = actionIdsByView.get(this)
		if (actionId === undefined || !actionHandlers.has(actionId)) return false
		invokeAction(actionId)
		return true
	}

	accessibilityRole() {
		return accessibilityRoles.get(actionIdsByView.get(this)) === 'button' ? 'AXButton' : 'AXGroup'
	}

	accessibilityLabel() {
		return accessibilityLabels.get(actionIdsByView.get(this)) ?? ''
	}

	accessibilityIsIgnored() {
		return !accessibilityRoles.has(actionIdsByView.get(this))
	}
}

function makeStack(props, StackClass = NSStackView) {
	const stack = StackClass.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 320 },
	})
	stack.orientation = props.flexDirection === 'row'
		? NSUserInterfaceLayoutOrientation.Horizontal
		: NSUserInterfaceLayoutOrientation.Vertical
	stack.alignment = NSLayoutAttribute.CenterX
	stack.distribution = NSStackViewDistribution.Fill
	stack.spacing = Number(props.gap ?? props.spacing ?? 14)
	stack.translatesAutoresizingMaskIntoConstraints = false
	return stack
}

function makeFlexbox(props) {
	const stack = makeStack(props, AccessibleStackView)
	const actionId =
		typeof props.onTap === 'function' || props.accessibilityRole === 'button'
			? nextActionId++
			: undefined
	if (actionId !== undefined) {
		actionIdsByView.set(stack, actionId)
		actionHandlers.set(actionId, null)
		stack.addGestureRecognizer(
			NSClickGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPressed'),
		)
	}
	return { view: stack, actionId }
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
		case 'flexboxlayout': {
			const flexbox = makeFlexbox(props)
			view = flexbox.view
			actionId = flexbox.actionId
			break
		}
		case 'label':
			view = makeLabel()
			break
		case '#text':
			view = null
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
	const node = { id, type, view, props: {}, parent: null, children: [], container, actionId, text: '' }
	applyProps(node, props)
	return node
}

function nativeColor(value) {
	const match = /^#([\da-f]{6})$/i.exec(String(value))
	if (!match) throw new Error('AppKit spike expects #rrggbb colors, received ' + value)
	const hex = match[1]
	return NSColor.colorWithRedGreenBlueAlpha(
		parseInt(hex.slice(0, 2), 16) / 255,
		parseInt(hex.slice(2, 4), 16) / 255,
		parseInt(hex.slice(4, 6), 16) / 255,
		1,
	)
}

function applyStyle(node, style) {
	if (style == null) return
	if (typeof style !== 'object') throw new Error('AppKit spike expects style to be an object')
	for (const [name, value] of Object.entries(style)) {
		if (value == null) continue
		if (name === 'fontSize' && node.type === 'label') {
			node.view.font = NSFont.systemFontOfSize(Number(value))
		} else if (name === 'color' && node.type === 'label') {
			node.view.textColor = nativeColor(value)
		} else if (name === 'padding' && node.type === 'flexboxlayout') {
			const padding = Number(value)
			node.view.edgeInsets = { top: padding, left: padding, bottom: padding, right: padding }
		} else if (name === 'backgroundColor' && node.type === 'flexboxlayout') {
			node.view.wantsLayer = true
			node.view.layer.backgroundColor = nativeColor(value).CGColor
		} else if (name === 'borderRadius' && node.type === 'flexboxlayout') {
			node.view.wantsLayer = true
			node.view.layer.cornerRadius = Number(value)
			node.view.layer.masksToBounds = true
		} else {
			throw new Error('AppKit spike does not map style.' + name + ' on <' + node.type + '>')
		}
	}
}

function syncText(parent) {
	if (parent?.type !== 'label') return
	parent.view.stringValue = parent.children
		.filter((child) => child.view === null)
		.map((child) => child.text)
		.join('')
}

function setAction(node, value) {
	if (node.actionId === undefined) {
		node.actionId = nextActionId++
		actionIdsByView.set(node.view, node.actionId)
		actionHandlers.set(node.actionId, null)
		node.view.addGestureRecognizer(
			NSClickGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPressed'),
		)
	}
	actionHandlers.set(
		node.actionId,
		typeof value === 'function'
			? () => {
				try {
					node.container.root.eventScope('discrete', value)
				} catch (error) {
					console.error('[macos-event] press handler failed', error)
				}
			}
			: null,
	)
}

function applyAccessibility(node, name, value) {
	if (node.type === 'flexboxlayout' && node.actionId !== undefined) {
		if (name === 'accessibilityLabel') accessibilityLabels.set(node.actionId, String(value ?? ''))
		if (name === 'accessibilityRole') accessibilityRoles.set(node.actionId, String(value ?? ''))
	}
	if (node.type === 'label' && name === 'accessibilityLabel') {
		node.view.setAccessibilityLabel?.(String(value ?? ''))
	}
}

function applyProps(node, props) {
	node.props = { ...node.props, ...props }
	if (node.type === '#text') {
		if ('value' in props) node.text = String(props.value ?? '')
		syncText(node.parent)
		return
	}
	for (const [name, value] of Object.entries(props)) {
		switch (node.type) {
			case 'stack':
				if (name === 'spacing') node.view.spacing = Number(value ?? 0)
				else if (name === 'style') applyStyle(node, value)
				else if (name === 'className' || name === 'id') continue
				else throw new Error('AppKit <stack> does not support the ' + name + ' prop')
				break
			case 'flexboxlayout':
				if (name === 'gap') node.view.spacing = Number(value ?? 0)
				else if (name === 'spacing') node.view.spacing = Number(value ?? 0)
				else if (name === 'flexDirection') {
					node.view.orientation = value === 'row'
						? NSUserInterfaceLayoutOrientation.Horizontal
						: NSUserInterfaceLayoutOrientation.Vertical
				} else if (name === 'style') applyStyle(node, value)
				else if (name === 'className' || name === 'id') continue
				else if (name === 'onTap') setAction(node, value)
				else if (name === 'onTouch') continue
				else if (name.startsWith('on') && value == null) continue
				else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (
					[
						'alignItems',
						'justifyContent',
						'flexWrap',
						'row',
						'col',
						'rowSpan',
						'colSpan',
						'left',
						'top',
						'flexGrow',
						'flexShrink',
						'alignSelf',
						'order',
					].includes(name)
				) continue
				else throw new Error('AppKit <flexboxlayout> does not support the ' + name + ' prop')
				break
			case 'label':
				if (name === 'text') {
					node.view.stringValue = String(value ?? '')
				} else if (name === 'fontSize') {
					node.view.font = NSFont.systemFontOfSize(Number(value ?? 16))
				} else if (name === 'style') applyStyle(node, value)
				else if (name === 'className' || name === 'id') continue
				else if (['maxLines', 'whiteSpace', 'textOverflow', 'accessible'].includes(name)) continue
				else if (name.startsWith('accessibility')) applyAccessibility(node, name, value)
				else if (name.startsWith('on') && value == null) continue
				else {
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
				} else if (name === 'style') applyStyle(node, value)
				else if (name === 'className' || name === 'id') continue
				else throw new Error('AppKit <button> does not support the ' + name + ' prop')
				break
		}
	}
}

function detach(container, node) {
	const siblings = node.parent?.children ?? container.children
	const index = siblings.indexOf(node)
	if (index >= 0) siblings.splice(index, 1)
	if (node.view) {
		if (node.parent?.type === 'stack' || node.parent?.type === 'flexboxlayout') {
			node.parent.view.removeArrangedSubview(node.view)
		}
		node.view.removeFromSuperview()
	}
	syncText(node.parent)
	node.parent = null
}

function insert(container, parentId, node, beforeId) {
	detach(container, node)
	const parent = parentId === null ? null : container.nodes.get(parentId)
	if (parentId !== null && !parent) throw new Error('Unknown AppKit parent ' + parentId)
	if (parent && node.view && parent.type !== 'stack' && parent.type !== 'flexboxlayout') {
		throw new Error('AppKit <' + parent.type + '> cannot contain child views')
	}
	const siblings = parent ? parent.children : container.children
	const beforeIndex = beforeId === null ? -1 : siblings.findIndex((child) => child.id === beforeId)
	const index = beforeIndex < 0 ? siblings.length : beforeIndex
	siblings.splice(index, 0, node)
	node.parent = parent
	if (node.view) {
		const parentView = parent?.view ?? container.hostView
		if (!parentView) throw new Error('AppKit host has no parent view for node ' + node.id)
		if (parent) {
			parentView.addViewInGravity(node.view, NSStackViewGravity.Center)
		} else {
			parentView.addSubview(node.view)
			node.view.centerXAnchor.constraintEqualToAnchor(parentView.centerXAnchor).active = true
			node.view.centerYAnchor.constraintEqualToAnchor(parentView.centerYAnchor).active = true
		}
	} else {
		syncText(parent)
	}
}

function remove(container, parentId, node) {
	const expectedParent = parentId === null ? null : container.nodes.get(parentId)
	if (node.parent !== expectedParent) return
	const siblings = expectedParent ? expectedParent.children : container.children
	const index = siblings.indexOf(node)
	if (index >= 0) siblings.splice(index, 1)
	if (node.view) {
		if (expectedParent?.type === 'stack' || expectedParent?.type === 'flexboxlayout') {
			expectedParent.view.removeArrangedSubview(node.view)
		}
		node.view.removeFromSuperview()
	}
	node.parent = null
	syncText(expectedParent)
}

function destroy(node) {
	if (node.actionId !== undefined) {
		actionHandlers.delete(node.actionId)
		accessibilityLabels.delete(node.actionId)
		accessibilityRoles.delete(node.actionId)
	}
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
			if (node?.view) node.view.hidden = command.state === 'hidden'
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
	capabilities: { text: 'host' },
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
								.filter((node) => node.type === 'label' && node.view)
								.map((node) => node.view.stringValue),
							buttons: [...container.nodes.values()]
								.filter((node) => node.type === 'button' && node.view)
								.map((node) => node.view.title),
							pressables: [...container.nodes.values()]
								.filter(
									(node) =>
										node.type === 'flexboxlayout' &&
										node.actionId !== undefined &&
										accessibilityRoles.get(node.actionId) === 'button',
								)
								.map((node) => accessibilityLabels.get(node.actionId)),
						}
					},
				pressAccessibilityLabel(label) {
					const node = [...container.nodes.values()].find(
						(candidate) =>
							candidate.type === 'flexboxlayout' &&
							candidate.actionId !== undefined &&
							accessibilityLabels.get(candidate.actionId) === label,
					)
					if (!node) throw new Error('No AppKit pressable labeled ' + label)
					if (!node.view.accessibilityPerformPress()) {
						throw new Error('AppKit pressable has no action for ' + label)
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
