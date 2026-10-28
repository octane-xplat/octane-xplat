/** Minimal @nativescript/core-compatible surface for the AppKit renderer.
 *
 *  Goal: pure-JS NativeScript plugins (custom views, behaviors, utilities)
 *  run on this host — they write `class X extends ViewBase`, register
 *  `Property`/`CssProperty`s, and instantiate through `registerPluginElement`
 *  which bridges into the renderer's element-behavior seam.
 *
 *  Deliberately out of scope (add per plugin demand): application/frame/page
 *  navigation, dialogs, file-system, image-source, gesture classes.
 */

// --- Observable -----------------------------------------------------------

export interface ObservableEvent {
	eventName: string
	object: Observable
	[key: string]: any
}

export class Observable {
	private _listeners: Map<string, Set<(args: ObservableEvent) => void>> | undefined

	on(event: string, callback: (args: ObservableEvent) => void) {
		;(this._listeners ??= new Map()).get(event)?.add(callback) ??
			this._listeners!.set(event, new Set([callback]))
	}

	once(event: string, callback: (args: ObservableEvent) => void) {
		const wrapped = (args: ObservableEvent) => {
			this.off(event, wrapped)
			callback(args)
		}
		this.on(event, wrapped)
	}

	off(event: string, callback?: (args: ObservableEvent) => void) {
		const set = this._listeners?.get(event)
		if (!set) {
			return
		}
		if (callback) {
			set.delete(callback)
		} else {
			set.clear()
		}
	}

	hasListeners(event: string) {
		return (this._listeners?.get(event)?.size ?? 0) > 0
	}

	notify(event: { eventName: string; object?: Observable; [key: string]: any }) {
		const args = { ...event, object: event.object ?? this }
		for (const cb of this._listeners?.get(event.eventName) ?? []) {
			cb(args)
		}
	}
}

// --- Property / CssProperty ------------------------------------------------

export interface PropertyOptions<Owner, T> {
	name: string
	defaultValue?: T
	affectsLayout?: boolean
	valueChanged?: (target: Owner, oldValue: T, newValue: T) => void
	valueConverter?: (value: string) => T
	equalityComparer?: (a: T, b: T) => boolean
}

interface PropertyRecord {
	descriptor: Property<any, any>
}

/** Per-class registry of NS-style properties. `prop.register(MyView)`
 *  installs a get/set pair on the prototype and records it in the class's
 *  property table so prop dispatch can find it by name. */
export class Property<Owner, T> {
	readonly name: string
	readonly defaultValue: T | undefined
	readonly affectsLayout: boolean
	readonly valueConverter?: (value: string) => T
	readonly native: string
	private readonly options: PropertyOptions<Owner, T>

	constructor(options: PropertyOptions<Owner, T>) {
		this.name = options.name
		this.defaultValue = options.defaultValue
		this.affectsLayout = options.affectsLayout ?? false
		this.valueConverter = options.valueConverter
		this.options = options
		this.native = options.name
	}

	register(cls: new (...args: any[]) => Owner) {
		const proto: any = cls.prototype
		const key = this.name
		const self = this
		;(proto.__propertyTable ??= Object.create(
			Object.getPrototypeOf(proto).__propertyTable ?? null,
		))[key] = { descriptor: self } satisfies PropertyRecord
		Object.defineProperty(proto, key, {
			configurable: true,
			enumerable: true,
			get(this: any) {
				return this.__propValues?.[key] ?? self.defaultValue
			},
			set(this: any, value: T) {
				const store = (this.__propValues ??= Object.create(null))
				const old = store[key] ?? self.defaultValue
				const equal = self.options.equalityComparer?.(old, value) ?? Object.is(old, value)
				if (equal) {
					return
				}
				store[key] = value
				self.options.valueChanged?.(this, old as T, value)
				if (self.affectsLayout) {
					this.requestLayout?.()
				}
				this.notify?.({
					eventName: key + 'Change',
					object: this,
					propertyName: key,
					value,
					oldValue: old,
				})
			},
		})
	}
}

/** CSS-named property registered onto a Style subclass; assignments forward
 *  to the owning view through its style-changed hook. */
export class CssProperty<Owner extends Style<any>, T> extends Property<Owner, T> {
	readonly cssName: string

	constructor(options: PropertyOptions<Owner, T> & { cssName: string }) {
		super(options)
		this.cssName = options.cssName
	}

	register(cls: new (...args: any[]) => Owner) {
		const proto: any = cls.prototype
		;(proto.__cssPropertyTable ??= Object.create(
			Object.getPrototypeOf(proto).__cssPropertyTable ?? null,
		))[this.cssName] = { descriptor: this }
		super.register(cls)
	}
}

// --- Style / ViewBase ------------------------------------------------------

/** Per-view style bag. Registered CssProperty setters fire valueChanged and
 *  forward into the owner's style pipeline (requestLayout + node style). */
