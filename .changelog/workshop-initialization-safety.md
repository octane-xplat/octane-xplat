### Check workshop initialization before writing

Workshop initialization now checks all three possible output files before writing.
It preserves existing custom files and scripts, and stops when a saved input
changes during planning.

**Breaking change:** initialization rejects symbolic links and input files over
1 MiB. Use ordinary project files and folders before running it.

To create the workshop files without adding a package script:

```sh
bun run xplat workshop init --no-scripts
```

See [component workshop setup](https://octane-xplat.goddardai.org/component-workshop#try-it).
