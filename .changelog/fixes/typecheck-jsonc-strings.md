### Preserve strings in typecheck configuration

`xplat typecheck` now preserves strings and object keys containing `,}` or `,]`
in `tsconfig.envs.json`. Comments and trailing commas remain supported; missing
values and adjacent tokens such as `[1/* gap */2]` are rejected instead of
silently changing the configuration.

See [TypeScript configuration](https://octane-xplat.goddardai.org/module-resolution#typescript)
and [TypeScript's tsconfig reference](https://www.typescriptlang.org/tsconfig/).
