#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>
#import <objc/runtime.h>
#import "XplatLocalNotifications.h"

static BOOL granted;
static BOOL permissionError;
static NSInteger status;
static NSUInteger prompts;
static NSMutableArray<UNNotificationRequest *> *requests;

@interface XplatFixtureSettings : NSObject
@property NSInteger authorizationStatus;
@end
@implementation XplatFixtureSettings
@end

@interface XplatFixtureCenter : NSObject
+ (id)currentNotificationCenter;
@end
@implementation XplatFixtureCenter
+ (id)currentNotificationCenter { return [XplatFixtureCenter new]; }
- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL, NSError *))done {
    NSCAssert(options == (UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge), @"permission options");
    prompts++;
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^{
        done(granted, permissionError ? [NSError errorWithDomain:@"fixture" code:1 userInfo:nil] : nil);
    });
}
- (void)getNotificationSettingsWithCompletionHandler:(void (^)(id))done {
    XplatFixtureSettings *settings = [XplatFixtureSettings new];
    settings.authorizationStatus = status;
    done(settings);
}
- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(void (^)(NSError *))done {
    [requests addObject:request];
    done(nil);
}
@end

int main(void) {
    @autoreleasepool {
        NSCAssert([XplatLocalNotifications isAvailable] == (NSBundle.mainBundle.bundleIdentifier.length > 0), @"bundle support differs");
        if ([XplatLocalNotifications isAvailable]) puts("BUNDLE_NOTIFICATION_SUPPORT_OK");
        Method real = class_getClassMethod(UNUserNotificationCenter.class, @selector(currentNotificationCenter));
        Method fake = class_getClassMethod(XplatFixtureCenter.class, @selector(currentNotificationCenter));
        method_exchangeImplementations(real, fake);
        requests = [NSMutableArray new];
        for (NSUInteger scenario = 0; scenario < 3; scenario++) {
            granted = scenario != 1;
            permissionError = scenario == 2;
            __block BOOL finished = NO;
            [XplatLocalNotifications ensure:^(NSString *result) {
                NSCAssert(NSThread.isMainThread, @"callback must reach JS main thread");
                NSCAssert([result isEqualToString:scenario == 0 ? @"granted" : @"denied"], @"permission result");
                finished = YES;
            }];
            NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:3];
            while (!finished && deadline.timeIntervalSinceNow > 0) {
                [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
            }
            NSCAssert(finished, @"callback timed out");
        }
        for (NSNumber *value in @[@(UNAuthorizationStatusNotDetermined), @(UNAuthorizationStatusDenied)]) {
            status = value.integerValue;
            [XplatLocalNotifications notify:@"blocked" body:@""];
        }
        NSCAssert(requests.count == 0, @"unapproved notifications must not be submitted");
        for (NSNumber *value in @[@(UNAuthorizationStatusAuthorized), @(UNAuthorizationStatusProvisional)]) {
            status = value.integerValue;
            [XplatLocalNotifications notify:@"fixture" body:@"body"];
            [XplatLocalNotifications notify:@"fixture" body:nil];
        }
        NSCAssert(prompts == 3, @"notify must not prompt");
        NSCAssert(requests.count == 4, @"authorized notifications submitted");
        NSMutableSet *ids = [NSMutableSet new];
        for (UNNotificationRequest *request in requests) {
            NSCAssert(request.trigger == nil, @"immediate scheduling preserved");
            NSCAssert([request.content.title isEqualToString:@"fixture"], @"title");
            [ids addObject:request.identifier];
        }
        NSCAssert(ids.count == 4, @"identifiers must not replace concurrent requests");
        NSCAssert([requests[0].content.body isEqualToString:@"body"], @"body");
        NSCAssert([requests[1].content.body isEqualToString:@""], @"optional body");
        method_exchangeImplementations(real, fake);
        puts("NATIVE_NOTIFICATION_DISPATCH_OK (intercepted center; no OS permission/delivery)");
    }
}
