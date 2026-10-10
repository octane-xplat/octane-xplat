#import <Foundation/Foundation.h>

@interface XplatGeolocation : NSObject
+ (BOOL)isAvailable;
+ (void)ensure:(void (^)(NSString *result))completion;
+ (void)position:(BOOL)highAccuracy timeout:(double)timeout maximumAge:(double)maximumAge
      completion:(void (^)(NSString *positionJSON, NSInteger code, NSString *message))completion;
@end
