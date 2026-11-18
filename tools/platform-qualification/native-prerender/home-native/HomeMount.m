#import "HomeMount.h"

static void Require(BOOL condition, NSString *message) {
    if (!condition) [NSException raise:NSInvalidArgumentException format:@"%@", message];
}
static NSDictionary *Paint(UIView *view) {
    MasonStyle *style = [NSCMason.shared styleForView:view];
    NSMutableDictionary *result = [@{@"backgroundColor":@(style.backgroundColor),@"borderRadius":style.borderRadius,@"cornerShape":style.cornerShape,@"alpha":@(view.alpha),@"overflowX":@(style.overflowX),@"overflowY":@(style.overflowY)} mutableCopy];
    if ([view isKindOfClass:MasonUIView.class]) {
        MasonUIView *mason = (MasonUIView *)view;
        result[@"scrollContainer"] = @(mason.isScrollContainer);
        result[@"contentOffset"] = @[@(mason.contentOffset.x), @(mason.contentOffset.y)];
    }
    result[@"layoutValues"] = [view valueForKey:@"prerenderLayoutValues"];
    result[@"effectiveRadii"] = [view valueForKey:@"prerenderEffectiveRadii"];
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
    // A live placeholder replacement is foreign to Mason: do not ask Mason for
    // a style, which would lazily adopt it into the node tree.
    BOOL indicator=[view isKindOfClass:UIActivityIndicatorView.class];
    [rows addObject:@{@"paint":indicator ? @{@"alpha":@(view.alpha)} : Paint(view),@"path":path,@"kind":indicator ? @"activityindicator":(label ? @"label":(((MasonUIView *)view).isScrollContainer ? @"scrollview" : @"masonview")),@"text":label ? (((UILabel *)view).text ?: @"") : @"",@"frame":@{@"x":@(frame.origin.x),@"y":@(frame.origin.y),@"width":@(frame.size.width),@"height":@(frame.size.height)}}];
    // Only artifact kinds: a Screen attaches its overlay RootLayout (a plain
    // UIView) after hydration, outside the startup artifact.
    if (!label && !indicator) {
        NSUInteger slot = 0;
        for (UIView *child in view.subviews) {
            if (![child isKindOfClass:MasonUIView.class] && ![child isKindOfClass:UILabel.class] && ![child isKindOfClass:UIActivityIndicatorView.class]) continue;
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
