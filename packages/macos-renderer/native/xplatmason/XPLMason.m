#import "XPLMason.h"

#include <stdbool.h>
#include <stdint.h>
#include <string.h>

// mason-c exports (crates/mason-c). Linked statically into this dylib.
extern void *mason_init(void);
extern void mason_release(void *mason);
extern void mason_set_device_scale(void *mason, float scale);
extern void *mason_node_new_node(void *mason, bool anonymous);
extern void mason_node_destroy(void *node);
extern void mason_node_set_children(void *mason, void *node, void *const *children,
                                    size_t children_size);
extern void mason_node_mark_dirty(void *mason, void *node);
extern void mason_node_compute_wh(void *mason, void *node, float width, float height);
extern void *mason_node_layout(void *mason, void *node,
                               void *(*cb)(const float *, size_t));
extern void *mason_node_compute_max_content_and_layout(
    void *mason, void *node, void *(*cb)(const float *, size_t));
extern void mason_style_set_with_values(
    void *mason, void *node, signed char display, signed char position,
    signed char direction, signed char flex_direction, signed char flex_wrap,
    signed char overflow, signed char align_items, signed char align_self,
    signed char align_content, signed char justify_items, signed char justify_self,
    signed char justify_content, signed char inset_left_type, float inset_left_value,
    signed char inset_right_type, float inset_right_value, signed char inset_top_type,
    float inset_top_value, signed char inset_bottom_type, float inset_bottom_value,
    signed char margin_left_type, float margin_left_value, signed char margin_right_type,
    float margin_right_value, signed char margin_top_type, float margin_top_value,
    signed char margin_bottom_type, float margin_bottom_value, signed char padding_left_type,
    float padding_left_value, signed char padding_right_type, float padding_right_value,
    signed char padding_top_type, float padding_top_value, signed char padding_bottom_type,
    float padding_bottom_value, signed char border_left_type, float border_left_value,
    signed char border_right_type, float border_right_value, signed char border_top_type,
    float border_top_value, signed char border_bottom_type, float border_bottom_value,
    float flex_grow, float flex_shrink, signed char flex_basis_type, float flex_basis_value,
    signed char width_type, float width_value, signed char height_type, float height_value,
    signed char min_width_type, float min_width_value, signed char min_height_type,
    float min_height_value, signed char max_width_type, float max_width_value,
    signed char max_height_type, float max_height_value, signed char gap_row_type,
    float gap_row_value, signed char gap_column_type, float gap_column_value,
    float aspect_ratio, const char *grid_auto_rows, const char *grid_auto_columns,
    signed char grid_auto_flow, const char *grid_column, const char *grid_column_start,
    const char *grid_column_end, const char *grid_row, const char *grid_row_start,
    const char *grid_row_end, const char *grid_template_rows,
    const char *grid_template_columns, signed char overflow_x, signed char overflow_y,
    float scrollbar_width, signed char text_align, signed char box_sizing,
    const char *grid_area, const char *grid_template_areas);

// The layout callback is a plain C function pointer, so it cannot capture.
// The host is single-threaded; a static collector is safe between calls.
static __strong NSMutableArray<NSNumber *> *XPLLayoutOut;

static void *XPLCollectLayout(const float *ptr, size_t len) {
  NSMutableArray<NSNumber *> *out = [NSMutableArray arrayWithCapacity:len];
  for (size_t i = 0; i < len; i++) {
    [out addObject:@(ptr[i])];
  }
  XPLLayoutOut = out;
  return NULL;
}

static signed char XE(NSDictionary *s, NSString *key, NSDictionary<NSString *, NSNumber *> *map) {
  id value = s[key];
  if (![value isKindOfClass:[NSString class]]) {
    return -1;
  }
  NSNumber *code = map[value];
  return code ? [code charValue] : -1;
}

// Auto-typed dimension: @[type, value] — 0 auto, 1 length, 2 percent(0-1).
// Absent -> auto.
static void XDimAuto(id value, signed char *type, float *out) {
  *type = 0;
  *out = 0;
  if (![value isKindOfClass:[NSArray class]] || [value count] < 2) {
    return;
  }
  *type = (signed char)[value[0] charValue];
  *out = [value[1] floatValue];
}

