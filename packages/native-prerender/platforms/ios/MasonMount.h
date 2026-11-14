#import <UIKit/UIKit.h>
#import <MasonCore/MasonCore-Swift.h>
NS_ASSUME_NONNULL_BEGIN
// Consume only the projection returned by XplatMasonArtifact.decode.
// The caller owns window attachment, adoption and disposal of the returned tree.
@interface XplatMasonMount : NSObject
+ (UIView *)mount:(NSDictionary *)artifact theme:(NSString *)theme scale:(CGFloat)scale;
@end
NS_ASSUME_NONNULL_END