export class Style<Owner extends ViewBase = ViewBase> extends Observable {
	readonly owner: Owner
	private readonly _values: Record<string, any> = Object.create(null)

	constructor(owner: Owner) {
		super()
		this.owner = owner
	}

	/** Assign a raw css-named value — mirrors `style.foo = v` for
	 *  unregistered names so plugins don't lose style input. */
	setProp(cssName: string, value: any) {
		const table = (Object.getPrototypeOf(this) as any).__cssPropertyTable ?? {}
		const record = table[cssName]
		if (record) {
			;(this as any)[record.descriptor.name] = value
		} else {
			this._values[cssName] = value
		}
		this.owner.styleChanged(cssName, value)
	}

	getProp(cssName: string) {
		const table = (Object.getPrototypeOf(this) as any).__cssPropertyTable ?? {}
		const record = table[cssName]
		return record ? (this as any)[record.descriptor.name] : this._values[cssName]
	}
}

/** ViewBase-shaped owner for plugin native views. `nativeView` is the real
 *  AppKit view the renderer parents and lays out. */
export class ViewBase extends Observable {
	nativeView: any = null
	readonly style: Style<this>
	/** The renderer's element node — set when the plugin element mounts. */
	hostNode: any = null
	private _className = ''

	constructor() {
		super()
		this.style = new Style(this)
	}

	/** Plugin factory hook — return the AppKit view to host. */
	createNativeView(): any {
		return undefined
	}

	get className() {
		return this._className
	}
	set className(value: string) {
		this._className = String(value ?? '')
		this.notify({ eventName: 'classNameChange', object: this, value: this._className })
	}

	/** Renderer glue — assigned by registerPluginElement, not plugin code. */
	__attachNode(node: any) {
		this.hostNode = node
	}

	/** Called when a style prop lands; subclasses/host adapters may override. */
	styleChanged(_cssName: string, _value: any) {
		this.requestLayout()
	}

	requestLayout() {
		if (this.hostNode) {
			compatDeps?.queueLayoutReconcile(this.hostNode.container, this.hostNode)
		}
	}
}

// --- Registration seam -----------------------------------------------------

interface CompatDeps {
	registerElementType: (type: string, behavior: any) => void
	applyStyle: (node: any, value: any) => void
	applyClassName: (node: any, value: any) => void
	applyAccessibility: (node: any, name: string, value: any) => void
	queueLayoutReconcile: (container: any, parent: any) => void
}

let compatDeps: CompatDeps | null = null
const pendingRegistrations: Array<() => void> = []

export interface PluginElementOptions<T extends ViewBase> {
	/** Factory for the plugin's view wrapper. */
	createView: () => T
	/** Element hosts view children. */
	container?: boolean
	/** Custom child layout — same hook the renderer's manual layouts use. */
	layout?: (parent: any) => void
	/** Extra style keys the element consumes (suppresses style warnings). */
	styleKeys?: ReadonlySet<string>
}

/** Called by the renderer at module init; queued registrations replay. */
export function installCompat(deps: CompatDeps) {
	compatDeps = deps
	for (const run of pendingRegistrations.splice(0)) {
		run()
	}
}

/** Register an octane element type backed by a ViewBase subclass — the entry
 *  point a plugin's index.macos/common entry calls. */
export function registerPluginElement<T extends ViewBase>(
	name: string,
	options: PluginElementOptions<T>,
) {
	const register = () => {
		if (!compatDeps) {
			pendingRegistrations.push(register)
			return
		}
		compatDeps.registerElementType(name, {
			container: options.container ?? false,
			containerStyles: options.container ?? false,
			layout: options.layout,
			styleKeys: options.styleKeys,
			make(node: any, _props: any) {
				const view = options.createView()
				view.__attachNode(node)
				node.view = view.createNativeView() ?? view.nativeView
				node.nsCompatView = view
			},
			applyProp(node: any, prop: string, value: any) {
				const view = node.nsCompatView as ViewBase | undefined
				if (!view) {
					return false
				}
				if (prop === 'style' && value && typeof value === 'object') {
					for (const key of Object.keys(value)) {
						view.style.setProp(key, value[key])
					}

					return true
				}
				if (prop === 'className') {
					view.className = String(value ?? '')
					compatDeps!.applyClassName(node, value)
					return true
				}
				if (prop === 'accessible' || prop.startsWith('accessibility')) {
					compatDeps!.applyAccessibility(node, prop, value)
					return true
				}
				const table = (Object.getPrototypeOf(view) as any).__propertyTable ?? {}
				if (table[prop]) {
					;(view as any)[prop] = value
					return true
				}
				return prop === 'id' || value === undefined
			},
			destroy(node: any) {
				;(node.nsCompatView as any)?.dispose?.()
				node.nsCompatView = undefined
			},
		})
	}
	register()
}
