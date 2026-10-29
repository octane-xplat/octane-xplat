#import "XplatShare.h"
#import <AppKit/AppKit.h>

@interface XplatShareOperation : NSObject <NSSharingServicePickerDelegate, NSSharingServiceDelegate>
@property (strong) NSSharingServicePicker *picker;
@property (strong) NSSharingService *service;
@property (weak) NSWindow *window;
@property (copy) NSString *subject;
@property (copy) void (^completion)(NSString *);
@property (strong) id closeObserver;
@property (strong) id terminateObserver;
@property BOOL selected;
- (void)finish:(NSString *)result;
@end

// AppKit delegates are weak. Keep the operation, picker and selected service alive
// until a terminal callback or presenter teardown; overlapping calls do not replace it.
static XplatShareOperation *activeShare;
@implementation XplatShareOperation
- (void)finish:(NSString *)result {
    if (!NSThread.isMainThread) {
        dispatch_async(dispatch_get_main_queue(), ^{ [self finish:result]; }); return;
    }
    if (!self.completion) return;
    __attribute__((objc_precise_lifetime)) XplatShareOperation *keepAlive = self;
    (void)keepAlive;
    void (^done)(NSString *) = self.completion;
    self.completion = nil;
    if (activeShare == self) activeShare = nil;
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    if (self.closeObserver) [center removeObserver:self.closeObserver];
    if (self.terminateObserver) [center removeObserver:self.terminateObserver];
    self.closeObserver = nil; self.terminateObserver = nil;
    self.picker.delegate = nil;
    if (self.service.delegate == self) self.service.delegate = nil;
    // close is available on the host's minimum macOS 13.5. Guard other hosts.
    @try { if (@available(macOS 13.0, *)) [self.picker close]; } @catch (NSException *exception) {}
    self.picker = nil; self.service = nil; self.window = nil;
    done(result);
}
- (id<NSSharingServiceDelegate>)sharingServicePicker:(NSSharingServicePicker *)picker delegateForSharingService:(NSSharingService *)service {
    if (!self.completion || picker != self.picker || (self.service && self.service != service)) return nil;
    self.service = service;
    service.subject = self.subject;
    return self;
}
- (void)sharingServicePicker:(NSSharingServicePicker *)picker didChooseSharingService:(NSSharingService *)service {
    if (!self.completion || picker != self.picker) return;
    if (!service) { if (!self.selected) [self finish:@"cancelled"]; return; }
    if (self.service && self.service != service) return;
    self.service = service; self.selected = YES;
    service.subject = self.subject;
}
- (void)sharingService:(NSSharingService *)service didShareItems:(NSArray *)items {
    if (self.completion && self.service == service) [self finish:@"shared"];
}
- (void)sharingService:(NSSharingService *)service didFailToShareItems:(NSArray *)items error:(NSError *)error {
    if (!self.completion || self.service != service) return;
    BOOL cancelled = [error.domain isEqualToString:NSCocoaErrorDomain] && error.code == NSUserCancelledError;
    [self finish:cancelled ? @"cancelled" : @"unavailable"];
}
- (NSWindow *)sharingService:(NSSharingService *)service sourceWindowForShareItems:(NSArray *)items sharingContentScope:(NSSharingContentScope *)scope {
    return self.completion && self.service == service ? self.window : nil;
}
@end

@implementation XplatShare
+ (void)shareKind:(NSString *)kind value:(NSString *)value subject:(NSString *)subject completion:(void (^)(NSString *))completion {
    if (!NSThread.isMainThread) {
        dispatch_async(dispatch_get_main_queue(), ^{ [self shareKind:kind value:value subject:subject completion:completion]; }); return;
    }
    NSWindow *window = NSApp.keyWindow ?: NSApp.mainWindow;
    NSView *anchor = window.contentView;
    if (activeShare || !window.visible || !anchor || window.attachedSheet || ![value isKindOfClass:NSString.class] || !value.length) {
        completion(@"unavailable"); return;
    }
    NSArray *items;
    if ([kind isEqualToString:@"text"]) {
        items = @[value];
    } else if ([kind isEqualToString:@"url"]) {
        NSURL *url = [NSURL URLWithString:value];
        if (!url || !url.scheme.length || url.isFileURL) { completion(@"unavailable"); return; }
        items = @[url];
    } else if ([kind isEqualToString:@"file"]) {
        // JS normalizes file:// URLs; native callers still must pass a local path.
        BOOL directory = NO;
        if (![value isAbsolutePath] || ![NSFileManager.defaultManager fileExistsAtPath:value isDirectory:&directory] || directory || ![NSFileManager.defaultManager isReadableFileAtPath:value]) {
            completion(@"unavailable"); return;
        }
        items = @[[NSURL fileURLWithPath:value]];
    } else { completion(@"unavailable"); return; }

    XplatShareOperation *operation = [XplatShareOperation new];
    operation.completion = completion; operation.window = window;
    operation.subject = subject ?: @"";
    activeShare = operation;
    @try {
        operation.picker = [[NSSharingServicePicker alloc] initWithItems:items];
        if (!operation.picker) { [operation finish:@"unavailable"]; return; }
        operation.picker.delegate = operation;
        __weak XplatShareOperation *weakOperation = operation;
        NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
        operation.closeObserver = [center addObserverForName:NSWindowWillCloseNotification object:window queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
            [weakOperation finish:@"cancelled"];
        }];
        operation.terminateObserver = [center addObserverForName:NSApplicationWillTerminateNotification object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
            [weakOperation finish:@"cancelled"];
        }];
        NSRect bounds = anchor.bounds;
        NSRect rect = NSMakeRect(NSMidX(bounds), NSMidY(bounds), 1, 1);
        // Call synchronously on the input turn; a timer would lose AppKit's gesture context.
        [operation.picker showRelativeToRect:rect ofView:anchor preferredEdge:NSMinYEdge];
    } @catch (NSException *exception) {
        // No payload or native exception text is logged.
        [operation finish:@"unavailable"];
    }
}
@end
