import '@nativescript/macos-node-api'
import { createUniversalRoot } from 'octane/universal/native'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const actionHandlers = new Map()
const actionIdsByView = new WeakMap()
const textNodesByView = new WeakMap()
const panHandlersByView = new WeakMap()
const gridLayoutNodesByView = new WeakMap()
const accessibilityLabels = new Map()
const accessibilityRoles = new Map()
let nextActionId = 1
const DEFAULT_TEXT_LINE_HEIGHT_RATIO = 21 / 16
const injectedGeistFontBase64 = typeof __XPLAT_GEIST_FONT_BASE64__ === 'string'
	? __XPLAT_GEIST_FONT_BASE64__
	: null
const injectedGeistLicense = typeof __XPLAT_GEIST_FONT_LICENSE__ === 'string'
	? __XPLAT_GEIST_FONT_LICENSE__
	: null
let geistLicenseText
const geistFontDescriptors = new Map()
const GEIST_WEIGHT_ALIASES = new Map([
	['thin', 100],
	['extralight', 200],
	['light', 300],
	['normal', 400],
	['regular', 400],
	['medium', 500],
	['semibold', 600],
	['bold', 700],
	['extrabold', 800],
	['black', 900],
])
const GEIST_WEIGHT_FACES = [
	[100, 'Geist-Thin'],
	[200, 'Geist-ExtraLight'],
	[300, 'Geist-Light'],
	[400, 'Geist-Regular'],
	[500, 'Geist-Medium'],
	[600, 'Geist-SemiBold'],
	[700, 'Geist-Bold'],
	[800, 'Geist-ExtraBold'],
	[Infinity, 'Geist-Black'],
]

function sourceFontPath(filename) {
	const candidates = [
		resolve(process.cwd(), 'packages/app/src/assets/fonts', filename),
		resolve(process.cwd(), '../../packages/app/src/assets/fonts', filename),
	]
	return candidates.find(existsSync)
}

function loadBundledGeistFonts() {
	const fontBytes = injectedGeistFontBase64
		? Buffer.from(injectedGeistFontBase64, 'base64')
		: (() => {
			const path = sourceFontPath('Geist-Variable.ttf')
			return path ? readFileSync(path) : null
		})()
	if (!fontBytes) {throw new Error('Could not find the bundled Geist font asset')}
	const licenseText = injectedGeistLicense ?? (() => {
		const path = sourceFontPath('OFL.txt')
		if (!path) {throw new Error('Could not find the Geist font license')}
		return readFileSync(path, 'utf8')
	})()
	geistLicenseText = licenseText
	const digest = createHash('sha256').update(fontBytes).digest('hex')
	const fontDirectory = join(homedir(), 'Library', 'Caches', 'octane-xplat', 'macos', 'fonts')
	const fontPath = join(fontDirectory, `Geist-Variable-${digest}.ttf`)
	const licensePath = join(fontDirectory, 'Geist-OFL.txt')
	mkdirSync(fontDirectory, { recursive: true })
	if (!existsSync(fontPath)) {writeFileSync(fontPath, fontBytes)}
	if (!existsSync(licensePath)) {writeFileSync(licensePath, licenseText, 'utf8')}

	const descriptors = CTFontManagerCreateFontDescriptorsFromURL(NSURL.fileURLWithPath(fontPath))
	for (let index = 0; index < Number(descriptors?.count ?? 0); index++) {
		const descriptor = descriptors.objectAtIndex(index)
		const postScriptName = String(descriptor.postscriptName ?? '')
		const descriptorURL = CTFontDescriptorCopyAttribute(descriptor, kCTFontURLAttribute)
		if (postScriptName.startsWith('Geist-') && descriptorURL?.path === fontPath) {
			geistFontDescriptors.set(postScriptName, descriptor)
		}
	}

	for (const postScriptName of [
		'Geist-Thin',
		'Geist-ExtraLight',
		'Geist-Light',
		'Geist-Regular',
		'Geist-Medium',
		'Geist-SemiBold',
		'Geist-Bold',
		'Geist-ExtraBold',
		'Geist-Black',
	]) {
		if (!geistFontDescriptors.has(postScriptName)) {
			throw new Error(`Failed to load the bundled ${postScriptName} font face`)
		}
	}
}

loadBundledGeistFonts()

function invokeAction(actionId) {
	const action = actionHandlers.get(actionId)
	if (action) {action()}
}

class ButtonActionTarget extends NSObject {
	static ObjCProtocols = [NSTextViewDelegate]

