# Consume an incremental HTTP response

ID: incremental-http
Targets: web, ios, android, macos
Related APIs: @octane-xplat/network, requestStream, StreamResponse, StreamRequestOptions

## Starting point

An app that consumes delayed HTTP bytes, with a parser and application-owned
authentication/record semantics. Native builds include the network leaf.

## Requirements

Receive data before server completion, preserve arbitrary byte boundaries,
and stop unused requests without unbounded unread buffering.

## Acceptance criteria

- AC1: Headers and the first response chunk arrive before the server finishes, including a readable non-2xx response.
- AC2: Streaming parsers preserve split UTF-8 and records, and malformed input or transport failure reaches the consumer.
- AC3: Reader cancellation and abort stop native work; unread data stays bounded or fails explicitly.
- AC4: Text/binary request bodies retain exact bytes; redirects, cookies, and unsupported request shapes are explicitly limited.
- AC5: Packaged native consumers discover the bridge and its dependencies through supported setup.

## Documentation

- AC1: [Incremental HTTP guide](../../../packages/network/README.md), [runtime fixture](../../../packages/network/tests/incremental.ts), and [transport regressions](../../../packages/network/tests/stream.test.mjs).
- AC2: [Incremental HTTP guide](../../../packages/network/README.md) and [Rouzer split-character regressions](../../../packages/network/tests/stream.test.mjs).
- AC3: [Incremental HTTP guide](../../../packages/network/README.md) and [transport regressions](../../../packages/network/tests/stream.test.mjs).
- AC4: [Incremental HTTP guide](../../../packages/network/README.md) and [binary PUT regressions](../../../packages/network/tests/stream.test.mjs).
- AC5: [Native setup](../../../packages/network/README.md#native-setup-and-evidence). Gap: full physical packaged-app qualification remains pending.

The [packed listening/settings check](../../../tools/native-readiness/README.md)
combines these services in an external mobile consumer. Its synthetic auth and
silent foreground media do not close physical background, output, restart,
or provider callback gates; see the [readiness record](../notes/still-native-readiness.md).
