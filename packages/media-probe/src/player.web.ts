export const createAudioPlayer = () => {
	const audio = new Audio()
	audio.src = 'https://www.w3schools.com/html/horse.mp3'
	audio.preload = 'auto'
	return {
		ready: Promise.resolve(),
		play: () => audio.play(),
		pause: () => audio.pause(),
		seek: (seconds: number) => {
			audio.currentTime = seconds
		},
		get currentTime() {
			return audio.currentTime
		},
		get duration() {
			return audio.duration
		},
		dispose: () => {
			audio.pause()
			audio.removeAttribute('src')
			audio.load()
		},
	}
}
