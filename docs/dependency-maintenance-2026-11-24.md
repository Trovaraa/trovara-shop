# Dependency maintenance on 24 November 2026

This release consolidates Shop Dependabot PRs #35 (eleven npm updates) and #36
(CodeQL and OSV Actions updates) on current main `0cf4b16`. The existing public
landing-page indexing, private-route noindex, redirect controls and security
headers remain included. This is a static frontend release; it adds no API or
database changes.

## Additional security fixes

- [Glob GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)
  affects versions 9.0.0 through 14.0.1. Dependabot's 13.0.7 update is still in
  that range, so the existing glob override is advanced to patched 14.0.2.
- [Minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
  affects versions 7.0.0 through 11.0.0. A selective override upgrades those
  ranges to 11.0.1. ESLint's separate, unaffected minimatch 3 API is retained.
  Lint, Vue type checking, component tests and the real production build verify
  the affected consumers with the new major versions. The lockfile regression
  test rejects vulnerable glob/minimatch copies.
- The build pin and engine floor now require Node 24.22.3, the latest stable
  Node 24 release in the official distribution index on this date. It is the
  [November security release](https://nodejs.org/en/blog/release/v24.22.3).

## Scanner verification

The CodeQL 4.39.3 and OSV action 2.7.1 commit pins were resolved from their
official upstream annotated tags. The existing security safeguard now checks
the exact reviewed OSV 2.7.1 commit, fixing the stale 2.7.0 expectation in PR #36.
Scanner checksums, fail-on-findings behavior and secret-canary tests are retained.
There are no advisory exclusions or audit-level changes.

## Validation

On checksum-verified Node 24.22.3, a clean script-disabled install, ESLint, Vue
type checking, 26 UI tests, 13 Node tests, two scanner safeguard tests and the
production build pass. The checksum-verified Gitleaks 8.30.1 binary passes both
the canary test and the repository history scan. Full and production npm audits
report zero known vulnerabilities; registry verification confirms 249 signatures
and 91 attestations. GitHub CI verifies
CodeQL, OSV and the installed Gitleaks scanner with its secret canary before the
release is deployed. Deployment status is recorded separately from this source
change.
