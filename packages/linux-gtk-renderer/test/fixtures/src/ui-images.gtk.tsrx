/** @jsxImportSource @octane-xplat/jsx */
import {
	Avatar,
	AvatarGroup,
	AvatarStatusDot,
	Image,
	Thumbnail,
	User,
} from '@octane-xplat/ui'

// A tiny real PNG (2x2) as a data: URI — the GTK host decodes it through
// GdkPixbuf into a Gdk.Texture.
export const PNG_2x2 =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVR4nGO4o6HxHxkzkC4AAJiYIrGEgq7pAAAAAElFTkSuQmCC'

export function ImageProbe() @{
	<>
	<Image id="img-fit-contain" src={PNG_2x2} alt="square" contentFit="contain" />
	<Image id="img-fit-fill" src={PNG_2x2} contentFit="fill" />
	<Image id="img-good" src={PNG_2x2} alt="works" />
	<Image id="img-bad" src="data:image/png;base64,NOTAPNG" />
	<Avatar id="av-img" src={PNG_2x2} name="Alec Guy" />
	<Avatar id="av-fallback" name="Alec Guy" />
	<Avatar id="av-dot" name="Dot Owner" />
	<AvatarGroup id="avgroup" max={2}>
		<Avatar name="One Person" />
		<Avatar name="Two Person" />
		<Avatar name="Three Person" />
		<Avatar name="Four Person" />
	</AvatarGroup>
	<Thumbnail id="thumb" src={PNG_2x2} alt="preview" />
	<Thumbnail id="thumb-bad" src="data:image/png;base64,BADBYTES" alt="preview" />
	<User id="user" src={PNG_2x2} name="Alec Guy" description="Engineer" />
	</>
}
