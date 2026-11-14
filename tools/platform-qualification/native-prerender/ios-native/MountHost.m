#import "MountHost.h"

static XplatMasonMount *CurrentMount;
static MasonUIView *CurrentViewport;

@implementation PrerenderMountHost
+ (XplatMasonMount *)mount { return CurrentMount; }
+ (void)setMount:(XplatMasonMount *)mount { CurrentMount = mount; }
+ (MasonUIView *)viewport { return CurrentViewport; }
+ (void)setViewport:(MasonUIView *)viewport { CurrentViewport = viewport; }
@end
