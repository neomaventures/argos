# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-01

### Added
- `ArgosModule` with `forRoot` / `forRootAsync` via `ConfigurableModuleBuilder`
- `@CreatedBy()` column decorator — sets actor on insert, never overwritten
- `@UpdatedBy()` column decorator — sets actor on insert and update
- ALS middleware with pluggable `resolveActor` function
- Configurable `defaultActor` option (defaults to `"system"`)

[Unreleased]: https://github.com/neomaventures/argos/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/neomaventures/argos/releases/tag/v0.1.0
