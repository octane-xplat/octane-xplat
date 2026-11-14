#import <UIKit/UIKit.h>
#import <MasonCore/MasonCore-Swift.h>
NS_ASSUME_NONNULL_BEGIN
// Consume only the projection returned by XplatMasonArtifact.decode.
// The caller owns window attachment, adoption and disposal of the returned tree.
@interface XplatMasonMount : NSObject
@property (nonatomic, readonly) UIView *root;
@property (nonatomic, readonly) NSArray<UIView *> *views;
+ (instancetype)mount:(NSDictionary *)artifact theme:(NSString *)theme scale:(CGFloat)scale;
// Restores the captured borderRadius, and Label font/textColor. Raises if called twice.
- (void)restoreDefaults;
@end
NS_ASSUME_NONNULL_END
