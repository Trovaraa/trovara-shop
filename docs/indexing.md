# Public landing page indexing

The Shop homepage and its `/shop` aliases are indexable, with a canonical URL
of `https://shop.trovara.farm/`. Only that URL appears in the Shop sitemap.

Install the `trovara_shop_robots` map and `X-Robots-Tag` directives from the
nginx example **before** publishing the indexable HTML. All other request URLs,
including verification, password reset, credit claims, APIs, unknown paths and
URLs containing queries, get `noindex, nofollow` at the HTTP layer. JavaScript
mirrors the policy after navigation and excludes signed-in account views.

Do not block these pages in robots.txt: crawlers must fetch them to see the
noindex header. Search indexing directives are not authentication; API access
controls and private responses remain unchanged.

Before publishing, test nginx syntax and both public/private response headers.
After publishing, inspect the homepage in Search Console and submit its sitemap.
Do not remove the account-specific exclusions to clear Search Console warnings.
