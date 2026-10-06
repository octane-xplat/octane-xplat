// npm deps (upstream octane packages included) read `process.env.NODE_ENV`
// bare — the npm convention where the consumer bundler statically replaces
// the member expression (vite `define`; see xplatNodeEnvDefine). tsc still
// needs the name declared in a program with no Node types. Kept narrow on
// purpose: `process.env.FOO` reads stay type errors because the bundler
// define cannot rewrite them either.
declare const process: { env: { NODE_ENV?: string }; cwd(): string }
