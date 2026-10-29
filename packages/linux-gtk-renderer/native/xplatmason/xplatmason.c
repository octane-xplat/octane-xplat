// See xplatmason.h — GI facade over mason-c for the Octane GTK renderer.
// The style-dictionary contract and the leaf-measure packing are ported
// verbatim from packages/macos-renderer/native/xplatmason/XPLMason.m; the
// marshalling layer differs because GJS crosses typelibs, not ObjC
// dispatch.
#include "xplatmason.h"

#include <json-glib/json-glib.h>
#include <math.h>
#include <string.h>

// mason-c exports come from the generated header shipped beside
// libMasonCore.a under dist/native/mason-core — build.sh puts it on the
// include path. No hand-written prototypes.
#include "mason_native.h"

#define H(ptr) ((guint64)(guintptr)(ptr))
#define P(handle) ((void *)(guintptr)(handle))

// node handle -> reffed GtkWidget for leaf measure contexts.
static GHashTable *xplat_leaf_widgets = NULL;

static GHashTable *leaf_widgets(void) {
  if (!xplat_leaf_widgets) {
    xplat_leaf_widgets = g_hash_table_new(g_direct_hash, g_direct_equal);
  }
  return xplat_leaf_widgets;
}

// Mason packs a measure result as two f32s in an i64 (MeasureOutput::make).
static long long XGtkMeasure(const void *ctx, float known_w, float known_h,
                             float avail_w, float avail_h) {
  GtkWidget *widget = (GtkWidget *)ctx;
  if (!GTK_IS_WIDGET(widget)) {
    return 0;
  }

  // Natural size on both axes. GTK's for_size is the opposite axis' offer —
  // take the engine's known value first, then its available-space offer.
  int min_w = 0, nat_w = 0, min_h = 0, nat_h = 0;
  float for_h = known_h >= 0 ? known_h : (avail_h >= 0 ? avail_h : -1.f);
  gtk_widget_measure(widget, GTK_ORIENTATION_HORIZONTAL, (int)for_h, &min_w,
                     &nat_w, NULL, NULL);

  float for_v = known_w >= 0 ? known_w : (float)nat_w;
  gtk_widget_measure(widget, GTK_ORIENTATION_VERTICAL, (int)for_v, &min_h,
                     &nat_h, NULL, NULL);

  guint32 wb, hb;
  float w = (float)nat_w, h = (float)nat_h;
  memcpy(&wb, &w, sizeof(float));
  memcpy(&hb, &h, sizeof(float));
  return (long long)(((guint64)wb << 32) | (guint64)hb);
}

guint64 xplat_mason_engine_new(void) { return H(mason_init()); }

void xplat_mason_engine_free(guint64 engine) {
  if (engine) {
    mason_release(P(engine));
  }
}

void xplat_mason_engine_set_scale(guint64 engine, gfloat scale) {
  mason_set_device_scale(P(engine), scale);
}

guint64 xplat_mason_node_new(guint64 engine, gboolean anonymous) {
  return H(mason_node_new_node(P(engine), anonymous));
}

guint64 xplat_mason_node_new_leaf(guint64 engine, GtkWidget *widget) {
  void *ctx = g_object_ref(widget);
  CMasonNode *node = mason_node_new_node_with_context(P(engine), ctx, XGtkMeasure);
  if (!node) {
    g_object_unref(ctx);
    return 0;
  }
  g_hash_table_insert(leaf_widgets(), node, ctx);
  return H(node);
}

void xplat_mason_node_free(guint64 engine, guint64 node) {
  CMasonNode *ptr = P(node);
  gpointer widget = g_hash_table_lookup(leaf_widgets(), ptr);
  if (widget) {
    g_hash_table_remove(leaf_widgets(), ptr);
    g_object_unref(widget);
  }
  (void)engine;
  mason_node_destroy(ptr);
}

void xplat_mason_node_set_children(guint64 engine, guint64 node,
                                   const guint64 *children,
                                   gsize children_len) {
  CMasonNode **list = NULL;
  if (children_len > 0) {
    list = g_new(CMasonNode *, children_len);
    for (gsize i = 0; i < children_len; i++) {
      list[i] = P(children[i]);
    }
  }
  mason_node_set_children(P(engine), P(node), list, (uintptr_t)children_len);
  g_free(list);
}

