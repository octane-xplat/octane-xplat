#import <Foundation/Foundation.h>

@class NSView;

// Keep AppKit child collection reads on the native side of the bridge.
@interface XplatViewTree : NSObject
+ (void)insertView:(NSView *)child intoParent:(NSView *)parent atIndex:(NSInteger)index;
+ (void)detachViewTree:(NSView *)view;
@end