	static ObjCExposedMethods = {
		buttonPressed: { params: [NSButton], returns: interop.types.void },
		viewPressed: { params: [NSObject], returns: interop.types.void },
		viewPanned: { params: [NSPanGestureRecognizer], returns: interop.types.void },
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

	viewPanned(sender) {
		const handler = panHandlersByView.get(sender.view)
		if (!handler) {return}

		const translation = sender.translationInView(sender.view)
		const nativeState = Number(sender.state)
		const state = nativeState === 1 ? 1 : nativeState === 2 ? 2 : nativeState === 3 ? 3 : 0
		try {
			handler({
				deltaX: Number(translation.x ?? 0),
				deltaY: Number(translation.y ?? 0),
				state,
				view: sender.view,
			})
		} catch (error) {
			console.error('[macos-event] pan handler failed', error)
		}
	}

	textDidChange(notification) {
		const node = textNodesByView.get(notification.object)
		syncTextViewPlaceholder(node)
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

// AppKit's grid host overlays its children in one cell. The macOS Slider uses
// that behavior to place its track, fill, and thumb from shared proportions.
class GridLayoutView extends NSView {
	static ObjCExposedMethods = {
		accessibilityRole: { params: [], returns: interop.types.id },
		accessibilityLabel: { params: [], returns: interop.types.id },
		accessibilityValue: { params: [], returns: interop.types.id },
		accessibilityMinValue: { params: [], returns: interop.types.id },
		accessibilityMaxValue: { params: [], returns: interop.types.id },
		accessibilityIsIgnored: { params: [], returns: interop.types.bool },
		accessibilityIsEnabled: { params: [], returns: interop.types.bool },
		accessibilityPerformIncrement: { params: [], returns: interop.types.bool },
		accessibilityPerformDecrement: { params: [], returns: interop.types.bool },
	}

	static {
		NativeClass(this)
	}

	accessibilityRole() {
		const node = gridLayoutNodesByView.get(this)
		return node?.props.accessibilityRole === 'adjustable' ? 'AXSlider' : 'AXGroup'
	}

	accessibilityLabel() {
		return gridLayoutNodesByView.get(this)?.props.accessibilityLabel ?? ''
	}

	accessibilityValue() {
		return NSNumber.numberWithDouble(Number(gridLayoutNodesByView.get(this)?.props.accessibilityValue ?? 0))
	}

	accessibilityMinValue() {
		return NSNumber.numberWithDouble(Number(gridLayoutNodesByView.get(this)?.props.accessibilityMinValue ?? 0))
	}

	accessibilityMaxValue() {
		return NSNumber.numberWithDouble(Number(gridLayoutNodesByView.get(this)?.props.accessibilityMaxValue ?? 100))
	}

	accessibilityIsIgnored() {
		return !gridLayoutNodesByView.get(this)?.props.accessibilityRole
	}

	accessibilityIsEnabled() {
		return gridLayoutNodesByView.get(this)?.props.disabled !== true
	}

	accessibilityPerformIncrement() {
		return performGridAccessibilityAdjustment(this, 'onAccessibilityIncrement')
	}

	accessibilityPerformDecrement() {
		return performGridAccessibilityAdjustment(this, 'onAccessibilityDecrement')
	}

	layout() {
		super.layout()
		layoutGridChildren(gridLayoutNodesByView.get(this))
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

	stack.alignment = stackAlignmentAttribute(stack, props.alignItems ?? 'stretch')
	stack.distribution = NSStackViewDistribution.GravityAreas
	stack.spacing = Number(props.gap ?? props.spacing ?? 0)
	stack.translatesAutoresizingMaskIntoConstraints = false
	return stack
}

function stackAlignmentAttribute(view, value) {
	const horizontal = view.orientation === NSUserInterfaceLayoutOrientation.Horizontal
	if (value === 'center') {return horizontal ? NSLayoutAttribute.CenterY : NSLayoutAttribute.CenterX}
	if (value === 'end' || value === 'flex-end') {return horizontal ? NSLayoutAttribute.Bottom : NSLayoutAttribute.Right}
	if (value === 'stretch' || value === 'start' || value === 'flex-start' || value === 'normal') {
		return horizontal ? NSLayoutAttribute.Top : NSLayoutAttribute.Left
	}
	if (value === 'baseline' && horizontal) {return NSLayoutAttribute.FirstBaseline}
	return horizontal ? NSLayoutAttribute.Top : NSLayoutAttribute.Left
}

function stackAlignItems(node) {
	const classes = nodeClasses(node)
	if (classes.includes('vx-button') || classes.includes('items-center')) {return 'center'}
	if (classes.includes('items-start')) {return 'start'}
	if (classes.includes('items-end')) {return 'end'}
	return node.props.alignItems ?? 'stretch'
}

function stackJustifyContent(node) {
	if (nodeClasses(node).includes('vx-button')) {return 'center'}
	if (nodeClasses(node).includes('justify-between')) {return 'space-between'}
	return node.props.justifyContent ?? 'start'
}

function updateCrossAxisConstraints(parent) {
	const stack = parent.childHost ?? parent.view
	if (!stack || stack.orientation == null) {return}
	const horizontal = stack.orientation === NSUserInterfaceLayoutOrientation.Horizontal
	const dimension = horizontal ? 'height' : 'width'
	const alignItems = stackAlignItems(parent)
	for (const child of parent.children) {
		if (child.crossAxisConstraint) {child.crossAxisConstraint.active = false}
		child.crossAxisConstraint = null
		if (alignItems !== 'stretch' || !child.view || child.sizeConstraintSpecs?.[dimension]) {continue}
		child.crossAxisConstraint = horizontal
			? child.view.heightAnchor.constraintEqualToAnchor(stack.heightAnchor)
			: child.view.widthAnchor.constraintEqualToAnchor(stack.widthAnchor)
		child.crossAxisConstraint.active = true
	}
}

function stackGravity(parent, child) {
	const stack = parent.childHost ?? parent.view
	const horizontal = stack.orientation === NSUserInterfaceLayoutOrientation.Horizontal
	const leading = horizontal ? NSStackViewGravity.Leading : NSStackViewGravity.Top
	const trailing = horizontal ? NSStackViewGravity.Trailing : NSStackViewGravity.Bottom
	const justifyContent = stackJustifyContent(parent)
	if (justifyContent === 'center') {return NSStackViewGravity.Center}
	if (justifyContent === 'end' || justifyContent === 'flex-end') {return trailing}
	if (justifyContent === 'space-between') {
		const index = parent.children.indexOf(child)
		if (index === 0) {return leading}
		if (index === parent.children.length - 1) {return trailing}
		return NSStackViewGravity.Center
	}
	return leading
}

function moveStackChildren(parent) {
	const stack = parent.childHost ?? parent.view
	if (typeof stack?.addViewInGravity !== 'function') {return}
	for (const child of parent.children) {
		if (!child.view) {continue}
		stack.removeArrangedSubview(child.view)
		child.view.removeFromSuperview()
		stack.addViewInGravity(child.view, stackGravity(parent, child))
		setStackChildPriorities(parent, child)
	}
	updateCrossAxisConstraints(parent)
}

function setStackChildPriorities(parent, child) {
	const stack = parent.childHost ?? parent.view
	if (stack?.orientation == null || !child.view) {return}
	const mainAxis = stack.orientation
	const grow = nodeClasses(child).includes('flex-1')
	for (const orientation of [
		NSUserInterfaceLayoutOrientation.Horizontal,
		NSUserInterfaceLayoutOrientation.Vertical,
	]) {
		const priority = grow && orientation === mainAxis ? 1 : 750
		child.view.setContentHuggingPriorityForOrientation(priority, orientation)
		child.view.setContentCompressionResistancePriorityForOrientation(750, orientation)
	}
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
	label.alignment = NSTextAlignment.Left
	label.cell.wraps = true
	label.cell.usesSingleLineMode = false
	label.translatesAutoresizingMaskIntoConstraints = false
	label.font = fontForStyle(16)
	label.textColor = nativeColor('#0a0a0a')
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

function setTextFieldPlaceholder(field, props) {
	const placeholder = String(props.placeholder ?? '')
	if (!placeholder) {
		field.placeholderAttributedString = null
		field.placeholderString = placeholder
		return
	}

	field.placeholderString = placeholder
	field.placeholderAttributedString = NSAttributedString.alloc().initWithStringAttributes(placeholder, {
		[NSFontAttributeName]: field.font,
		[NSForegroundColorAttributeName]: nativeColor(String(props.placeholderTextColor ?? '#666666')),
	})
}

function makeTextField(props, multiline = false) {
	const field = multiline
		? NSTextView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 320, height: 72 } })
		: NSTextField.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 320, height: 28 } })
	field.translatesAutoresizingMaskIntoConstraints = false
	field.font = fontForStyle(14)
	field.textColor = nativeColor('#0a0a0a')
	if (!multiline) {
		field.bezeled = false
		field.drawsBackground = false
		field.editable = true
		field.selectable = true
		field.sendsActionOnEndEditing = false
		setTextFieldPlaceholder(field, props)
	} else {
		field.editable = true
		field.selectable = true
		field.drawsBackground = false
		field.textContainerInset = { width: 0, height: 0 }
		field.textContainer.lineFragmentPadding = 0
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

function makeGridLayout() {
	const view = GridLayoutView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 140, height: 28 } })
	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

