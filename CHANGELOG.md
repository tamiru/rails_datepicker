# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 0.2.0 - 2026-11-01

### Added

- `dual_dates` field option and configuration setting that shows the other calendar's day number beneath each day.
- `rails-datepicker:change` event carrying ISO, Gregorian, Ethiopian, and formatted values.
- Full date labels on day buttons, ARIA grid rows, and a live region announcing month changes.

### Changed

- Refreshed the calendar design: self-contained button and select resets, softer popover with an open animation, pill footer controls, a today marker dot, custom dropdown chevrons, and refined dark theme tokens.
- Requires Ruby 4.0 or newer; CI and releases run on Ruby 4.0.
- Year dropdown is anchored to today and the selection and clamped to `min`/`max`; out-of-range months and the previous/next/Today buttons are disabled.
- Keyboard navigation skips unavailable dates, and Page Up/Down keep the day of the month.
- The popup closes when focus leaves the component, reopens on the selected month, and opens when a read-only field is clicked.
- Made popup calendars compact and independent of the form field width.
- Added an English/Amharic switch for all calendar controls and labels.
- Added `display_calendar` so Ethiopian calendar selection can display Gregorian results.
- Renamed the gem from `stimulus-datepicker` to `rails-datepicker`, including its Ruby namespace, generator, Stimulus identifier, and asset names.
- Made Ethiopian/Gregorian conversion accurate across Gregorian century boundaries.
- Applied each field's locale to server-rendered labels and preserved caller-supplied ARIA descriptions.
- Made disabled inline calendars inert and ensured unconstrained calendars keep selectable dates.
- Added Puma as a declared development dependency so the browser test suite can boot.

### Fixed

- Completed the lockfile checksums so frozen `bundle install` in CI no longer aborts.
- Popover sizing no longer depends on Tailwind's preflight, so the popup is exactly 18rem wide in every host app.

## 0.1.0 - 2026-10-15

### Added

- Ethiopian and Gregorian calendars with bidirectional conversion, leap years, Pagume, and New Year boundary coverage.
- English and Amharic labels, configurable week start, date format, and Ethiopic numerals.
- Accessible Stimulus 3 popover and inline calendars with keyboard navigation and responsive positioning.
- Gregorian ISO form submission for Rails form builders, nested forms, and optional Simple Form input.
- Tailwind CSS 4 light, dark, and automatic themes.
- Rails installer for Importmap and Bun/esbuild applications.
- Rails 8 dummy application, integration, generator, system, and JavaScript tests.
