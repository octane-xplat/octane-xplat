/** Host-neutral keyboard input. DOM KeyboardEvent and desktop adapter events satisfy this shape. */
export interface ShortcutEvent {
	/** Keyboard phase; adapters emit `keydown` or `keyup`. */
	readonly type: string
	/** Logical key, or `Unidentified` when the host cannot supply one. */
	readonly key: string
	/** Physical key name, such as `KeyK`; empty when unmapped. */
	readonly code: string
	/** Modifier states at dispatch time. */
	readonly altKey: boolean
	readonly ctrlKey: boolean
	readonly metaKey: boolean
	readonly shiftKey: boolean
	/** Whether the key is being held. */
	readonly repeat: boolean
	/** Whether text composition owns this input. */
	readonly isComposing: boolean
	/** Focused host object. */
	readonly target: object | null
	/** Current native-default cancellation state. */
	readonly defaultPrevented: boolean
	/** Cancel the native default where the host permits it. */
	preventDefault(): void
	/** Stop delivery to ancestor shortcut boundaries. */
	stopPropagation(): void
	/** Origin-first native ancestry, including the runtime boundary. */
	composedPath?(): object[]
}

/**
 * Controls whether a binding may run while focus is inside an editable element.
 *
 * - `"ignore-editable"` blocks the binding in `input`, `textarea`, `select`, and
 *   `contenteditable` targets.
 * - `"allow-in-editable"` always allows the binding.
 * - `"allow-if-meta"` allows the binding only while Ctrl or Meta is pressed.
 */
export type EditablePolicy = 'ignore-editable' | 'allow-in-editable' | 'allow-if-meta'

/** Keyboard event phase used for bindings and recording. */
export type KeyEventType = 'keydown' | 'keyup'

/** Category of a shortcut reservation in a blocklist. */
export type ShortcutBlocklistCategory = 'browser' | 'os'

/** A browser family that may own a browser-level shortcut. */
export type ShortcutBrowser = 'chrome' | 'edge' | 'firefox' | 'safari'

/** Platform associated with a shortcut reservation. */
export type ShortcutPlatform = 'mac' | 'windows' | 'linux' | 'other'

/** Metadata describing a shortcut that should be reserved by an app policy. */
export type ShortcutBlocklistEntry = {
	/** Combo expression such as `"Mod+W"`. Blocklist entries cannot be sequences. */
	combo: string

	/** Whether the shortcut belongs to a browser or the operating system. */
	category: ShortcutBlocklistCategory

	/** Browser family associated with a browser-level entry, when known. */
	browser?: ShortcutBrowser

	/** Platform associated with the entry, when it is platform-specific. */
	platform?: ShortcutPlatform
}

/** Readonly blocklist accepted by {@link ShortcutOptions}. */
export type ShortcutBlocklist = readonly ShortcutBlocklistEntry[]

/** Structured issue returned when a shortcut cannot pass blocklist validation. */
export type ShortcutValidationError =
	| {
			/** The expression could not be parsed as a combo. */
			code: 'invalid-shortcut'
			combo: string
			error: Error
	  }
	| {
			/** The expression matched a configured blocklist entry. */
			code: 'shortcut-blocked'
			combo: string
			canonicalCombo: string
			category: ShortcutBlocklistCategory
			browser?: ShortcutBrowser
			platform?: ShortcutPlatform
	  }

/** Result returned by {@link ShortcutRuntime.validateShortcut}. */
export type ShortcutValidationResult =
	| {
			valid: true
			combo: string
			canonicalCombo: string
	  }
	| {
			valid: false
			combo: string
			canonicalCombo?: string
			errors: readonly ShortcutValidationError[]
	  }

