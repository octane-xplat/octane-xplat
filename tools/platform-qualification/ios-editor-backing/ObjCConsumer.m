#import <UIKit/UIKit.h>
#import "SurfaceProbe-Swift.h"
UIView *makeEditorSurface(void) {
    XplatEditorSurfaceProbe *probe = [XplatEditorSurfaceProbe new];
    [probe undo];
    return probe.view;
}
