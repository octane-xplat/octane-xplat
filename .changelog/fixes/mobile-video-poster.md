### Show mobile video posters with hidden controls

On iOS and Android, `Video` now shows its poster when controls are hidden and restores it when switching clips, until playback starts.

```tsx
<Video src={clip.uri} poster={clip.thumbnail} controls={false} autoPlay />
```

See [video playback](https://octane-xplat.goddardai.org/package-video).
