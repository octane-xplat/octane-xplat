/** `@nstudio/nativescript-exoplayer` `seekToTime` units differ per platform:
 *  Android forwards milliseconds to `player.seekTo`, while iOS expects
 *  seconds for `CMTimeMakeWithSeconds`. The public handle and chrome keep
 *  milliseconds — convert once at the plugin boundary. */
export function seekToTime(
	video: { seekToTime(time: number): void },
	ms: number,
	platform: 'ios' | 'android',
): void {
	video.seekToTime(platform === 'ios' ? ms / 1000 : ms)
}
