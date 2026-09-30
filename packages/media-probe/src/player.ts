import { TNSPlayer } from '@nativescript-community/audio'

export const createAudioPlayer = () => {
	const player = new TNSPlayer()
	const ready = player.initFromUrl({
		audioFile: 'https://www.w3schools.com/html/horse.mp3',
		loop: false,
	})

	return {
		ready,
		play: async () => {
			await ready
			return player.play()
		},
		pause: () => player.pause(),
		seek: (seconds: number) => player.seekTo(seconds),
		get currentTime() {
			return player.currentTime
		},
		get duration() {
			return player.duration
		},
		dispose: () => player.dispose(),
	}
}
