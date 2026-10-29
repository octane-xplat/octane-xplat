### Images and avatars on the GTK root

GTK apps can now use the shared image and identity surface from
`@octane-xplat/ui`: `Image`, `Thumbnail`, `thumbHashUri`, `Avatar`,
`AvatarStatusDot`, `AvatarGroup`, `AvatarGroupOverflow` and `User`.

```tsx
import { Avatar, Image } from '@octane-xplat/ui'

export function AuthorCard() {
	return (
		<>
			<Avatar src="~/avatar.png" name="Alec Guy" />
			<Image src="~/hero.png" alt="Hero" contentFit="cover" />
		</>
	)
}
```

`Image` accepts the shared `src` grammar — `data:`, file paths, `~/`,
`res://` and remote `http(s)` (fetched via Soup). `contentFit` maps onto
`Gtk.Picture` fit modes; `contentPosition` and the true `none`/`scale-down`
fits are not supported on the GTK host. `thumbHashUri` decodes through
GdkPixbuf to a `thumbhash:` placeholder. [GTK setup and
limits](https://octane-xplat.goddardai.org/linux-gtk).