/** Options for creating a shortcut runtime. */
export type ShortcutOptions = {
	/**
	 * Event boundary for the runtime.
	 *
	 * Use a Document, DOM element, AppKit NSView, GTK widget, or attached WinUI
	 * element. A NativeScript view is unwrapped to its nativeViewProtected.
	 * Dispose the runtime before releasing its target.
	 */
	target: object

	/** Platform used to resolve Mod and platform reservations. Defaults to the active host. */
	platform?: ShortcutPlatform

	/**
	 * Shortcuts reserved by the browser or operating system.
	 *
	 * Browser entries call `preventDefault()` for matching `keydown` events within
	 * the runtime boundary when the browser delivers the event to the page.
	 * Operating-system entries are used by {@link ShortcutRuntime.validateShortcut}
	 * but cannot be intercepted by page JavaScript.
	 *
	 * Blocklist entries do not reject application bindings automatically. Use
	 * `validateShortcut` when a downstream app wants to enforce its own policy.
	 */
	blocklist?: ShortcutBlocklist

	/**
	 * Time window, in milliseconds, before an in-progress sequence expires.
	 *
	 * @defaultValue `1000`
	 */
	sequenceTimeout?: number

	/**
	 * Default editable-target policy for bindings that do not override it.
	 *
	 * @defaultValue `"ignore-editable"`
	 */
	editablePolicy?: EditablePolicy

	/**
	 * Returns the active scopes in precedence order, from highest to lowest.
	 *
	 * The runtime always appends the `"root"` scope after the returned scopes.
	 */
	getActiveScopes?: () => Iterable<string>

	/**
	 * Filters matched candidates after `when` evaluation but before conflict
	 * resolution and event consumption.
	 *
	 * Return `false` to make a candidate ineligible while still allowing a lower
	 * priority eligible candidate to win.
	 *
	 * Keep this callback side-effect-free. It is also evaluated by
	 * {@link ShortcutRuntime.explain}.
	 */
	canDispatch?: (candidate: ShortcutCandidate) => boolean

	/**
	 * Receives errors thrown by candidate guards, handlers, or recording
	 * callbacks.
	 *
	 * When omitted, errors are rethrown asynchronously.
	 */
	onError?: (error: unknown, info: ErrorInfo) => void
}

/** Match data passed to a winning shortcut handler. */
export type ShortcutMatch = {
	/** Generated identifier for the winning binding. */
	bindingId: string

	/**
	 * Canonical combo expression for the binding's first step.
	 *
	 * For sequence bindings, use `sequence` to read the full expression.
	 */
	combo: string

	/** Canonical full sequence expression when the winning binding is a sequence. */
	sequence?: string

	/** Normalized keyboard event data for the winning event. */
	event: NormalizedKeyEvent

	/**
	 * Evaluation context for `when` clauses and handlers.
	 *
	 * User-defined context is available both under `context` and at its original
	 * top-level keys, alongside the built-in `event`, `scope`, and `runtime`
	 * namespaces.
	 */
	context: Record<string, unknown>

	/** Active scope that selected this binding. */
	matchedScope: string
}

/**
 * Runs when a binding wins dispatch.
 *
 * Exceptions are routed to `ShortcutOptions.onError`.
 */
export type ShortcutHandler = (match: ShortcutMatch) => void

/** Disposable handle returned when a binding is registered. */
export type BindingHandle = {
	/** Generated identifier for the binding. */
	id: string

	/**
	 * Removes the binding.
	 *
	 * @returns `true` when the binding existed and was removed.
	 */
	dispose(): boolean
}

/** Metadata describing an error reported by the runtime. */
export type ErrorInfo = {
	/** Runtime phase that produced the error. */
	phase: 'canDispatch' | 'handler' | 'recording'

	/** Binding identifier when the error came from candidate dispatch or a handler. */
	bindingId?: string

	/** Event being processed when the error occurred, when available. */
	event?: NormalizedKeyEvent
}

/** Options for temporarily recording shortcut expressions from user input. */
export type RecordOptions = {
	/**
	 * Keyboard event phase to capture.
	 *
	 * @defaultValue `"keydown"`
	 */
	eventType?: KeyEventType

	/**
	 * Idle timeout, in milliseconds, before the recording auto-finishes.
	 *
	 * @defaultValue `ShortcutOptions.sequenceTimeout`
	 */
	timeout?: number

	/**
	 * Prevents existing bindings from firing while recording.
	 *
	 * @defaultValue `true`
	 */
	suppressHandlers?: boolean

	/**
	 * Calls `preventDefault()` and `stopPropagation()` on captured events.
	 *
	 * @defaultValue `false`
	 */
	consumeEvents?: boolean

	/**
	 * Recording boundary.
	 *
	 * Defaults to the runtime target. Only events delivered within that runtime
	 * boundary can be recorded, even when this target is broader.
	 */
	target?: object

	/**
	 * Receives the latest snapshot each time a step is captured.
	 *
	 * Errors thrown here are reported through `ShortcutOptions.onError` and do
	 * not stop the recording.
	 */
	onUpdate?: (recording: ShortcutRecording) => void
}

