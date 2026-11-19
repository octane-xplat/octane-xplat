#import "MasonMount.h"
#import <float.h>
#import "FontLowering.h"
#import "UIView+NativeScript.h"
#import <TNSWidgets/TNSWidgets.h>

static NSDictionary *CaptureDefaults(UIView *view) {
    MasonStyle *style = [NSCMason.shared styleForView:view];
    NSMutableDictionary *defaults = [@{@"borderRadius":style.borderRadius.length ? style.borderRadius : @"0", @"alpha":@(view.alpha),
        // The per-side shorthand resets a side to width0/none/clear on "".
        @"borderSide":style.borderTop ?: @""} mutableCopy];
    if ([view isKindOfClass:UILabel.class]) {
        UILabel *label = (UILabel *)view;
        defaults[@"font"] = label.font;
        defaults[@"textColor"] = label.textColor;
        defaults[@"textAlignment"] = @(label.textAlignment);
        if (label.backgroundColor) defaults[@"viewBackgroundColor"] = label.backgroundColor;
        if ([view isKindOfClass:TNSLabel.class]) {
            TNSLabel *tns = (TNSLabel *)view;
            defaults[@"padding"] = [NSValue valueWithUIEdgeInsets:tns.padding];
            defaults[@"borderThickness"] = [NSValue valueWithUIEdgeInsets:tns.borderThickness];
        }
        CALayer *layer = view.layer;
        defaults[@"layerBorderWidth"] = @(layer.borderWidth);
        if (layer.borderColor) defaults[@"layerBorderColor"] = (__bridge id)layer.borderColor;
        if (layer.backgroundColor) defaults[@"layerBackgroundColor"] = (__bridge id)layer.backgroundColor;
        defaults[@"layerCornerRadius"] = @(layer.cornerRadius);
        defaults[@"layerCornerCurve"] = layer.cornerCurve;
    }
    return defaults;
}
static void Require(BOOL condition, NSString *message) {
    if (!condition) [NSException raise:NSInvalidArgumentException format:@"%@", message];
}
static UIColor *Color(NSString *source) {
    if ([source hasPrefix:@"#"] && source.length == 7) {
        unsigned value = 0;
        Require([[NSScanner scannerWithString:[source substringFromIndex:1]] scanHexInt:&value], @"Invalid hex color");
        return [UIColor colorWithRed:((value >> 16) & 255)/255.0 green:((value >> 8) & 255)/255.0 blue:(value & 255)/255.0 alpha:1];
    }
    double r, g, b, a;
    Require(sscanf(source.UTF8String, "rgba(%lf, %lf, %lf, %lf)", &r, &g, &b, &a) == 4, @"Unsupported color");
    return [UIColor colorWithRed:r/255 green:g/255 blue:b/255 alpha:a];
}
static uint32_t ARGB(UIColor *color) {
    CGFloat r, g, b, a;
    Require([color getRed:&r green:&g blue:&b alpha:&a], @"Expected resolved background color");
    // Match NativeScript Color's byte rounding; UIColor-to-Mason conversion truncates alpha.
    return ((uint32_t)lround(a*255) << 24) | ((uint32_t)lround(r*255) << 16) | ((uint32_t)lround(g*255) << 8) | (uint32_t)lround(b*255);
}
static void Apply(UIView *view, NSDictionary *values, CGFloat scale) {
    MasonStyle *style = [NSCMason.shared styleForView:view];
    NSSet *known = [NSSet setWithArray:@[@"display", @"flexDirection", @"flexGrow", @"flexShrink", @"paddingTop", @"paddingRight", @"paddingBottom", @"paddingLeft", @"rowGap", @"columnGap", @"backgroundColor", @"borderColor", @"color", @"fontSize", @"fontWeight", @"fontFamily", @"justifyContent", @"justifySelf", @"alignItems", @"borderRadius", @"borderWidth", @"cornerShape", @"whiteSpace", @"textOverflow", @"minWidth", @"minHeight", @"maxWidth", @"height", @"lineHeight", @"userSelect", @"opacity", @"maxHeight", @"overflowX", @"overflowY", @"alignSelf", @"width", @"gridRow", @"gridColumn", @"gridTemplateRows", @"gridTemplateColumns", @"textAlign"]];
    for (NSString *key in values) Require([known containsObject:key], [@"Unsupported property: " stringByAppendingString:key]);
    // The driver's foreign-leaf sync (MASON_LEAF_STYLE_KEYS) only forwards the
    // layout subset into a foreign view's Mason buffer; a label's padding,
    // border, background and text paint live on the native view instead.
    BOOL label = [view isKindOfClass:UILabel.class];
    if (values[@"display"]) {
        Require([values[@"display"] isEqual:@"flex"] || [values[@"display"] isEqual:@"block"] || [values[@"display"] isEqual:@"grid"], @"Unsupported display");
        style.display = [values[@"display"] isEqual:@"flex"] ? MasonDisplayFlex : [values[@"display"] isEqual:@"grid"] ? MasonDisplayGrid : MasonDisplayBlock;
    }
    if (values[@"gridRow"]) { Require([values[@"gridRow"] isEqual:@"1"], @"Unsupported grid row"); style.gridRow = values[@"gridRow"]; }
    if (values[@"gridColumn"]) { Require([values[@"gridColumn"] isEqual:@"1"], @"Unsupported grid column"); style.gridColumn = values[@"gridColumn"]; }
    if (!label && values[@"gridTemplateRows"]) { Require([values[@"gridTemplateRows"] isEqual:@"1fr"], @"Unsupported grid template rows"); style.gridTemplateRows = values[@"gridTemplateRows"]; }
    if (!label && values[@"gridTemplateColumns"]) { Require([values[@"gridTemplateColumns"] isEqual:@"1fr"], @"Unsupported grid template columns"); style.gridTemplateColumns = values[@"gridTemplateColumns"]; }
    if (!label && values[@"flexDirection"]) {
        Require([@[@"row",@"column"] containsObject:values[@"flexDirection"]], @"Unsupported flex direction");
        style.flexDirection = [values[@"flexDirection"] isEqual:@"column"] ? MasonFlexDirectionColumn : MasonFlexDirectionRow;
    }
    if (values[@"flexGrow"]) style.flexGrow = [values[@"flexGrow"] floatValue];
    if (values[@"flexShrink"]) style.flexShrink = [values[@"flexShrink"] floatValue];
    if (!label) {
        if (values[@"paddingTop"]) [style setPaddingTop:[values[@"paddingTop"] floatValue]*scale :0];
        if (values[@"paddingRight"]) [style setPaddingRight:[values[@"paddingRight"] floatValue]*scale :0];
        if (values[@"paddingBottom"]) [style setPaddingBottom:[values[@"paddingBottom"] floatValue]*scale :0];
        if (values[@"paddingLeft"]) [style setPaddingLeft:[values[@"paddingLeft"] floatValue]*scale :0];
    }
    if (!label && values[@"rowGap"]) [style setRowGap:[values[@"rowGap"] floatValue]*scale :0];
    if (!label && values[@"columnGap"]) [style setColumnGap:[values[@"columnGap"] floatValue]*scale :0];
    if (values[@"minWidth"]) [style setMinSizeWidth:[values[@"minWidth"] floatValue]*scale :MasonDimensionCompatTypePoints];
    if (values[@"minHeight"]) [style setMinSizeHeight:[values[@"minHeight"] floatValue]*scale :MasonDimensionCompatTypePoints];
    if (values[@"maxWidth"]) { Require([values[@"maxWidth"] isEqual:@"100%"], @"Unsupported maximum width"); [style setMaxSizeWidth:1 :MasonDimensionCompatTypePercent]; }
    if (values[@"maxHeight"]) { Require([values[@"maxHeight"] isEqual:@"100%"], @"Unsupported maximum height"); [style setMaxSizeHeight:1 :MasonDimensionCompatTypePercent]; }
    if (!label && values[@"overflowX"]) style.overflowX = [values[@"overflowX"] isEqual:@"scroll"] ? MasonOverflowScroll : MasonOverflowHidden;
    if (!label && values[@"overflowY"]) style.overflowY = [values[@"overflowY"] isEqual:@"scroll"] ? MasonOverflowScroll : MasonOverflowHidden;
    if ([values[@"height"] isKindOfClass:NSString.class]) { Require([values[@"height"] isEqual:@"100%"], @"Unsupported height"); [style setSizeHeight:1 :MasonDimensionCompatTypePercent]; }
    else if (values[@"height"]) [style setSizeHeight:[values[@"height"] floatValue]*scale :MasonDimensionCompatTypePoints];
    if ([values[@"width"] isKindOfClass:NSString.class]) { Require([values[@"width"] isEqual:@"100%"], @"Unsupported width"); [style setSizeWidth:1 :MasonDimensionCompatTypePercent]; }
    else if (values[@"width"]) [style setSizeWidth:[values[@"width"] floatValue]*scale :MasonDimensionCompatTypePoints];
    if (values[@"alignSelf"]) {
        Require([values[@"alignSelf"] isEqual:@"stretch"] || [values[@"alignSelf"] isEqual:@"center"], @"Unsupported self alignment");
        style.alignSelf = [values[@"alignSelf"] isEqual:@"center"] ? MasonAlignSelfCenter : MasonAlignSelfStretch;
    }
    if (values[@"justifySelf"]) {
        Require([values[@"justifySelf"] isEqual:@"stretch"] || [values[@"justifySelf"] isEqual:@"center"], @"Unsupported self justification");
        style.justifySelf = [values[@"justifySelf"] isEqual:@"center"] ? MasonJustifySelfCenter : MasonJustifySelfStretch;
    }
    if (!label) {
        // Live forwards the border-width/border-color longhands into the
        // buffer exactly; the IR carries no border-style, so write the
        // longhands without inventing one — a side only paints where live's
        // buffer also has a non-none style. The bulk setBorderWidth setter
        // assigns padding in this SDK; use the individual edge setters.
        if (values[@"borderWidth"]) {
            float width = [values[@"borderWidth"] doubleValue]*scale;
            [style setBorderTopWidth:width :0];
            [style setBorderRightWidth:width :0];
            [style setBorderBottomWidth:width :0];
            [style setBorderLeftWidth:width :0];
        }
        if (values[@"borderColor"]) [style setBorderColor:values[@"borderColor"]];
    }
    if (!label && values[@"alignItems"]) { Require([values[@"alignItems"] isEqual:@"center"], @"Unsupported alignment"); style.alignItems = MasonAlignItemsCenter; }
    if (!label && values[@"justifyContent"]) {
        Require([@[@"center",@"space-between"] containsObject:values[@"justifyContent"]], @"Unsupported justification");
        style.justifyContent = [values[@"justifyContent"] isEqual:@"center"] ? MasonJustifyContentCenter : MasonJustifyContentSpaceBetween;
    }
    if (!label && values[@"backgroundColor"]) style.backgroundColor = ARGB(Color(values[@"backgroundColor"]));
    if (!label && values[@"borderRadius"]) style.borderRadius = [NSString stringWithFormat:@"%gpx", [values[@"borderRadius"] doubleValue]];
    if (!label && values[@"cornerShape"]) style.cornerShape = values[@"cornerShape"];
    if (!label && values[@"textAlign"]) {
        Require([@[@"left",@"center",@"right"] containsObject:values[@"textAlign"]], @"Unsupported text alignment");
        style.textAlign = [values[@"textAlign"] isEqual:@"center"] ? MasonTextAlignCenter : [values[@"textAlign"] isEqual:@"left"] ? MasonTextAlignLeft : MasonTextAlignRight;
    }
    // Core 9.1.3 opacity writes UIView.alpha; its getDefault reads it back.
    if (values[@"opacity"]) view.alpha = [values[@"opacity"] doubleValue];
    // Font/color inheritance was resolved by the producer. Container values do not paint text.
    if ([view isKindOfClass:UILabel.class]) {
        UILabel *label = (UILabel *)view;
        TNSLabel *tns = [view isKindOfClass:TNSLabel.class] ? (TNSLabel *)view : nil;
        NSArray *families = values[@"fontFamily"] ? [values[@"fontFamily"] componentsSeparatedByString:@","] : @[];
        NSMutableArray *names = [NSMutableArray new];
        NSCharacterSet *trim = [NSCharacterSet characterSetWithCharactersInString:@" \t\"'"];
        for (NSString *family in families) [names addObject:[family stringByTrimmingCharactersInSet:trim]];
        label.font = [PrerenderFontLowering createFont:@{@"fontFamily":names,@"fontSize":values[@"fontSize"] ?: @17,@"cssFontWeight":values[@"fontWeight"] ?: @400}];
        if (values[@"color"]) label.textColor = Color(values[@"color"]);
        BOOL nowrap = [values[@"whiteSpace"] isEqual:@"nowrap"];
        label.numberOfLines = nowrap ? 1 : 0;
        label.lineBreakMode = [values[@"textOverflow"] isEqual:@"ellipsis"] ? NSLineBreakByTruncatingTail : NSLineBreakByWordWrapping;
        [label nativeScriptSetTextDecorationAndTransform:label.text textDecoration:@"" letterSpacing:0 lineHeight:[values[@"lineHeight"] doubleValue]];
        // Core Label carries padding and border thickness as TNSLabel insets
        // (dips), inside the measured box the foreign leaf reports.
        if (tns && (values[@"paddingTop"] || values[@"paddingRight"] || values[@"paddingBottom"] || values[@"paddingLeft"])) {
            tns.padding = UIEdgeInsetsMake(
                [values[@"paddingTop"] doubleValue], [values[@"paddingLeft"] doubleValue],
                [values[@"paddingBottom"] doubleValue], [values[@"paddingRight"] doubleValue]);
        }
        double borderWidth = [values[@"borderWidth"] doubleValue];
        if (tns && values[@"borderWidth"]) {
            tns.borderThickness = UIEdgeInsetsMake(borderWidth, borderWidth, borderWidth, borderWidth);
        }
        // Core's uniform-border branch paints the border on the layer; the
        // contract's single side values are always uniform.
        if (values[@"borderWidth"] || values[@"borderColor"] || values[@"borderRadius"] || values[@"cornerShape"]) {
            view.layer.borderWidth = borderWidth;
            view.layer.borderColor = values[@"borderColor"] ? Color(values[@"borderColor"]).CGColor : nil;
            view.layer.cornerRadius = [values[@"borderRadius"] doubleValue];
            view.layer.cornerCurve = [values[@"cornerShape"] isEqual:@"squircle"] ? kCACornerCurveContinuous : kCACornerCurveCircular;
        }
        // Label._redrawNativeBackground paints the label background on the
        // layer, leaving the view's own backgroundColor at its default.
        if (values[@"backgroundColor"]) view.layer.backgroundColor = Color(values[@"backgroundColor"]).CGColor;
        // A live label's leaf buffer carries borderRadius "0" once its
        // backgroundInternal border-radius was applied; the painted corner
        // lives on the layer only.
        if (values[@"borderRadius"]) style.borderRadius = @"0";
        if (values[@"textAlign"]) {
            Require([@[@"left",@"center",@"right"] containsObject:values[@"textAlign"]], @"Unsupported text alignment");
            label.textAlignment = [values[@"textAlign"] isEqual:@"center"] ? NSTextAlignmentCenter : [values[@"textAlign"] isEqual:@"left"] ? NSTextAlignmentLeft : NSTextAlignmentRight;
        }
    }
    // userSelect is not a native Style paint property in the live reference.
    [style updateNativeStyle];
}
@implementation XplatMasonMount {
    NSMutableArray<NSDictionary *> *_journals;
    BOOL _restored;
}
+ (instancetype)mount:(NSDictionary *)artifact theme:(NSString *)theme scale:(CGFloat)scale {
    NSArray *records = artifact[@"nodes"];
    NSArray *styles = artifact[@"variants"][theme];
    Require(records.count > 0 && styles.count == records.count, @"Invalid Mason/Label topology");
    Require(NSThread.isMainThread, @"Native mounting requires the UI thread");
    Require(scale > 0 && isfinite(scale), @"Invalid owning screen scale");
    NSMutableArray<UIView *> *views = [NSMutableArray new];
    // The native reader validates every scheme variant before this boundary.
    for (NSUInteger index=0; index<records.count; index++) {
        NSDictionary *record = records[index];
        Require([record[@"index"] unsignedIntegerValue] == index && [styles[index][@"index"] unsignedIntegerValue] == index, @"Noncanonical index");
        Require([@[@"masonview",@"scrollview",@"label",@"placeholder"] containsObject:record[@"kind"]], @"Unknown host kind");
        Require(index == 0 ? record[@"parent"] == NSNull.null : [record[@"parent"] unsignedIntegerValue] < index, @"Invalid parent ordering");
        // Decoding validated property semantics. Check owning-scale conversion
        // for every record before allocating the first native view.
        if (index > 0) Require([@[@"masonview",@"scrollview"] containsObject:records[[record[@"parent"] unsignedIntegerValue]][@"kind"]], @"Only containers can own visual children");
        for (NSString *variant in artifact[@"variants"]) {
            NSArray *rows = artifact[@"variants"][variant];
            Require(rows.count == records.count, @"Style projection differs");
            NSDictionary *values = rows[index][@"style"];
            for (NSString *key in @[@"paddingTop", @"paddingRight", @"paddingBottom", @"paddingLeft", @"rowGap", @"columnGap", @"minWidth", @"minHeight", @"height"]) {
                if (!values[key] || [values[key] isKindOfClass:NSString.class]) continue;
                double pixels = (double)[values[key] floatValue] * scale;
                Require(isfinite(pixels) && pixels <= FLT_MAX, @"Scaled length exceeds native range");
            }
        }
    }
    [NSCMason.shared setDeviceScale:scale];
    XplatMasonMount *mount = [XplatMasonMount new];
    mount->_journals = [NSMutableArray new];
    for (NSUInteger index=0; index<records.count; index++) {
        NSDictionary *record = records[index];
        UIView *view;
        if ([record[@"kind"] isEqual:@"label"]) { TNSLabel *label = [TNSLabel new]; label.userInteractionEnabled = YES; label.text = record[@"text"]; view=label; }
        else {
            view = [NSCMason.shared createView];
            // Mason core Scroll is a plain MasonUIView marked as a scroll container.
            if ([record[@"kind"] isEqual:@"scrollview"]) ((MasonUIView *)view).isScrollContainer = YES;
        }
        view.accessibilityIdentifier = [NSString stringWithFormat:@"prerender-%lu", (unsigned long)index];
        [views addObject:view];
        if (index > 0) { UIView *parent=views[[record[@"parent"] unsignedIntegerValue]]; Require([parent isKindOfClass:MasonUIView.class], @"Label cannot contain visual children"); [(MasonUIView *)parent addView:view]; }
        // Match Core Label creation and the driver foreign-leaf minimum, before authored styles.
        if ([view isKindOfClass:UILabel.class]) [[NSCMason.shared styleForView:view] setMinSizeWidth:0 :MasonDimensionCompatTypePoints];
        [mount->_journals addObject:@{@"view":view, @"defaults":CaptureDefaults(view)}];
        Apply(view, styles[index][@"style"], scale);
    }
    mount->_root = views[0];
    mount->_views = [views copy];
    return mount;
}
// The journal holds this mount's captured defaults; it is not a property of
// the shared native views.
- (void)restoreDefaults {
    Require(!_restored, @"restoreDefaults already invoked");
    _restored = YES;
    for (NSDictionary *journal in _journals) {
        UIView *view = journal[@"view"];
        NSDictionary *defaults = journal[@"defaults"];
        MasonStyle *style = [NSCMason.shared styleForView:view];
        style.borderRadius = defaults[@"borderRadius"];
        view.alpha = [defaults[@"alpha"] doubleValue];
        NSString *border = defaults[@"borderSide"];
        style.borderTop = border;
        style.borderRight = border;
        style.borderBottom = border;
        style.borderLeft = border;
        if ([view isKindOfClass:UILabel.class]) {
            UILabel *label = (UILabel *)view;
            label.font = defaults[@"font"];
            label.textColor = defaults[@"textColor"];
            label.textAlignment = [defaults[@"textAlignment"] integerValue];
            label.backgroundColor = defaults[@"viewBackgroundColor"];
            if ([view isKindOfClass:TNSLabel.class]) {
                TNSLabel *tns = (TNSLabel *)view;
                tns.padding = [defaults[@"padding"] UIEdgeInsetsValue];
                tns.borderThickness = [defaults[@"borderThickness"] UIEdgeInsetsValue];
            }
            view.layer.borderWidth = [defaults[@"layerBorderWidth"] doubleValue];
            view.layer.borderColor = (__bridge CGColorRef)defaults[@"layerBorderColor"];
            view.layer.backgroundColor = (__bridge CGColorRef)defaults[@"layerBackgroundColor"];
            view.layer.cornerRadius = [defaults[@"layerCornerRadius"] doubleValue];
            view.layer.cornerCurve = defaults[@"layerCornerCurve"];
        }
    }
}
@end
