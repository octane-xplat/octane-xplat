### Native styles keep their cascade layers

Native builds now retain CSS cascade layers. App classes can override package defaults even when a component imports its stylesheet later. This fixes layout overrides that worked on web but were ignored on native hosts.

See [styling screens](https://octane-xplat.goddardai.org/styling).