// dimension_with_auto edge where absent should mean length-0 rather than
// auto (margins). Supports explicit 'auto' = type 0 too.
static void XDimAutoOrLength(id value, signed char *type, float *out) {
  *type = 1;
  *out = 0;
  if (![value isKindOfClass:[NSArray class]] || [value count] < 2) {
    return;
  }
  *type = (signed char)[value[0] charValue];
  *out = [value[1] floatValue];
}

// Length/percent dimension: @[type, value] — 0 length, 1 percent.
// Absent -> length 0.
static void XDim(id value, signed char *type, float *out) {
  *type = 0;
  *out = 0;
  if (![value isKindOfClass:[NSArray class]] || [value count] < 2) {
    return;
  }
  *type = (signed char)[value[0] charValue];
  *out = [value[1] floatValue];
}

static id XEdge(NSDictionary *s, NSString *box, NSString *side) {
  id edges = s[box];
  if (![edges isKindOfClass:[NSDictionary class]]) {
    return nil;
  }
  return edges[side];
}

static float XNum(NSDictionary *s, NSString *key, float dflt) {
  id value = s[key];
  return [value respondsToSelector:@selector(floatValue)] ? [value floatValue] : dflt;
}

static const char *XStr(NSDictionary *s, NSString *key) {
  id value = s[key];
  return [value isKindOfClass:[NSString class]] ? [value UTF8String] : NULL;
}

