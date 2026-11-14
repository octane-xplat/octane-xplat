# Source ownership and attribution

`vendor/ns-node/src` and `vendor/ns-node/tests` preserve the six source modules
and their Jasmine cases byte for byte from the internal ns-node exploration.
`vendor/ns-node/provenance.json` records the source revision and SHA-256 hashes.
That repository is not an npm dependency and is never published by this package.

`src/vendor` contains the active events, util, assert and querystring copies.
Their local changes convert TS export assignments to ESM, expose the events
namespace required by CJS consumers, and give util a private process scheduler.
Keep these changes inspectable against the originals; never update provenance
hashes merely to accept an edit to an original file.

The original Buffer and stream implementations are reference material. Runtime
Buffer comes from feross/buffer 6.0.3; streams come from readable-stream 4.8.0,
which includes Node contributor source. The engine bundles their dependency
implementations under explicit entry selection. License notices for bundled
third-party code are retained in `vendor/licenses/` (indexed by
`manifest.json`) and must accompany any future distribution.

The ns-node snapshot has no standalone license file. This package stays private;
publication requires settling its source attribution/licensing and completing
the declared API and host qualification gates. The framework's MIT declaration
does not replace third-party notices or establish an absent upstream grant.
