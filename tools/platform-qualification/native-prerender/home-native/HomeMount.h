#import <UIKit/UIKit.h>
#import <MasonCore/MasonCore-Swift.h>
NS_ASSUME_NONNULL_BEGIN
// Disposable semantic mounting probe. This is not the production IR reader.
@interface PrerenderHomeMount : NSObject
+ (MasonUIView *)mount:(NSDictionary *)artifact theme:(NSString *)theme scale:(CGFloat)scale;
+ (NSArray<NSDictionary *> *)snapshot:(MasonUIView *)root;
@end
NS_ASSUME_NONNULL_END
