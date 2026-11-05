---
hype: 25
---

### Protect recordings from pending camera configuration

Camera configuration now rejects if recording starts or the session is disposed while camera discovery is pending. A rejected camera change leaves the existing take running. `configure` remains idle-only; choose the camera before arming automatic recording. For a supported camera switch during a take, use `switchCamera` instead.

```ts
// Before arming automatic recording:
await session.configure({ camera: 'front' })
```

```ts
// During a take, after preview activation and a support check:
if ((await session.capabilities()).cameraSwitchDuringRecording) {
  await session.switchCamera('front')
}
```

See [camera switching during a take](https://octane-xplat.goddardai.org/movie-capture#switch-cameras-during-a-take) and [camera selection and orientation](https://octane-xplat.goddardai.org/movie-capture#camera-selection-and-orientation).
