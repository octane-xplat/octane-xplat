import '@nativescript/macos-node-api'
import { createUniversalRoot } from 'octane/universal/native'

const actionHandlers = new Map()
const actionIdsByView = new WeakMap()
const accessibilityLabels = new Map()
const accessibilityRoles = new Map()
let nextActionId = 1

function invokeAction(actionId) {
	const action = actionHandlers.get(actionId)
	if (action) {action()}
}

class ButtonActionTarget extends NSObject {
	static ObjCProtocols = [NSTextViewDelegate]

	static ObjCExposedMethods = {
		buttonPressed: { params: [NSButton], returns: interop.types.void },
		viewPressed: { params: [NSObject], returns: interop.types.void },
		controlChanged: { params: [NSObject], returns: interop.types.void },
		textDidChange: { params: [NSNotification], returns: interop.types.void },
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

	controlChanged(sender) {
		invokeAction(sender.tag ?? actionIdsByView.get(sender))
	}

	textDidChange(notification) {
		invokeAction(actionIdsByView.get(notification.object))
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
		if (actionId === undefined || !actionHandlers.has(actionId)) {return false}
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

function makeScrollView() {
	const scroll = NSScrollView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 320 },
	})
	const content = makeStack({ flexDirection: 'column' })
	scroll.hasVerticalScroller = true
	scroll.drawsBackground = false
	scroll.borderType = NSBorderType.NoBorder
	scroll.translatesAutoresizingMaskIntoConstraints = false
	scroll.documentView = content
	content.widthAnchor.constraintEqualToAnchor(scroll.contentView.widthAnchor).active = true
	return { view: scroll, childHost: content }
}

function makeTextField(props, multiline = false) {
	const field = multiline
		? NSTextView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 320, height: 72 } })
		: NSTextField.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 320, height: 28 } })
	field.translatesAutoresizingMaskIntoConstraints = false
	if (!multiline) {
		field.bezeled = true
		field.drawsBackground = true
		field.editable = true
		field.selectable = true
		field.sendsActionOnEndEditing = false
		field.placeholderString = String(props.placeholder ?? '')
	} else {
		field.editable = true
		field.selectable = true
		field.drawsBackground = true
	}
	if (multiline) {field.string = String(props.value ?? '')}
	else {field.stringValue = String(props.value ?? '')}
	return field
}

function makeSwitch(props) {
	const button = NSButton.buttonWithTitleTargetAction('', buttonActionTarget, 'controlChanged')
	button.setButtonType(NSButtonType.Switch)
	button.state = props.checked ? 1 : 0
	button.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	button.tag = actionId
	actionHandlers.set(actionId, null)
	return { view: button, actionId }
}

function makeSlider(props) {
	const slider = NSSlider.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 140, height: 24 } })
	slider.minValue = Number(props.minValue ?? 0)
	slider.maxValue = Number(props.maxValue ?? 1)
	slider.doubleValue = Number(props.value ?? 0)
	slider.target = buttonActionTarget
	slider.action = 'controlChanged'
	slider.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	slider.tag = actionId
	actionHandlers.set(actionId, null)
	return { view: slider, actionId }
}

function makeImageView(props) {
	const image = NSImageView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 24, height: 24 } })
	image.translatesAutoresizingMaskIntoConstraints = false
	const match = /^data:[^,]*;base64,(.+)$/s.exec(String(props.src ?? ''))
	if (match) {
		const data = NSData.alloc().initWithBase64EncodedStringOptions(match[1], 0)
		image.image = NSImage.alloc().initWithData(data)
	}
	return image
}

function makeNode(container, id, type, props) {
	let view
	let actionId
	let childHost
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
		case 'scrollview': {
			const scroll = makeScrollView()
			view = scroll.view
			childHost = scroll.childHost
			break
		}
		case 'textfield':
			view = makeTextField(props)
			break
		case 'textview':
			view = makeTextField(props, true)
			break
		case 'switch': {
			const control = makeSwitch(props)
			view = control.view
			actionId = control.actionId
			break
		}
		case 'slider': {
			const control = makeSlider(props)
			view = control.view
			actionId = control.actionId
			break
		}
		case 'image':
			view = makeImageView(props)
			break
		case 'span':
			view = null
			break
		default:
			throw new Error('AppKit spike does not support <' + type + '>')
	}

	if (type === 'textfield' || type === 'textview') {
		actionId = nextActionId++
		actionIdsByView.set(view, actionId)
		actionHandlers.set(actionId, null)
		if (type === 'textfield') {
			view.tag = actionId
			view.target = buttonActionTarget
			view.action = 'controlChanged'
		} else {
			view.delegate = buttonActionTarget
			}
	}

	const node = { id, type, view, childHost, props: {}, parent: null, children: [], container, actionId, text: '' }
	applyProps(node, props)
	return node
}