/** Active recording session returned by {@link ShortcutRuntime.record}. */
export type RecordingSession = {
	/**
	 * Finishes the recording immediately.
	 *
	 * @returns The final recording snapshot.
	 */
	stop(): ShortcutRecording

	/**
	 * Cancels the recording.
	 *
	 * The `finished` promise rejects with an `AbortError`.
	 */
	cancel(): void

	/** Resolves when recording finishes or rejects when it is cancelled. */
	finished: Promise<ShortcutRecording>
}

/** Immutable snapshot of a recorded shortcut expression. */
export type ShortcutRecording = {
	/** Canonical expressions for each recorded step. */
	steps: readonly string[]

	/** `steps` joined with spaces. */
	expression: string

	/** Event phase that was recorded. */
	eventType: KeyEventType
}

/**
 * Shared availability contract for commands or other external actions.
 *
 * `@octane-xplat/shortcuts` uses this shape to answer whether something is currently
 * available under the active scopes and runtime context. The contract is
 * structural, so external command objects may include any additional fields.
 */
export interface RunnableInput {
	/**
	 * Scope or scopes where this item is eligible.
	 *
	 * @defaultValue `"root"`
	 */
	scope?: string | readonly string[]

	/**
	 * Boolean expression evaluated against the runtime context.
	 *
	 * A falsy result means "not available".
	 */
	when?: string
}

/**
 * Object-form binding definition accepted by {@link ShortcutRuntime.bind} and
 * {@link BindingSet.replace}.
 */
export type BindingSpec = RunnableInput & {
	/**
	 * Canonical combo expression such as `"Mod+k"` or `"Shift+ArrowDown"`.
	 *
	 * Exactly one of `combo` or `sequence` is required.
	 */
	combo?: string

	/**
	 * Whitespace-separated sequence expression such as `"g g"` or `"g h"`.
	 *
	 * Exactly one of `combo` or `sequence` is required.
	 */
	sequence?: string

	/**
	 * Limits this binding to keyboard events originating within this element's
	 * subtree.
	 *
	 * Every step of a sequence must occur within the element. When otherwise
	 * equivalent bindings match, the binding with the narrower matching element
	 * boundary wins.
	 */
	within?: object

	/**
	 * Keyboard event phase that must match this binding.
	 *
	 * @defaultValue `"keydown"`
	 */
	keyEvent?: KeyEventType

	/**
	 * Higher numbers win before lower numbers when multiple bindings match.
	 *
	 * @defaultValue `0`
	 */
	priority?: number

	/**
	 * Binding-specific editable-target policy.
	 *
	 * Use `"inherit"` to keep the runtime default.
	 *
	 * @defaultValue `"inherit"`
	 */
	editablePolicy?: 'inherit' | EditablePolicy

	/**
	 * Calls `preventDefault()` when this binding wins.
	 *
	 * @defaultValue `false`
	 */
	preventDefault?: boolean

	/**
	 * Calls `stopPropagation()` when this binding wins.
	 *
	 * @defaultValue `false`
	 */
	stopPropagation?: boolean

	/**
	 * Allows repeated `keydown` events to match while a key is held.
	 *
	 * @defaultValue `false`
	 */
	allowRepeat?: boolean

	/** Handler invoked when the binding wins dispatch. */
	handler: ShortcutHandler
}

/**
 * Input accepted by {@link ShortcutRuntime.bind}.
 *
 * Use the string shorthand for a simple combo plus handler, or
 * {@link BindingSpec} for sequences, scopes, `when` clauses, or dispatch
 * options.
 */
export type BindingInput = string | BindingSpec

/** Normalized keyboard event shape exposed by handlers, traces, and errors. */
export type NormalizedKeyEvent = {
	/** Normalized event phase. */
	type: KeyEventType

	/** Canonical key name used for matching, such as `"k"` or `"Escape"`. */
	key: string

	/** Physical key name in the KeyboardEvent.code vocabulary; empty if unmapped. */
	code: string

	/** Modifier state captured from the native event. */
	modifiers: {
		alt: boolean
		ctrl: boolean
		meta: boolean
		shift: boolean
	}

	/** Whether the host marked the event as a repeat. */
	repeat: boolean

	/** Whether the event was emitted while IME composition was active. */
	composing: boolean

	/** Original event target. */
	target: object | null

	/** Host-neutral event with cancellation methods. */
	nativeEvent: ShortcutEvent
}

