// Minimal ambient declarations for the GJS `gi://` introspection imports this
// package uses. These cover the members the driver and host touch — they are
// a hand-maintained subset, not generated GIR types. Members not declared
// here resolve through the namespace's index signature as `any`. Replace with
// generated typings (e.g. @girs/gtk-4.0) when the renderer grows beyond the
// starter surface; the inventory note lists this as a tracked limitation.
declare module 'gi://Gtk?version=4.0' {
	namespace Gtk {
		const AccessibleRelation: { LABELLED_BY: number; [key: string]: number }
		const MAJOR_VERSION: number
		const MINOR_VERSION: number
		const MICRO_VERSION: number

		const STYLE_PROVIDER_PRIORITY_APPLICATION: number

		enum Orientation {
			HORIZONTAL = 0,
			VERTICAL = 1,
		}

		enum Overflow {
			VISIBLE = 0,
			HIDDEN = 1,
		}

		enum Align {
			FILL = 0,
			START = 1,
			END = 2,
			CENTER = 3,
			BASELINE_FILL = 4,
			BASELINE_CENTER = 5,
		}

		enum PolicyType {
			ALWAYS = 0,
			AUTOMATIC = 1,
			NEVER = 2,
			EXTERNAL = 3,
		}

		// Declared as a loose map — the numeric values come from the GI
		// namespace at runtime and are not stable enough to pin here.
		const AccessibleRole: {
			BUTTON: number
			LINK: number
			IMG: number
			LABEL: number
			SLIDER: number
			PROGRESS_BAR: number
			CHECKBOX: number
			SWITCH: number
			[key: string]: number
		}

		const AccessibleProperty: {
			LABEL: number
			[key: string]: number
		}

		const InputPurpose: {
			FREE_FORM: number
			DIGITS: number
			NUMBER: number
			PHONE: number
			URL: number
			EMAIL: number
			PASSWORD: number
			PIN: number
			[key: string]: number
		}

		const InputHints: {
			NONE: number
			NO_SPELLCHECK: number
			[key: string]: number
		}

		const AccessibleList: any
		const AccessibleRelation: { DESCRIBED_BY: number }
		const Popover: any
		const EventControllerMotion: any
		const PositionType: { TOP: number; BOTTOM: number; LEFT: number; RIGHT: number }
		const Picture: any
		const ContentFit: { FILL: number; CONTAIN: number; COVER: number; SCALE_DOWN: number }
		const AccessibleState: { HIDDEN: number; [key: string]: number }
		const AccessibleTristate: { FALSE: number; TRUE: number; MIXED: number }
		const AccessibleInvalidState: { FALSE: number; TRUE: number; GRAMMAR: number; SPELLING: number }
		class Widget {
			connect(signal: string, handler: (...args: any[]) => unknown): number
			disconnect(id: number): void
			get_parent(): Widget | null
			unparent(): void
			get_first_child(): Widget | null
			get_next_sibling(): Widget | null
			insert_before(parent: Widget, sibling: Widget | null): void
			insert_after(parent: Widget, sibling: Widget | null): void
			set_layout_manager(manager: LayoutManager): void
			measure(orientation: Orientation, forSize: number): [number, number, number, number]
			size_allocate(
				allocation: { x: number; y: number; width: number; height: number },
				baseline: number,
			): void
			queue_resize(): void
			add_controller(controller: EventController): void
			remove_controller(controller: EventController): void
			add_css_class(name: string): void
			remove_css_class(name: string): void
			get_style_context(): StyleContext
			static get_default_direction(): TextDirection
			set_size_request(width: number, height: number): void
			get_size_request(): [number, number]
			set_name(name: string): void
			get_name(): string | null
			set_sensitive(sensitive: boolean): void
			set_visible(visible: boolean): void
			set_hexpand(expand: boolean): void
			set_vexpand(expand: boolean): void
			set_halign(align: Align): void
			set_valign(align: Align): void
			set_margin_top(margin: number): void
			set_margin_bottom(margin: number): void
			set_margin_start(margin: number): void
			set_margin_end(margin: number): void
			set_opacity(opacity: number): void
			set_focusable(focusable: boolean): void
			set_tooltip_text(text: string | null): void
			/** Non-varargs GtkAccessible property/value-array binding. */
			update_property(properties: number[], values: unknown[]): void
			reset_property(property: number): void
			reset_relation(relation: number): void
			grab_focus(): boolean
			pick(x: number, y: number, flags: number): Widget | null
			compute_bounds(target: Widget): [boolean, unknown]
			visible: boolean
			sensitive: boolean
			hexpand: boolean
			vexpand: boolean
			halign: Align
			valign: Align
			opacity: number
			readonly has_focus: boolean;
			[key: string]: any
		}

