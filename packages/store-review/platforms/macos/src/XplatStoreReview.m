#import "XplatStoreReview.h"
#import <StoreKit/StoreKit.h>

@implementation XplatStoreReview
+ (BOOL)isAvailable {
    return NSClassFromString(@"SKStoreReviewController") != nil;
}

+ (void)requestReview {
    if (@available(macOS 10.14, *)) {
        [SKStoreReviewController requestReview];
    }
}
@end
