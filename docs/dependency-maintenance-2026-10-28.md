# Dependency and PR maintenance — 2026-10-28

This branch starts from current main (`af25505`), which includes the deployed Node 24 security and public Shop indexing fixes from #28.

- Merges Dependabot #29: PostCSS 8.5.31 and typescript-eslint 8.72.0, including their lockfile updates.
- Incorporates #27's GitHub Actions branch. Its pinned setup-node, CodeQL and OSV versions were already included by #28, so this merge records that coverage without reverting newer fixes.
- Incorporates the subsequent #30 update to CodeQL v4.39.1, pinned to the commit verified against the upstream annotated release tag.
- Keeps private account routes excluded from indexing, the public landing page indexable, and Node 24.22.1 as the minimum build runtime.

Validation: 26 UI tests, 12 Node regression tests, lint, typecheck and production build pass on Node 24.22.1. Full and production audits report zero findings; 239 registry signatures and 83 attestations verify.

Shop does not include the deepmerge dependency identified in OS and Marketing. This PR does not deploy production or alter customer records.
