// GObject-introspectable facade over mason-c (the Mason layout engine's C
// ABI) for the Octane GTK renderer. GJS has no plain-C FFI — every native
// call crosses a typelib — so this library wraps the engine in functions
// g-ir-scanner can describe. The JS contract mirrors macOS's XPLMason:
// engine/node handles, a JSON style dictionary, 22-float preorder layout
// records, and leaf nodes whose measure callback reads a live widget's
// natural size.
//
// All pointers cross as guint64 handles. `children` is a guint64 array;
// layout output crosses as GBytes (Float32 records, 22 per node, preorder:
// order,x,y,w,h,borderTRBL,marginTRBL,paddingTRBL,overflowRB,scrollbarWH,
// childCount).
#ifndef XPLAT_MASON_H
#define XPLAT_MASON_H

#include <glib.h>
#include <gtk/gtk.h>

G_BEGIN_DECLS

/**
 * xplat_mason_engine_new:
 *
 * Creates a Mason engine instance.
 *
 * Returns: engine handle (0 on failure)
 */
guint64 xplat_mason_engine_new(void);

/**
 * xplat_mason_engine_free:
 * @engine: engine handle
 *
 * Destroys the engine and every node it owns.
 */
void xplat_mason_engine_free(guint64 engine);

/**
 * xplat_mason_engine_set_scale:
 * @engine: engine handle
 * @scale: device scale factor (1.0 = no rounding to pixels)
 */
void xplat_mason_engine_set_scale(guint64 engine, gfloat scale);

/**
 * xplat_mason_node_new:
 * @engine: engine handle
 * @anonymous: pass-through to mason_node_new_node
 *
 * Creates a container node.
 *
 * Returns: node handle
 */
guint64 xplat_mason_node_new(guint64 engine, gboolean anonymous);

/**
 * xplat_mason_node_new_leaf:
 * @engine: engine handle
 * @widget: (type Gtk.Widget): widget whose natural size feeds the leaf's
 *   measure pass on every engine compute
 *
 * Creates a leaf node bound to a Gtk widget. The widget is reffed until
 * xplat_mason_node_free.
 *
 * Returns: node handle
 */
guint64 xplat_mason_node_new_leaf(guint64 engine, GtkWidget *widget);

/**
 * xplat_mason_node_free:
 * @engine: engine handle
 * @node: node handle
 */
void xplat_mason_node_free(guint64 engine, guint64 node);

/**
 * xplat_mason_node_set_children:
 * @engine: engine handle
 * @node: parent node handle
 * @children: (array length=children_len) (element-type guint64): ordered
 *   child node handles
 * @children_len: number of children
 */
void xplat_mason_node_set_children(guint64 engine, guint64 node,
                                   const guint64 *children,
                                   gsize children_len);

/**
 * xplat_mason_node_mark_dirty:
 * @engine: engine handle
 * @node: node handle
 *
 * Flags a measured leaf for re-measure on the next compute.
 */
void xplat_mason_node_mark_dirty(guint64 engine, guint64 node);

/**
 * xplat_mason_node_set_style:
 * @engine: engine handle
 * @node: node handle
 * @style_json: JSON style dictionary — the same shape macOS's XPLMason
 *   accepts: enum strings, [type,value] dimension pairs, {left,right,top,
 *   bottom} edge objects, plain numbers, and grid track strings. Unknown
 *   keys are ignored.
 */
void xplat_mason_node_set_style(guint64 engine, guint64 node,
                                const gchar *style_json);

/**
 * xplat_mason_node_compute:
 * @engine: engine handle
 * @node: root node handle
 * @width: available width (-1 min-content, -2 max-content, else definite)
 * @height: available height (same sentinels)
 */
void xplat_mason_node_compute(guint64 engine, guint64 node, gfloat width,
                              gfloat height);

/**
 * xplat_mason_node_layout:
 * @engine: engine handle
 * @node: root node handle
 *
 * Reads the last compute's layout for the whole subtree.
 *
 * Returns: (transfer full): flat f32 records — 22 per node, preorder
 */
GBytes *xplat_mason_node_layout(guint64 engine, guint64 node);

/**
 * xplat_mason_node_layout_shallow:
 * @engine: engine handle
 * @node: root node handle
 *
 * Reads the last compute's layout for the root and its direct children only.
 *
 * Returns: (transfer full): flat f32 records — 22 per node
 */
GBytes *xplat_mason_node_layout_shallow(guint64 engine, guint64 node);

/**
 * xplat_mason_node_natural:
 * @engine: engine handle
 * @node: root node handle
 * @width: (out): max-content width
 * @height: (out): max-content height
 *
 * Runs a max-content compute and reports the root's size.
 */
void xplat_mason_node_natural(guint64 engine, guint64 node, gfloat *width,
                              gfloat *height);

G_END_DECLS

#endif
