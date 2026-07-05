# Changelog

This file tracks the public CloakGuard releases. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.9.0] - 2026-07-05

### Added

- Added a user-triggered update check to the Windows app. It checks GitHub only after the user clicks the button.
- Added signed update packages so CloakGuard can reject an installer with the wrong updater signature.
- Added a new shield icon, matching app icons and favicon, and a two-tone CloakGuard wordmark.
- Added a fuller About page with clear privacy notes, project links, and desktop update status.

### Changed

- Kept the scanner webview at `connect-src 'none'`; update traffic runs through Tauri's Rust plugin.
- Reworded the privacy docs to separate click-only GitHub update traffic from scanning, which remains local and upload-free.

### Safety

- There are no launch checks, background polling, analytics, or telemetry.
- Version 0.9.0 must be installed manually. Automatic updates apply to releases after 0.9.0.
- The updater package is signed for Tauri verification, but the Windows installer itself is still unsigned and may trigger SmartScreen.

## [0.8.0] - 2026-07-04

### Added

- Added a browser demo that uses the same client-side scanner as the desktop app.
- Added a short architecture guide and an animated README walkthrough.
- Added a review panel that suggests possible names, company terms, and repeated acronyms after a scan.
- Added one-click session hiding for suggested terms and a direct link to reusable Cloak Lists.

### Changed

- Updated the README with the live demo, architecture notes, and the new review step.

### Safety

- Suggestions never redact text automatically. The user must choose what to hide.
- CloakGuard still uses contextual name and organization checks, not a built-in name dictionary.

## [0.7.3] - 2026-07-04

### Changed

- Shortened the Scan-screen detection reminder at the supported desktop width.
- Made the reminder dismissible for the current session without storing a new preference.

## [0.7.2] - 2026-07-04

### Added

- Added a visible reminder that built-in rules can miss context-specific terms.
- Added Cloak List and Custom Pack creation inside the Profile Editor.

### Changed

- Preserved unfinished profile edits while creating and selecting a new list or pack.

## [0.7.1] - 2026-07-04

### Added

- Expanded contextual person and organization checks across CSV, JSON, copyright lines, signatures, workflow labels, honorifics, and clear prose cues.
- Added a draft-based Profile Editor for modes, packs, Cloak Lists, individual rules, and redaction formats.

### Safety

- Kept name and organization findings low-confidence and protected common command syntax and structured file formatting.
- Documented why exact known names belong in Cloak Lists instead of a universal dictionary.

## [0.6.7] - 2026-07-04

### Added

- Added rule editing for saved profiles while keeping built-in profiles read-only.
- Added public synthetic stress files for repeatable manual checks.

### Changed

- Improved email-domain, Windows path, name, organization, and Cloak List matching.
- Made Cloak List terms handle common apostrophe, dash, and spacing variants.

## [0.6.5] - 2026-07-04

### Added

- Published the first Windows release with 34 local rules, Balanced and Strict modes, country packs, custom terms, Cloak Lists, custom labeled-field rules, and redaction formats.
- Added a per-user Windows installer with an offline WebView2 bootstrapper.

### Safety

- Kept scanning local with no backend, account, or telemetry.
- Documented the unsigned-installer warning and the need to review cleaned text before sharing.

[0.9.0]: https://github.com/benthompsondev/cloakguard/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/benthompsondev/cloakguard/compare/v0.7.3...v0.8.0
[0.7.3]: https://github.com/benthompsondev/cloakguard/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/benthompsondev/cloakguard/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/benthompsondev/cloakguard/compare/v0.6.7...v0.7.1
[0.6.7]: https://github.com/benthompsondev/cloakguard/compare/v0.6.5...v0.6.7
[0.6.5]: https://github.com/benthompsondev/cloakguard/releases/tag/v0.6.5
