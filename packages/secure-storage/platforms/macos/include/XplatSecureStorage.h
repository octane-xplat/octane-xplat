#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
@interface XplatSecureStorage : NSObject
+ (NSDictionary *)get:(NSString *)key;
+ (BOOL)set:(NSDictionary *)options;
+ (BOOL)remove:(NSString *)key;
@end
NS_ASSUME_NONNULL_END
