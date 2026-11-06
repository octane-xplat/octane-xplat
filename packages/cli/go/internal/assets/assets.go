package assets

import _ "embed"

// Generated from the TypeScript catalog by build.mjs, not from Nim output.
//
//go:embed catalog.json
var Catalog []byte

// Generated from tools/cli-go/native-assets.json before every Turbo build.
//
//go:embed native-assets.json
var NativeAssets []byte
