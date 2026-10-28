#import <Foundation/Foundation.h>
@interface XplatStreamingRequest : NSObject <NSURLSessionDataDelegate>
- (void)start:(NSString *)options event:(void (^)(NSString *))event;
- (void)cancel;
@end
