# Cloudflare public-page cache

ScoreLead's public pages are prerendered and emit `Cache-Control` headers, but
Cloudflare does not cache HTML by default. Add one Cache Rule for the public
host after deploying the accompanying locale-routing change.

## Cache Rule

In **Caching > Cache Rules**, create a rule named `ScoreLead public HTML` with
this custom expression:

```text
(http.host eq "scorelead.io"
 and http.request.method in {"GET" "HEAD"}
 and any(http.request.headers["accept"][*] contains "text/html")
 and http.request.uri.path ne "/api"
 and not starts_with(http.request.uri.path, "/api/")
 and not starts_with(http.request.uri.path, "/_next/")
 and not starts_with(http.request.uri.path, "/cdn-cgi/")
 and not any(lower(http.request.headers.names[*])[*] eq "authorization")
 and not (http.cookie contains "better-auth.session_token="
          or http.cookie contains "__Secure-better-auth.session_token=")
 and not any(lower(http.request.headers.names[*])[*] eq "rsc")
 and not any(lower(http.request.headers.names[*])[*] eq "next-router-prefetch")
 and not any(lower(http.request.headers.names[*])[*] eq "next-router-segment-prefetch")
 and not any(lower(http.request.headers.names[*])[*] eq "next-router-state-tree"))
```

Configure the action as follows:

- Cache eligibility: **Eligible for cache**
- Edge TTL: **Ignore cache-control header and use this TTL** — 1 hour
- Browser TTL: **Respect existing headers**

The `Accept` condition limits the override to HTML navigations, while the path,
cookie, authorization, and Next.js request-header exclusions keep static assets,
authenticated traffic, APIs, and React Server Component payloads on their own
cache policies. Keep `app.scorelead.io` outside this rule.

The one-hour edge override prevents a deploy from leaving year-long stale HTML.
If deploy automation is later wired to purge the Cloudflare zone, the rule can
instead respect the origin's `s-maxage` value.

## Verify

After saving the rule, request a public URL twice:

```sh
curl -I -H 'Accept: text/html' https://scorelead.io/
curl -I -H 'Accept: text/html' https://scorelead.io/
```

The first response should normally report `cf-cache-status: MISS`; the second
should report `cf-cache-status: HIT`. Neither response should contain a
`set-cookie` header. Repeat with `/pt` and `/es`.

Also verify that a deployed static asset URL keeps its immutable asset policy
instead of receiving the one-hour HTML override:

```sh
curl -I 'https://scorelead.io/_next/static/<deployed-asset-path>'
```

Cloudflare references:

- <https://developers.cloudflare.com/cache/how-to/cache-rules/create-dashboard/>
- <https://developers.cloudflare.com/cache/how-to/cache-rules/settings/>
