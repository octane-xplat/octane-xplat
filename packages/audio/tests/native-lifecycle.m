#import "XplatAudioPlayer.h"
#import <AVFoundation/AVFoundation.h>

static NSDictionary *snapshot(XplatAudioPlayer *player) {
	return [NSJSONSerialization JSONObjectWithData:[[player snapshot] dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
}

int main(int argc, char **argv) {
	@autoreleasepool {
		NSCAssert(argc == 2, @"local source required");
		NSString *source = @(argv[1]);
		XplatAudioPlayer *player = [XplatAudioPlayer new];
		[player setSource:@"invalid-source"];
		NSCAssert([snapshot(player)[@"state"] isEqual:@"error"], @"invalid source must fail");
		[player setSource:source];
		AVPlayerItem *oldItem = [player valueForKey:@"item"];
		[player setSource:source];
		AVPlayer *native = [player valueForKey:@"player"];
		AVPlayerItem *item = native.currentItem;
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
		puts("NATIVE_AUDIO_LIFECYCLE_OK (injected failures; no output-device evidence)");
	}
}
