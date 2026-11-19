### Avoid dev action errors when stopping the bridge

Stopping the development-action bridge after changing a handler no longer raises a late registration error. Pending messages and responses from the stopped bridge can’t reach a new connection.

[Development actions](https://octane-xplat.goddardai.org/development-actions)