function nativeColor(value) {
	const match = /^#([\da-f]{6})$/i.exec(String(value))
	if (!match) {throw new Error('AppKit spike expects #rrggbb colors, received ' + value)}
	const hex = match[1]
	return NSColor.colorWithRedGreenBlueAlpha(
		parseInt(hex.slice(0, 2), 16) / 255,
		parseInt(hex.slice(2, 4), 16) / 255,
		parseInt(hex.slice(4, 6), 16) / 255,
		1,
	)
}

function applyStyle(node, style) {
	if (style == null) {return}
	if (typeof style !== 'object') {throw new Error('AppKit spike expects style to be an object')}
	for (const [name, value] of Object.entries(style)) {
		if (value == null) {continue}
		if (name === 'fontSize' && node.type === 'label') {
			node.view.font = NSFont.systemFontOfSize(Number(value))
		} else if (name === 'color' && node.type === 'label') {
			node.view.textColor = nativeColor(value)
		} else if (name === 'padding' && node.type === 'flexboxlayout') {
			const padding = Number(value)
			node.view.edgeInsets = { top: padding, left: padding, bottom: padding, right: padding }
		} else if (name === 'backgroundColor' && node.view) {
			node.view.wantsLayer = true
			node.view.layer.backgroundColor = nativeColor(value).CGColor
		} else if (name === 'borderRadius' && node.view) {
			node.view.wantsLayer = true
			node.view.layer.cornerRadius = Number(value)
			node.view.layer.masksToBounds = true
		} else if ((name === 'width' || name === 'height') && node.view) {
			const constraints = (node.sizeConstraints ??= {})
			constraints[name]?.setActive(false)
			constraints[name] = name === 'width'
				? node.view.widthAnchor.constraintEqualToConstant(Number(value))
				: node.view.heightAnchor.constraintEqualToConstant(Number(value))
			constraints[name].active = true
		} else if (name === 'opacity' && node.view) {
			node.view.alphaValue = Number(value)
		} else if (name === 'fontWeight' && node.type === 'label') {
			node.view.font = NSFont.boldSystemFontOfSize(node.view.font.pointSize)
		} else if (name === 'textAlign' && node.type === 'label') {
			node.view.alignment = value === 'left' ? NSTextAlignment.Left : value === 'right' ? NSTextAlignment.Right : NSTextAlignment.Center
		} else if (name === 'borderWidth' && node.view) {
			node.view.wantsLayer = true
			node.view.layer.borderWidth = Number(value)
		} else if (name === 'borderColor' && node.view) {
			node.view.wantsLayer = true
			node.view.layer.borderColor = nativeColor(value).CGColor
		} else {
			console.warn('[macos-style] ignored unsupported style.' + name + ' on <' + node.type + '>')
		}
	}
}

function applyClassName(node, value) {
	const classes = String(value ?? '').split(/\s+/).filter(Boolean)
	if (node.type === 'label') {
		const sizes = { 'text-xs': 12, 'text-sm': 14, 'text-base': 16, 'text-lg': 18, 'text-xl': 20, 'text-2xl': 24 }
		for (const name of classes) {
			if (sizes[name]) {node.view.font = NSFont.systemFontOfSize(sizes[name])}
			if (name === 'font-semibold' || name === 'font-bold') {node.view.font = NSFont.boldSystemFontOfSize(node.view.font.pointSize)}
			if (name === 'text-muted') {node.view.textColor = nativeColor('#71717a')}
			if (name === 'text-onprimary') {node.view.textColor = nativeColor('#ffffff')}
		}
	}

	if (node.type === 'flexboxlayout' || node.type === 'stack' || node.type === 'scrollview') {
		const gaps = { 'gap-1': 4, 'gap-2': 8, 'gap-3': 12, 'gap-4': 16, 'gap-6': 24 }
		for (const name of classes) {
			if (gaps[name] !== undefined) {node.view.spacing = gaps[name]}
			if (name === 'flex-row') {node.view.orientation = NSUserInterfaceLayoutOrientation.Horizontal}
			if (name === 'flex-col') {node.view.orientation = NSUserInterfaceLayoutOrientation.Vertical}
			if (name === 'items-center') {
				node.view.alignment = node.view.orientation === NSUserInterfaceLayoutOrientation.Horizontal
					? NSLayoutAttribute.CenterY
					: NSLayoutAttribute.CenterX
			}
			if (name === 'justify-between') {node.view.distribution = NSStackViewDistribution.EqualSpacing}
			if (name === 'flex-1') {
				node.view.setContentHuggingPriorityForOrientation(1, NSUserInterfaceLayoutOrientation.Vertical)
				node.view.setContentCompressionResistancePriorityForOrientation(1, NSUserInterfaceLayoutOrientation.Vertical)
			}
			if (name === 'shrink-0') {
				node.view.setContentHuggingPriorityForOrientation(750, NSUserInterfaceLayoutOrientation.Vertical)
			}
			if (name === 'rounded-full' || name.startsWith('rounded-')) {
				node.view.wantsLayer = true
				node.view.layer.cornerRadius = name === 'rounded-full' ? 12 : 8
				node.view.layer.masksToBounds = true
			}
			if (name === 'bg-primary' || name === 'btn') {
				node.view.wantsLayer = true
				node.view.layer.backgroundColor = nativeColor('#2563eb').CGColor
				node.view.edgeInsets = { top: 6, left: 10, bottom: 6, right: 10 }
			}
			if (name === 'bg-danger') {
				node.view.wantsLayer = true
				node.view.layer.backgroundColor = nativeColor('#dc2626').CGColor
			}
			if (name === 'btn-secondary' || name === 'chip' || name === 'chip-off') {
				node.view.wantsLayer = true
				node.view.layer.backgroundColor = nativeColor('#3f3f46').CGColor
				node.view.edgeInsets = { top: 4, left: 8, bottom: 4, right: 8 }
			}
		}
	}
}

