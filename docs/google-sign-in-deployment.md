# Google sign-in deployment checks

Google refuses to render its account screen inside an iframe. Ummverse uses
Lovable Cloud's required managed Google helper, which already performs a full-page
redirect when the app is opened as a top-level page and a provider popup in the
Lovable editor. Do not replace it with direct Supabase Google OAuth or custom
iframe navigation: the managed credentials and preview session exchange depend
on the helper.

For a Vercel deployment:

1. Open the actual deployed app in its own browser tab, not an embedded deployment
   preview. The Google account screen must be a top-level page or provider popup.
2. In Lovable, open **More → Users → Auth settings → Advanced**. Add the exact
   Vercel origin with `/**` to Redirect URLs. Add each preview origin you use.
   Set Site URL to the intended production address if desired.
3. The app returns to `${window.location.origin}/auth/callback`. This public page
   handles automatically hydrated sessions, unprocessed PKCE codes or complete
   token fragments, verifies the user, removes URL credentials and goes directly
   to `/dashboard`. It never initiates Google sign-in.
4. Check the deployment's security headers and embedding parent if the provider
   still reports `ERR_BLOCKED_BY_RESPONSE`; an iframe cannot bypass Google's
   anti-framing response headers. Capture the failing navigation chain without
   sharing codes or tokens.

Hosted settings checked on 2026-11-14 include the Ummverse domains and Lovable
preview/published domains, but no `vercel.app` origin. The reported Vercel URL
was not supplied, so its navigation chain and successful Google account exchange
remain unverified. SPA rewrites alone do not verify OAuth hosting support.