		class Box extends Widget {
			constructor(props?: { orientation?: Orientation; spacing?: number; accessible_role?: number })
			prepend(child: Widget): void
			append(child: Widget): void
			insert_child_after(child: Widget, sibling: Widget | null): void
			remove(child: Widget): void
			orientation: Orientation
			spacing: number
			homogeneous: boolean
		}

		class Fixed extends Widget {
			put(child: Widget, x: number, y: number): void
			move(child: Widget, x: number, y: number): void
			remove(child: Widget): void
		}

		class Grid extends Widget {
			attach(child: Widget, column: number, row: number, width: number, height: number): void
			attach_next_to(
				child: Widget,
				sibling: Widget | null,
				side: number,
				width: number,
				height: number,
			): void
			remove(child: Widget): void
			column_spacing: number
			row_spacing: number
		}

		class Label extends Widget {
			constructor(props?: { label?: string; xalign?: number })
			label: string
			xalign: number
			wrap: boolean
			ellipsize: number
			selectable: boolean
		}

		class Button extends Widget {
			constructor(props?: { label?: string })
			label: string
			set_label(label: string): void
		}

		class Entry extends Widget {
			get_text(): string
			set_text(text: string): void
			get_position(): number
			set_position(position: number): void
			select_region(start: number, end: number): void
			get_selection_bounds(): [boolean, number, number]
			placeholder_text: string
			visibility: boolean
		}

		class Switch extends Widget {
			active: boolean
		}

		class Adjustment {
			get_value(): number
			set_value(value: number): void
			get_lower(): number
			get_upper(): number
			get_page_size(): number
			constructor(props?: {
				lower?: number
				upper?: number
				step_increment?: number
				value?: number
			})
			value: number
			lower: number
			upper: number
			connect(signal: string, handler: (...args: any[]) => unknown): number
			disconnect(id: number): void
		}

		class Scale extends Widget {
			constructor(props?: { orientation?: Orientation; adjustment?: Adjustment })
			adjustment: Adjustment
			set_range(min: number, max: number): void
			get_value(): number
			set_value(value: number): void
		}

		class ProgressBar extends Widget {
			fraction: number
			set_fraction(fraction: number): void
		}

		class Spinner extends Widget {
			spinning: boolean
			start(): void
			stop(): void
		}

		class ScrolledWindow extends Widget {
			constructor(props?: { hscrollbar_policy?: PolicyType; vscrollbar_policy?: PolicyType })
			get_hadjustment(): Adjustment
			get_vadjustment(): Adjustment
			set_child(child: Widget | null): void
			get_child(): Widget | null
			hscrollbar_policy: PolicyType
			vscrollbar_policy: PolicyType
			hadjustment: Adjustment
			vadjustment: Adjustment
		}

		class LayoutManager {
			[key: string]: any
		}

		class EventController {
			[key: string]: any
		}

		class GestureClick extends EventController {
			constructor()
		}

		class GestureDrag extends EventController {
			constructor()
		}

		class GestureSwipe extends EventController {
			constructor()
		}

		class GestureLongPress extends EventController {
			constructor()
		}

		class EventControllerFocus extends EventController {
			constructor()
		}

		const EventControllerLegacy: any
		const PropagationPhase: { CAPTURE: number }
		class EventControllerKey extends EventController {
			constructor()
		}

		// Legacy is required for cancellable key-up: EventControllerKey's
		// ::key-released signal is void. Used by packages/shortcuts.
		class EventControllerLegacy extends EventController {
			constructor()
			set_propagation_phase(phase: number): void
		}

		const PropagationPhase: {
			NONE: number
			CAPTURE: number
			BUBBLE: number
			TARGET: number
			[key: string]: number
		}

		// Editable is a GTK4 interface; class-declared for instanceof checks.
		class Editable extends Widget {}
		class TextView extends Widget {}
		class DropDown extends Widget {}

		class CssProvider {
			constructor()
			load_from_string(css: string): void
			load_from_data(data: string): void
			connect(signal: string, handler: (...args: any[]) => unknown): number
			disconnect(id: number): void
		}

		class StyleContext {
			add_provider(provider: CssProvider, priority: number): void
			remove_provider(provider: CssProvider): void
		}