function layoutLength(value, available, fallback) {
	if (typeof value === 'string' && value.trim().endsWith('%')) {
		const percent = Number(value.trim().slice(0, -1))
		return Number.isFinite(percent) ? (available * percent) / 100 : fallback
	}

	const length = Number(value)
	return Number.isFinite(length) ? length : fallback
}

function layoutGridChildren(parent) {
	if (!parent?.view) {return}
	const width = Number(parent.view.bounds.size.width)
	const height = Number(parent.view.bounds.size.height)

	for (const child of parent.children) {
		if (!child.view) {continue}
		const style = child.props.style ?? {}
		const horizontal = child.props.horizontalAlignment ?? 'stretch'
		const vertical = child.props.verticalAlignment ?? 'stretch'
		const intrinsic = child.view.intrinsicContentSize ?? { width: 0, height: 0 }
		const childWidth = style.width == null
			? (horizontal === 'stretch' ? width : Math.max(0, Number(intrinsic.width ?? 0)))
			: layoutLength(style.width, width, 0)
		const childHeight = style.height == null
			? (vertical === 'stretch' ? height : Math.max(0, Number(intrinsic.height ?? 0)))
			: layoutLength(style.height, height, 0)

		let x = 0
		if (horizontal === 'center' || horizontal === 'middle') {
			x = (width - childWidth) / 2
		} else if (horizontal === 'right') {
			x = width - childWidth
		} else if (horizontal === 'left') {
			x = layoutLength(style.left, width, 0) + Number(style.marginLeft ?? 0)
		}

		let y = 0
		if (vertical === 'middle' || vertical === 'center') {
			y = (height - childHeight) / 2
		} else if (vertical === 'top') {
			y = height - childHeight
		}

		child.view.frame = {
			origin: { x, y },
			size: { width: childWidth, height: childHeight },
		}
	}
}

