/* global _GTypeQuery, _GtkLayoutManagerClass, cairo_rectangle_int_t, g_get_monotonic_time, g_object_new, g_object_ref_sink, g_object_unref, g_object_weak_ref, g_signal_connect, g_signal_emit_by_name, g_signal_handler_disconnect, g_type_query, g_type_register_static_simple, gtk_box_new, gtk_button_new_with_label, gtk_button_set_label, gtk_editable_get_position, gtk_editable_get_text, gtk_editable_set_position, gtk_editable_set_text, gtk_entry_new, gtk_init, gtk_label_get_text, gtk_label_new, gtk_label_set_text, gtk_layout_manager_get_type, gtk_widget_get_allocation, gtk_widget_get_first_child, gtk_widget_get_next_sibling, gtk_widget_get_parent, gtk_widget_grab_focus, gtk_widget_insert_before, gtk_widget_measure, gtk_widget_set_layout_manager, gtk_widget_size_allocate, gtk_widget_unparent, gtk_window_destroy, gtk_window_new, gtk_window_present, gtk_window_set_child, gtk_window_set_decorated, gtk_window_set_default_size, gtk_window_set_title, interop, mason_init, mason_node_compute_max_content, mason_node_compute_wh, mason_node_destroy, mason_node_get_unrounded_size, mason_node_layout_shallow, mason_node_new_node, mason_node_new_node_with_context, mason_node_set_children, mason_release, mason_style_set_box_size, mason_style_set_with_values */
// Experimental C binding adapter: intentionally only the slice's widget surface.
const t = interop.types
const write = (p, value) => {
  if (p) {
    new interop.Reference(t.int32, p).value = value
  }
}
const key = (p) => p?.toString()
export const stats = {
  measures: 0,
  allocations: 0,
  leafMeasures: 0,
  callbacks: 0,
  released: 0,
  nodes: 0,
  created: 0,
  finalized: 0,
}
const finalized = () => {
  stats.finalized++
}
const layouts = new Map()
const measureLeaf = (widget, kw, kh, _aw, _ah) => {
  stats.leafMeasures++
  const min = new Int32Array(1),
    nat = new Int32Array(1)
  gtk_widget_measure(widget, 0, -1, min, nat, null, null)
  const w = kw >= 0 ? kw : nat[0]
  gtk_widget_measure(widget, 1, Math.round(w), min, nat, null, null)
  const h = kh >= 0 ? kh : nat[0]
  const floats = new Float32Array([h, w])
  return new BigInt64Array(floats.buffer)[0]
}
const collect = (data, length) => {
  latestLayout = new Float32Array(interop.bufferFromData(data, Number(length) * 4)).slice()
  return null
}
let latestLayout
const syncChildren = (widget, layout) => {
  const children = []
  for (let c = gtk_widget_get_first_child(widget); c; c = gtk_widget_get_next_sibling(c)) {
    children.push(c)
  }
  const pointers = children.map((child) => layout.children.get(key(child)))
  const array = new BigUint64Array(pointers.map((p) => p.toBigInt()))
  mason_node_set_children(layout.engine, layout.root, array, array.length)
  return children
}
const layoutMeasure = (lm, widget, orientation, forSize, min, nat, mb, nb) => {
  stats.measures++
  const layout = layouts.get(key(widget))
  let value = 0
  if (layout) {
    syncChildren(widget, layout)
    mason_node_compute_max_content(layout.engine, layout.root)
    const width = new Float32Array(1),
      height = new Float32Array(1)
    mason_node_get_unrounded_size(layout.engine, layout.root, width, height)
    value = Math.ceil(orientation === 0 ? width[0] : height[0])
  }
  write(min, value)
  write(nat, value)
  write(mb, -1)
  write(nb, -1)
}
const layoutAllocate = (lm, widget, width, height) => {
  stats.allocations++
  const layout = layouts.get(key(widget))
  if (!layout) {
    return
  }
  mason_style_set_box_size(
    layout.engine,
    layout.root,
    1,
    width,
    1,
    height,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  )
  // Pointer wrappers are not assumed to have JavaScript identity.
  const children = syncChildren(widget, layout)
  mason_node_compute_wh(layout.engine, layout.root, width, height)
  mason_node_layout_shallow(layout.engine, layout.root, collect)
  layout.records = Array.from(latestLayout)
  mason_style_set_box_size(
    layout.engine,
    layout.root,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  )
  for (let i = 0; i < children.length; i++) {
    const off = (i + 1) * 22
    const [x, y, w, h] = latestLayout.slice(off + 1, off + 5)
    const rect = new cairo_rectangle_int_t()
    rect.x = Math.round(x)
    rect.y = Math.round(y)
    rect.width = Math.round(w)
    rect.height = Math.round(h)
    gtk_widget_size_allocate(children[i], rect, -1)
  }
}
const classInit = (p) => {
  const klass = new interop.Reference(_GtkLayoutManagerClass, p).value
  klass.measure = interop.callback(layoutMeasure, {
    returns: t.void,
    args: [t.pointer, t.pointer, t.int32, t.int32, t.pointer, t.pointer, t.pointer, t.pointer],
  })
  klass.allocate = interop.callback(layoutAllocate, {
    returns: t.void,
    args: [t.pointer, t.pointer, t.int32, t.int32, t.int32],
  })
}
const query = new _GTypeQuery()
g_type_query(gtk_layout_manager_get_type(), query)
const layoutType = g_type_register_static_simple(
  gtk_layout_manager_get_type(),
  'OctaneRuntimeEvalLayout',
  query.class_size,
  classInit,
  query.instance_size,
  null,
  0,
)
const setFlex = (engine, node) =>
  mason_style_set_with_values(
    engine,
    node,
    1, // display
    -1, // position
    -1, // direction
    0, // flex_direction
    -1, // flex_wrap
    -1, // overflow
    -1, // align_items
    -1, // align_self
    -1, // align_content
    -1, // justify_items
    -1, // justify_self
    -1, // justify_content
    0, // inset_left_type
    0, // inset_left_value
    0, // inset_right_type
    0, // inset_right_value
    0, // inset_top_type
    0, // inset_top_value
    0, // inset_bottom_type
    0, // inset_bottom_value
    1, // margin_left_type
    0, // margin_left_value
    1, // margin_right_type
    0, // margin_right_value
    1, // margin_top_type
    0, // margin_top_value
    1, // margin_bottom_type
    0, // margin_bottom_value
    0, // padding_left_type
    0, // padding_left_value
    0, // padding_right_type
    0, // padding_right_value
    0, // padding_top_type
    0, // padding_top_value
    0, // padding_bottom_type
    0, // padding_bottom_value
    0, // border_left_type
    0, // border_left_value
    0, // border_right_type
    0, // border_right_value
    0, // border_top_type
    0, // border_top_value
    0, // border_bottom_type
    0, // border_bottom_value
    0, // flex_grow
    1, // flex_shrink
    0, // flex_basis_type
    0, // flex_basis_value
    0, // width_type
    0, // width_value
    0, // height_type
    0, // height_value
    0, // min_width_type
    0, // min_width_value
    0, // min_height_type
    0, // min_height_value
    0, // max_width_type
    0, // max_width_value
    0, // max_height_type
    0, // max_height_value
    0, // gap_row_type
    0, // gap_row_value
    0, // gap_column_type
    0, // gap_column_value
    NaN, // aspect_ratio
    null, // grid_auto_rows
    null, // grid_auto_columns
    -1, // grid_auto_flow
    null, // grid_column
    null, // grid_column_start
    null, // grid_column_end
    null, // grid_row
    null, // grid_row_start
    null, // grid_row_end
    null, // grid_template_rows
    null, // grid_template_columns
    -1, // overflow_x
    -1, // overflow_y
    0, // scrollbar_width
    -1, // text_align
    -1, // box_sizing
    null, // grid_area
    null, // grid_template_areas
  )
