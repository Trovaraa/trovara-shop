# Security review and Dependabot consolidation — 2026-09-27

Repository: Trovaraa/trovara-shop. Fresh branch from origin/main 2c5d456.

## Open PRs covered

- [#17](https://github.com/Trovaraa/trovara-shop/pull/17)
- [#18](https://github.com/Trovaraa/trovara-shop/pull/18)

Both Dependabot heads are ancestors of this branch. Their dependency and SHA-pinned CodeQL updates are consolidated without dropping existing main changes. These routine updates are not presented as fixes for unreported CVEs. Original PRs remain open pending review/merge of the consolidated change.

## Code hardening

The checkout URL predicate accepted arbitrary *.paystack.com hosts, embedded credentials and non-default ports. Restrict redirects to exactly https://checkout.paystack.com with no credentials, matching the API-side check. Regression tests cover valid checkout URLs, subdomains, userinfo, misleading hostnames, ports and non-HTTPS schemes. This reduces the trusted redirect surface; it is not evidence that a Paystack subdomain was compromised.

The checkout origin matches the [Paystack transaction API documentation](https://paystack.com/docs/api/transaction/). Existing money amounts, payment verification, webhook signatures and order status rules are unchanged.

## Security evidence

- GitHub returned zero open Dependabot alerts and zero open code-scanning alerts for this repository at review time.
- Native GitHub secret scanning is disabled. The repository's independent Gitleaks workflow remains enabled; no repository security setting was changed.
- Lockfile-only install with lifecycle scripts disabled: npm reported zero known vulnerabilities, including development dependencies.
- Registry signature verification: 292 installed packages verified; 84 provenance attestations verified. Lockfile packages use HTTPS registry.npmjs.org origins and integrity hashes; no unexpected source origin was found. Installed lifecycle hooks were esbuild's Node installer.
- Checksum-verified Gitleaks 8.30.1 found no secrets in history reachable from the combined branch. Scanner canary tests passed without widening exclusions or weakening rules.
- Targeted static review covered form proxying, checkout destinations, authentication/CSRF boundaries, Talent farm scoping and document downloads, and common downloader/encoded-execution/TLS-disable indicators across the three repos. No additional confirmed exploit or common malware indicator was found in the reviewed paths.

## Verification and limits

23 application tests, 5 security-header tests, 2 scanner safeguard tests, lint, typecheck and production build passed.

The checkout regression checks pass with the tighter policy; the same former allowlist behavior was reproduced by failing API-side regression tests. Repository checks cannot establish that every vulnerability or malware payload is absent. No fresh antivirus scan, runtime host/container audit or penetration test was performed. Production dependencies can differ from Git main; zero repository alerts does not certify the deployed server.

No production deployment, main merge, manual alert dismissal, original PR closure, applicant-data access, financial changes or email actions are included. Marketing PR automation may create its normal isolated preview; production release still requires separate approval and reconciliation with deployed overlays.
