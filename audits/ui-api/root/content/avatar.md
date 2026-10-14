# Avatar, AvatarGroup, and User

Current exports: `Avatar`, `AvatarGroup`, `User`.

**Design: Keep Avatar/AvatarGroup and rename User to UserInfo.**

User sounds like a data model or authentication API, while the props describe a display row. UserInfo better predicts the rendered result. Keep visible fallback content separate from an accessible label, define group overflow, and use the same avatar size type in the group and the composed row.

Proposed shape (illustrative):

```ts
type ProposedUserInfoProps = {
	name: string
	description?: string
	avatarSrc?: string
	onPress?: () => void
}
```

Evidence: [src/props.ts:3076](../../../../packages/ui/src/props.ts#L3076), [src/props.ts:3092](../../../../packages/ui/src/props.ts#L3092), [src/props.ts:3975](../../../../packages/ui/src/props.ts#L3975).

[Audit index](../../README.md)