function performGridAccessibilityAdjustment(view, name) {
	const node = gridLayoutNodesByView.get(view)
	const handler = node?.props[name]
	if (typeof handler !== 'function') {return false}
	try {
		node.container.root.eventScope('discrete', handler)
		return true
	} catch (error) {
		console.error('[macos-event] slider accessibility adjustment failed', error)
		return false
	}
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
		case 'gridlayout':
			view = makeGridLayout()
			break
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
	if (type === 'gridlayout') {
		gridLayoutNodesByView.set(view, node)
	}
	if (type === 'textview') {
		const placeholder = makeLabel()
		placeholder.font = fontForStyle(14)
		placeholder.textColor = nativeColor('#666666')
		placeholder.stringValue = String(props.placeholder ?? '')
		placeholder.translatesAutoresizingMaskIntoConstraints = false
		placeholder.heightAnchor.constraintEqualToConstant(Math.ceil(14 * DEFAULT_TEXT_LINE_HEIGHT_RATIO)).active = true
		placeholder.hidden = String(props.value ?? '').length > 0
		view.addSubview(placeholder)
		placeholder.leadingAnchor.constraintEqualToAnchorConstant(view.leadingAnchor, 0).active = true
		placeholder.topAnchor.constraintEqualToAnchor(view.topAnchor).active = true
		node.placeholderView = placeholder
		textNodesByView.set(view, node)
	}
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

function fontForStyle(size, weight = 400) {
	const value = String(weight).toLowerCase()
	const parsedWeight = GEIST_WEIGHT_ALIASES.get(value) ?? Number(value)
	const numericWeight = Number.isFinite(parsedWeight) ? parsedWeight : 400
	const geistName = GEIST_WEIGHT_FACES.find(([maxWeight]) => numericWeight <= maxWeight)[1]
	const geistFont = NSFont.fontWithDescriptorSize(geistFontDescriptors.get(geistName), Number(size))
	if (!geistFont || String(geistFont.fontName) !== geistName) {
		throw new Error(`Failed to create the bundled ${geistName} font face`)
	}
	return geistFont
}

function fontForFamilyStyle(size, weight = 400, family) {
	const firstFamily = String(family ?? '').split(',')[0].trim().replace(/^['"]|['"]$/g, '')
	if (firstFamily === 'system-ui' || firstFamily === '-apple-system') {
		const systemFont = NSFont.systemFontOfSize(Number(size))
		if (!systemFont) {throw new Error('Failed to create the AppKit system font face')}
		return systemFont
	}
	return fontForStyle(size, weight)
}

function setSizeConstraint(node, name, value) {
	const spec = sizeConstraintSpec(value)
	const specs = (node.sizeConstraintSpecs ??= {})
	if (!spec) {
		delete specs[name]
		console.warn('[macos-style] ignored unsupported style.' + name + ' value ' + JSON.stringify(value))
	} else {
		specs[name] = spec
	}

	if (node.parent?.type === 'gridlayout') {
		deactivateSizeConstraints(node)
		layoutGridChildren(node.parent)
		return
	}

	applySizeConstraint(node, name)
	if (node.parent) {updateCrossAxisConstraints(node.parent)}
}

function sizeConstraintSpec(value) {
	if (typeof value === 'string') {
		const text = value.trim()
		const percent = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))%$/)
		if (percent) {
			const multiplier = Number(percent[1]) / 100
			return Number.isFinite(multiplier) && multiplier >= 0 ? { kind: 'percent', multiplier } : null
		}

		const px = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))px$/i)
		if (px) {
			const points = Number(px[1])
			return Number.isFinite(points) && points >= 0 ? { kind: 'points', points } : null
		}
	}

	const points = typeof value === 'number' ? value : Number(value)
	return Number.isFinite(points) && points >= 0 ? { kind: 'points', points } : null
}

function sizeConstraintParentView(node) {
	if (node.parent) {return node.parent.childHost ?? node.parent.view}
	return node.container.children.includes(node) ? node.container.hostView : null
}

function applySizeConstraint(node, name) {
	const constraints = (node.sizeConstraints ??= {})
	if (constraints[name]) {
		constraints[name].active = false
		delete constraints[name]
	}

	const spec = node.sizeConstraintSpecs?.[name]
	if (!spec || !node.view) {return}

	let constraint
	if (spec.kind === 'percent') {
		const parentView = sizeConstraintParentView(node)
		if (!parentView) {return}
		const anchor = name === 'width' ? node.view.widthAnchor : node.view.heightAnchor
		const parentAnchor = name === 'width' ? parentView.widthAnchor : parentView.heightAnchor
		constraint = anchor.constraintEqualToAnchorMultiplier(parentAnchor, spec.multiplier)
	} else {
		constraint = name === 'width'
			? node.view.widthAnchor.constraintEqualToConstant(spec.points)
			: node.view.heightAnchor.constraintEqualToConstant(spec.points)
	}

	constraints[name] = constraint
	constraint.active = true
}

