# Build and check an accessible screen

ID: accessible-screen
Targets: web, ios, android
Related APIs: TextInput, FieldStatus, TextInputHandle, Button, useAnnounce, Overlay, useReducedMotion

## Starting point

A configured app with shared UI/theme setup. The first example is a local trip
form; server/disk persistence is outside that example's claim.

## Requirements

Compose visible names, validation, status and focus into a usable screen. Check
keyboard and assistive technology separately on intended targets, including host
limits instead of assuming web behavior proves native delivery.

## Acceptance criteria

- AC1: The reader builds a typed complete form with visible label/instructions, required/error state, a submit action and a visible successful result without inventing a save operation.
- AC2: Keyboard order/activation, invalid-field focus, icon-only action names, disabled and asynchronous loading/failure states have concrete implementation and checks.
- AC3: Status remains visible, announcements do not steal focus and urgency/clearing differences are explicit across web/native.
- AC4: A named modal has a dismissal/focus procedure with native restoration/isolation limitations and an explicit recovery path.
- AC5: Reduced motion, text size, contrast and localization have bounded checks; actual VoiceOver/TalkBack/browser delivery and unverified targets are recorded separately from DOM/source assertions.

## Documentation

- AC1: [First form](../../../docs/app/accessibility.md#build-the-first-form) and [maintained form](../../../packages/demos/src/accessibility-guide/AccessibleTripForm.tsx).
- AC2: [Focus](../../../docs/app/accessibility.md#preserve-useful-focus-and-status), [action names/states](../../../docs/app/accessibility.md#name-actions-and-show-unavailable-work) and [real-input journey](../../../docs/app/accessibility.md#check-the-screen-with-real-input).
- AC3: [Status and focus](../../../docs/app/accessibility.md#preserve-useful-focus-and-status) and [platform announcement guidance](../../../docs/platform/platform-services.md#announce-a-status).
- AC4: [Modal focus qualification](../../../docs/app/accessibility.md#qualify-modal-focus-separately) links current host behavior and explicit input-focus recovery.
- AC5: [Display preferences](../../../docs/app/accessibility.md#respect-motion-text-size-and-contrast) and [bounded manual journey](../../../docs/app/accessibility.md#check-the-screen-with-real-input) keep actual assistive-technology delivery distinct from mechanical checks.