function textContent(node) {
	if (node.type === '#text') {return node.text}
	if (node.type === 'label') {return node.view.stringValue}
	return node.children.map(textContent).join('')
}

function syncText(parent) {
	if (parent?.type !== 'label') {return}
	parent.view.stringValue = parent.children.map(textContent).join('')
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

function setControlAction(node, value, readValue) {
	if (node.actionId === undefined) {return}
	actionHandlers.set(
		node.actionId,
		typeof value === 'function'
			? () => {
				try {
					node.container.root.eventScope('discrete', () => value(readValue()))
				} catch (error) {
					console.error('[macos-event] control handler failed', error)
				}
			}
			: null,
	)
}

function applyAccessibility(node, name, value) {
	if (node.type === 'flexboxlayout' && node.actionId !== undefined) {
		if (name === 'accessibilityLabel') {accessibilityLabels.set(node.actionId, String(value ?? ''))}
		if (name === 'accessibilityRole') {accessibilityRoles.set(node.actionId, String(value ?? ''))}
	}

	if (node.type === 'label' && name === 'accessibilityLabel') {
		node.view.setAccessibilityLabel?.(String(value ?? ''))
	}
}

function applyProps(node, props) {
	node.props = { ...node.props, ...props }
	if (node.type === '#text') {
		if ('value' in props) {node.text = String(props.value ?? '')}
		syncText(node.parent)
		return
	}
	if (node.type === 'span') {return}

	for (const [name, value] of Object.entries(props)) {
		switch (node.type) {
			case 'stack':
				if (name === 'spacing') {node.view.spacing = Number(value ?? 0)}
				else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className') {applyClassName(node, value)}
				else if (name === 'id') {continue}
				else {console.warn('[macos-host] ignored stack prop ' + name)}

				break
			case 'flexboxlayout':
				if (name === 'gap') {node.view.spacing = Number(value ?? 0)}
				else if (name === 'spacing') {node.view.spacing = Number(value ?? 0)}
				else if (name === 'flexDirection') {
					node.view.orientation = value === 'row'
						? NSUserInterfaceLayoutOrientation.Horizontal
						: NSUserInterfaceLayoutOrientation.Vertical
				} else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className') {applyClassName(node, value)}
				else if (name === 'id') {continue}
				else if (name === 'onTap') {setAction(node, value)}
				else if (name === 'onTouch') {continue}
				else if (name === 'onPan' || name === 'onSwipe') {
					if (typeof value === 'function') {
						console.warn('[macos-host] ' + name + ' is unsupported by the AppKit renderer')
					}
				}
				else if (name.startsWith('on') && value == null) {continue}
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
				) {continue}
				else {console.warn('[macos-host] ignored flexboxlayout prop ' + name)}

				break
			case 'label':
				if (name === 'text') {
					node.view.stringValue = String(value ?? '')
				} else if (name === 'fontSize') {
					node.view.font = NSFont.systemFontOfSize(Number(value ?? 16))
				} else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className') {applyClassName(node, value)}
				else if (name === 'id') {continue}
				else if (['maxLines', 'whiteSpace', 'textOverflow', 'accessible'].includes(name)) {continue}
				else if (name.startsWith('accessibility')) {applyAccessibility(node, name, value)}
				else if (name.startsWith('on') && value == null) {continue}
				else {
					console.warn('[macos-host] ignored label prop ' + name)
				}

				break
			case 'button':
				if (name === 'title') {node.view.title = String(value ?? '')}
				else if (name === 'enabled') {node.view.enabled = value !== false}
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
				} else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className' || name === 'id') {continue}
				else {console.warn('[macos-host] ignored button prop ' + name)}

				break
			case 'scrollview':
				if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className') {applyClassName(node, value)}
				else if (name === 'accessibilityLabel') {node.view.setAccessibilityLabel?.(String(value ?? ''))}
				else if (name === 'id' || name === 'horizontal' || name === 'showsVerticalScrollIndicator') {continue}
				else if (name.startsWith('on')) {
					if (typeof value === 'function') {console.warn('[macos-host] ' + name + ' is unsupported on ScrollView')}
				}
				else {console.warn('[macos-host] ignored scrollview prop ' + name)}

				break
			case 'textfield':
			case 'textview':
				if (name === 'value') {
					if (node.type === 'textview') {node.view.string = String(value ?? '')}
					else {node.view.stringValue = String(value ?? '')}
				}
				else if (name === 'placeholder') {
					if (node.type === 'textfield') {node.view.placeholderString = String(value ?? '')}
				}
				else if (name === 'onTextChange') {
					setControlAction(node, value, () => String(node.type === 'textview' ? node.view.string : node.view.stringValue ?? ''))
				}
				else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className') {applyClassName(node, value)}
				else if (name === 'id') {continue}
				else if (name.startsWith('accessibility')) {applyAccessibility(node, name, value)}
				else if (name.startsWith('on') && value == null) {continue}
				else if (['editable', 'enabled', 'secure', 'keyboardType', 'returnKeyType', 'autoGrow', 'maxRows'].includes(name)) {continue}
				else {console.warn('[macos-host] ignored text control prop ' + name)}

				break
			case 'switch':
				if (name === 'checked') {node.view.state = value ? 1 : 0}
				else if (name === 'onCheckedChange') {
					setControlAction(node, value, () => node.view.state === 1)
				}
				else if (name === 'disabled') {node.view.enabled = value !== true}
				else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className' || name === 'id') {continue}
				else {console.warn('[macos-host] ignored switch prop ' + name)}

				break
			case 'slider':
				if (name === 'value') {node.view.doubleValue = Number(value ?? 0)}
				else if (name === 'minValue') {node.view.minValue = Number(value ?? 0)}
				else if (name === 'maxValue') {node.view.maxValue = Number(value ?? 1)}
				else if (name === 'onValueChange') {
					setControlAction(node, value, () => Number(node.view.doubleValue))
				}
				else if (name === 'disabled') {node.view.enabled = value !== true}
				else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className' || name === 'id') {continue}
				else {console.warn('[macos-host] ignored slider prop ' + name)}

				break
			case 'image':
				if (name === 'src') {
					const match = /^data:[^,]*;base64,(.+)$/s.exec(String(value ?? ''))
					if (match) {
						const data = NSData.alloc().initWithBase64EncodedStringOptions(match[1], 0)
						node.view.image = NSImage.alloc().initWithData(data)
					}
				}
				else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className' || name === 'id' || name === 'alt') {continue}
				else if (name === 'accessibilityLabel') {node.view.setAccessibilityLabel?.(String(value ?? ''))}
				else {console.warn('[macos-host] ignored image prop ' + name)}

				break
		}
	}
}

