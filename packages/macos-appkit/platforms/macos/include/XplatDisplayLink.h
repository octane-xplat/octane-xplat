#import <Foundation/Foundation.h>

// Internal renderer clock. All methods and target delivery are main-thread only.
@interface XplatDisplayLink : NSObject
+ (double)nowMS;
- (BOOL)startWithTarget:(id)target selector:(SEL)selector;
- (void)stop;
@property(nonatomic, readonly) BOOL running;
@property(nonatomic, readonly) NSUInteger deliveryCount;
@property(nonatomic, readonly) NSString *backend;
@end
