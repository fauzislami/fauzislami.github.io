# Recover Hugo source for fauzislami.github.io

## Problem

This repo (`fauzislami/fauzislami.github.io`) is a GitHub Pages user-site repo. Its `master`
branch currently contains only the *generated* static output of a Hugo build (raw HTML,
`css/`, `js/`, `images/`, etc. at the repo root) — the Hugo source that produced it
(`hugo.toml`/`config.toml`, `content/`, the theme) was never committed here. Git history
confirms this: `git log --all --diff-filter=A --name-only` finds no `content/`, `layouts/`,
`archetypes/`, or Hugo config file in any commit, and there is only one branch
(`master`) on the remote. The source lived only outside this repo (locally or elsewhere)
and was lost. The user wants a working Hugo source project recovered/reconstructed so they
can continue writing new posts.

## Site facts established during investigation

- Generator meta tag: `Hugo 0.92.2`. Theme identified via
  `<meta name="keywords" content='blog, gokarna, hugo'>` and site structure as the
  **Gokarna** theme, real repo: `https://github.com/gokarna-theme/gokarna-hugo`.
- Real content lives under `blog/` and (partially — see below) `thoughts/`. `posts/`
  contains only Gokarna's theme-demo/starter content (`lorem-ipsum`, `hello`,
  `emoji-support`, `testing-post`, `markdown-syntax`, `theme-documentation-basics`,
  `theme-documentation-advanced`) — not the user's writing, and will not be recreated.
- **`projects/hydra`, `projects/bludhaven`, `projects/tatooine`, and their `thoughts/`
  namesakes (`thoughts/hydra`, `thoughts/bludhaven`, `thoughts/tatooine`) are unedited
  Gokarna theme demo placeholders**, confirmed by diffing them word-for-word against the
  theme's own `exampleSite/content/projects/{hydra,bludhaven,tatooine}.md` — identical
  text (e.g. "A project was planned, but never completed."). The `projects/` section is
  also not linked from the site nav at all. Decision (user-approved): drop the entire
  `projects/` section and these 3 `thoughts/` entries from the recovery — they are not
  the user's writing.
- **28 real posts to recover**: 23 under `blog/` + 5 under `thoughts/`
  (`thoughts/trade-off`, `thoughts/daring-echo`, `thoughts/generational-dispute`,
  `thoughts/upon-midst-of-war`, `thoughts/pewaris-atau-perintis` — confirmed real by
  matching recent genuine commits, e.g. "add new article: Daring Echo"). Full list of the
  23 real `blog/` posts (exact current paths, confirmed via `find`):
  - Flat-slug: `blog/pod-topology-spread-constraints/`,
    `blog/terratest-golang-for-infrastructure-e2e-testing/`,
    `blog/k8s-thing-how-linux-namespace-Plays-a-role-in-Kubernetes/`,
    `blog/k8s-thing-how-linux-namespace-works-in-a-pod/`, `blog/fluxcd-image-watcher/`,
    `blog/flux-image-watcher/`, `blog/linter-aggregator-golangci-lint/`.
  - Date-path (`/blog/YYYY/MM/DD/slug/`): `blog/2021/01/18/automating-k8s-cluster-installation-with-kubespray/`,
    `blog/2021/03/03/ci-cd-labs-part-1-integrate-jenkins-with-nexus-repository-oss/`,
    `blog/2021/03/05/ci-cd-labs-part-2-integrate-jenkins-with-bitbucket-server/`,
    `blog/2021/03/10/menambahkan-trusted-certificate-pada-jvm-di-jenkins/`,
    `blog/2021/03/10/namespace-openshift-tidak-dapat-dihapus/`,
    `blog/2021/03/10/storagecluster-ocs-tidak-dapat-dihapus/`,
    `blog/2021/03/20/machineconfigpool-degraded-saat-updating-error-when-evicting-pod/`,
    `blog/2021/03/26/ci-cd-labs-part-3-integrate-jenkins-with-openshift/`,
    `blog/2021/07/23/collecting-network-traffic-using-tcpdump-on-pod-level-in-openshift/`,
    `blog/2021/08/01/service-mesh-istio-and-kiali-setup/`,
    `blog/2021/09/26/secure-k8s-secret-object-using-sealedsecret/`,
    `blog/2021/10/08/proxying-pypi-repository-in-nexus-repository-manager/`,
    `blog/2021/10/14/proxying-docker-registry-through-nexus-repository-manager/`,
    `blog/2021/10/17/highly-available-kubernetes-cluster-with-haproxy-and-keepalived/`,
    `blog/2022/02/06/immutable-infrastructure-treating-servers-like-cattle-does-it-sound-ridiculous/`,
    `blog/2022/02/18/jcasc-jenkins-configuration-as-code-setting-up-jenkins-in-a-fully-reproducible-way/`.
  - Two posts (`blog/2022/02/06/immutable-infrastructure-...`,
    `blog/2022/02/18/jcasc-jenkins-configuration-as-code-...`) contain a `.notice info`
    callout box in their body (from a shortcode not native to Gokarna) with the text
    "This post has some corrupted data. Will fix it soon!" — carry this over verbatim,
    it's the user's own existing published caveat, not something to fix now.
  - No post actually uses the `categories/` taxonomy despite `categories/*` list pages
    existing (confirmed via grep across all post HTML) — so front matter only needs
    `tags`, not `categories`.
