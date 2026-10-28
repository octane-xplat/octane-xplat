#import "XplatAudioPlayer.h"
#import <AVFoundation/AVFoundation.h>

static NSDictionary *snapshot(XplatAudioPlayer *player) {
	return [NSJSONSerialization JSONObjectWithData:[[player snapshot] dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
}

static BOOL waitFor(BOOL (^check)(void), NSTimeInterval timeout) {
	NSDate *end = [NSDate dateWithTimeIntervalSinceNow:timeout];
	while ([end timeIntervalSinceNow] > 0) {
		if (check()) return YES;
		[[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
	}
	return check();
}

int main(int argc, char **argv) {
	@autoreleasepool {
		NSCAssert(argc == 3, @"local and HTTP sources required");
		NSString *source = @(argv[1]);
		XplatAudioPlayer *player = [XplatAudioPlayer new];
		[player setSource:@"invalid-source"];
		NSCAssert([snapshot(player)[@"state"] isEqual:@"error"], @"invalid source must fail");
		[player setSource:source];
		[player setPlaybackRate:1.75];
		[player setVolume:0.4];
		[player setMuted:YES];
		AVPlayerItem *oldItem = [player valueForKey:@"item"];
		[player setSource:source];
		AVPlayer *native = [player valueForKey:@"player"];
		AVPlayerItem *item = native.currentItem;
		NSCAssert(fabs(native.volume - 0.4) < 0.001 && native.muted, @"settings survive source replacement");
		NSCAssert(item.audioTimePitchAlgorithm == AVAudioTimePitchAlgorithmTimeDomain, @"speech pitch preserved");
		[NSNotificationCenter.defaultCenter postNotificationName:AVPlayerItemDidPlayToEndTimeNotification object:oldItem];
		NSCAssert(![snapshot(player)[@"state"] isEqual:@"ended"], @"obsolete end notification ignored");
		NSError *failure = [NSError errorWithDomain:@"AudioFixture" code:1 userInfo:@{NSLocalizedDescriptionKey:@"Injected output failure"}];
		[NSNotificationCenter.defaultCenter postNotificationName:AVPlayerItemFailedToPlayToEndTimeNotification object:item userInfo:@{AVPlayerItemFailedToPlayToEndTimeErrorKey:failure}];
		NSCAssert([snapshot(player)[@"state"] isEqual:@"error"], @"output failure is terminal");
		NSCAssert([snapshot(player)[@"error"] isEqual:@"Injected output failure"], @"native error preserved");
		NSCAssert(native.rate == 0 && native.currentItem == nil, @"failure stops owned playback");
		[player pause]; [player play]; [player seekSeconds:1];
		NSCAssert([snapshot(player)[@"state"] isEqual:@"error"], @"commands cannot recover failed item");
		[player setSource:source];
		// Force elapsed watchdog time while the freshly installed item is unknown.
		[player setValue:@(NSProcessInfo.processInfo.systemUptime - 31) forKey:@"loadingSince"];
		NSCAssert([snapshot(player)[@"state"] isEqual:@"error"], @"hung load settles as error");
		[player setSource:source];
		native = [player valueForKey:@"player"];
		item = native.currentItem;
		XplatAudioPlayer *other = [XplatAudioPlayer new];
		[other setSource:source];
		[player dispose]; [player dispose];
		[NSNotificationCenter.defaultCenter postNotificationName:AVPlayerItemDidPlayToEndTimeNotification object:item];
		[NSNotificationCenter.defaultCenter postNotificationName:AVPlayerItemFailedToPlayToEndTimeNotification object:item userInfo:@{AVPlayerItemFailedToPlayToEndTimeErrorKey:failure}];
		NSCAssert([snapshot(player)[@"state"] isEqual:@"idle"], @"disposed observer changed state");
		NSCAssert(native.currentItem == nil && native.rate == 0, @"dispose detaches owned playback");
		NSCAssert([[player valueForKey:@"observers"] count] == 0, @"dispose removes notifications");
		NSCAssert([other valueForKey:@"item"] != nil && [[other valueForKey:@"observers"] count] == 2, @"dispose must not affect another owner");
		[other dispose];
		XplatAudioPlayer *rapid = [XplatAudioPlayer new];
		[rapid setPlaybackRate:1.75];
		for (NSString *entry in @[source, @(argv[2])]) {
			for (int attempt = 0; attempt < 3; attempt++) {
				[rapid setMuted:YES];
				[rapid setSource:entry];
				NSCAssert(waitFor(^BOOL{ return [snapshot(rapid)[@"state"] isEqual:@"paused"]; }, 5), @"rapid fixture load failed: %@", snapshot(rapid));
				[rapid play];
				NSCAssert(waitFor(^BOOL{ return [snapshot(rapid)[@"state"] isEqual:@"playing"]; }, 5), @"rapid fixture play failed: %@", snapshot(rapid));
				[rapid pause]; [rapid setMuted:NO]; [rapid play];
				NSCAssert(waitFor(^BOOL{ return [snapshot(rapid)[@"state"] isEqual:@"ended"]; }, 5), @"rapid resume did not progress: %@", snapshot(rapid));
			}
		}
		[rapid dispose];
		puts("NATIVE_AUDIO_RAPID_RESUME_OK (local and HTTP; silent sources)");
		puts("NATIVE_AUDIO_LIFECYCLE_OK (injected failures; no output-device evidence)");
	}
}
