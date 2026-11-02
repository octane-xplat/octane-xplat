#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
@interface XplatWebPEncoder : NSObject
+ (nullable NSData *)encodePNG:(NSData *)data quality:(double)quality;
@end
NS_ASSUME_NONNULL_END
