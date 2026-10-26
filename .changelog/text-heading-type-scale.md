### Text and Heading gain the Astryx type scale

`Text` now accepts the Astryx typography props: `type`
(`body`/`large`/`label`/`supporting`/`code`/`display-1`–`display-3`/`inherit`),
`size` (`4xs`–`4xl`), `color`
(`primary`/`secondary`/`disabled`/`placeholder`/`accent`/`inherit`), `weight`
(`normal`/`medium`/`semibold`/`bold`), and `maxLines` for ellipsis truncation.
`Heading` applies the Astryx `--text-heading-*` scale per `level` and accepts
`type` (display scale), `color`, `weight`, and `maxLines`.

```tsx
<Text type="body" size="sm" color="secondary" maxLines={2}>{summary}</Text>
<Heading level={1}>Page title</Heading>
<Heading level={3} maxLines={1}>Card title</Heading>
```

**Breaking change:** `Text`'s `numberOfLines` and `ellipsize` props are
removed — `maxLines` replaces both (1 = single-line ellipsis, >1 =
line-clamp). `Heading` now renders the Astryx type scale (h1 24px/600,
h2 20px/600, h3 17px, …) instead of browser heading defaults, and a bare
`Text` still inherits ambient typography — xplat diverges from Astryx's
`type="body"` default deliberately, since `Text` is the shared text host
every component composes. Pass `type="body"` for the upstream default.
