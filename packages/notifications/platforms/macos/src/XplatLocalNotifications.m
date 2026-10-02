#import "XplatLocalNotifications.h"
#import <UserNotifications/UserNotifications.h>

@implementation XplatLocalNotifications
+ (BOOL)isAvailable {
    // Apple requires an application bundle identity, even when metadata is loaded.
    return NSBundle.mainBundle.bundleIdentifier.length > 0;
}
+ (void)ensure:(void (^)(NSString *result))completion {
    UNUserNotificationCenter *center = UNUserNotificationCenter.currentNotificationCenter;
    [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge)
                         completionHandler:^(BOOL granted, NSError *error) {
        dispatch_async(dispatch_get_main_queue(), ^{
            completion(granted && !error ? @"granted" : @"denied");
        });
    }];
}

+ (void)notify:(NSString *)title body:(NSString *)body {
    UNUserNotificationCenter *center = UNUserNotificationCenter.currentNotificationCenter;
    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        if (settings.authorizationStatus != UNAuthorizationStatusAuthorized &&
            settings.authorizationStatus != UNAuthorizationStatusProvisional) return;
        UNMutableNotificationContent *content = [UNMutableNotificationContent new];
        content.title = title;
        content.body = body ?: @"";
        // A nil trigger delivers immediately. UUIDs avoid replacing concurrent requests.
        UNNotificationRequest *request = [UNNotificationRequest
            requestWithIdentifier:NSUUID.UUID.UUIDString content:content trigger:nil];
        [center addNotificationRequest:request withCompletionHandler:^(NSError *error) {
            if (error) NSLog(@"Octane local notification submission failed (%ld)", (long)error.code);
        }];
    }];
}
@end
