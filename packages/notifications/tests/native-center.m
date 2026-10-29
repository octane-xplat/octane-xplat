#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>
#import <objc/runtime.h>
#import "XplatLocalNotifications.h"

static BOOL available;
static BOOL granted;
static BOOL permissionError;
static NSInteger status;
static NSUInteger prompts;
static NSUInteger centerAccesses;
static NSMutableArray<UNNotificationRequest *> *requests;
@interface XplatFixtureSettings : NSObject
@property NSInteger authorizationStatus;
@end
@implementation XplatFixtureSettings
@end
@interface XplatFixtureCenter : NSObject
+ (id)currentNotificationCenter;
+ (BOOL)isAvailable;
@end
@implementation XplatFixtureCenter
+ (id)currentNotificationCenter { centerAccesses++; return [XplatFixtureCenter new]; }
+ (BOOL)isAvailable { return available; }
- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL, NSError *))done {
    NSCAssert(options == (UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge), @"permission options");
    prompts++;
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^{
        done(granted, permissionError ? [NSError errorWithDomain:@"fixture" code:1 userInfo:nil] : nil);
    });
}
- (void)getNotificationSettingsWithCompletionHandler:(void (^)(id))done {
    if (status == -1) { done(nil); return; }
    XplatFixtureSettings *settings = [XplatFixtureSettings new]; settings.authorizationStatus = status; done(settings);
}
- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(void (^)(NSError *))done { [requests addObject:request]; done(nil); }
@end
static void ExpectPermission(void (^invoke)(void (^)(NSString *)), NSString *expected) {
    __block BOOL finished = NO;
    invoke(^(NSString *result) {
        NSCAssert(NSThread.isMainThread, @"callback must reach main thread");
        NSCAssert([result isEqualToString:expected], @"permission result"); finished = YES;
    });
    NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:3];
    while (!finished && deadline.timeIntervalSinceNow > 0) [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
    NSCAssert(finished, @"callback timed out");
}
int main(void) {
    @autoreleasepool {
        NSCAssert([XplatLocalNotifications isAvailable] == (NSBundle.mainBundle.bundleIdentifier.length > 0), @"bundle support differs");
        if ([XplatLocalNotifications isAvailable]) puts("BUNDLE_NOTIFICATION_SUPPORT_OK");
        Method real = class_getClassMethod(UNUserNotificationCenter.class, @selector(currentNotificationCenter));
        Method fake = class_getClassMethod(XplatFixtureCenter.class, @selector(currentNotificationCenter));
        Method realAvailability = class_getClassMethod(XplatLocalNotifications.class, @selector(isAvailable));
        Method fakeAvailability = class_getClassMethod(XplatFixtureCenter.class, @selector(isAvailable));
        method_exchangeImplementations(real, fake); method_exchangeImplementations(realAvailability, fakeAvailability);
        requests = [NSMutableArray new];
        available = NO;
        ExpectPermission(^(void (^done)(NSString *)) { [XplatLocalNotifications getStatus:done]; }, @"unsupported");
        ExpectPermission(^(void (^done)(NSString *)) { [XplatLocalNotifications ensure:done]; }, @"unsupported");
        [XplatLocalNotifications notify:@"unavailable" body:nil];
        NSCAssert(centerAccesses == 0 && prompts == 0 && requests.count == 0, @"unavailable paths must not touch the center");
        available = YES;
        NSArray *states = @[@(UNAuthorizationStatusNotDetermined), @(UNAuthorizationStatusDenied), @(UNAuthorizationStatusAuthorized), @(UNAuthorizationStatusProvisional), @999, @(-1)];
        NSArray *expected = @[@"undetermined", @"denied", @"granted", @"granted", @"unsupported", @"unsupported"];
        for (NSUInteger i = 0; i < states.count; i++) {
            status = [states[i] integerValue];
            ExpectPermission(^(void (^done)(NSString *)) {
                dispatch_async(dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^{ [XplatLocalNotifications getStatus:done]; });
            }, expected[i]);
        }
        NSCAssert(prompts == 0, @"status reads must never request authorization");
        NSArray *requestStates = @[@(UNAuthorizationStatusAuthorized), @(UNAuthorizationStatusDenied), @(UNAuthorizationStatusNotDetermined), @(UNAuthorizationStatusAuthorized)];
        NSArray *requestExpected = @[@"granted", @"denied", @"undetermined", @"granted"];
        for (NSUInteger i = 0; i < requestStates.count; i++) {
            status = [requestStates[i] integerValue]; granted = i == 0; permissionError = i >= 2;
            ExpectPermission(^(void (^done)(NSString *)) { [XplatLocalNotifications ensure:done]; }, requestExpected[i]);
        }
        for (NSNumber *value in @[@(UNAuthorizationStatusNotDetermined), @(UNAuthorizationStatusDenied)]) { status = value.integerValue; [XplatLocalNotifications notify:@"blocked" body:@""]; }
        NSCAssert(requests.count == 0, @"unapproved notifications must not be submitted");
        for (NSNumber *value in @[@(UNAuthorizationStatusAuthorized), @(UNAuthorizationStatusProvisional)]) {
            status = value.integerValue; [XplatLocalNotifications notify:@"fixture" body:@"body"]; [XplatLocalNotifications notify:@"fixture" body:nil];
        }
        NSCAssert(prompts == 4 && requests.count == 4, @"only explicit requests prompt and approved sends submit");
        NSMutableSet *ids = [NSMutableSet new];
        for (UNNotificationRequest *request in requests) {
            NSCAssert(request.trigger == nil && [request.content.title isEqualToString:@"fixture"], @"immediate title"); [ids addObject:request.identifier];
        }
        NSCAssert(ids.count == 4, @"identifiers must not replace concurrent requests");
        NSCAssert([requests[0].content.body isEqualToString:@"body"] && [requests[1].content.body isEqualToString:@""], @"optional body");
        method_exchangeImplementations(realAvailability, fakeAvailability); method_exchangeImplementations(real, fake);
        puts("NATIVE_NOTIFICATION_DISPATCH_OK (intercepted center; no OS permission/delivery)");
    }
}