function detach(container, node) {
	const siblings = node.parent?.children ?? container.children
	const index = siblings.indexOf(node)
	if (index >= 0) {siblings.splice(index, 1)}
	if (node.view) {
		const parentView = node.parent?.childHost ?? node.parent?.view
		if (parentView?.removeArrangedSubview) {
			parentView.removeArrangedSubview(node.view)
		}

		node.view.removeFromSuperview()
	}

	syncText(node.parent)
	node.parent = null
}

function insert(container, parentId, node, beforeId) {
	detach(container, node)
	const parent = parentId === null ? null : container.nodes.get(parentId)
	if (parentId !== null && !parent) {throw new Error('Unknown AppKit parent ' + parentId)}
	if (parent && node.view && parent.type !== 'stack' && parent.type !== 'flexboxlayout' && parent.type !== 'scrollview') {
		throw new Error('AppKit <' + parent.type + '> cannot contain child views')
	}

	const siblings = parent ? parent.children : container.children
	const beforeIndex = beforeId === null ? -1 : siblings.findIndex((child) => child.id === beforeId)
	const index = beforeIndex < 0 ? siblings.length : beforeIndex
	siblings.splice(index, 0, node)
	node.parent = parent
	if (node.view) {
		const parentView = parent?.childHost ?? parent?.view ?? container.hostView
		if (!parentView) {throw new Error('AppKit host has no parent view for node ' + node.id)}
		if (parent) {
			parentView.addViewInGravity(node.view, NSStackViewGravity.Center)
		} else {
			parentView.addSubview(node.view)
			node.view.leadingAnchor.constraintEqualToAnchor(parentView.leadingAnchor).active = true
			node.view.trailingAnchor.constraintEqualToAnchor(parentView.trailingAnchor).active = true
			node.view.topAnchor.constraintEqualToAnchor(parentView.topAnchor).active = true
			node.view.bottomAnchor.constraintEqualToAnchor(parentView.bottomAnchor).active = true
		}
	} else {
		syncText(parent)
	}
}