void xplat_mason_node_mark_dirty(guint64 engine, guint64 node) {
  mason_node_mark_dirty(P(engine), P(node));
}

// The layout callback cannot capture; a static collector is safe between
// calls on the single-threaded host.
static GBytes *xplat_layout_out;

static void *XCollectLayout(const float *ptr, uintptr_t len) {
  xplat_layout_out = len ? g_bytes_new(ptr, len * sizeof(float)) : NULL;
  return NULL;
}

void xplat_mason_node_compute(guint64 engine, guint64 node, gfloat width,
                              gfloat height) {
  mason_node_compute_wh(P(engine), P(node), width, height);
}

GBytes *xplat_mason_node_layout(guint64 engine, guint64 node) {
  xplat_layout_out = NULL;
  mason_node_layout(P(engine), P(node), XCollectLayout);
  GBytes *out = xplat_layout_out;
  xplat_layout_out = NULL;
  return out ?: g_bytes_new(NULL, 0);
}

GBytes *xplat_mason_node_layout_shallow(guint64 engine, guint64 node) {
  xplat_layout_out = NULL;
  mason_node_layout_shallow(P(engine), P(node), XCollectLayout);
  GBytes *out = xplat_layout_out;
  xplat_layout_out = NULL;
  return out ?: g_bytes_new(NULL, 0);
}

void xplat_mason_node_natural(guint64 engine, guint64 node, gfloat *width,
                              gfloat *height) {
  xplat_layout_out = NULL;
  mason_node_compute_max_content_and_layout(P(engine), P(node), XCollectLayout);
  GBytes *out = xplat_layout_out;
  xplat_layout_out = NULL;
  float w = 0, h = 0;
  gsize len = 0;
  const float *rec = out ? g_bytes_get_data(out, &len) : NULL;
  // The root record's width/height sit at indices 3 and 4.
  if (rec && len >= 5 * sizeof(float)) {
    w = rec[3];
    h = rec[4];
  }
  if (width) {
    *width = w;
  }
  if (height) {
    *height = h;
  }
  if (out) {
    g_bytes_unref(out);
  }
}

// ---------------------------------------------------------------------------
// Style JSON -> mason_style_set_with_values. Same dictionary contract as
// XPLMason.m: enum strings, @[type,value] dimensions, edge objects.
// ---------------------------------------------------------------------------

typedef struct {
  const char *name;
  signed char code;
} XEnumEntry;

static signed char XLookup(JsonObject *s, const char *key,
                           const XEnumEntry *map, gsize map_len) {
  if (!json_object_has_member(s, key) ||
      json_object_get_member(s, key) == NULL ||
      !JSON_NODE_HOLDS_VALUE(json_object_get_member(s, key)) ||
      json_node_get_node_type(json_object_get_member(s, key)) != JSON_NODE_VALUE) {
    return -1;
  }
  JsonNode *member = json_object_get_member(s, key);
  if (json_node_get_value_type(member) != G_TYPE_STRING) {
    return -1;
  }
  const char *value = json_node_get_string(member);
  for (gsize i = 0; i < map_len; i++) {
    if (g_strcmp0(value, map[i].name) == 0) {
      return map[i].code;
    }
  }
  return -1;
}

static JsonArray *XDimArray(JsonObject *s, const char *key) {
  if (!json_object_has_member(s, key)) {
    return NULL;
  }
  JsonNode *member = json_object_get_member(s, key);
  if (json_node_get_node_type(member) != JSON_NODE_ARRAY) {
    return NULL;
  }
  JsonArray *arr = json_node_get_array(member);
  return json_array_get_length(arr) >= 2 ? arr : NULL;
}

// Auto-typed dimension: [type, value] — 0 auto, 1 length, 2 percent(0-1).
// Absent -> auto.
static void XDimAuto(JsonArray *value, signed char *type, float *out) {
  *type = 0;
  *out = 0;
  if (!value) {
    return;
  }
  *type = (signed char)json_array_get_int_element(value, 0);
  *out = (float)json_array_get_double_element(value, 1);
}

