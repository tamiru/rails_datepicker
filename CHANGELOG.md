# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Changed

- Made popup calendars compact and independent of the form field width.
- Added an English/Amharic switch for all calendar controls and labels.
- Added `display_calendar` so Ethiopian calendar selection can display Gregorian results.

- Renamed the gem from `stimulus-datepicker` to `rails-datepicker`, including its Ruby namespace, generator, Stimulus identifier, and asset names.
- Made Ethiopian/Gregorian conversion accurate across Gregorian century boundaries.
- Applied each field's locale to server-rendered labels and preserved caller-supplied ARIA descriptions.
- Made disabled inline calendars inert and ensured unconstrained calendars keep selectable dates.
- Added Puma as a declared development dependency so the browser test suite can boot.

## 0.1.0 - 2026-10-15

### Added

- Ethiopian and Gregorian calendars with bidirectional conversion, leap years, Pagume, and New Year boundary coverage.
- English and Amharic labels, configurable week start, date format, and Ethiopic numerals.
- Accessible Stimulus 3 popover and inline calendars with keyboard navigation and responsive positioning.
- Gregorian ISO form submission for Rails form builders, nested forms, and optional Simple Form input.
- Tailwind CSS 4 light, dark, and automatic themes.
- Rails installer for Importmap and Bun/esbuild applications.
- Rails 8 dummy application, integration, generator, system, and JavaScript tests.