function remove(container, parentId, node) {
	const expectedParent = parentId === null ? null : container.nodes.get(parentId)
	if (node.parent !== expectedParent) {return}
	const siblings = expectedParent ? expectedParent.children : container.children
	const index = siblings.indexOf(node)
	if (index >= 0) {siblings.splice(index, 1)}
	if (node.view) {
		const parentView = expectedParent?.childHost ?? expectedParent?.view
		if (parentView?.removeArrangedSubview) {
			parentView.removeArrangedSubview(node.view)
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
			if (!node) {throw new Error('Unknown AppKit node ' + command.id)}
			applyProps(node, command.props)
			return
		}
		case 'insert':
		case 'move': {
			const node = container.nodes.get(command.id)
			if (!node) {throw new Error('Unknown AppKit node ' + command.id)}
			insert(container, command.parent, node, command.before)
			return
		}
		case 'remove': {
			const node = container.nodes.get(command.id)
			if (node) {remove(container, command.parent, node)}
			return
		}
		case 'destroy': {
			const node = container.nodes.get(command.id)
			if (node) {destroy(node)}
			container.nodes.delete(command.id)
			return
		}
		case 'visibility': {
			const node = container.nodes.get(command.id)
			if (node?.view) {node.view.hidden = command.state === 'hidden'}
			return
		}
		case 'ensure-public-instance':
			return
		case 'recreate': {
			const node = container.nodes.get(command.id)
			if (!node) {throw new Error('Unknown AppKit node ' + command.id)}
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
				for (const command of batch.commands) {applyCommand(container, command)}
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
		const debug = {
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
					pressId(id) {
						const node = [...container.nodes.values()].find((candidate) => candidate.props.id === id)
						if (!node || node.actionId === undefined) {
							throw new Error('No AppKit pressable with id ' + id)
						}
						invokeAction(node.actionId)
					},
					setText(idOrPlaceholder, value) {
						const node = [...container.nodes.values()].find(
							(candidate) =>
								(candidate.type === 'textfield' || candidate.type === 'textview') &&
								(candidate.props.id === idOrPlaceholder || candidate.props.placeholder === idOrPlaceholder),
						)
						if (!node || node.actionId === undefined) {
							throw new Error('No AppKit text input with id or placeholder ' + idOrPlaceholder)
						}
						if (node.type === 'textview') {
							node.view.string = String(value)
							buttonActionTarget.textDidChange({ object: node.view })
						} else {
							node.view.stringValue = String(value)
							buttonActionTarget.controlChanged(node.view)
						}
					},
				pressAccessibilityLabel(label) {
					const node = [...container.nodes.values()].find(
						(candidate) =>
							candidate.type === 'flexboxlayout' &&
							candidate.actionId !== undefined &&
							accessibilityLabels.get(candidate.actionId) === label,
					)

					if (!node) {throw new Error('No AppKit pressable labeled ' + label)}
					if (!node.view.accessibilityPerformPress()) {
						throw new Error('AppKit pressable has no action for ' + label)
					}
				},
				pressButton(title) {
					const node = [...container.nodes.values()].find(
						(candidate) => candidate.type === 'button' && candidate.view.title === title,
					)

					if (!node) {throw new Error('No AppKit button titled ' + title)}
					node.view.performClick(null)
				},
			}
		Object.defineProperty(root, '__macosDebug', { value: debug })
		Object.defineProperty(globalThis, '__xplatMacOSDebug', { value: debug, configurable: true })
	}

	return root
}

export * from 'octane/universal/native'
