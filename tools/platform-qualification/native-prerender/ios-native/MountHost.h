#import <UIKit/UIKit.h>
#import <MasonCore/MasonCore-Swift.h>
#import "MasonMount.h"
NS_ASSUME_NONNULL_BEGIN
// Native-side handover for the bounded mount controls. The Swift host installs
// its mount/viewport here for the JS adoption fixture; lifetime controls must
// clear both before weak-reference observation.
@interface PrerenderMountHost : NSObject
@property (class, nonatomic, nullable) XplatMasonMount *mount;
@property (class, nonatomic, nullable) MasonUIView *viewport;
@end
NS_ASSUME_NONNULL_END
