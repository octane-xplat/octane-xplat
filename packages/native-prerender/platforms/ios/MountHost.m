#import "MountHost.h"

static XplatMasonMount *CurrentMount;
static MasonUIView *CurrentViewport;
static UIWindow *CurrentWindow;
static NSString *CurrentBind;
static NSString *CurrentTheme;
static NSString *CurrentRejection;

@implementation PrerenderMountHost
+ (XplatMasonMount *)mount { return CurrentMount; }
+ (void)setMount:(XplatMasonMount *)mount { CurrentMount = mount; }
+ (MasonUIView *)viewport { return CurrentViewport; }
+ (void)setViewport:(MasonUIView *)viewport { CurrentViewport = viewport; }
+ (UIWindow *)window { return CurrentWindow; }
+ (void)setWindow:(UIWindow *)window { CurrentWindow = window; }
+ (NSString *)bind { return CurrentBind; }
+ (void)setBind:(NSString *)bind { CurrentBind = bind; }
+ (NSString *)theme { return CurrentTheme; }
+ (void)setTheme:(NSString *)theme { CurrentTheme = theme; }
+ (NSString *)rejection { return CurrentRejection; }
+ (void)setRejection:(NSString *)rejection { CurrentRejection = rejection; }
@end
