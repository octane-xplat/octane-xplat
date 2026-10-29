#import "XplatLocalNotifications.h"
#import <UserNotifications/UserNotifications.h>

static NSString *XplatNotificationStatus(UNNotificationSettings *settings) {
    if (!settings) return @"unsupported";
    switch (settings.authorizationStatus) {
        case UNAuthorizationStatusNotDetermined: return @"undetermined";
        case UNAuthorizationStatusDenied: return @"denied";
        case UNAuthorizationStatusAuthorized:
        case UNAuthorizationStatusProvisional: return @"granted";
        default: return @"unsupported";
    }
}
static void XplatCompletePermission(void (^completion)(NSString *), NSString *status) {
    dispatch_async(dispatch_get_main_queue(), ^{ completion(status); });
}

@implementation XplatLocalNotifications
+ (BOOL)isAvailable {
    // Apple requires an application bundle identity, even when metadata is loaded.
    return NSBundle.mainBundle.bundleIdentifier.length > 0;
}
+ (void)getStatus:(void (^)(NSString *result))completion {
    if (![self isAvailable]) { XplatCompletePermission(completion, @"unsupported"); return; }
    [UNUserNotificationCenter.currentNotificationCenter getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        XplatCompletePermission(completion, XplatNotificationStatus(settings));
    }];
}
+ (void)ensure:(void (^)(NSString *result))completion {
    if (![self isAvailable]) { XplatCompletePermission(completion, @"unsupported"); return; }
    UNUserNotificationCenter *center = UNUserNotificationCenter.currentNotificationCenter;
    [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge)
                         completionHandler:^(BOOL granted, NSError *error) {
        (void)granted; (void)error;
        // An error does not establish denial. Read the actual authorization state.
        [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
            XplatCompletePermission(completion, XplatNotificationStatus(settings));
        }];
    }];
}

+ (void)notify:(NSString *)title body:(NSString *)body {
    if (![self isAvailable]) return;
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