function applySizeConstraints(node) {
	for (const name of ['width', 'height']) {applySizeConstraint(node, name)}
}

function deactivateSizeConstraints(node) {
	for (const name of ['width', 'height']) {
		const constraint = node.sizeConstraints?.[name]
		if (constraint) {
			constraint.active = false
			delete node.sizeConstraints[name]
		}
	}
}

function applyStyle(node, style) {
	if (style == null) {return}
	if (typeof style !== 'object') {throw new Error('AppKit spike expects style to be an object')}
	for (const [name, value] of Object.entries(style)) {
		if (value == null) {continue}
		if (name === 'fontSize' && ['label', 'textfield', 'textview'].includes(node.type)) {
			const weight = style.fontWeight ?? node.appliedFontWeight ?? 400
			node.appliedFontWeight = String(weight)
			node.view.font = fontForFamilyStyle(value, weight, style.fontFamily ?? node.appliedFontFamily)
		} else if (name === 'fontFamily' && ['label', 'textfield', 'textview'].includes(node.type)) {
			node.appliedFontFamily = String(value)
			const size = style.fontSize ?? node.view.font.pointSize
			const weight = style.fontWeight ?? node.appliedFontWeight ?? 400
			node.view.font = fontForFamilyStyle(size, weight, value)
		} else if (name === 'color' && ['label', 'textfield', 'textview'].includes(node.type)) {
			node.view.textColor = nativeColor(value)
		} else if (name === 'lineHeight' && node.type === 'label') {
			// syncText applies this to each paragraph; it is not the label's fixed height.
			continue
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
			setSizeConstraint(node, name, value)
		} else if ((name === 'left' || name === 'marginLeft') && node.view) {
			if (node.parent?.type === 'gridlayout') {layoutGridChildren(node.parent)}
		} else if (name === 'opacity' && node.view) {
			node.view.alphaValue = Number(value)
		} else if (name === 'fontWeight' && ['label', 'textfield', 'textview'].includes(node.type)) {
			node.appliedFontWeight = String(value)
			node.view.font = fontForFamilyStyle(node.view.font.pointSize, value, style.fontFamily ?? node.appliedFontFamily)
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
			if (sizes[name]) {node.view.font = fontForFamilyStyle(sizes[name], node.appliedFontWeight ?? 400, node.appliedFontFamily)}
			if (name === 'font-semibold') {
				node.appliedFontWeight = '600'
				node.view.font = fontForFamilyStyle(node.view.font.pointSize, 600, node.appliedFontFamily)
			}
			if (name === 'font-bold') {
				node.appliedFontWeight = '700'
				node.view.font = fontForFamilyStyle(node.view.font.pointSize, 700, node.appliedFontFamily)
			}
			if (name === 'text-muted') {node.view.textColor = nativeColor('#71717a')}
			if (name === 'text-onprimary') {node.view.textColor = nativeColor('#ffffff')}
		}
	}

	if (node.type === 'flexboxlayout' || node.type === 'stack' || node.type === 'scrollview' || node.type === 'gridlayout') {
		const gaps = { 'gap-1': 4, 'gap-2': 8, 'gap-3': 12, 'gap-4': 16, 'gap-6': 24 }
		for (const name of classes) {
			if (gaps[name] !== undefined) {node.view.spacing = gaps[name]}
			if (name === 'flex-row') {node.view.orientation = NSUserInterfaceLayoutOrientation.Horizontal}
			if (name === 'flex-col') {node.view.orientation = NSUserInterfaceLayoutOrientation.Vertical}
			if (name === 'items-center' || name === 'items-start' || name === 'items-end') {
				node.view.alignment = stackAlignmentAttribute(node.view, stackAlignItems(node))
			}
			if (name === 'vx-button') {
				node.view.orientation = NSUserInterfaceLayoutOrientation.Horizontal
				node.view.alignment = NSLayoutAttribute.CenterY
				node.view.distribution = NSStackViewDistribution.GravityAreas
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

	if (node.type === 'textfield' || node.type === 'textview') {
		if (classes.includes('vx-input') || classes.includes('vx-textarea')) {
			node.view.font = fontForStyle(14, node.appliedFontWeight ?? 400)
			node.view.textColor = nativeColor('#0a0a0a')
			node.view.drawsBackground = false
			if (node.type === 'textfield') {node.view.bezeled = false}
			if (node.type === 'textview') {node.view.textContainerInset = { width: 0, height: 0 }}
		}
	}
}

function textContent(node) {
	if (node.type === '#text') {return node.text}
	if (node.type === 'label') {return node.view.stringValue}
	return node.children.map(textContent).join('')
}

function setLabelText(node, text) {
	const lineHeight = Number(node.props?.style?.lineHeight)
	if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
		node.view.stringValue = text
		return
	}

	const paragraphStyle = NSMutableParagraphStyle.alloc().init()
	paragraphStyle.minimumLineHeight = lineHeight
	paragraphStyle.maximumLineHeight = lineHeight
	node.view.attributedStringValue = NSAttributedString.alloc().initWithStringAttributes(text, {
		[NSParagraphStyleAttributeName]: paragraphStyle,
		[NSFontAttributeName]: node.view.font,
		[NSForegroundColorAttributeName]: node.view.textColor,
	})
}

function syncText(parent) {
	if (parent?.type !== 'label') {return}
	setLabelText(parent, parent.children.map(textContent).join(''))
}

function syncTextViewPlaceholder(node) {
	if (node?.placeholderView) {node.placeholderView.hidden = String(node.view.string ?? '').length > 0}
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

function setPanAction(node, value) {
	if (typeof value === 'function' && !node.panGestureRecognizer) {
		node.panGestureRecognizer = NSPanGestureRecognizer.alloc().initWithTargetAction(
			buttonActionTarget,
			'viewPanned',
		)
		node.view.addGestureRecognizer(node.panGestureRecognizer)
	}

	panHandlersByView.set(
		node.view,
		typeof value === 'function'
			? (event) => {
				try {
					node.container.root.eventScope('discrete', () => value(event))
				} catch (error) {
					console.error('[macos-event] pan handler failed', error)
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
					node.view.distribution = NSStackViewDistribution.GravityAreas
					node.view.alignment = stackAlignmentAttribute(node.view, stackAlignItems(node))
					moveStackChildren(node)
					updateCrossAxisConstraints(node)
				} else if (name === 'alignItems') {
					node.view.alignment = stackAlignmentAttribute(node.view, stackAlignItems(node))
					updateCrossAxisConstraints(node)
				} else if (name === 'justifyContent') {
					node.view.distribution = NSStackViewDistribution.GravityAreas
					moveStackChildren(node)
				} else if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className') {
					applyClassName(node, value)
					moveStackChildren(node)
					node.view.alignment = stackAlignmentAttribute(node.view, stackAlignItems(node))
					updateCrossAxisConstraints(node)
				}
				else if (name === 'id') {continue}
				else if (name === 'onTap') {setAction(node, value)}
				else if (name === 'onPan') {setPanAction(node, value)}
				else if (name === 'onTouch') {continue}
				else if (name === 'onSwipe') {
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
						'horizontalAlignment',
						'verticalAlignment',
					].includes(name)
				) {continue}
				else {console.warn('[macos-host] ignored flexboxlayout prop ' + name)}

				break
			case 'gridlayout':
				if (name === 'style') {applyStyle(node, value)}
				else if (name === 'className' || name === 'id') {continue}
				else if (name === 'disabled') {continue}
				else if (name === 'onPan') {setPanAction(node, value)}
				else if (name === 'onAccessibilityIncrement' || name === 'onAccessibilityDecrement') {continue}
				else if (name === 'onSwipe') {
					if (typeof value === 'function') {
						console.warn('[macos-host] onSwipe is unsupported by the AppKit renderer')
					}
				}
				else if (name.startsWith('on') && value == null) {continue}
				else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (['rows', 'columns'].includes(name)) {
					if (value) {
						throw new Error('[macos-host] gridlayout overlay does not support ' + name)
					}
				} else {console.warn('[macos-host] ignored gridlayout prop ' + name)}

				break
		case 'label':
				if (name === 'text') {
					setLabelText(node, String(value ?? ''))
				} else if (name === 'fontSize') {
					node.view.font = fontForStyle(Number(value ?? 16), node.appliedFontWeight ?? 400)
				} else if (name === 'style') {
					applyStyle(node, value)
					syncText(node)
				}
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
					if (node.type === 'textview') {
						node.view.string = String(value ?? '')
						syncTextViewPlaceholder(node)
					}
					else {node.view.stringValue = String(value ?? '')}
				}
				else if (name === 'placeholder') {
					if (node.type === 'textfield') {continue}
					else if (node.placeholderView) {
						node.placeholderView.stringValue = String(value ?? '')
						syncTextViewPlaceholder(node)
					}
				}
				else if (name === 'placeholderTextColor' && node.type === 'textfield') {continue}
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

	if (node.type === 'textfield') {setTextFieldPlaceholder(node.view, node.props)}

	if (node.type === 'label') {
		const style = node.props.style ?? {}
		if (style.lineHeight == null && style.height == null) {
			const size = Number(node.view.font?.pointSize ?? 16)
			setSizeConstraint(node, 'height', Math.ceil(size * DEFAULT_TEXT_LINE_HEIGHT_RATIO))
		}
	}
}

function detach(container, node) {
	const siblings = node.parent?.children ?? container.children
	const index = siblings.indexOf(node)
	if (index >= 0) {siblings.splice(index, 1)}
	if (node.crossAxisConstraint) {node.crossAxisConstraint.active = false}
	node.crossAxisConstraint = null
	deactivateSizeConstraints(node)
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
	if (
		parent?.type === 'gridlayout' &&
		node.view &&
		(Number(node.props.row ?? 0) !== 0 ||
			Number(node.props.col ?? 0) !== 0 ||
			Number(node.props.rowSpan ?? 1) !== 1 ||
			Number(node.props.colSpan ?? 1) !== 1)
	) {
		throw new Error('[macos-host] gridlayout overlay supports only its default cell')
	}

	if (parent && node.view && parent.type !== 'stack' && parent.type !== 'flexboxlayout' && parent.type !== 'scrollview' && parent.type !== 'gridlayout') {
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
			if (parent.type === 'gridlayout') {
				parentView.addSubview(node.view)
				node.view.translatesAutoresizingMaskIntoConstraints = false
				deactivateSizeConstraints(node)
				layoutGridChildren(parent)
			} else {
				parentView.addViewInGravity(node.view, stackGravity(parent, node))
				applySizeConstraints(node)
				setStackChildPriorities(parent, node)
				updateCrossAxisConstraints(parent)
			}
		} else {
			parentView.addSubview(node.view)
			node.view.leadingAnchor.constraintEqualToAnchor(parentView.leadingAnchor).active = true
			node.view.trailingAnchor.constraintEqualToAnchor(parentView.trailingAnchor).active = true
			node.view.topAnchor.constraintEqualToAnchor(parentView.topAnchor).active = true
			node.view.bottomAnchor.constraintEqualToAnchor(parentView.bottomAnchor).active = true
			applySizeConstraints(node)
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
	if (node.crossAxisConstraint) {node.crossAxisConstraint.active = false}
	node.crossAxisConstraint = null
	deactivateSizeConstraints(node)
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

const round = (value) => Math.round(value * 100) / 100

function nodeClasses(node) {
	return String(node.props?.className ?? '').split(/\s+/).filter(Boolean)
}

function descendants(node, out = []) {
	for (const child of node.children) {
		out.push(child)
		descendants(child, out)
	}

	return out
}

function withDrawingAppearance(appearance, read) {
	let value
	const readValue = () => {value = read()}
	if (typeof appearance?.performAsCurrentDrawingAppearance === 'function') {
		appearance.performAsCurrentDrawingAppearance(readValue)
	} else {
		readValue()
	}
	return value
}

function colorValue(color, appearance) {
	if (!color) {return undefined}
	try {
		return withDrawingAppearance(appearance, () => {
			const rgb = color.colorUsingColorSpace?.(NSColorSpace.sRGBColorSpace) ?? color
			return (
				'#' +
				[rgb.redComponent, rgb.greenComponent, rgb.blueComponent]
					.map((component) => Math.round(Number(component) * 255).toString(16).padStart(2, '0'))
					.join('')
			)
		})
	} catch {
		return undefined
	}
}

function stackDirection(view) {
	return view.orientation === NSUserInterfaceLayoutOrientation.Horizontal ? 'row' : 'column'
}

function parityStyle(node, facets) {
	const view = node.view
	const font = view?.font
	const supplied = node.props?.style ?? {}
	const out = {}
	for (const facet of facets) {
		let value = supplied[facet]
		if (facet === 'paddingTop' && view?.edgeInsets?.top != null) {value = view.edgeInsets.top}
		if (facet === 'paddingRight' && view?.edgeInsets?.right != null) {value = view.edgeInsets.right}
		if (facet === 'paddingBottom' && view?.edgeInsets?.bottom != null) {value = view.edgeInsets.bottom}
		if (facet === 'paddingLeft' && view?.edgeInsets?.left != null) {value = view.edgeInsets.left}
		if (facet === 'fontSize' && font?.pointSize != null) {value = font.pointSize}
		if (facet === 'fontFamily' && font?.familyName) {value = font.familyName}
		if (facet === 'fontWeight' && font?.fontDescriptor?.symbolicTraits != null) {
			value = supplied.fontWeight ?? node.appliedFontWeight ?? (Number(font.fontDescriptor.symbolicTraits) & 2 ? '700' : '400')
		}
		if (facet === 'lineHeight' && font) {
			value = supplied.lineHeight ?? (node.type === 'label'
				? round(Number(view.frame.size.height))
				: round(Number(font.ascender) - Number(font.descender) + Number(font.leading)))
		}
		if (facet === 'color' && view?.textColor) {value = colorValue(view.textColor) ?? value}
		if (facet === 'backgroundColor') {
			value = colorValue(view?.layer?.backgroundColor ? NSColor.colorWithCGColor(view.layer.backgroundColor) : null) ?? value
			if (value == null && view?.drawsBackground === false) {value = 'rgba(0,0,0,0)'}
		}
		if (facet === 'borderTopWidth' && view?.layer) {value = view.layer.borderWidth}
		if (facet === 'borderTopColor' && view?.layer?.borderColor) {
			value = colorValue(NSColor.colorWithCGColor(view.layer.borderColor)) ?? value
		}
		if (facet === 'borderTopLeftRadius' && view?.layer) {value = view.layer.cornerRadius}
		if (facet === 'opacity' && view?.alphaValue != null) {value = view.alphaValue}
		if (facet === 'flexDirection' && view?.orientation != null) {value = stackDirection(view)}
		if (facet === 'alignItems' && view?.orientation != null) {value = stackAlignItems(node)}
		if (facet === 'justifyContent' && view?.distribution != null) {value = stackJustifyContent(node)}

		if (value !== undefined && value !== null && value !== '') {
			out[facet] = String(value)
		}
	}
	if (font?.fontName) {out.fontPostScriptName = String(font.fontName)}

	return out
}

function measureTextLineAdvances(value, font) {
	if (!value || !font) {return undefined}
	return String(value).split(/\r\n|\r|\n/).map((line) => {
		const attributed = NSAttributedString.alloc().initWithStringAttributes(line, {
			[NSFontAttributeName]: font,
		})
		return round(Number(attributed.size().width))
	})
}

function parityNode(node, boxNode, facets) {
	const view = node.view
	let box = null
	if (view && boxNode.view) {
		try {
			const alignedRect = view.alignmentRectForFrame?.(view.frame)
			const rect = alignedRect && view.superview
				? view.superview.convertRectToView(alignedRect, boxNode.view)
				: view.convertRectToView(view.bounds, boxNode.view)
			const boxHeight = Number(boxNode.view.bounds.size.height)
			box = {
				x: round(Number(rect.origin.x)),
				y: round(boxHeight - Number(rect.origin.y) - Number(rect.size.height)),
				w: round(Number(rect.size.width)),
				h: round(Number(rect.size.height)),
			}
		} catch {}
	}
	let placeholderBox = null
	if (node.placeholderView && boxNode.view) {
		try {
			const placeholderView = node.placeholderView
			const alignedRect = placeholderView.alignmentRectForFrame?.(placeholderView.frame)
			const rect = alignedRect && placeholderView.superview
				? placeholderView.superview.convertRectToView(alignedRect, boxNode.view)
				: placeholderView.convertRectToView(placeholderView.bounds, boxNode.view)
			const boxHeight = Number(boxNode.view.bounds.size.height)
			placeholderBox = {
				x: round(Number(rect.origin.x)),
				y: round(boxHeight - Number(rect.origin.y) - Number(rect.size.height)),
				w: round(Number(rect.size.width)),
				h: round(Number(rect.size.height)),
			}
		} catch {}
	}

	let text
	let textLineAdvances
	if (node.type === 'label') {
		const value = String(view?.stringValue ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	}
	else if (node.type === 'button') {
		const value = String(view?.title ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	}
	else if (node.type === 'textfield') {
		const value = String(view?.stringValue ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	}
	else if (node.type === 'textview') {
		const value = String(view?.string ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	}
	const placeholderAttributedString = node.type === 'textfield' ? view?.placeholderAttributedString : null
	const placeholder = node.type === 'textfield'
		? String(placeholderAttributedString?.string ?? view?.placeholderString ?? '').trim()
		: node.type === 'textview'
			? String(node.placeholderView?.stringValue ?? '').trim()
			: ''
	const placeholderColor = node.type === 'textfield'
		? placeholderAttributedString?.attributeAtIndexEffectiveRange?.(NSForegroundColorAttributeName, 0, null)
			?? NSColor.placeholderTextColor
		: node.type === 'textview'
			? node.placeholderView?.textColor
			: null
	const appearance = view?.effectiveAppearance ?? view?.window?.effectiveAppearance
	const placeholderStyle = placeholderColor
		? {
				color: colorValue(placeholderColor, appearance),
				opacity: round(Number(withDrawingAppearance(appearance, () => placeholderColor.alphaComponent))),
			}
		: undefined

	return {
		tag: String(node.type ?? 'view').toLowerCase(),
		id: node.props?.id || undefined,
		classes: nodeClasses(node),
		box,
		placeholderBox,
		style: parityStyle(node, facets),
		text: text || undefined,
		textLineAdvances,
		placeholder: placeholder || undefined,
		placeholderStyle,
	}
}

function measureParity(container, facets) {
	const stage = [...container.nodes.values()].find((node) => node.props?.id === 'parity-stage')
	if (!stage?.view) {return null}
	container.hostView.window?.contentView?.layoutSubtreeIfNeeded?.()
	stage.view.layoutSubtreeIfNeeded?.()

	const cells = {}
	for (const cell of stage.children.filter((node) => nodeClasses(node).includes('parity-cell'))) {
		const name = String(cell.props?.id ?? '').replace(/^cell-/, '')
		const box = descendants(cell).find((node) => nodeClasses(node).includes('parity-box'))
		if (!box?.view) {continue}
		box.view.layoutSubtreeIfNeeded?.()
		for (const scroll of descendants(box).filter((node) => node.type === 'scrollview' && node.view)) {
			const clip = scroll.view.contentView
			const document = scroll.view.documentView
			const y = Math.max(0, Number(document.bounds.size.height) - Number(clip.bounds.size.height))
			clip.scrollToPoint({ x: 0, y })
			scroll.view.reflectScrolledClipView(clip)
		}
		cells[name] = [box, ...descendants(box)]
			.filter((node) => node.view)
			.map((node) => parityNode(node, box, facets))
	}

	return { target: 'macos', cells }
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
			fontLicenses: { Geist: geistLicenseText },
			measureParity(facets) {
				return measureParity(container, facets)
			},
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
