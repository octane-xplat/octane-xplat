#import "HomeMount.h"
#import <TNSWidgets/TNSWidgets.h>

static void Require(BOOL condition, NSString *message) {
    if (!condition) [NSException raise:NSInvalidArgumentException format:@"%@", message];
}
static NSArray<NSNumber *> *Rgba(UIColor *color) {
    if (!color) return nil;
    CGFloat r, g, b, a;
    if (![color getRed:&r green:&g blue:&b alpha:&a]) return nil;
    return @[@(r),@(g),@(b),@(a)];
}
static NSArray<NSNumber *> *Insets(UIEdgeInsets insets) {
    return @[@(insets.left),@(insets.top),@(insets.right),@(insets.bottom)];
}
static NSDictionary *Paint(UIView *view) {
    MasonStyle *style = [NSCMason.shared styleForView:view];
    NSMutableDictionary *result = [@{@"backgroundColor":@(style.backgroundColor),@"borderRadius":style.borderRadius,@"cornerShape":style.cornerShape,@"alpha":@(view.alpha),@"overflowX":@(style.overflowX),@"overflowY":@(style.overflowY)} mutableCopy];
    MasonLengthPercentageRectCompat *border = style.borderWidthCompat;
    result[@"borderWidths"] = @[border.top.cssValue, border.right.cssValue, border.bottom.cssValue, border.left.cssValue];
    if ([view isKindOfClass:MasonUIView.class]) {
        MasonUIView *mason = (MasonUIView *)view;
        result[@"scrollContainer"] = @(mason.isScrollContainer);
        result[@"contentOffset"] = @[@(mason.contentOffset.x), @(mason.contentOffset.y)];
    }
    result[@"layoutValues"] = [view valueForKey:@"prerenderLayoutValues"];
    result[@"effectiveRadii"] = [view valueForKey:@"prerenderEffectiveRadii"];
    if ([view isKindOfClass:UILabel.class]) {
        UILabel *label = (UILabel *)view;
        NSArray<NSNumber *> *textColor = Rgba(label.textColor);
        Require(textColor != nil, @"Expected a resolved text color");
        result[@"textColor"] = textColor;
        result[@"textAlignment"] = @(label.textAlignment);
        if ([view isKindOfClass:TNSLabel.class]) {
            TNSLabel *tns = (TNSLabel *)view;
            result[@"labelPadding"] = Insets(tns.padding);
            result[@"borderThickness"] = Insets(tns.borderThickness);
        }
        CALayer *layer = view.layer;
        result[@"layer"] = @{@"backgroundColor":layer.backgroundColor ? (Rgba([UIColor colorWithCGColor:layer.backgroundColor]) ?: [NSNull null]) : [NSNull null],
            @"borderColor":layer.borderColor ? (Rgba([UIColor colorWithCGColor:layer.borderColor]) ?: [NSNull null]) : [NSNull null],
            @"borderWidth":@(layer.borderWidth),@"cornerRadius":@(layer.cornerRadius),
            @"cornerCurve":layer.cornerCurve,@"masksToBounds":@(layer.masksToBounds)};
        result[@"viewBackground"] = Rgba(view.backgroundColor) ?: [NSNull null];
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
    // A live placeholder replacement is foreign to Mason: do not ask Mason for
    // a style, which would lazily adopt it into the node tree. Known
    // replacements: UIActivityIndicatorView (activityindicator), the vendored
    // ui-svg SVGKFastImageView (svgview) and UIImageView (image). SVGKFastImageView
    // is checked first in case it subclasses UIImageView.
    Class svgClass=NSClassFromString(@"SVGKFastImageView");
    BOOL indicator=[view isKindOfClass:UIActivityIndicatorView.class];
    BOOL svg=svgClass!=nil&&[view isKindOfClass:svgClass];
    BOOL image=!svg&&[view isKindOfClass:UIImageView.class];
    BOOL foreign=indicator||svg||image;
    [rows addObject:@{@"paint":foreign ? @{@"alpha":@(view.alpha)} : Paint(view),@"path":path,@"kind":indicator ? @"activityindicator":(svg ? @"svgview":(image ? @"image":(label ? @"label":(((MasonUIView *)view).isScrollContainer ? @"scrollview" : @"masonview")))),@"text":label ? (((UILabel *)view).text ?: @"") : @"",@"frame":@{@"x":@(frame.origin.x),@"y":@(frame.origin.y),@"width":@(frame.size.width),@"height":@(frame.size.height)}}];
    // Only artifact kinds: a Screen attaches its overlay RootLayout (a plain
    // UIView) after hydration, outside the startup artifact.
    if (!label && !foreign) {
        NSUInteger slot = 0;
        for (UIView *child in view.subviews) {
            if (![child isKindOfClass:MasonUIView.class] && ![child isKindOfClass:UILabel.class] && ![child isKindOfClass:UIActivityIndicatorView.class] && ![child isKindOfClass:UIImageView.class] && !(svgClass!=nil&&[child isKindOfClass:svgClass])) continue;
            Snapshot(child, [path stringByAppendingFormat:@"/%lu", (unsigned long)slot++], rows);
        }
    }
}
@implementation PrerenderHomeMount
+ (NSArray<NSDictionary *> *)snapshot:(MasonUIView *)root {
    NSMutableArray *rows=[NSMutableArray new];
    Snapshot(root,@"0",rows);
    return rows;
}
@end