static void XSetStyle(void *engine, void *node, NSDictionary *s) {
  static NSDictionary<NSString *, NSNumber *> *displayMap;
  static NSDictionary<NSString *, NSNumber *> *positionMap;
  static NSDictionary<NSString *, NSNumber *> *directionMap;
  static NSDictionary<NSString *, NSNumber *> *flexDirMap;
  static NSDictionary<NSString *, NSNumber *> *flexWrapMap;
  static NSDictionary<NSString *, NSNumber *> *overflowMap;
  static NSDictionary<NSString *, NSNumber *> *alignItemsMap;
  static NSDictionary<NSString *, NSNumber *> *alignSelfMap;
  static NSDictionary<NSString *, NSNumber *> *alignContentMap;
  static NSDictionary<NSString *, NSNumber *> *justifyContentMap;
  static NSDictionary<NSString *, NSNumber *> *textAlignMap;
  static NSDictionary<NSString *, NSNumber *> *boxSizingMap;
  static NSDictionary<NSString *, NSNumber *> *gridAutoFlowMap;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    displayMap = @{
      @"none" : @0, @"flex" : @1, @"grid" : @2, @"block" : @3, @"flow-root" : @4,
    };
    positionMap = @{
      @"static" : @0, @"relative" : @1, @"absolute" : @2, @"fixed" : @3, @"sticky" : @4,
    };
    directionMap = @{ @"ltr" : @1, @"rtl" : @2 };
    flexDirMap = @{
      @"row" : @0, @"column" : @1, @"row-reverse" : @2, @"column-reverse" : @3,
    };
    flexWrapMap = @{
      @"nowrap" : @0, @"wrap" : @1, @"wrap-reverse" : @2, @"balance" : @3,
      @"balance-reverse" : @4,
    };
    overflowMap = @{
      @"visible" : @0, @"hidden" : @1, @"scroll" : @2, @"clip" : @3, @"auto" : @4,
    };
    alignItemsMap = @{
      @"start" : @0, @"end" : @1, @"center" : @2, @"baseline" : @3, @"stretch" : @4,
      @"flex-start" : @5, @"flex-end" : @6, @"self-start" : @7, @"self-end" : @8,
    };
    alignSelfMap = @{
      @"start" : @0, @"end" : @1, @"center" : @2, @"baseline" : @3, @"stretch" : @4,
      @"flex-start" : @5, @"flex-end" : @6, @"self-start" : @7, @"self-end" : @8,
      @"auto" : @9,
    };
    alignContentMap = @{
      @"start" : @0, @"end" : @1, @"center" : @2, @"stretch" : @3,
      @"space-between" : @4, @"space-around" : @5, @"space-evenly" : @6,
      @"flex-start" : @7, @"flex-end" : @8,
    };
    justifyContentMap = @{
      @"start" : @0, @"end" : @1, @"center" : @2, @"stretch" : @3,
      @"space-between" : @4, @"space-around" : @5, @"space-evenly" : @6,
      @"flex-start" : @7, @"flex-end" : @8,
    };
    textAlignMap = @{ @"auto" : @0, @"left" : @1, @"right" : @2, @"center" : @3 };
    boxSizingMap = @{ @"border-box" : @0, @"content-box" : @1 };
    gridAutoFlowMap = @{
      @"row" : @0, @"column" : @1, @"row-dense" : @2, @"column-dense" : @3,
    };
  });

  signed char insetL, insetR, insetT, insetB, marginL, marginR, marginT, marginB;
  signed char padL, padR, padT, padB, borderL, borderR, borderT, borderB;
  signed char basisT, widthT, heightT, minWT, minHT, maxWT, maxHT, gapRT, gapCT;
  float insetLv, insetRv, insetTv, insetBv, marginLv, marginRv, marginTv, marginBv;
  float padLv, padRv, padTv, padBv, borderLv, borderRv, borderTv, borderBv;
  float basisV, widthV, heightV, minWV, minHV, maxWV, maxHV, gapRV, gapCV;

  XDimAuto(XEdge(s, @"inset", @"left"), &insetL, &insetLv);
  XDimAuto(XEdge(s, @"inset", @"right"), &insetR, &insetRv);
  XDimAuto(XEdge(s, @"inset", @"top"), &insetT, &insetTv);
  XDimAuto(XEdge(s, @"inset", @"bottom"), &insetB, &insetBv);
  // CSS margins default to 0, not auto — auto margins center children and
  // eat every scrap of free space. Margin slots use dimension_with_auto
  // where 0 means auto, so absent margins must be [length, 0] = type 1.
  XDimAutoOrLength(XEdge(s, @"margin", @"left"), &marginL, &marginLv);
  XDimAutoOrLength(XEdge(s, @"margin", @"right"), &marginR, &marginRv);
  XDimAutoOrLength(XEdge(s, @"margin", @"top"), &marginT, &marginTv);
  XDimAutoOrLength(XEdge(s, @"margin", @"bottom"), &marginB, &marginBv);
  XDim(XEdge(s, @"padding", @"left"), &padL, &padLv);
  XDim(XEdge(s, @"padding", @"right"), &padR, &padRv);
  XDim(XEdge(s, @"padding", @"top"), &padT, &padTv);
  XDim(XEdge(s, @"padding", @"bottom"), &padB, &padBv);
  XDim(XEdge(s, @"border", @"left"), &borderL, &borderLv);
  XDim(XEdge(s, @"border", @"right"), &borderR, &borderRv);
  XDim(XEdge(s, @"border", @"top"), &borderT, &borderTv);
  XDim(XEdge(s, @"border", @"bottom"), &borderB, &borderBv);
  XDimAuto(s[@"flexBasis"], &basisT, &basisV);
  XDimAuto(s[@"width"], &widthT, &widthV);
  XDimAuto(s[@"height"], &heightT, &heightV);
  XDimAuto(s[@"minWidth"], &minWT, &minWV);
  XDimAuto(s[@"minHeight"], &minHT, &minHV);
  XDimAuto(s[@"maxWidth"], &maxWT, &maxWV);
  XDimAuto(s[@"maxHeight"], &maxHT, &maxHV);
  XDim(s[@"gapRow"], &gapRT, &gapRV);
  XDim(s[@"gapColumn"], &gapCT, &gapCV);

  mason_style_set_with_values(
      engine, node, XE(s, @"display", displayMap), XE(s, @"position", positionMap),
      XE(s, @"direction", directionMap), XE(s, @"flexDirection", flexDirMap),
      XE(s, @"flexWrap", flexWrapMap), XE(s, @"overflow", overflowMap),
      XE(s, @"alignItems", alignItemsMap), XE(s, @"alignSelf", alignSelfMap),
      XE(s, @"alignContent", alignContentMap), XE(s, @"justifyItems", alignItemsMap),
      XE(s, @"justifySelf", alignSelfMap), XE(s, @"justifyContent", justifyContentMap),
      insetL, insetLv, insetR, insetRv, insetT, insetTv, insetB, insetBv, marginL,
      marginLv, marginR, marginRv, marginT, marginTv, marginB, marginBv, padL, padLv,
      padR, padRv, padT, padTv, padB, padBv, borderL, borderLv, borderR, borderRv,
      borderT, borderTv, borderB, borderBv, XNum(s, @"flexGrow", 0),
      XNum(s, @"flexShrink", 1), basisT, basisV, widthT, widthV, heightT, heightV,
      minWT, minWV, minHT, minHV, maxWT, maxWV, maxHT, maxHV, gapRT, gapRV, gapCT,
      gapCV, XNum(s, @"aspectRatio", NAN), XStr(s, @"gridAutoRows"),
      XStr(s, @"gridAutoColumns"), XE(s, @"gridAutoFlow", gridAutoFlowMap),
      XStr(s, @"gridColumn"), XStr(s, @"gridColumnStart"), XStr(s, @"gridColumnEnd"),
      XStr(s, @"gridRow"), XStr(s, @"gridRowStart"), XStr(s, @"gridRowEnd"),
      XStr(s, @"gridTemplateRows"), XStr(s, @"gridTemplateColumns"),
      XE(s, @"overflowX", overflowMap), XE(s, @"overflowY", overflowMap),
      XNum(s, @"scrollbarWidth", 0), XE(s, @"textAlign", textAlignMap),
      XE(s, @"boxSizing", boxSizingMap), XStr(s, @"gridArea"),
      XStr(s, @"gridTemplateAreas"));
}

