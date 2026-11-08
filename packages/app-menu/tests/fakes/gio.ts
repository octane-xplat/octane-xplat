// Minimal Gio fake for the GTK menubar adapter — records actions, accels,
// menu structure and window/app effects for assertions.

export class Variant {
  constructor(
    readonly kind: string,
    readonly value: unknown,
  ) {}
}

export class SimpleAction {
  stateful = false
  state: Variant | null = null
  enabled = true
  handlers = new Map<string, (...args: any[]) => unknown>()

  constructor(readonly name: string) {}

  static new(name: string, _parameterType: unknown): SimpleAction {
    return new SimpleAction(name)
  }

  static new_stateful(name: string, _parameterType: unknown, state: Variant): SimpleAction {
    const action = new SimpleAction(name)

    action.stateful = true
    action.state = state
    return action
  }

  connect(signal: string, handler: (...args: any[]) => unknown): number {
    this.handlers.set(signal, handler)
    return this.handlers.size
  }

  disconnect(id: number): void {
    void id
  }

  set_enabled(enabled: boolean): void {
    this.enabled = enabled
  }

  activate(...args: unknown[]): void {
    this.handlers.get('activate')?.(...args)
  }
}

export class MenuItem {
  attrs = new Map<string, unknown>()

  constructor(
    readonly label: string | null,
    readonly action: string | null,
  ) {}

  static new(label: string | null, action: string | null): MenuItem {
    return new MenuItem(label, action)
  }

  set_attribute_value(name: string, value: unknown): void {
    this.attrs.set(name, value)
  }
}

export class Menu {
  children: unknown[] = []

  append(label: string | null, action: string | null): void {
    this.children.push({ label, action })
  }

  append_item(item: MenuItem): void {
    this.children.push(item)
  }

  append_section(label: string | null, section: Menu): void {
    this.children.push({ sectionLabel: label, section })
  }

  append_submenu(label: string | null, submenu: Menu): void {
    this.children.push({ label, submenu })
  }
}

export class Application {
  static default: Application | null = null

  static get_default(): Application | null {
    return Application.default
  }

  actions = new Map<string, SimpleAction>()
  accels = new Map<string, string[]>()
  menubar: Menu | null = null
  activeWindow: any = null
  quitCalls = 0

  add_action(action: SimpleAction): void {
    this.actions.set(action.name, action)
  }

  remove_action(name: string): void {
    this.actions.delete(name)
  }

  set_accels_for_action(name: string, accels: string[]): void {
    this.accels.set(name, accels)
  }

  set_menubar(menu: Menu | null): void {
    this.menubar = menu
  }

  get_menubar(): Menu | null {
    return this.menubar
  }

  get_active_window(): any {
    return this.activeWindow
  }

  quit(): void {
    this.quitCalls++
  }
}

export default { Application, SimpleAction, Menu, MenuItem, Variant }