/** Candidate passed to {@link ShortcutOptions.canDispatch}. */
export type ShortcutCandidate = {
	/** Generated identifier for the matched binding. */
	bindingId: string

	/** Canonical combo expression for the binding's first step. */
	combo: string

	/** Canonical full sequence expression when the binding is a sequence. */
	sequence?: string

	/** Normalized keyboard event data for the matched event. */
	event: NormalizedKeyEvent

	/**
	 * Evaluation context built with the same namespaces available to `when`
	 * clauses.
	 */
	context: Record<string, unknown>

	/** Active scope that selected this candidate. */
	matchedScope: string

	/** Handler registered on the candidate binding. */
	handler: ShortcutHandler
}

/** Snapshot of a registered binding. */
export type BindingSnapshot = {
	/** Generated identifier for the binding. */
	id: string

	/** Binding shape used by dispatch. */
	type: 'combo' | 'sequence'

	/** Canonical combo or sequence expression. */
	expression: string

	/** Scopes where the binding is eligible. */
	scopes: readonly string[]

	/** Priority used for conflict resolution. */
	priority: number

	/** Keyboard phase matched by this binding. */
	keyEvent: KeyEventType

	/** Original `when` source, when present. */
	whenSource?: string

	/** Element boundary that limits this binding, when present. */
	within?: object
}

/** Snapshot of an in-progress sequence match. */
export type SequenceSnapshot = {
	/** Binding identifier that owns this state. */
	bindingId: string

	/** Active scope that matched the sequence so far. */
	matchedScope: string

	/** Zero-based index of the next step that must match. */
	stepIndex: number

	/** Epoch time, in milliseconds, when this sequence state expires. */
	expiresAt: number
}

/** Result of evaluating a `when` clause during tracing. */
export type WhenTrace = {
	/** Original `when` source. */
	source: string

	/** Boolean result after evaluation. */
	result: boolean

	/** Evaluation error, when the clause threw and was treated as `false`. */
	error?: Error
}

/** Result of evaluating {@link ShortcutOptions.canDispatch} during tracing. */
export type CanDispatchTrace = {
	/** Boolean result returned by the candidate guard. */
	result: boolean

	/** Evaluation error, when the guard threw and was treated as `false`. */
	error?: Error
}

/** Per-binding trace entry returned by {@link ShortcutRuntime.explain}. */
export type CandidateTrace = {
	/** Binding identifier being evaluated. */
	bindingId: string

	/** Scope that matched before later rejection, when one existed. */
	matchedScope?: string

	/** Whether the combo or sequence matcher itself matched. */
	matcherMatched: boolean

	/** `when`-clause result when one was evaluated. */
	when?: WhenTrace

	/** Candidate guard result when `canDispatch` was evaluated. */
	canDispatch?: CanDispatchTrace

	/** Reason the candidate did not win dispatch. */
	rejectedBy?:
		| 'boundary'
		| 'recording'
		| 'paused'
		| 'editable-policy'
		| 'scope'
		| 'matcher'
		| 'when'
		| 'can-dispatch'
		| 'conflict'
}

/** Full trace for a single keyboard event evaluation. */
export type EvaluationTrace = {
	/** Normalized event that was evaluated. */
	event: NormalizedKeyEvent

	/** Browser blocklist entries matched by this event, when any. */
	blockedBy?: readonly ShortcutBlocklistEntry[]

	/** Trace entries for each registered binding. */
	candidates: CandidateTrace[]

	/** Winning binding identifier, when one matched. */
	winner?: string
}

/**
 * Mutable collection of bindings owned by one runtime.
 *
 * Use a binding set when your app derives shortcuts from user settings,
 * command metadata, or other mutable state and must replace them as one unit.
 */
