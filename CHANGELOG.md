# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `ArgosModule` with `forRoot` / `forRootAsync` via `ConfigurableModuleBuilder`
- `@CreatedBy()` column decorator — sets actor on insert, never overwritten
- `@UpdatedBy()` column decorator — sets actor on insert and update
- ALS middleware with pluggable `resolveActor` function
- Configurable `defaultActor` option (defaults to `"system"`)
