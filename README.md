# fauzislami.github.io

This is the Hugo source for the site published at fauzislami.github.io. The
original Hugo project was lost; it was rebuilt from the site's own published
HTML. For the full story (what was recovered, what was inferred, and the
tradeoffs made along the way), see `specs/001-recover-hugo-source/spec.md`.

**Branch layout:**
- `master` — this branch. The Hugo source: config, content, theme submodule.
  Nothing here is served directly; it has to be built.
- `gh-pages` — the generated output branch. GitHub Pages is configured to
  serve from here. Don't hand-edit it; `.github/workflows/build-deploy.yml`
  keeps it in sync with `master`.

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

## Publishing

`.github/workflows/build-deploy.yml` builds the site with Hugo and, when it
publishes, commits and pushes the output straight to `gh-pages` — the branch
GitHub Pages actually serves. There is no staging step in that publish path.

**The workflow's `on: push` trigger is currently disabled** (commented out
in `build-deploy.yml`), so pushing to `master` does not, by itself, publish
anything. Only `workflow_dispatch` (manual run) is active, and it defaults
to `dry_run: true` — a manual run in that mode builds the site and uploads
the result as a downloadable Actions artifact instead of touching `gh-pages`.
To do a real publish: either run the workflow manually with `dry_run` set to
`false`, or uncomment the `on: push` block once you're ready for every future
push to `master` to auto-publish.
