#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

// All completion blocks are delivered on the main thread for the JS runtime.
@interface XplatLocalNotifications : NSObject
+ (BOOL)isAvailable;
+ (void)ensure:(void (^)(NSString *result))completion;
+ (void)notify:(NSString *)title body:(NSString *)body;
@end
