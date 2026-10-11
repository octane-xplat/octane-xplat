#import "XplatAudioPlayer.h"
#import <AVFoundation/AVFoundation.h>
#import <math.h>

@interface XplatAudioPlayer ()
@property(nonatomic, strong) AVPlayer *player;
@property(nonatomic, strong) AVPlayerItem *item;
@property(nonatomic, strong) NSMutableArray *observers;
@property(nonatomic, copy) NSString *state;
@property(nonatomic, copy) NSString *failure;
@property(nonatomic) BOOL disposed;
@property(nonatomic) BOOL wantsPlayback;
@property(nonatomic) NSTimeInterval loadingSince;
@end

@implementation XplatAudioPlayer
- (instancetype)init {
	if ((self = [super init])) {
		_state = @"idle";
		_observers = [NSMutableArray new];
	}
	return self;
}

- (void)releaseTrack {
	for (id token in self.observers) [[NSNotificationCenter defaultCenter] removeObserver:token];
	[self.observers removeAllObjects];
	[self.player pause];
	[self.item cancelPendingSeeks];
	[self.item.asset cancelLoading];
	[self.player replaceCurrentItemWithPlayerItem:nil];
	self.item = nil;
	self.player = nil;
	self.wantsPlayback = NO;
	self.loadingSince = 0;
}

- (void)fail:(NSString *)message {
	[self releaseTrack];
	self.failure = message.length ? message : @"Audio playback failed";
	self.state = @"error";
}

- (void)setSource:(NSString *)source {
	if (self.disposed) return;
	[self clear];
	NSURL *url = [source hasPrefix:@"/"] ? [NSURL fileURLWithPath:source] : [NSURL URLWithString:source];
	NSString *scheme = url.scheme.lowercaseString;
	if (!url || !([scheme isEqual:@"file"] ||
		(([scheme isEqual:@"http"] || [scheme isEqual:@"https"]) && url.host.length))) {
		[self fail:@"Audio source must be an absolute path, file URL, or HTTP(S) URL"];
		return;
	}
	if (url.isFileURL && ![[NSFileManager defaultManager] isReadableFileAtPath:url.path]) {
		[self fail:@"Audio file is not readable"];
		return;
	}
	self.state = @"loading";
	self.loadingSince = NSProcessInfo.processInfo.systemUptime;
	self.item = [AVPlayerItem playerItemWithURL:url];
	self.player = [AVPlayer playerWithPlayerItem:self.item];
	__weak XplatAudioPlayer *owner = self;
	AVPlayerItem *item = self.item;
	NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
	[self.observers addObject:[center addObserverForName:AVPlayerItemDidPlayToEndTimeNotification
		object:item queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
		XplatAudioPlayer *strongOwner = owner;
		if (!strongOwner || strongOwner.disposed || strongOwner.item != note.object) return;
		[strongOwner.player pause];
		strongOwner.wantsPlayback = NO;
		strongOwner.state = @"ended";
	}]];
	[self.observers addObject:[center addObserverForName:AVPlayerItemFailedToPlayToEndTimeNotification
		object:item queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
		XplatAudioPlayer *strongOwner = owner;
		if (!strongOwner || strongOwner.disposed || strongOwner.item != note.object) return;
		NSError *error = note.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey];
		[strongOwner fail:error.localizedDescription];
	}]];
}

- (void)refresh {
	if (!self.item || self.disposed || [self.state isEqual:@"ended"]) return;
	if (self.item.status == AVPlayerItemStatusFailed || self.player.status == AVPlayerStatusFailed) {
		[self fail:(self.item.error ?: self.player.error).localizedDescription];
		return;
	}
	BOOL waiting = self.item.status != AVPlayerItemStatusReadyToPlay ||
		(self.wantsPlayback && self.player.timeControlStatus != AVPlayerTimeControlStatusPlaying);
	if (waiting) {
		self.state = @"loading";
		NSTimeInterval now = NSProcessInfo.processInfo.systemUptime;
		if (!self.loadingSince) self.loadingSince = now;
		if (now - self.loadingSince >= 30) [self fail:@"Audio loading or buffering timed out"];
	} else {
		self.loadingSince = 0;
		self.state = self.wantsPlayback ? @"playing" : @"paused";
	}
}

- (void)play {
	[self refresh];
	if (!self.player || self.disposed || [self.state isEqual:@"error"]) return;
	if ([self.state isEqual:@"ended"]) {
		[self.player seekToTime:kCMTimeZero];
		self.state = @"paused";
	}
	self.wantsPlayback = YES;
	[self.player play];
	[self refresh];
}

- (void)pause {
	if (!self.player || self.disposed) return;
	self.wantsPlayback = NO;
	[self.player pause];
	[self refresh];
}

- (void)seekSeconds:(double)seconds {
	if (!self.player || self.disposed || !isfinite(seconds)) return;
	if ([self.state isEqual:@"ended"]) self.state = @"paused";
	double duration = CMTimeGetSeconds(self.item.duration);
	seconds = fmax(0, seconds);
	if (isfinite(duration) && duration > 0) seconds = fmin(seconds, duration);
	[self.player seekToTime:CMTimeMakeWithSeconds(seconds, 600) toleranceBefore:kCMTimeZero toleranceAfter:kCMTimeZero];
}

static double safeSeconds(CMTime time) {
	double value = CMTimeGetSeconds(time);
	return isfinite(value) && value > 0 ? value : 0;
}

- (NSString *)snapshot {
	[self refresh];
	NSMutableDictionary *value = [@{
		@"state": self.state,
		@"currentTime": @(self.player ? safeSeconds(self.player.currentTime) : 0),
		@"duration": @(self.item ? safeSeconds(self.item.duration) : 0)
	} mutableCopy];
	if (self.failure) value[@"error"] = self.failure;
	NSData *data = [NSJSONSerialization dataWithJSONObject:value options:0 error:nil];
	return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

- (void)clear {
	[self releaseTrack];
	self.failure = nil;
	self.state = @"idle";
}

- (void)dispose {
	if (self.disposed) return;
	self.disposed = YES;
	[self clear];
}

- (void)dealloc {
	[self releaseTrack];
}
@end
