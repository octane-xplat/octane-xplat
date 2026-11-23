#import "XplatViewTree.h"
#import <AppKit/AppKit.h>

@implementation XplatViewTree

+ (void)insertView:(NSView *)child intoParent:(NSView *)parent atIndex:(NSInteger)index {
    NSArray<NSView *> *siblings = parent.subviews;
    if (index < 0 || (NSUInteger)index >= siblings.count) {
        [parent addSubview:child];
        return;
    }
    [parent addSubview:child positioned:NSWindowBelow relativeTo:siblings[(NSUInteger)index]];
}

+ (void)detachViewTree:(NSView *)view {
    if ([view isKindOfClass:[NSScrollView class]]) {
        NSScrollView *scroll = (NSScrollView *)view;
        NSView *document = scroll.documentView;
        scroll.documentView = nil;
        if (document) {
            [self detachViewTree:document];
        }
    } else {
        for (NSView *child in [view.subviews reverseObjectEnumerator]) {
            if (child.superview == view) {
                [self detachViewTree:child];
            }
        }
    }
    [view removeFromSuperview];
}

@end
