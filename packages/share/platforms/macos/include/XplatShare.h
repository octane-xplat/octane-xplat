#import <Foundation/Foundation.h>

// The completion is one-shot and delivered on the main thread. No host-global seam.
@interface XplatShare : NSObject
+ (void)shareKind:(NSString *)kind value:(NSString *)value subject:(NSString *)subject completion:(void (^)(NSString *result))completion;
@end