// Margin edges use the same slots but absent must mean length-0, not auto —
// auto margins center children and swallow free space.
static void XDimAutoOrLength(JsonArray *value, signed char *type, float *out) {
  *type = 1;
  *out = 0;
  if (!value) {
    return;
  }
  *type = (signed char)json_array_get_int_element(value, 0);
  *out = (float)json_array_get_double_element(value, 1);
}

// Length/percent dimension: [type, value] — 0 length, 1 percent.
// Absent -> length 0.
static void XDim(JsonArray *value, signed char *type, float *out) {
  *type = 0;
  *out = 0;
  if (!value) {
    return;
  }
  *type = (signed char)json_array_get_int_element(value, 0);
  *out = (float)json_array_get_double_element(value, 1);
}

static JsonObject *XEdgeBox(JsonObject *s, const char *box) {
  if (!json_object_has_member(s, box)) {
    return NULL;
  }
  JsonNode *member = json_object_get_member(s, box);
  if (json_node_get_node_type(member) != JSON_NODE_OBJECT) {
    return NULL;
  }
  return json_node_get_object(member);
}

static JsonArray *XEdge(JsonObject *s, const char *box, const char *side) {
  JsonObject *edges = XEdgeBox(s, box);
  return edges ? XDimArray(edges, side) : NULL;
}

static float XNum(JsonObject *s, const char *key, float dflt) {
  if (!json_object_has_member(s, key)) {
    return dflt;
  }
  JsonNode *member = json_object_get_member(s, key);
  if (json_node_get_node_type(member) != JSON_NODE_VALUE) {
    return dflt;
  }
  GType t = json_node_get_value_type(member);
  if (t == G_TYPE_DOUBLE || t == G_TYPE_INT64 || t == G_TYPE_UINT64 ||
      t == G_TYPE_INT) {
    return (float)json_node_get_double(member);
  }
  return dflt;
}

static const char *XStr(JsonObject *s, const char *key) {
  if (!json_object_has_member(s, key)) {
    return NULL;
  }
  JsonNode *member = json_object_get_member(s, key);
  if (json_node_get_node_type(member) != JSON_NODE_VALUE ||
      json_node_get_value_type(member) != G_TYPE_STRING) {
    return NULL;
  }
  return json_node_get_string(member);
}

#define ENUM(name, ...) \
  static const XEnumEntry name[] = {__VA_ARGS__}

ENUM(XDisplayMap, {"none", 0}, {"flex", 1}, {"grid", 2}, {"block", 3},
     {"flow-root", 4});
ENUM(XPositionMap, {"static", 0}, {"relative", 1}, {"absolute", 2},
     {"fixed", 3}, {"sticky", 4});
ENUM(XDirectionMap, {"ltr", 1}, {"rtl", 2});
ENUM(XFlexDirMap, {"row", 0}, {"column", 1}, {"row-reverse", 2},
     {"column-reverse", 3});
ENUM(XFlexWrapMap, {"nowrap", 0}, {"wrap", 1}, {"wrap-reverse", 2},
     {"balance", 3}, {"balance-reverse", 4});
ENUM(XOverflowMap, {"visible", 0}, {"hidden", 1}, {"scroll", 2}, {"clip", 3},
     {"auto", 4});
ENUM(XAlignItemsMap, {"start", 0}, {"end", 1}, {"center", 2}, {"baseline", 3},
     {"stretch", 4}, {"flex-start", 5}, {"flex-end", 6}, {"self-start", 7},
     {"self-end", 8});
ENUM(XAlignSelfMap, {"start", 0}, {"end", 1}, {"center", 2}, {"baseline", 3},
     {"stretch", 4}, {"flex-start", 5}, {"flex-end", 6}, {"self-start", 7},
     {"self-end", 8}, {"auto", 9});
ENUM(XAlignContentMap, {"start", 0}, {"end", 1}, {"center", 2}, {"stretch", 3},
     {"space-between", 4}, {"space-around", 5}, {"space-evenly", 6},
     {"flex-start", 7}, {"flex-end", 8});