export type BindingSet = {
	/**
	 * Replaces the set's current bindings atomically.
	 *
	 * The next bindings are validated before the runtime swaps them into place.
	 * When any next binding is invalid, the set remains unchanged.
	 *
	 * Successful replacement removes any in-progress sequence state owned by the
	 * previous set contents.
	 *
	 * @throws When the binding set or its runtime is disposed, or when a binding
	 *   definition is invalid.
	 */
	replace(next: readonly BindingSpec[]): void

	/** Removes all bindings currently owned by the set. Equivalent to `replace([])`. */
	clear(): void

	/**
	 * Returns this set's current bindings in entry order.
	 *
	 * Returns `[]` after the binding set or its runtime is disposed.
	 */
	getBindings(): readonly BindingSnapshot[]

	/**
	 * Removes this set's bindings and permanently disposes the set.
	 *
	 * Safe to call more than once.
	 * After disposal, `replace` and `clear` throw.
	 */
	dispose(): void
}

/** Runtime API returned by {@link createShortcuts}. */
export type ShortcutRuntime = {
	/**
	 * Registers a combo or sequence binding.
	 *
	 * @param input Binding shorthand or full binding descriptor.
	 * @param handler Handler used with the string shorthand.
	 * @returns A handle that can later remove the binding.
	 * @throws When the runtime is disposed or the binding definition is invalid.
	 */
	bind(input: BindingInput, handler?: ShortcutHandler): BindingHandle

	/**
	 * Registers a combo or sequence binding limited to an element subtree.
	 *
	 * This accepts the same binding inputs as {@link bind}. The explicit element
	 * overrides `within` when object-form input already declares one.
	 */
	bindWithin(within: object, input: BindingInput, handler?: ShortcutHandler): BindingHandle

	/**
	 * Checks a combo against the configured blocklist without registering it.
	 *
	 * The result contains machine-readable issues only; downstreams own any
	 * user-facing copy and policy decisions.
	 */
	validateShortcut(combo: string): ShortcutValidationResult

	/**
	 * Removes a binding.
	 *
	 * @returns `true` when the binding existed and was removed.
	 */
	unbind(binding: BindingHandle | string): boolean

	/**
	 * Creates a mutable binding collection that can be replaced atomically.
	 *
	 * This is useful for derived or user-configurable shortcuts that must be
	 * rebound as one unit.
	 *
	 * Repeated replacements keep the set's relative precedence stable against
	 * unrelated direct bindings or other binding sets.
	 *
	 * @throws When the runtime is disposed.
	 */
	createBindingSet(): BindingSet

	/**
	 * Pauses dispatch.
	 *
	 * When `scope` is omitted, all scopes pause. Pause calls are reference-counted
	 * and should be balanced with `resume`.
	 */
	pause(scope?: string): void

	/**
	 * Resumes dispatch after a matching {@link pause} call.
	 *
	 * When `scope` is omitted, it resumes global pauses.
	 */
	resume(scope?: string): void

	/**
	 * Starts recording a shortcut expression.
	 *
	 * Only one recording session may be active at a time.
	 *
	 * @throws When the runtime is disposed or another recording session is active.
	 */
	record(options?: RecordOptions): RecordingSession

	/**
	 * Sets a user context value at a dotted path.
	 *
	 * Reserved top-level namespaces are `context`, `event`, `scope`, and
	 * `runtime`.
	 */
	setContext(path: string, value: unknown): void

	/** Reads a user context value from a dotted path. */
	getContext(path: string): unknown

	/**
	 * Deletes a user context value from a dotted path.
	 *
	 * @returns `true` when a value was removed.
	 */
	deleteContext(path: string): boolean

	/** Applies multiple dotted-path context updates in one pass. */
	batchContext(update: Record<string, unknown>): void

	/**
	 * Returns whether an external action is currently available.
	 *
	 * This evaluates only shared availability concerns such as `scope` and
	 * `when`. It ignores keyboard-specific matching and dispatch behavior such as
	 * pause state, editable-target policy, repeat handling, and event
	 * consumption. The input is structural, so extra fields are ignored.
	 *
	 * @throws When `when` contains invalid syntax.
	 */
	isAvailable(input: RunnableInput): boolean

	/** Returns a snapshot of all registered bindings in runtime precedence order. */
	getBindings(): readonly BindingSnapshot[]

	/** Returns non-expired sequence states. */
	getActiveSequences(): readonly SequenceSnapshot[]

	/**
	 * Explains how the runtime would evaluate a keyboard event.
	 *
	 * This does not mutate runtime state or invoke handlers.
	 */
	explain(event: ShortcutEvent): EvaluationTrace

	/**
	 * Removes listeners, clears state, and rejects any active recording.
	 *
	 * Safe to call more than once.
	 */
	dispose(): void
}
