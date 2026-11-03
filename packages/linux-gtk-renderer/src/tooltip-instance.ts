import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'

type Options = {
  interactionTarget?: any
  disabled?: boolean
  openDelay?: number
  closeDelay?: number
  placement?: 'top' | 'bottom' | 'left' | 'right'
  alignment?: 'start' | 'center' | 'end'
  offset?: number
  focusTrigger?: 'auto' | 'always' | 'never'
  touchTrigger?: 'auto' | 'tap' | 'none'
  controlledOpen?: boolean
  onShown?(): void
  onHidden?(): void
  onOpen(): void
  onClose(): void
}

/** A noninteractive native tooltip surface. UI content stays in its original
 * universal root through a portal into target; this object owns only GTK. */
function createTooltip(anchor: any, initial: Options) {
  if (!Gtk.AccessibleList) {
    throw new Error('GTK Tooltip requires GTK 4.14 or newer for accessible description references.')
  }
  const interaction = initial.interactionTarget ?? anchor
  let options = initial
  let disposed = false
  let opening: number | null = null
  let closing: number | null = null
  let tick: number | null = null
  let visible = false
  let touchInput = false
  let previousGeometry = ''
  let previousPlacement = ''
  let described: any = null
  const connections: Array<[any, number]> = []
  let scrollConnections: Array<[any, number]> = []
  const target = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    accessible_role: Gtk.AccessibleRole.TOOLTIP,
  })
  let popover: any
  let popoverClosed: number
  let presented = false

  const connect = (object: any, signal: string, handler: (...args: any[]) => unknown) =>
    connections.push([object, object.connect(signal, handler)])
  const clear = (kind: 'open' | 'close') => {
    const source = kind === 'open' ? opening : closing
    if (source !== null) {
      GLib.source_remove(source)
    }
    if (kind === 'open') {
      opening = null
    } else {
      closing = null
    }
  }
  const stopPositioning = () => {
    if (tick !== null) {
      anchor.remove_tick_callback(tick)
    }
    tick = null
    for (const [object, id] of scrollConnections) {
      object.disconnect(id)
    }
    scrollConnections = []
  }
  const hide = () => {
    const wasVisible = visible
    if (described) {
      described.reset_relation(Gtk.AccessibleRelation.DESCRIBED_BY)
    }
    described = null
    clear('open')
    clear('close')
    visible = false
    stopPositioning()
    if (popover.get_visible()) {
      popover.popdown()
    }
    if (wasVisible) {
      options.onHidden?.()
    }
  }
  const close = () => {
    if (!disposed) {
      hide()
      options.onClose()
    }
  }
  const open = () => {
    clear('open')
    clear('close')
    if (!disposed && !options.disabled) {
      options.onOpen()
    }
  }
  const enter = () => {
    clear('open')
    clear('close')
    if (disposed || options.disabled || touchInput) {
      return
    }
    opening = GLib.timeout_add(GLib.PRIORITY_DEFAULT, Math.max(0, options.openDelay ?? 500), () => {
      opening = null
      open()
      return false
    })
  }
  const leave = () => {
    clear('open')
    clear('close')
    if (disposed || options.controlledOpen === true) {
      return
    }
    closing = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      Math.max(0, options.closeDelay ?? 100),
      () => {
        closing = null
        close()
        return false
      },
    )
  }
  const motion = new Gtk.EventControllerMotion()
  connect(motion, 'enter', () => {
    touchInput = false
    enter()
  })
  connect(motion, 'leave', leave)
  interaction.add_controller(motion)
  const focus = new Gtk.EventControllerFocus()
  connect(focus, 'enter', () => {
    if (touchInput || options.focusTrigger === 'never') {
      return
    }
    if (
      options.focusTrigger === 'auto' &&
      !interaction.get_focusable() &&
      !(interaction instanceof Gtk.Editable) &&
      !(interaction instanceof Gtk.TextView) &&
      !(interaction instanceof Gtk.DropDown)
    ) {
      return
    }
    open()
  })
  connect(focus, 'leave', () => {
    if (options.controlledOpen !== true) {
      close()
    }
  })
  interaction.add_controller(focus)
  const touch = new Gtk.GestureClick()
  touch.set_touch_only(true)
  touch.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
  connect(touch, 'pressed', (_gesture, _presses, x, y) => {
    touchInput = true
    if (
      options.disabled ||
      options.touchTrigger === 'none' ||
      options.controlledOpen !== undefined
    ) {
      return
    }
    if ((options.touchTrigger ?? 'auto') === 'auto') {
      for (
        let widget = interaction.pick(x, y, 0) ?? interaction;
        widget;
        widget = widget.get_parent()
      ) {
        const action =
          widget instanceof Gtk.Button ||
          widget instanceof Gtk.Editable ||
          widget instanceof Gtk.TextView ||
          widget instanceof Gtk.DropDown ||
          [Gtk.AccessibleRole.BUTTON, Gtk.AccessibleRole.LINK].includes(
            widget.get_accessible_role(),
          )

        if (action) {
          return
        }

        if (widget === interaction) {
          break
        }
      }
    }
    if (visible) {
      close()
    } else {
      open()
    }
  })
  interaction.add_controller(touch)
  connect(anchor, 'unmap', close)
  if (interaction !== anchor) {
    connect(interaction, 'unmap', close)
  }
  const closed = () => {
    if (!visible || disposed || popover.get_visible()) {
      return
    }
    close()
  }
  const resetPopover = () => {
    if (popover) {
      popover.disconnect(popoverClosed)
      popover.set_child(null)
      popover.unparent()
    }
    popover = new Gtk.Popover({ autohide: false, has_arrow: true })
    popover.set_can_focus(false)
    popover.set_can_target(false)
    popover.set_child(target)
    popover.set_parent(anchor)
    popoverClosed = popover.connect('closed', closed)
    previousGeometry = ''
    previousPlacement = ''
  }
  resetPopover()

  const window = anchor.get_root()
  const keys = new Gtk.EventControllerKey()
  keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
  connect(keys, 'key-pressed', (_controller, key) => {
    touchInput = false
    if (key !== 65307 || disposed) {
      return false
    }
    const consume = visible
    close()
    return consume
  })
  window?.add_controller(keys)
  const present = () => {
    // Mason's layout manager allocates logical children only; the popup is
    // a native child outside that graph. Invalidate its cached allocation
    // when anchor bounds change before asking GTK to position it.
    const geometry = JSON.stringify(
      anchor.getBounds?.() ?? [anchor.get_width(), anchor.get_height()],
    )
    if (geometry !== previousGeometry) {
      previousGeometry = geometry
      popover.queue_resize()
    }
    const rect = { x: 0, y: 0, width: anchor.get_width(), height: anchor.get_height() }
    let offsetX = 0,
      offsetY = 0
    if (
      (options.alignment !== undefined && options.alignment !== 'center') ||
      options.offset !== undefined
    ) {
      const side = options.placement ?? 'top'
      const gap = options.offset ?? 8
      const horizontal = side === 'top' || side === 'bottom'
      const size = horizontal ? target.get_width() : target.get_height()
      const span = horizontal ? rect.width : rect.height
      const cross =
        options.alignment === 'start'
          ? size / 2
          : options.alignment === 'end'
            ? span - size / 2
            : span / 2

      rect.x += horizontal ? cross : side === 'left' ? 0 : rect.width
      rect.y += !horizontal ? cross : side === 'top' ? 0 : rect.height
      rect.width = rect.height = 0
      offsetX = horizontal ? 0 : side === 'left' ? -gap : gap
      offsetY = !horizontal ? 0 : side === 'top' ? -gap : gap
    }
    rect.x = Math.round(rect.x)
    rect.y = Math.round(rect.y)
    const placement = JSON.stringify([rect, offsetX, offsetY])
    if (placement !== previousPlacement) {
      previousPlacement = placement
      popover.set_pointing_to(new Gdk.Rectangle(rect))
      popover.set_offset(offsetX, offsetY)
    }
    popover.present()
  }
  const position = () => {
    const positions = {
      top: Gtk.PositionType.TOP,
      bottom: Gtk.PositionType.BOTTOM,
      left: Gtk.PositionType.LEFT,
      right: Gtk.PositionType.RIGHT,
    }
    popover.set_position(positions[options.placement ?? 'top'])
    if (visible) {
      present()
    }
  }
  const show = () => {
    if (disposed || options.disabled || visible || !anchor.get_mapped()) {
      return
    }

    // Hidden portal content is removed. GTK can retain an allocation for
    // that empty popup, so each opening gets a fresh native popup while
    // the portal target and interaction controllers keep their lifetime.
    if (presented) {
      resetPopover()
    }
    presented = true
    visible = true
    const recipient = (widget: any): any => {
      if (widget === popover) {
        return null
      }
      if (widget instanceof Gtk.Entry || widget instanceof Gtk.Button || widget.get_focusable()) {
        return widget
      }
      for (let child = widget.get_first_child(); child; child = child.get_next_sibling()) {
        const found = recipient(child)
        if (found) {
          return found
        }
      }
      return null
    }
    described = recipient(interaction) ?? interaction
    described.update_relation(
      [Gtk.AccessibleRelation.DESCRIBED_BY],
      [Gtk.AccessibleList.new_from_list([target])],
    )
    position()
    for (let parent = anchor.get_parent(); parent; parent = parent.get_parent()) {
      if (!(parent instanceof Gtk.ScrolledWindow)) {
        continue
      }

      for (const adjustment of [parent.hadjustment, parent.vadjustment]) {
        scrollConnections.push([adjustment, adjustment.connect('value-changed', close)])
      }
    }
    popover.popup()
    options.onShown?.()
    tick = anchor.add_tick_callback(() => {
      if (!visible || disposed) {
        tick = null
        return false
      }
      present()
      return true
    })
  }

  return {
    target,
    get popover() {
      return popover
    },
    configure(next: Options) {
      if (disposed) {
        return
      }
      options = next
      position()
      if (options.disabled) {
        close()
      }
    },
    show,
    hide: () => {
      if (!disposed) {
        hide()
      }
    },
    dispose() {
      if (disposed) {
        return
      }
      disposed = true
      hide()
      for (const [object, id] of connections) {
        object.disconnect(id)
      }
      interaction.remove_controller(motion)
      interaction.remove_controller(focus)
      interaction.remove_controller(touch)
      window?.remove_controller(keys)
      popover.disconnect(popoverClosed)
      popover.unparent()
    },
  }
}

export function bindTooltips(view: any): () => void {
  let disposed = false
  const sessions = new Set<ReturnType<typeof createTooltip>>()
  view.createTooltip = (options: Options) => {
    if (disposed) {
      return null
    }
    const session = createTooltip(view, options)
    sessions.add(session)
    const release = session.dispose
    session.dispose = () => {
      release()
      sessions.delete(session)
    }
    return session
  }
  return () => {
    disposed = true
    for (const session of sessions) {
      session.dispose()
    }
    sessions.clear()
  }
}