ENUM(XTextAlignMap, {"auto", 0}, {"left", 1}, {"right", 2}, {"center", 3});
ENUM(XBoxSizingMap, {"border-box", 0}, {"content-box", 1});
ENUM(XGridAutoFlowMap, {"row", 0}, {"column", 1}, {"row-dense", 2},
     {"column-dense", 3});
#undef ENUM

#define ELEN(map) (sizeof(map) / sizeof((map)[0]))

static void XSetStyle(void *engine, void *node, JsonObject *s) {
  signed char insetL, insetR, insetT, insetB, marginL, marginR, marginT, marginB;
  signed char padL, padR, padT, padB, borderL, borderR, borderT, borderB;
  signed char basisT, widthT, heightT, minWT, minHT, maxWT, maxHT, gapRT, gapCT;
  float insetLv, insetRv, insetTv, insetBv, marginLv, marginRv, marginTv, marginBv;
  float padLv, padRv, padTv, padBv, borderLv, borderRv, borderTv, borderBv;
  float basisV, widthV, heightV, minWV, minHV, maxWV, maxHV, gapRV, gapCV;

  XDimAuto(XEdge(s, "inset", "left"), &insetL, &insetLv);
  XDimAuto(XEdge(s, "inset", "right"), &insetR, &insetRv);
  XDimAuto(XEdge(s, "inset", "top"), &insetT, &insetTv);
  XDimAuto(XEdge(s, "inset", "bottom"), &insetB, &insetBv);
  XDimAutoOrLength(XEdge(s, "margin", "left"), &marginL, &marginLv);
  XDimAutoOrLength(XEdge(s, "margin", "right"), &marginR, &marginRv);
  XDimAutoOrLength(XEdge(s, "margin", "top"), &marginT, &marginTv);
  XDimAutoOrLength(XEdge(s, "margin", "bottom"), &marginB, &marginBv);
  XDim(XEdge(s, "padding", "left"), &padL, &padLv);
  XDim(XEdge(s, "padding", "right"), &padR, &padRv);
  XDim(XEdge(s, "padding", "top"), &padT, &padTv);
  XDim(XEdge(s, "padding", "bottom"), &padB, &padBv);
  XDim(XEdge(s, "border", "left"), &borderL, &borderLv);
  XDim(XEdge(s, "border", "right"), &borderR, &borderRv);
  XDim(XEdge(s, "border", "top"), &borderT, &borderTv);
  XDim(XEdge(s, "border", "bottom"), &borderB, &borderBv);
  XDimAuto(XDimArray(s, "flexBasis"), &basisT, &basisV);
  XDimAuto(XDimArray(s, "width"), &widthT, &widthV);
  XDimAuto(XDimArray(s, "height"), &heightT, &heightV);
  XDimAuto(XDimArray(s, "minWidth"), &minWT, &minWV);
  XDimAuto(XDimArray(s, "minHeight"), &minHT, &minHV);
  XDimAuto(XDimArray(s, "maxWidth"), &maxWT, &maxWV);
  XDimAuto(XDimArray(s, "maxHeight"), &maxHT, &maxHV);
  XDim(XDimArray(s, "gapRow"), &gapRT, &gapRV);
  XDim(XDimArray(s, "gapColumn"), &gapCT, &gapCV);

  mason_style_set_with_values(
      engine, node,
      XLookup(s, "display", XDisplayMap, ELEN(XDisplayMap)),
      XLookup(s, "position", XPositionMap, ELEN(XPositionMap)),
      XLookup(s, "direction", XDirectionMap, ELEN(XDirectionMap)),
      XLookup(s, "flexDirection", XFlexDirMap, ELEN(XFlexDirMap)),
      XLookup(s, "flexWrap", XFlexWrapMap, ELEN(XFlexWrapMap)),
      XLookup(s, "overflow", XOverflowMap, ELEN(XOverflowMap)),
      XLookup(s, "alignItems", XAlignItemsMap, ELEN(XAlignItemsMap)),
      XLookup(s, "alignSelf", XAlignSelfMap, ELEN(XAlignSelfMap)),
      XLookup(s, "alignContent", XAlignContentMap, ELEN(XAlignContentMap)),
      XLookup(s, "justifyItems", XAlignItemsMap, ELEN(XAlignItemsMap)),
      XLookup(s, "justifySelf", XAlignSelfMap, ELEN(XAlignSelfMap)),
      XLookup(s, "justifyContent", XAlignContentMap, ELEN(XAlignContentMap)),
      insetL, insetLv, insetR, insetRv, insetT, insetTv, insetB, insetBv,
      marginL, marginLv, marginR, marginRv, marginT, marginTv, marginB, marginBv,
      padL, padLv, padR, padRv, padT, padTv, padB, padBv,
      borderL, borderLv, borderR, borderRv, borderT, borderTv, borderB, borderBv,
      XNum(s, "flexGrow", 0), XNum(s, "flexShrink", 1),
      basisT, basisV, widthT, widthV, heightT, heightV,
      minWT, minWV, minHT, minHV, maxWT, maxWV, maxHT, maxHV,
      gapRT, gapRV, gapCT, gapCV,
      XNum(s, "aspectRatio", NAN), XStr(s, "gridAutoRows"),
      XStr(s, "gridAutoColumns"),
      XLookup(s, "gridAutoFlow", XGridAutoFlowMap, ELEN(XGridAutoFlowMap)),
      XStr(s, "gridColumn"), XStr(s, "gridColumnStart"), XStr(s, "gridColumnEnd"),
      XStr(s, "gridRow"), XStr(s, "gridRowStart"), XStr(s, "gridRowEnd"),
      XStr(s, "gridTemplateRows"), XStr(s, "gridTemplateColumns"),
      XLookup(s, "overflowX", XOverflowMap, ELEN(XOverflowMap)),
      XLookup(s, "overflowY", XOverflowMap, ELEN(XOverflowMap)),
      XNum(s, "scrollbarWidth", 0),
      XLookup(s, "textAlign", XTextAlignMap, ELEN(XTextAlignMap)),
      XLookup(s, "boxSizing", XBoxSizingMap, ELEN(XBoxSizingMap)),
      XStr(s, "gridArea"), XStr(s, "gridTemplateAreas"));
}