		enum Justification {
			LEFT = 0,
			RIGHT = 1,
			CENTER = 2,
			FILL = 3,
		}

		enum StateFlags {
			NORMAL = 0,
			ACTIVE = 1,
			PRELIGHT = 2,
			SELECTED = 4,
			INSENSITIVE = 8,
			INCONSISTENT = 16,
			FOCUSED = 32,
			BACKDROP = 64,
			DIR_LTR = 128,
			DIR_RTL = 256,
			LINK = 512,
			VISITED = 1024,
			CHECKED = 2048,
			DROP_ACTIVE = 4096,
			FOCUS_VISIBLE = 8192,
			FOCUS_WITHIN = 16384,
		}

		enum TextDirection {
			NONE = 0,
			LTR = 1,
			RTL = 2,
		}

		// GTK 4.20+; absent on older introspection data.
		const InterfaceColorScheme: {
			LIGHT: number
			DARK: number
			[key: string]: number
		}

		class Settings {
			static get_default(): Settings | null
			connect(signal: string, handler: (...args: any[]) => unknown): number
			disconnect(id: number): void
			[key: string]: any
		}

		class Window extends Widget {
			set_child(child: Widget | null): void
			present(): void
			close(): void
			title: string
		}

		class ApplicationWindow extends Window {
			constructor(props?: {
				application?: Application
				title?: string
				default_width?: number
				default_height?: number
			})
		}

		class Application {
			constructor(props?: { application_id?: string; flags?: number })
			connect(signal: string, handler: (...args: any[]) => unknown): number
			run(argv: string[] | null): number
			quit(): void
			hold(): void
			release(): void
		}
	}

	export default Gtk
}

declare module 'gi://GLib' {
	namespace GLib {
		const Bytes: any
		function base64_decode(value: string): Uint8Array
		const MAJOR_VERSION: number
		const MINOR_VERSION: number
		const MICRO_VERSION: number
		const PRIORITY_DEFAULT: number
		const PRIORITY_DEFAULT_IDLE: number
		const PRIORITY_HIGH: number
		const SOURCE_CONTINUE: boolean
		const SOURCE_REMOVE: boolean
		function timeout_add(priority: number, interval: number, fn: () => boolean): number
		function idle_add(priority: number, fn: () => boolean): number
		function source_remove(id: number): boolean
		function get_monotonic_time(): number
		function getenv(name: string): string | null
		function build_filenamev(parts: string[]): string
		function path_get_dirname(path: string): string
		function file_test(path: string, test: number): boolean
		const FileTest: { EXISTS: number; IS_DIR: number }
	}

	export default GLib
}

declare module 'gi://Gdk?version=4.0' {
	namespace Gdk {
		const EventType: {
			KEY_PRESS: number
			KEY_RELEASE: number
			[key: string]: number
		}

		const ModifierType: {
			SHIFT_MASK: number
			LOCK_MASK: number
			CONTROL_MASK: number
			ALT_MASK: number
			SUPER_MASK: number
			HYPER_MASK: number
			META_MASK: number
			[key: string]: number
		}

		function keyval_name(keyval: number): string | null
		function keyval_to_unicode(keyval: number): number

		const Texture: any
		class Rectangle {
			constructor(fields?: { x?: number; y?: number; width?: number; height?: number })
			x: number
			y: number
			width: number
			height: number
		}
	}

	export default Gdk
}

declare module 'gi://GObject' {
	namespace GObject {
		const Value: any
		const TYPE_INT: any
		/** GJS type registration — returns a constructible GObject class. */
		function registerClass(meta: any, klass?: any): any
	}

	export default GObject
}

declare module 'gi://Gio' {
	namespace Gio {
		const Cancellable: any
		const ApplicationFlags: {
			FLAGS_NONE: number
			NON_UNIQUE: number
			HANDLES_OPEN: number
			[key: string]: number
		}

		class File {
			static new_for_path(path: string): File
			static new_for_uri(uri: string): File
			query_exists(cancellable: unknown): boolean
			get_path(): string | null
			get_uri(): string
			[key: string]: any
		}
	}

	export default Gio
}

declare module 'gi://Gsk?version=4.0' {
	const Gsk: any
	export default Gsk
}

declare module 'gi://Graphene' {
	const Graphene: any
	export default Graphene
}

declare module 'gi://Soup?version=3.0' {
	const Soup: any
	export default Soup
}
