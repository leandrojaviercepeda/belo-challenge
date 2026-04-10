## Why

The project has inconsistent JSDoc coverage — some files have Spanish descriptions, but most critical modules (auth, errors, entities) have no documentation. This makes onboarding harder and internal APIs unclear.

## What Changes

- Add JSDoc to priority modules following English standard
- Use @param and @returns on all public methods
- Add class-level descriptions to all exported classes

## Capabilities

### New Capabilities

- `jsdoc-standards`: Internal documentation standards for the codebase

### Modified Capabilities

- None

## Impact

- **Files affected**: ~15-20 files in src/auth/, src/common/errors/, src/users/, src/config/, src/health/
- **No breaking changes**: Pure documentation additions
