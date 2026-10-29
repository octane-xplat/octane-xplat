import Gtk from 'gi://Gtk?version=4.0'
import GObject from 'gi://GObject'

type Bag = Record<string, any>
type Binding = { kind: 'state' | 'property'; id: number; value: boolean | number }
const previous = new WeakMap<object, Map<string, Binding>>()
const integer = (value: number) => {
	const boxed = new GObject.Value()
	boxed.init(GObject.TYPE_INT)
	boxed.set_int(value)
	return boxed
}
function inputState(value: unknown): Bag {
	if (typeof value === 'object' && value !== null) return value as Bag
	switch (value) {
		case 'disabled':
			return { disabled: true }
		case 'selected':
			return { selected: true }
		case 'checked':
			return { checked: true }
		case 'unchecked':
			return { checked: false }
		default:
			return {}
	}
}
/** Apply after the complete prop bag so sensitivity/editability and metadata
 * observe the same generation. GTK's optional booleans/tristates use G_TYPE_INT,
 * while ordinary booleans and boolean properties use G_TYPE_BOOLEAN. */
export function syncAccessibilityState(view: any, props: Bag) {
	const state = inputState(props.accessibilityState)
	const before = previous.get(view) ?? new Map<string, Binding>()
	const next = new Map<string, Binding>()
	const add = (
		key: string,
		id: number,
		value: boolean | number | undefined,
		kind: Binding['kind'] = 'state',
	) => {
		if (value !== undefined) next.set(key, { kind, id, value })
	}
	const sensitive = view.is_sensitive()
	if (state.disabled != null || before.has('disabled'))
		add('disabled', Gtk.AccessibleState.DISABLED, state.disabled === true || !sensitive)
	if (state.busy != null) add('busy', Gtk.AccessibleState.BUSY, Boolean(state.busy))
	if (state.hidden != null || props.accessible != null || before.has('hidden'))
		add(
			'hidden',
			Gtk.AccessibleState.HIDDEN,
			state.hidden === true || props.accessible === false || !view.get_mapped(),
		)
	for (const key of ['selected', 'expanded', 'visited'] as const)
		if (state[key] != null) add(key, Gtk.AccessibleState[key.toUpperCase()], state[key] ? 1 : 0)
	for (const key of ['checked', 'pressed'] as const) {
		const value = state[key]
		if (value != null)
			add(
				key,
				Gtk.AccessibleState[key.toUpperCase()],
				value === 'mixed'
					? Gtk.AccessibleTristate.MIXED
					: value
						? Gtk.AccessibleTristate.TRUE
						: Gtk.AccessibleTristate.FALSE,
			)
	}
	if (state.checked == null && view instanceof Gtk.Switch && before.has('checked'))
		add(
			'checked',
			Gtk.AccessibleState.CHECKED,
			view.get_active() ? Gtk.AccessibleTristate.TRUE : Gtk.AccessibleTristate.FALSE,
		)
	if (state.invalid != null) {
		const value = state.invalid
		const invalid =
			value === 'grammar'
				? Gtk.AccessibleInvalidState.GRAMMAR
				: value === 'spelling'
					? Gtk.AccessibleInvalidState.SPELLING
					: value
						? Gtk.AccessibleInvalidState.TRUE
						: Gtk.AccessibleInvalidState.FALSE
		add('invalid', Gtk.AccessibleState.INVALID, invalid)
	}
	const nativeReadOnly =
		view instanceof Gtk.Entry || view instanceof Gtk.TextView ? !view.get_editable() : undefined
	const readOnly = state.readOnly
	add(
		'readOnly',
		Gtk.AccessibleProperty.READ_ONLY,
		readOnly != null ? Boolean(readOnly) || nativeReadOnly === true : nativeReadOnly,
		'property',
	)
	if (state.required != null)
		add('required', Gtk.AccessibleProperty.REQUIRED, Boolean(state.required), 'property')
	for (const [key, binding] of before) {
		if (next.has(key)) continue
		if (binding.kind === 'state') view.reset_state(binding.id)
		else view.reset_property(binding.id)
	}
	for (const binding of next.values()) {
		const value = typeof binding.value === 'number' ? integer(binding.value) : binding.value
		if (binding.kind === 'state') view.update_state([binding.id], [value])
		else view.update_property([binding.id], [value])
	}
	// Natural GTK state may change independently of the authored metadata.
	// Do not retain native restorations as active declarative overrides.
	if (state.disabled == null) next.delete('disabled')
	if (state.hidden == null && props.accessible == null) next.delete('hidden')
	if (state.checked == null) next.delete('checked')
	previous.set(view, next)
}

/** GTK 4.14 writes HIDDEN=false after emitting map, replacing declarative
 * exclusions set before first mount. Reapply after that native call returns;
 * read current props and cancel pending work when the node is disposed. */
export function bindAccessibilityMapping(view: any, getProps: () => Bag): () => void {
	let active = true
	const mapped = () => {
		Promise.resolve().then(() => {
			if (active && view.get_mapped()) syncAccessibilityState(view, getProps())
		})
	}
	const connection = view.connect('map', mapped)
	if (view.get_mapped()) mapped()
	return () => {
		active = false
		view.disconnect(connection)
	}
}
