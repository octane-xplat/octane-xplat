#import <UIKit/UIKit.h>
#import <MasonCore/MasonCore-Swift.h>
NS_ASSUME_NONNULL_BEGIN
// Qualification-only native style and geometry observation.
@interface PrerenderHomeMount : NSObject
+ (NSArray<NSDictionary *> *)snapshot:(MasonUIView *)root;
@end
NS_ASSUME_NONNULL_END
