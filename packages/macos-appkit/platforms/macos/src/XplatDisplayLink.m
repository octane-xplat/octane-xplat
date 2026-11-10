#import "XplatDisplayLink.h"
#import <AppKit/AppKit.h>
#import <QuartzCore/QuartzCore.h>
#import <CoreVideo/CoreVideo.h>
#import <objc/message.h>

// Core Video's real-time thread touches only a native dispatch source. DATA_OR
// coalesces refreshes while the UI thread is busy; it never queues JS work.
static CVReturn refresh(CVDisplayLinkRef link, const CVTimeStamp *now,
                        const CVTimeStamp *output, CVOptionFlags flags,
                        CVOptionFlags *outFlags, void *context) {
    dispatch_source_merge_data((__bridge dispatch_source_t)context, 1);
    return kCVReturnSuccess;
}

@implementation XplatDisplayLink {
    CADisplayLink *_caLink API_AVAILABLE(macos(14.0));
    CVDisplayLinkRef _cvLink;
    dispatch_source_t _source;
    id _target;
    SEL _selector;
    NSUInteger _generation;
    NSUInteger _deliveryCount;
}

+ (double)nowMS { return CACurrentMediaTime() * 1000.0; }
- (BOOL)running { return _target != nil; }
- (NSUInteger)deliveryCount { return _deliveryCount; }
- (NSString *)backend {
    if (@available(macOS 14.0, *)) return @"CADisplayLink";
    return @"CVDisplayLink";
}

- (BOOL)startWithTarget:(id)target selector:(SEL)selector {
    NSAssert(NSThread.isMainThread, @"Display link must start on the UI thread");
    [self stop];
    _target = target;
    _selector = selector;
    if (@available(macOS 14.0, *)) {
        NSScreen *screen = NSScreen.mainScreen;
        if (!screen) { [self stop]; return NO; }
        _caLink = [screen displayLinkWithTarget:self selector:@selector(frame:)];
        if (!_caLink) { [self stop]; return NO; }
        [_caLink addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
        return YES;
    }
    _source = dispatch_source_create(DISPATCH_SOURCE_TYPE_DATA_OR, 0, 0, dispatch_get_main_queue());
    NSUInteger generation = _generation;
    __weak XplatDisplayLink *weakSelf = self;
    dispatch_source_set_event_handler(_source, ^{
        XplatDisplayLink *owner = weakSelf;
        if (owner && owner->_generation == generation) [owner frame:nil];
    });
    dispatch_resume(_source);
    if (CVDisplayLinkCreateWithActiveCGDisplays(&_cvLink) != kCVReturnSuccess ||
        CVDisplayLinkSetOutputCallback(_cvLink, refresh, (__bridge void *)_source) != kCVReturnSuccess ||
        CVDisplayLinkStart(_cvLink) != kCVReturnSuccess) {
        [self stop];
        return NO;
    }
    return YES;
}

- (void)frame:(id)sender {
    NSAssert(NSThread.isMainThread, @"Display link delivered outside the UI thread");
    if (!_target) return;
    if (@available(macOS 14.0, *)) {
        // An invalidated link must not dispatch into a restarted owner's target.
        if (sender != _caLink) return;
    }
    _deliveryCount++;
    // Delivery time shares mach_absolute_time's epoch with host performance.now().
    // Do not pass a predicted presentation time to engines reading current time.
    ((void (*)(id, SEL, double))objc_msgSend)(_target, _selector, XplatDisplayLink.nowMS);
}

- (void)stop {
    _generation++;
    _target = nil;
    _selector = NULL;
    if (@available(macOS 14.0, *)) {
        [_caLink invalidate];
        _caLink = nil;
    }
    if (_cvLink) {
        // Stop quiesces the real-time callback before its source is released.
        CVDisplayLinkStop(_cvLink);
        CVDisplayLinkRelease(_cvLink);
        _cvLink = NULL;
    }
    if (_source) {
        dispatch_source_cancel(_source);
        _source = nil;
    }
}

- (void)dealloc { [self stop]; }
@end
