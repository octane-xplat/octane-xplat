#import "HomeMount.h"
#import "FontLowering.h"
#import "UIView+NativeScript.h"
#import <TNSWidgets/TNSWidgets.h>

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
    NSSet *known = [NSSet setWithArray:@[@"display", @"flexDirection", @"flexGrow", @"flexShrink", @"paddingTop", @"paddingRight", @"paddingBottom", @"paddingLeft", @"rowGap", @"columnGap", @"backgroundColor", @"color", @"fontSize", @"fontWeight", @"fontFamily", @"justifyContent", @"alignItems", @"borderRadius", @"borderWidth", @"cornerShape", @"whiteSpace", @"textOverflow", @"minWidth", @"maxWidth", @"height", @"lineHeight", @"userSelect"]];
    for (NSString *key in values) Require([known containsObject:key], [@"Unsupported property: " stringByAppendingString:key]);
    if (values[@"display"]) { Require([values[@"display"] isEqual:@"flex"], @"Unsupported display"); style.display = MasonDisplayFlex; }
    if (values[@"flexDirection"]) {
        Require([@[@"row",@"column"] containsObject:values[@"flexDirection"]], @"Unsupported flex direction");
        style.flexDirection = [values[@"flexDirection"] isEqual:@"column"] ? MasonFlexDirectionColumn : MasonFlexDirectionRow;
    }
    if (values[@"flexGrow"]) style.flexGrow = [values[@"flexGrow"] floatValue];
    if (values[@"flexShrink"]) style.flexShrink = [values[@"flexShrink"] floatValue];
    if (values[@"paddingTop"]) [style setPaddingTop:[values[@"paddingTop"] floatValue]*scale :0];
    if (values[@"paddingRight"]) [style setPaddingRight:[values[@"paddingRight"] floatValue]*scale :0];
    if (values[@"paddingBottom"]) [style setPaddingBottom:[values[@"paddingBottom"] floatValue]*scale :0];
    if (values[@"paddingLeft"]) [style setPaddingLeft:[values[@"paddingLeft"] floatValue]*scale :0];
    if (values[@"rowGap"]) [style setRowGap:[values[@"rowGap"] floatValue]*scale :0];
    if (values[@"columnGap"]) [style setColumnGap:[values[@"columnGap"] floatValue]*scale :0];
    if (values[@"minWidth"]) [style setMinSizeWidth:[values[@"minWidth"] floatValue]*scale :MasonDimensionCompatTypePoints];
    if (values[@"maxWidth"]) { Require([values[@"maxWidth"] isEqual:@"100%"], @"Unsupported maximum width"); [style setMaxSizeWidth:1 :MasonDimensionCompatTypePercent]; }
    if (values[@"height"]) [style setSizeHeight:[values[@"height"] floatValue]*scale :MasonDimensionCompatTypePoints];
    if (values[@"borderWidth"]) { Require([values[@"borderWidth"] doubleValue] == 0, @"Unsupported border width"); [style setBorderWidth:0 :0]; }
    if (values[@"alignItems"]) { Require([values[@"alignItems"] isEqual:@"center"], @"Unsupported alignment"); style.alignItems = MasonAlignItemsCenter; }
    if (values[@"justifyContent"]) {
        Require([@[@"center",@"space-between"] containsObject:values[@"justifyContent"]], @"Unsupported justification");
        style.justifyContent = [values[@"justifyContent"] isEqual:@"center"] ? MasonJustifyContentCenter : MasonJustifyContentSpaceBetween;
    }
    if (values[@"backgroundColor"]) style.backgroundColor = ARGB(Color(values[@"backgroundColor"]));
    if (values[@"borderRadius"]) style.borderRadius = [NSString stringWithFormat:@"%gpx", [values[@"borderRadius"] doubleValue]*scale];
    if (values[@"cornerShape"]) style.cornerShape = values[@"cornerShape"];
    // Font/color inheritance was resolved by the producer. Container values do not paint text.
    if ([view isKindOfClass:UILabel.class]) {
        UILabel *label = (UILabel *)view;
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
    }
    // userSelect is not a native Style paint property in the live reference.
    [style updateNativeStyle];
}
static NSDictionary *Paint(UIView *view) {
    MasonStyle *style = [NSCMason.shared styleForView:view];
    NSMutableDictionary *result = [@{@"backgroundColor":@(style.backgroundColor),@"borderRadius":style.borderRadius,@"cornerShape":style.cornerShape} mutableCopy];
    if ([view isKindOfClass:UILabel.class]) {
        UILabel *label = (UILabel *)view;
        CGFloat r, g, b, a;
        Require([label.textColor getRed:&r green:&g blue:&b alpha:&a], @"Expected a resolved text color");
        result[@"textColor"] = @[@(r),@(g),@(b),@(a)];
        UIFont *font = label.font;
        if (label.attributedText.length > 0) {
            id attributedFont = [label.attributedText attribute:NSFontAttributeName atIndex:0 effectiveRange:NULL];
            if ([attributedFont isKindOfClass:UIFont.class]) font = attributedFont;
        }
        result[@"font"] = @{@"fontName":font.fontName,@"pointSize":@(font.pointSize),@"ascender":@(font.ascender),@"descender":@(font.descender),@"lineHeight":@(font.lineHeight),@"leading":@(font.leading),@"capHeight":@(font.capHeight),@"xHeight":@(font.xHeight)};
    }
    return result;
}
static void Snapshot(UIView *view, NSString *path, NSMutableArray *rows) {
    CGRect frame=view.frame;
    BOOL label=[view isKindOfClass:UILabel.class];
    [rows addObject:@{@"paint":Paint(view),@"path":path,@"kind":label ? @"label":@"masonview",@"text":label ? (((UILabel *)view).text ?: @"") : @"",@"frame":@{@"x":@(frame.origin.x),@"y":@(frame.origin.y),@"width":@(frame.size.width),@"height":@(frame.size.height)}}];
    if (!label) for (NSUInteger index=0;index<view.subviews.count;index++) Snapshot(view.subviews[index],[path stringByAppendingFormat:@"/%lu",(unsigned long)index],rows);
}
@implementation PrerenderHomeMount
+ (MasonUIView *)mount:(NSDictionary *)artifact theme:(NSString *)theme scale:(CGFloat)scale {
    NSArray *records = artifact[@"nodes"];
    NSArray *styles = artifact[@"variants"][theme];
    Require(records.count == 19 && styles.count == records.count, @"Unexpected first-screen topology");
    Require(scale > 0 && isfinite(scale), @"Invalid owning screen scale");
    NSMutableArray<UIView *> *views = [NSMutableArray new];
    // Validate parent ordering before creation. The trusted producer supplies the property contract.
    for (NSUInteger index=0; index<records.count; index++) {
        NSDictionary *record = records[index];
        Require([record[@"index"] unsignedIntegerValue] == index && [styles[index][@"index"] unsignedIntegerValue] == index, @"Noncanonical index");
        Require([@[@"masonview",@"label"] containsObject:record[@"kind"]], @"Unknown host kind");
        Require(index == 0 ? record[@"parent"] == NSNull.null : [record[@"parent"] unsignedIntegerValue] < index, @"Invalid parent ordering");
    }
    [NSCMason.shared setDeviceScale:scale];
    for (NSUInteger index=0; index<records.count; index++) {
        NSDictionary *record = records[index];
        UIView *view;
        if ([record[@"kind"] isEqual:@"label"]) { TNSLabel *label = [TNSLabel new]; label.text = record[@"text"]; view=label; }
        else view = [NSCMason.shared createView];
        view.accessibilityIdentifier = [NSString stringWithFormat:@"prerender-%lu", (unsigned long)index];
        [views addObject:view];
        if (index > 0) { UIView *parent=views[[record[@"parent"] unsignedIntegerValue]]; Require([parent isKindOfClass:MasonUIView.class], @"Label cannot contain visual children"); [(MasonUIView *)parent addView:view]; }
        Apply(view, styles[index][@"style"], scale);
    }
    return (MasonUIView *)views[0];
}
+ (NSArray<NSDictionary *> *)snapshot:(MasonUIView *)root {
    NSMutableArray *rows=[NSMutableArray new];
    Snapshot(root,@"0",rows);
    return rows;
}
@end
