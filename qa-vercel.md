# Vercel QA checkpoint

The deployed root URL `https://kitabi-six.vercel.app/` loads the Kitabi application successfully. The direct URL `https://kitabi-six.vercel.app/admin` returns a Vercel `404: NOT_FOUND` before the SPA is loaded, confirming a deployment rewrite/routing issue rather than an application authorization response.

The mobile screenshot also indicates that the root page loads but the desktop-oriented layout is too dense at the phone viewport. The next fixes are a Vercel SPA fallback and mobile overflow/layout adjustments while preserving the current visual identity.

After pushing commit `bb07b9e`, the deployed root still loads the app, but the direct `/admin` URL still returns Vercel `404: NOT_FOUND`. This indicates the visible deployment has not picked up the new Vercel routing configuration yet, or the Vercel project is deploying a different branch/root. The code-side fix is present in the GitHub `main` branch and requires a fresh deployment from that commit.

Reference check: Vercel rewrites are defined in root `vercel.json`. A Vercel community resolution for Vite SPA deep-link 404 identified that `cleanUrls: true` can conflict with a rewrite destination of `/index.html`; the recommended fix is removing cleanUrls or setting it false while keeping the rewrite. Source: https://community.vercel.com/t/rewrite-to-index-html-ignored-for-react-vite-spa-404-on-routes/8412