- Per-post metadata available directly in the rendered HTML: title (`<h1>`), date
  (`.post-date`), tags (`.post-tags a` links), and full body (`.post-content`).
- Homepage/site params observed live and matched against the real theme's exampleSite
  config (`/tmp/gokarna-check/exampleSite/hugo.toml`, confirms param names):
  - `title = "Blog · Muhammad Fauzi Islami"`
  - `description = "/home/fauzislami/blog"`
  - `metaKeywords = ["blog", "gokarna", "hugo"]`
  - accent color `#FF4D4D`
  - footer copyright text: "Fauzi Islami"
  - `socialIcons`: github (`https://github.com/fauzislami`), linkedin
    (`https://www.linkedin.com/in/fauzislami/`), instagram
    (`https://www.instagram.com/fauzislami/`)
  - Nav menu: Home (`/`), Posts (`/posts/`), Thoughts (`/thoughts/`), Tags (`/tags/`),
    "About Me" (external, `https://about.me/fauzislami`), GitHub icon link.
  - `customHeadHTML` carries the KaTeX CDN `<link>`/`<script>` includes — this is a
    first-class Gokarna param (confirmed in the theme's exampleSite config), so the
    site-wide KaTeX include maps directly onto it.
- The current (latest) Gokarna theme release no longer has the homepage "typewriter"
  intro animation the live site currently has, and renamed some CSS classes
  (`social-icons` → `gk-social-icons`). Decision (user-approved): use the latest theme
  release as-is and accept this cosmetic difference, rather than pinning an old theme
  commit — easier to maintain, gets theme fixes going forward.
- The current theme has no built-in "notice" callout shortcode. A small custom
  `layouts/shortcodes/notice.html` will be added on top of the theme to reproduce the
  look used by the two posts above, and to make the shortcode available for future posts.

## Decisions made (user-approved)

1. **Where the source lives**: a new **orphan branch `source`** in this same repo
   (unrelated history to `master`, since the two hold fundamentally different kinds of
   files). `master` is not modified by hand during this work — only by the automated
   publish step described below, and only once verified.
2. **Publishing**: a GitHub Actions workflow living on `source`
   (`.github/workflows/*.yml`) builds the site with Hugo on push and commits/pushes the
   generated `public/` output to `master` automatically. No manual build step needed for
   future posts — write markdown on `source`, push, done.
3. **Theme**: the real Gokarna theme (`gokarna-theme/gokarna-hugo`) added as a **git
   submodule** at `themes/gokarna`, latest release — not a hand-copied recreation.
4. **Demo content**: `posts/` (Gokarna's starter/demo posts), the entire `projects/`
   section, and the 3 unedited `thoughts/` demo entries (`hydra`, `bludhaven`,
   `tatooine`) are **not** recreated — none of it is the user's writing.
5. **Content conversion**: the 28 real posts under `blog/` and `thoughts/` **are**
   converted from their existing rendered HTML into Markdown (best-effort automated
   script), since Hugo cannot build without markdown source and this content doesn't
   exist anywhere else. The user will do a light proofread pass afterward rather than
   requiring a line-by-line manual conversion.
6. **Permalinks**: each converted post gets an explicit `url:` front matter field set to
   its current published path (taken directly from the existing HTML's location), so the
   rebuilt site's URLs are guaranteed to match today's — this avoids having to reverse-
   engineer Hugo's historical `permalinks` config (which appears to have changed over the
   site's lifetime, since some posts use flat slugs and others use `/YYYY/MM/DD/slug/`).
7. **Taxonomies**: only `tags` are set in front matter; `categories` are omitted (unused
   in practice on every real post).

## Non-goals

- Pixel-perfect visual reproduction of the 2022-era theme (typewriter animation, old CSS
  class names) — explicitly out of scope per decision above.
- Fixing the "corrupted data" notices in the two flagged posts — carried over as-is.
- Recreating the `posts/` demo/starter content, the `projects/` section, or the 3
  unedited demo `thoughts/` entries (`hydra`, `bludhaven`, `tatooine`).
- Any changes to `master`'s current published content until the rebuilt source's output
  has been verified to match.

## Verification plan

1. Build the reconstructed `source` branch locally with `hugo` (pinned to a version
   compatible with the theme's `min_version` requirement).
2. Diff the freshly generated `public/` output against the current `master` content,
   ignoring expected/approved cosmetic differences (lost typewriter effect, renamed CSS
   classes, Hugo generator version string, sitemap `lastmod` timestamps, RSS feed
   content).
3. Confirm for every real post: same URL path, same title, same tags, same body text
   (allowing for HTML-to-Markdown round-trip formatting differences, not content loss).
4. Spot-check rendering of: both "notice" posts, one date-path-permalink post, one
   flat-slug-permalink post, and the homepage/KaTeX includes.
5. Only after this local verification passes does the GitHub Actions publish step get
   exercised against `master` for real.