void xplat_mason_node_set_style(guint64 engine, guint64 node,
                                const gchar *style_json) {
  if (!style_json) {
    return;
  }
  g_autoptr(JsonParser) parser = json_parser_new();
  GError *error = NULL;
  if (!json_parser_load_from_data(parser, style_json, -1, &error)) {
    g_warning("[xplat-mason] style JSON parse failed: %s",
              error ? error->message : "unknown");
    g_clear_error(&error);
    return;
  }
  JsonNode *root = json_parser_get_root(parser);
  if (!root || json_node_get_node_type(root) != JSON_NODE_OBJECT) {
    return;
  }
  XSetStyle(P(engine), P(node), json_node_get_object(root));
}

// GTK's variadic assertion helpers are not introspectable. Fixed signatures
// let maintained GJS fixtures compare actual stored values, including false
// versus true, rather than merely checking that an attribute is present.
gchar *xplat_mason_test_accessible_state(GtkAccessible *accessible,
                                        GtkAccessibleState state, gint expected) {
  return gtk_test_accessible_check_state(accessible, state, expected);
}

gchar *xplat_mason_test_accessible_boolean_property(GtkAccessible *accessible,
                                                   GtkAccessibleProperty property,
                                                   gboolean expected) {
  return gtk_test_accessible_check_property(accessible, property, expected);
}

gchar *xplat_mason_test_accessible_string_property(GtkAccessible *accessible,
                                                  GtkAccessibleProperty property,
                                                  const gchar *expected) {
  return gtk_test_accessible_check_property(accessible, property, expected);
}


gchar *xplat_mason_test_accessible_double_property(GtkAccessible *accessible,
                                                  GtkAccessibleProperty property,
                                                  gdouble expected) {
  return gtk_test_accessible_check_property(accessible, property, expected);
}
