# fauzislami.github.io

This is the `source` branch: the reconstructed Hugo source for the site
published at fauzislami.github.io. The original Hugo project was lost; this
branch was rebuilt from the site's own published HTML. For the full story
(what was recovered, what was inferred, and the tradeoffs made along the way),
see `specs/001-recover-hugo-source/spec.md`.

## Working locally

```
git clone --recurse-submodules <repo-url>
# or, if already cloned:
git submodule update --init

hugo server -D
```

To start a new post:

```
hugo new blog/<slug>.md
hugo new thoughts/<slug>.md
```

The archetypes set `type: post` automatically.

New posts do not need a `url:` front-matter field. That field only appears on
the 28 recovered posts, to freeze their exact legacy URLs (some of which use
the old `/blog/YYYY/MM/DD/slug/` permalink shape). New posts get a clean
`/blog/<slug>/` or `/thoughts/<slug>/` URL automatically.

## Warning: first push has an immediate effect on the live site

Pushing `source` to the remote triggers `.github/workflows/build-deploy.yml`,
which builds the site with Hugo and immediately commits and pushes the output
straight to `master` — the live, published branch. There is no staging step.

On the first run after this reconstruction, that publish will remove the
theme-demo leftovers currently live on `master`: `/posts/`, `/projects/`,
three unedited demo pages under `/thoughts/`, stale demo tag pages, and the
old asset paths `/icons/`, `/css/`, `/js/` (replaced by new theme-provided
paths). This is intentional cleanup per the recovery spec, not a regression,
but it is a real and immediate change to the live site, so it's worth being
aware of before pushing.

If you'd rather inspect a build before it goes live: temporarily remove the
`on: push` trigger from `build-deploy.yml` so only `workflow_dispatch`
remains, push `source`, run the workflow manually and inspect its build
artifact/logs, then restore the `on: push` trigger once you're satisfied.
