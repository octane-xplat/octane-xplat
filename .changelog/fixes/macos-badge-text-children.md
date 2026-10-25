### Badge accepts plain text children on macOS

`<Badge>3</Badge>` no longer crashes on macOS with "cannot contain text-only
children" — the string renders inside a text label like it does on the web.
On iOS and Android, raw string children now render too; they were previously
dropped silently.