const string = (p) => interop.stringFromCString(p)
export const api = {
  init: () => gtk_init(),
  window() {
    const p = gtk_window_new()
    gtk_window_set_title(p, 'Octane runtime evaluation')
    gtk_window_set_default_size(p, 480, 80)
    gtk_window_set_decorated(p, false)
    return p
  },
  create(type) {
    let p
    if (type === 'host') {
      p = gtk_box_new(1, 0)
    } else if (type === 'masonview') {
      p = gtk_box_new(0, 0)
      gtk_widget_set_layout_manager(p, g_object_new(layoutType, null))
      const engine = mason_init(),
        root = mason_node_new_node(engine, false)
      setFlex(engine, root)
      layouts.set(key(p), { engine, root, children: new Map(), records: [] })
    } else if (type === 'label') {
      p = gtk_label_new('')
    } else if (type === 'button') {
      p = gtk_button_new_with_label('')
    } else if (type === 'textfield') {
      p = gtk_entry_new()
    } else {
      throw Error(`unsupported type ${type}`)
    }
    g_object_ref_sink(p)
    g_object_weak_ref(p, finalized, null)
    stats.created++
    stats.nodes++
    return p
  },
  setText(type, p, text) {
    if (type === 'label') {
      gtk_label_set_text(p, text)
    } else if (type === 'button') {
      gtk_button_set_label(p, text)
    } else if (type === 'textfield') {
      const pos = gtk_editable_get_position(p)
      gtk_editable_set_text(p, text)
      gtk_editable_set_position(p, pos)
    }
  },
  text: (type, p) =>
    string(type === 'textfield' ? gtk_editable_get_text(p) : gtk_label_get_text(p)),
  attach(parent, child, before) {
    const layout = layouts.get(key(parent))
    if (layout && !layout.children.has(key(child))) {
      const node = mason_node_new_node_with_context(layout.engine, child, measureLeaf)
      mason_style_set_box_size(
        layout.engine,
        node,
        1,
        120,
        1,
        60,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      )
      layout.children.set(key(child), node)
    }
    gtk_widget_insert_before(child, parent, before)
  },
  detach: (p) => {
    if (gtk_widget_get_parent(p)) {
      gtk_widget_unparent(p)
    }
  },
  connect(p, signal, callback) {
    const id = g_signal_connect(p, signal, callback)
    stats.callbacks++
    return () => {
      g_signal_handler_disconnect(p, id)
      stats.callbacks--
      stats.released += interop.release(callback)
    }
  },
  destroy(p) {
    const layout = layouts.get(key(p))
    if (layout) {
      for (const n of layout.children.values()) {
        mason_node_destroy(n)
      }
      mason_node_destroy(layout.root)
      mason_release(layout.engine)
      layouts.delete(key(p))
    }
    g_object_unref(p)
    stats.nodes--
  },
  show: (win, child) => {
    gtk_window_set_child(win, child)
    gtk_window_present(win)
  },
  close: (win) => gtk_window_destroy(win),
  bounds: (p) => {
    const a = new cairo_rectangle_int_t()
    gtk_widget_get_allocation(p, a)
    return { x: a.x, y: a.y, width: a.width, height: a.height }
  },
  deferEvent: (fn) => setTimeout(fn, 0),
  cancelEvent: (id) => clearTimeout(id),
  emitClick: (p) => g_signal_emit_by_name(p, 'clicked'),
  focus: (p) => gtk_widget_grab_focus(p),
  now: () => Number(g_get_monotonic_time()) / 1000,
  pause: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  nativeRecords: () => [...layouts.values()].map((l) => l.records),
}
