#import <Foundation/Foundation.h>

// Path callbacks always reach JavaScript on the main thread.
@interface XplatConnectivity : NSObject
+ (NSString *)readState;
- (BOOL)start:(void (^)(NSString *state))listener;
- (void)stop;
@end
