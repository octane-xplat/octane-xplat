#import <UIKit/UIKit.h>
#import <MasonCore/MasonCore-Swift.h>
#import "MasonMount.h"
NS_ASSUME_NONNULL_BEGIN
// Native-side handover for the installable startup mount. The Swift bootstrap
// installs its mount/viewport plus the launch bind, theme, window and any
// rejection here; the JavaScript startup entry (renderWithStartup) reads them
// to adopt or fall back. Qualification hosts share the same statics.
@interface PrerenderMountHost : NSObject
@property (class, nonatomic, nullable) XplatMasonMount *mount;
@property (class, nonatomic, nullable) MasonUIView *viewport;
@property (class, nonatomic, nullable) UIWindow *window;
/// JSON of the artifact bind the native mount selected (canonical sorted keys).
@property (class, nonatomic, nullable) NSString *bind;
/// The appearance the mount used: "dark" or "light".
@property (class, nonatomic, nullable) NSString *theme;
/// Non-nil when artifact decode/preflight/selection rejected before mount.
@property (class, nonatomic, nullable) NSString *rejection;
@end
NS_ASSUME_NONNULL_END
