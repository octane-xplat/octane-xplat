#import <Foundation/Foundation.h>

// One instance owns one AVPlayer. Calls and notifications run on the host main thread.
@interface XplatAudioPlayer : NSObject
- (void)setSource:(NSString *)source;
- (void)setPlaybackRate:(double)rate;
- (void)setVolume:(double)volume;
- (void)setMuted:(BOOL)muted;
- (void)play;
- (void)pause;
- (void)seekSeconds:(double)seconds;
- (NSString *)snapshot;
- (void)clear;
- (void)dispose;
@end
