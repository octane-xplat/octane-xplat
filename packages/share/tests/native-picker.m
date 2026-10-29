// Intercepted picker; no system share UI, recipient or delivery.
#import <AppKit/AppKit.h>
#import <objc/runtime.h>
#import "XplatShare.h"
@interface FixtureAnchor : NSObject
@property NSRect bounds;
@end
@implementation FixtureAnchor
@end
@interface FixtureWindow : NSObject
@property BOOL visible;
@property (strong) FixtureAnchor *contentView;
@property (strong) id attachedSheet;
@end
@implementation FixtureWindow
@end
static FixtureWindow *window;
@interface FixtureApp : NSObject
@end
@implementation FixtureApp
- (id)keyWindow { return window; }
- (id)mainWindow { return window; }
@end
@interface FixtureService : NSObject
@property (weak) id delegate;
@property (copy) NSString *subject;
@end
@implementation FixtureService
@end
@interface FixturePicker : NSObject
@property (weak) id<NSSharingServicePickerDelegate> delegate;
@property (strong) NSArray *items;
@property BOOL shown;
@property BOOL closed;
- (instancetype)initWithItems:(NSArray *)items;
@end
static FixturePicker *picker;
@implementation FixturePicker
- (instancetype)initWithItems:(NSArray *)items {
    // Preserve init-family ARC ownership when replacing the real initializer.
    self = [FixturePicker new]; self.items = items; picker = self; return self;
}
- (void)showRelativeToRect:(NSRect)rect ofView:(NSView *)view preferredEdge:(NSRectEdge)edge {
    NSCAssert(view == (id)window.contentView && rect.size.width == 1 && edge == NSMinYEdge, @"anchor");
    self.shown = YES;
}
- (void)close { self.closed = YES; [self.delegate sharingServicePicker:(id)self didChooseSharingService:nil]; }
@end
static NSUInteger callbacks;
static NSString *result;
static void Present(NSString *kind, NSString *value, NSString *subject) {
    result = nil; callbacks = 0;
    [XplatShare shareKind:kind value:value subject:subject completion:^(NSString *value) {
        NSCAssert(NSThread.isMainThread, @"completion thread"); callbacks++; result = value;
    }];
}
static id<NSSharingServiceDelegate> Select(FixtureService *service) {
    id<NSSharingServiceDelegate> delegate = [picker.delegate sharingServicePicker:(id)picker delegateForSharingService:(id)service];
    service.delegate = delegate;
    [picker.delegate sharingServicePicker:(id)picker didChooseSharingService:(id)service];
    return delegate;
}
int main(void) {
    @autoreleasepool {
        // Replace NSApp entirely in this isolated executable; never create NSApplication.
        NSApp = (id)[FixtureApp new];
        window = [FixtureWindow new]; window.visible = YES;
        window.contentView = [FixtureAnchor new]; window.contentView.bounds = NSMakeRect(0, 0, 300, 200);
        Method init = class_getInstanceMethod(NSSharingServicePicker.class, @selector(initWithItems:));
        Method replacement = class_getInstanceMethod(FixturePicker.class, @selector(initWithItems:));
        method_exchangeImplementations(init, replacement);
        Present(@"text", @"body", @"Subject");
        NSCAssert(!result && picker.shown && [picker.items isEqualToArray:@[@"body"]], @"must not resolve on launch");
        __block NSString *overlap;
        [XplatShare shareKind:@"text" value:@"second" subject:@"" completion:^(NSString *value) { overlap = value; }];
        NSCAssert([overlap isEqualToString:@"unavailable"] && !result, @"overlap must not replace current owner");
        FixtureService *service = [FixtureService new];
        id<NSSharingServiceDelegate> delegate = Select(service);
        NSCAssert([service.subject isEqualToString:@"Subject"] && !result, @"selection is not completion");
        [delegate sharingService:(id)service didShareItems:picker.items];
        [delegate sharingService:(id)service didShareItems:picker.items];
        NSCAssert(callbacks == 1 && [result isEqualToString:@"shared"] && picker.closed && !picker.delegate && !service.delegate, @"terminal ownership");
        Present(@"url", @"https://example.com", @"Link");
        NSCAssert(picker.items.count == 1 && [picker.items[0] isKindOfClass:NSURL.class], @"URL stays a URL");
        [picker.delegate sharingServicePicker:(id)picker didChooseSharingService:nil];
        NSCAssert([result isEqualToString:@"cancelled"], @"picker dismissal");
        for (NSNumber *code in @[@(NSUserCancelledError), @1]) {
            Present(@"text", @"failure", @""); service = [FixtureService new]; delegate = Select(service);
            [delegate sharingService:(id)service didFailToShareItems:picker.items error:[NSError errorWithDomain:NSCocoaErrorDomain code:code.integerValue userInfo:nil]];
            NSCAssert([result isEqualToString:code.integerValue == NSUserCancelledError ? @"cancelled" : @"unavailable"], @"service failure");
        }
        Present(@"text", @"owner", @"");
        [NSNotificationCenter.defaultCenter postNotificationName:NSWindowWillCloseNotification object:window];
        NSCAssert(callbacks == 1 && [result isEqualToString:@"cancelled"] && picker.closed, @"window teardown");
        Present(@"text", @"owner", @"");
        [NSNotificationCenter.defaultCenter postNotificationName:NSApplicationWillTerminateNotification object:NSApp];
        NSCAssert(callbacks == 1 && [result isEqualToString:@"cancelled"], @"application teardown");
        window.visible = NO; Present(@"text", @"hidden", @"");
        NSCAssert([result isEqualToString:@"unavailable"], @"hidden presenter"); window.visible = YES;
        window.attachedSheet = [NSObject new]; Present(@"text", @"modal", @"");
        NSCAssert([result isEqualToString:@"unavailable"], @"sheet presenter"); window.attachedSheet = nil;
        Present(@"file", @"/no-such-xplat-file/report.txt", @"");
        NSCAssert([result isEqualToString:@"unavailable"], @"missing file");
        Present(@"file", NSTemporaryDirectory(), @"");
        NSCAssert([result isEqualToString:@"unavailable"], @"directory");
        NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:NSUUID.UUID.UUIDString];
        [@"fixture" writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:nil];
        Present(@"file", path, @"");
        NSCAssert(!result && picker.items.count == 1 && [picker.items[0] isFileURL] && [[picker.items[0] path] isEqualToString:path], @"local file item");
        [picker.delegate sharingServicePicker:(id)picker didChooseSharingService:nil];
        [NSFileManager.defaultManager removeItemAtPath:path error:nil];
        for (NSString *url in @[@"relative", @"file:///tmp/report.txt"]) {
            Present(@"url", url, @""); NSCAssert([result isEqualToString:@"unavailable"], @"invalid URL");
        }
        window.visible = NO;
        __block BOOL completed = NO;
        dispatch_async(dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^{
            [XplatShare shareKind:@"text" value:@"background" subject:@"" completion:^(NSString *value) {
                NSCAssert(NSThread.isMainThread && [value isEqualToString:@"unavailable"], @"off-main invocation"); completed = YES;
            }];
        });
        NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:3];
        while (!completed && deadline.timeIntervalSinceNow > 0) [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
        NSCAssert(completed, @"background completion timed out");
        method_exchangeImplementations(init, replacement); NSApp = nil;
        puts("NATIVE_SHARE_CONTRACT_OK (intercepted picker; no OS UI or delivery)");
    }
}