@implementation XPLMason {
  void *_engine;
}

// The bridge cannot fabricate members for metadata-free classes fetched via
// objc_getClass — but performSelector on a real object dispatches live. At
// load we publish a host instance where JS can pick it up: the main thread's
// threadDictionary (a typegen'd, bridged API).
+ (void)load {
  XPLMason *host = [XPLMason new];
  NSThread.mainThread.threadDictionary[@"xplatMasonHost"] = host;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _engine = mason_init();
  }
  return self;
}

- (void)dealloc {
  if (_engine) {
    mason_release(_engine);
    _engine = NULL;
  }
}

- (id)invoke:(NSString *)op args:(NSArray *)args {
  if ([op isEqualToString:@"scale"]) {
    mason_set_device_scale(_engine, [args[0] floatValue]);
    return nil;
  }
  if ([op isEqualToString:@"node"]) {
    return [NSValue valueWithPointer:mason_node_new_node(_engine, false)];
  }
  if ([op isEqualToString:@"free"]) {
    mason_node_destroy([args[0] pointerValue]);
    return nil;
  }
  if ([op isEqualToString:@"children"]) {
    NSArray<NSValue *> *children = args[1];
    NSUInteger count = children.count;
    void **list = count ? malloc(sizeof(void *) * count) : NULL;
    for (NSUInteger i = 0; i < count; i++) {
      list[i] = [children[i] pointerValue];
    }
    mason_node_set_children(_engine, [args[0] pointerValue], (void *const *)list,
                            (size_t)count);
    free(list);
    return nil;
  }
  if ([op isEqualToString:@"dirty"]) {
    mason_node_mark_dirty(_engine, [args[0] pointerValue]);
    return nil;
  }
  if ([op isEqualToString:@"style"]) {
    XSetStyle(_engine, [args[0] pointerValue], args[1]);
    return nil;
  }
  if ([op isEqualToString:@"compute"]) {
    mason_node_compute_wh(_engine, [args[0] pointerValue], [args[1] floatValue],
                          [args[2] floatValue]);
    return nil;
  }
  if ([op isEqualToString:@"layout"]) {
    XPLLayoutOut = nil;
    mason_node_layout(_engine, [args[0] pointerValue], XPLCollectLayout);
    NSArray<NSNumber *> *out = XPLLayoutOut;
    XPLLayoutOut = nil;
    return out ?: @[];
  }
  if ([op isEqualToString:@"natural"]) {
    XPLLayoutOut = nil;
    mason_node_compute_max_content_and_layout(_engine, [args[0] pointerValue],
                                              XPLCollectLayout);
    NSArray<NSNumber *> *out = XPLLayoutOut;
    XPLLayoutOut = nil;
    // The root record's width/height are indices 3 and 4.
    if (out.count >= 5) {
      return @[ out[3], out[4] ];
    }
    return @[ @0, @0 ];
  }
  return nil;
}

@end
