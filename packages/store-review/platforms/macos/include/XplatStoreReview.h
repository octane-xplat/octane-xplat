#import <Foundation/Foundation.h>

@interface XplatStoreReview : NSObject
+ (BOOL)isAvailable;
+ (void)requestReview;
@end
