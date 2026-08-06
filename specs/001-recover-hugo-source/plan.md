# Recover Hugo source for fauzislami.github.io — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct a working Hugo source project on the `source` branch (real Gokarna
theme + all 28 real posts converted from the currently-published HTML into Markdown) so
the user can continue writing new posts, with an automated pipeline that publishes to
`master`.

**Architecture:** A standard Hugo project (`hugo.toml`, `content/`, `themes/gokarna` as a
git submodule, a small custom shortcode) reconstructed from scratch on the orphan
`source` branch. A one-time Node.js recovery script reads the existing rendered HTML from
a read-only reference checkout of `master` (already available at
`/tmp/claude-72518314/-home-fauzi-accelbyte-net-accelbyte-personal-github-fauzislami-github-io/af324ece-d41e-41b6-bda7-0fcfa72ef185/scratchpad/master-ref`,
a `git worktree` of `master`) and emits Markdown + front matter for every real post. A
verification script then diffs a fresh Hugo build against that same reference to confirm
nothing was lost in translation. A GitHub Actions workflow (created but not triggered as
part of this plan) builds `source` and publishes to `master` on every future push.

**Tech Stack:** Hugo (binary at `hugo`, v0.152.2, confirmed installed), Gokarna theme
(`gokarna-theme/gokarna-hugo`) as a git submodule, Node.js 18 with `cheerio` +
`turndown` for the one-time HTML→Markdown recovery script (Node's built-in `node:test`
for its unit tests — no test framework dependency needed).

## Global Constraints

- Everything in this plan happens on the `source` branch. Do not modify `master` by hand
  at any point — only the (separately-triggered) GitHub Actions workflow may ever write
  to `master`, and only after Task 7's local verification has passed.
- The read-only reference checkout of `master`'s current content lives at
  `$MASTER_REF` = `/tmp/claude-72518314/-home-fauzi-accelbyte-net-accelbyte-personal-github-fauzislami-github-io/af324ece-d41e-41b6-bda7-0fcfa72ef185/scratchpad/master-ref`
  (a `git worktree`). If it's missing when you start (e.g. new session), recreate it from
  the repo root with: `git worktree add $MASTER_REF master`.
- Do not recreate `posts/` (theme demo content), the `projects/` section, or
  `thoughts/hydra`, `thoughts/bludhaven`, `thoughts/tatooine` (unedited theme demo
  placeholders) — confirmed non-goals in `specs/001-recover-hugo-source/spec.md`.
- Exactly 28 real posts to recover: 23 under `blog/`, 5 under `thoughts/` — the
  authoritative list is given in Task 6.
- Every converted post's front matter MUST include an explicit `url:` field matching its
  current published path exactly (from `$MASTER_REF`), so rebuilt URLs never change.
- Do not `git push` any branch, and do not trigger the GitHub Actions workflow, without
  explicit user confirmation first — this repo is a live published site.

---

## File Structure

```
hugo.toml                          site config (Task 1, 2)
.gitignore                         ignores /public, /resources, node_modules (Task 1)
.gitmodules                        theme submodule pointer (Task 1)
themes/gokarna/                    git submodule (Task 1)
archetypes/blog.md                 `hugo new blog/<slug>.md` template (Task 1)
archetypes/thoughts.md             `hugo new thoughts/<slug>.md` template (Task 1)
layouts/shortcodes/notice.html     custom callout shortcode (Task 3)
static/images/                     real post images + site logo, copied from master (Task 4)
static/favicon.ico, favicon-16x16.png, favicon-32x32.png,
  apple-touch-icon.png, android-chrome-192x192.png,
  android-chrome-512x512.png, site.webmanifest
                                    real favicon set, copied from master (Task 4)
content/blog/*.md                  23 real posts (Task 6)
content/thoughts/*.md              5 real posts (Task 6)
scripts/recovery/package.json      cheerio + turndown deps (Task 5)
scripts/recovery/lib.mjs           date parsing, front matter, HTML->MD+notice conversion (Task 5)
scripts/recovery/lib.test.mjs      unit tests for lib.mjs (Task 5)
scripts/recovery/convert.mjs       driver: walks 28 posts, writes content/*.md (Task 6)
scripts/recovery/verify.mjs        driver: diffs public/ build against $MASTER_REF (Task 7)
.github/workflows/build-deploy.yml build `source` -> publish to `master` (Task 8)
```

---

### Task 1: Hugo project skeleton + Gokarna theme submodule

**Files:**
- Create: `hugo.toml`
- Create: `.gitignore`
- Create: `archetypes/blog.md`
- Create: `archetypes/thoughts.md`
- Create: `.gitmodules` (via `git submodule add`)

**Interfaces:**
- Produces: a buildable Hugo project with the real theme installed at `themes/gokarna`,
  and a minimal `hugo.toml` (`theme = "gokarna"`, `baseURL`, `title`) that Task 2 will
  extend with the full param/menu set.

- [ ] **Step 1: Add to `.gitignore`**

A `.gitignore` already exists (with a `.superpowers/` entry used by the execution
tooling — leave that line alone). Append these lines to it:

```
/public/
/resources/
.hugo_build.lock
node_modules/
```

- [ ] **Step 2: Add the Gokarna theme as a git submodule**

Run: `git submodule add https://github.com/gokarna-theme/gokarna-hugo themes/gokarna`

Expected: creates `.gitmodules` and `themes/gokarna/` populated with the theme's files
(you should see `themes/gokarna/layouts/`, `themes/gokarna/theme.toml`, etc.).

- [ ] **Step 3: Create a minimal `hugo.toml`**

```toml
baseURL = "https://fauzislami.github.io/"
languageCode = "en"
title = "Blog · Muhammad Fauzi Islami"
theme = "gokarna"
```

- [ ] **Step 4: Verify the project builds**

Run: `hugo --minify`
Expected: exits 0, prints something like `Pages | 1` (just the homepage — no content
yet), and creates `public/index.html`.

- [ ] **Step 5: Create archetypes for future posts**

`archetypes/blog.md`:
```markdown
---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
date: {{ .Date }}
type: post
tags: []
draft: true
---
```

`archetypes/thoughts.md`:
```markdown
---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
date: {{ .Date }}
type: post
tags: []
draft: true
---
```

- [ ] **Step 6: Commit**

```bash
git add hugo.toml .gitignore .gitmodules themes archetypes
git commit -m "feat: initialize Hugo project skeleton with Gokarna theme submodule"
```

---

### Task 2: Site configuration matching the live site

**Files:**
- Modify: `hugo.toml`

**Interfaces:**
- Consumes: the minimal `hugo.toml` from Task 1.
- Produces: the final site-wide config (menu, social icons, colors, KaTeX include) that
  every later build depends on. No further tasks modify `hugo.toml`.

- [ ] **Step 1: Replace `hugo.toml` with the full config**

```toml
baseURL = "https://fauzislami.github.io/"
languageCode = "en"
title = "Blog · Muhammad Fauzi Islami"
theme = "gokarna"
enableEmoji = true
enableRobotsTXT = true
pygmentsStyle = "monokai"

[params]
  accentColor = "#FF4D4D"
  avatarURL = "/images/logo-blog-oji.png"
  avatarAltText = "avatar"
  avatarSize = "size-m"
  description = "/home/fauzislami/blog"
  footer = "Fauzi Islami"
  metaKeywords = ["blog", "gokarna", "hugo"]
  showBackToTopButton = true

  socialIcons = [
    { name = "github", url = "https://github.com/fauzislami" },
    { name = "linkedin", url = "https://www.linkedin.com/in/fauzislami/" },
    { name = "instagram", url = "https://www.instagram.com/fauzislami/" },
  ]

  customHeadHTML = """
    <!-- KaTeX -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP" crossorigin="anonymous">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js" integrity="sha384-cMkvdD8LoxVzGF/RPUKAcvmm49FQ0oxwDF3BGKtDXcEc+T1b2N+teh/OJfpU0jr6" crossorigin="anonymous"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js" integrity="sha384-hCXGrW6PitJEwbkoStFjeJxv+fSOOQKOPbJxSfM6G5sWZjAyWhXiTIIAmQqnlLlh" crossorigin="anonymous"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
          ],
          throwOnError: false
        });
      });
    </script>
  """

[[menu.main]]
  name = "Home"
  url = "/"
  weight = 1

[[menu.main]]
  name = "Posts"
  url = "/blog/"
  weight = 2

[[menu.main]]
  name = "Thoughts"
  url = "/thoughts/"
  weight = 3

[[menu.main]]
  name = "About Me"
  url = "https://about.me/fauzislami"
  weight = 4

[[menu.main]]
  name = "Tags"
  url = "/tags/"
  weight = 5

[[menu.main]]
  identifier = "github"
  pre = "<span data-feather='github'></span>"
  url = "https://github.com/fauzislami"
  weight = 6

[markup.tableOfContents]
  startLevel = 1
  endLevel = 4
  ordered = false

[minify]
  minifyOutput = true
```

- [ ] **Step 2: Build and verify params landed in the output**

Run: `hugo --minify && grep -o 'accent-color: #FF4D4D' public/index.html`
Expected: prints `accent-color: #FF4D4D` (confirms `accentColor` param reached the
homepage's inline style).

Run: `grep -o 'href="https://github.com/fauzislami"' public/index.html | head -1`
Expected: prints the href once (confirms the social icon / menu link rendered).

Run: `grep -c 'katex.min.css' public/index.html`
Expected: `1` (confirms `customHeadHTML` rendered into `<head>`).

- [ ] **Step 3: Commit**

```bash
git add hugo.toml
git commit -m "feat: configure site params, menu, and KaTeX to match the live site"
```

---

### Task 3: Custom notice shortcode

**Files:**
- Create: `layouts/shortcodes/notice.html`

**Interfaces:**
- Consumes: nothing new.
- Produces: a `{{< notice "TYPE" >}}...{{< /notice >}}` shortcode. Task 5/6's conversion
  script emits exactly this call syntax for the 3 real posts that use it
  (`blog/2022/02/06/immutable-infrastructure-...`,
  `blog/2022/02/18/jcasc-jenkins-configuration-as-code-...`,
  `blog/k8s-thing-how-linux-namespace-Plays-a-role-in-Kubernetes/`), so the shortcode's
  output markup must match what those pages already render on `master` (verified in
  Step 2 below, and again for real content in Task 7).

- [ ] **Step 1: Create the shortcode**

```html
{{ $type := .Get 0 | default "note" }}
{{ $title := .Get 1 | default (title $type) }}
<div><svg width="0" height="0" style="display:none" xmlns="http://www.w3.org/2000/svg"><symbol id="tip-notice" viewBox="0 0 512 512"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"/></symbol><symbol id="note-notice" viewBox="0 0 512 512"><path d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"/></symbol><symbol id="warning-notice" viewBox="0 0 576 512"><path d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"/></symbol><symbol id="info-notice" viewBox="0 0 512 512"><path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"/></symbol></svg></div><div class="notice {{ $type }}"><p class="first notice-title"><span class="icon-notice baseline"><svg><use href="#{{ $type }}-notice"></use></svg></span>{{ $title }}</p>{{ .Inner | markdownify }}</div>
<style>.notice{padding:18px;line-height:24px;margin-bottom:24px;border-radius:4px;color:#444;background:#e7f2fa}.notice p:last-child{margin-bottom:0}.notice-title{margin:-18px -18px 12px;padding:4px 18px;border-radius:4px 4px 0 0;font-weight:700;color:#fff;background:#6ab0de}.notice.warning .notice-title{background:rgba(217,83,79,.9)}.notice.warning{background:#fae2e2}.notice.info .notice-title{background:#f0b37e}.notice.info{background:#fff2db}.notice.note .notice-title{background:#6ab0de}.notice.note{background:#e7f2fA}.notice.tip .notice-title{background:rgba(92,184,92,.8)}.notice.tip{background:#e6f9e6}.icon-notice{display:inline-flex;align-self:center;margin-right:8px}.icon-notice img,.icon-notice svg{height:1em;width:1em;fill:currentColor}.icon-notice img,.icon-notice.baseline svg{top:0.125em;position:relative}</style>
```

- [ ] **Step 2: Smoke-test the shortcode with a throwaway post**

Run:
```bash
mkdir -p content/blog
cat > content/blog/_shortcode-smoke-test.md <<'EOF'
---
title: "Shortcode Smoke Test"
date: 2024-01-01
type: post
tags: []
draft: false
---

{{< notice "info" >}}
This post has some corrupted data. Will fix it soon!
{{< /notice >}}
EOF
hugo --minify
grep -c 'class="notice info"' public/blog/_shortcode-smoke-test/index.html
grep -o 'This post has some corrupted data. Will fix it soon!' public/blog/_shortcode-smoke-test/index.html
```
Expected: `1`, then the sentence printed back (confirms the shortcode renders the exact
`notice info` markup and passes inner markdown through correctly).

- [ ] **Step 3: Remove the smoke-test post**

Run: `rm content/blog/_shortcode-smoke-test.md`

- [ ] **Step 4: Commit**

```bash
git add layouts/shortcodes/notice.html
git commit -m "feat: add notice callout shortcode to reproduce the three posts using it"
```

---

### Task 4: Static assets — real images and favicons

**Files:**
- Create: `static/images/` (copied)
- Create: `static/favicon.ico`, `static/favicon-16x16.png`, `static/favicon-32x32.png`,
  `static/apple-touch-icon.png`, `static/android-chrome-192x192.png`,
  `static/android-chrome-512x512.png`, `static/site.webmanifest` (copied)

**Interfaces:**
- Consumes: `$MASTER_REF` (the reference worktree of `master`, see Global Constraints).
- Produces: every `/images/...` path referenced by converted post bodies (Task 6) will
  resolve once built; the site's real favicon set (not the theme's placeholder) is used.

- [ ] **Step 1: Copy the images directory**

Run:
```bash
mkdir -p static
cp -r "$MASTER_REF/images" static/images
```
Expected: `static/images/` now contains the same ~100 files as `$MASTER_REF/images`
(logo, per-post diagrams like `static/images/podTopologySpreadConstraints/main.png`,
`static/images/trade-off/1.jpg`, etc.)

- [ ] **Step 2: Copy the favicon set**

Run:
```bash
for f in favicon.ico favicon-16x16.png favicon-32x32.png apple-touch-icon.png \
         android-chrome-192x192.png android-chrome-512x512.png site.webmanifest; do
  cp "$MASTER_REF/$f" "static/$f"
done
```

- [ ] **Step 3: Verify via build**

Run: `hugo --minify && ls public/images | wc -l && test -f public/favicon.ico && echo OK`
Expected: a count matching `ls "$MASTER_REF/images" | wc -l`, and `OK` printed.

- [ ] **Step 4: Commit**

```bash
git add static
git commit -m "feat: add real site images and favicon set from the published site"
```

---

### Task 5: Recovery script library — date parsing, front matter, notice conversion

**Files:**
- Create: `scripts/recovery/package.json`
- Create: `scripts/recovery/lib.mjs`
- Test: `scripts/recovery/lib.test.mjs`

**Interfaces:**
- Consumes: nothing (pure functions + cheerio/turndown).
- Produces (consumed by Task 6's `convert.mjs`):
  - `parsePostDate(text: string): string | null` — parses `"Month D, YYYY"` (the
    `.post-date` text) into `"YYYY-MM-DD"`, or `null` if unparseable.
  - `parseRssPubDate(text: string): string | null` — parses an RFC 2822 `<pubDate>`
    (e.g. `"Sat, 29 Jun 2024 12:32:59 +0700"`) into `"YYYY-MM-DD"`.
  - `buildFrontMatter({ title: string, date: string, tags: string[], url: string }): string`
    — returns the full YAML front matter block (including the `---` delimiters) with
    `type: post` always set.
  - `htmlToMarkdownWithNotices($: CheerioAPI, contentEl: Cheerio): string` — takes a
    loaded cheerio document and the `.post-content` element, rewrites any
    `div.notice.<type>` into the `{{< notice "<type>" >}}...{{< /notice >}}` shortcode
    call, and returns the resulting Markdown string.

- [ ] **Step 1: Create `package.json` and install dependencies**

```json
{
  "name": "recovery-scripts",
  "private": true,
  "type": "module",
  "dependencies": {
    "cheerio": "^1.0.0",
    "turndown": "^7.2.0"
  }
}
```

Run: `cd scripts/recovery && npm install && cd ../..`
Expected: `scripts/recovery/node_modules/` created, `scripts/recovery/package-lock.json`
created, exit 0.

- [ ] **Step 2: Write the failing tests**

`scripts/recovery/lib.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
import {
  parsePostDate,
  parseRssPubDate,
  buildFrontMatter,
  htmlToMarkdownWithNotices,
} from './lib.mjs';

test('parsePostDate parses "Month D, YYYY"', () => {
  assert.equal(parsePostDate('November 1, 2022'), '2022-11-01');
  assert.equal(parsePostDate('  February 27, 2023  '), '2023-02-27');
});

test('parsePostDate returns null for unrecognized text', () => {
  assert.equal(parsePostDate(''), null);
  assert.equal(parsePostDate('not a date'), null);
});

test('parseRssPubDate parses an RFC 2822 pubDate', () => {
  assert.equal(parseRssPubDate('Sat, 29 Jun 2024 12:32:59 +0700'), '2024-06-29');
  assert.equal(parseRssPubDate('Tue, 24 Oct 2023 12:49:56 +0700'), '2023-10-24');
});

test('buildFrontMatter emits the expected YAML', () => {
  const fm = buildFrontMatter({
    title: 'Distribute Pods Across Nodes With topologySpreadConstraints',
    date: '2022-11-01',
    tags: ['Kubernetes'],
    url: '/blog/pod-topology-spread-constraints/',
  });
  assert.match(fm, /^---\n/);
  assert.match(fm, /title: "Distribute Pods Across Nodes With topologySpreadConstraints"/);
  assert.match(fm, /date: 2022-11-01/);
  assert.match(fm, /type: post/);
  assert.match(fm, /url: "\/blog\/pod-topology-spread-constraints\/"/);
  assert.match(fm, /tags: \["Kubernetes"\]/);
  assert.match(fm, /\n---$/);
});

test('buildFrontMatter escapes double quotes in the title', () => {
  const fm = buildFrontMatter({
    title: 'A "quoted" title',
    date: '2022-01-01',
    tags: [],
    url: '/blog/x/',
  });
  assert.match(fm, /title: "A \\"quoted\\" title"/);
  assert.match(fm, /tags: \[\]/);
});

test('htmlToMarkdownWithNotices converts a notice info box to the shortcode', () => {
  const html = `<div class="post-content"><p>intro</p>
<div class="notice info" >
<p class="first notice-title"><span class="icon-notice baseline"><svg><use href="#info-notice"></use></svg></span>Info</p><p><strong>This post has some corrupted data. Will fix it soon!</strong></p></div>
</div>`;
  const $ = cheerio.load(html);
  const markdown = htmlToMarkdownWithNotices($, $('.post-content'));
  assert.match(markdown, /\{\{< notice "info" >\}\}/);
  assert.match(markdown, /This post has some corrupted data\. Will fix it soon!/);
  assert.match(markdown, /\{\{< \/notice >\}\}/);
  assert.doesNotMatch(markdown, /notice-title/);
});

test('htmlToMarkdownWithNotices leaves normal content untouched', () => {
  const html = '<div class="post-content"><h1 id="intro">Intro</h1><p>Hello <strong>world</strong></p></div>';
  const $ = cheerio.load(html);
  const markdown = htmlToMarkdownWithNotices($, $('.post-content'));
  assert.match(markdown, /# Intro/);
  assert.match(markdown, /Hello \*\*world\*\*/);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd scripts/recovery && node --test lib.test.mjs; cd ../..`
Expected: FAIL — `lib.mjs` doesn't exist yet (`Cannot find module './lib.mjs'`).

- [ ] **Step 4: Implement `lib.mjs`**

```js
import TurndownService from 'turndown';

const MONTH_NAMES = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

const RSS_MONTH_ABBR = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

export function parsePostDate(text) {
  const m = text.trim().match(/^(\w+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) return null;
  const [, monthName, day, year] = m;
  const month = MONTH_NAMES[monthName];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseRssPubDate(text) {
  const m = text.trim().match(/^\w+,\s+(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const [, day, monthAbbr, year] = m;
  const month = RSS_MONTH_ABBR[monthAbbr];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function yamlQuote(str) {
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function buildFrontMatter({ title, date, tags, url }) {
  const lines = ['---'];
  lines.push(`title: ${yamlQuote(title)}`);
  lines.push(`date: ${date}`);
  lines.push('type: post');
  lines.push(`url: ${yamlQuote(url)}`);
  lines.push(`tags: [${tags.map(yamlQuote).join(', ')}]`);
  lines.push('draft: false');
  lines.push('---');
  return lines.join('\n');
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export function htmlToMarkdownWithNotices($, contentEl) {
  const $content = $(contentEl).clone();
  $content.find('div.notice').each((_, el) => {
    const $el = $(el);
    const classAttr = $el.attr('class') || '';
    const type = classAttr.split(/\s+/)[1] || 'note';
    $el.find('.notice-title').remove();
    const inner = $el.html().trim();
    $el.replaceWith(`<p>%%NOTICE_OPEN_${type}%%</p>${inner}<p>%%NOTICE_CLOSE%%</p>`);
  });
  const html = $content.html();
  let markdown = turndownService.turndown(html);
  markdown = markdown
    .replace(/%%NOTICE_OPEN_(\w+)%%/g, '{{< notice "$1" >}}')
    .replace(/%%NOTICE_CLOSE%%/g, '{{< /notice >}}');
  return markdown;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd scripts/recovery && node --test lib.test.mjs; cd ../..`
Expected: all tests PASS (0 failing).

- [ ] **Step 6: Commit**

```bash
git add scripts/recovery/package.json scripts/recovery/package-lock.json \
        scripts/recovery/lib.mjs scripts/recovery/lib.test.mjs
git commit -m "feat: add recovery-script library with tests (dates, front matter, notices)"
```

---

### Task 6: Conversion driver — generate all 28 real posts

**Files:**
- Create: `scripts/recovery/convert.mjs`
- Creates (as output, not hand-written): `content/blog/*.md` (23 files),
  `content/thoughts/*.md` (5 files)

**Interfaces:**
- Consumes: `lib.mjs`'s four exports from Task 5; reads HTML from `$MASTER_REF`.
- Produces: `content/blog/<slug>.md` and `content/thoughts/<slug>.md` for all 28 real
  posts — consumed by Task 7's build + verification.

- [ ] **Step 1: Write `convert.mjs`**

```js
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { parsePostDate, parseRssPubDate, buildFrontMatter, htmlToMarkdownWithNotices } from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

const masterRef = process.argv[2];
if (!masterRef) {
  console.error('Usage: node convert.mjs <path-to-master-worktree>');
  process.exit(1);
}

const BLOG_POSTS = [
  'blog/pod-topology-spread-constraints',
  'blog/terratest-golang-for-infrastructure-e2e-testing',
  'blog/k8s-thing-how-linux-namespace-Plays-a-role-in-Kubernetes',
  'blog/k8s-thing-how-linux-namespace-works-in-a-pod',
  'blog/fluxcd-image-watcher',
  'blog/flux-image-watcher',
  'blog/linter-aggregator-golangci-lint',
  'blog/2021/01/18/automating-k8s-cluster-installation-with-kubespray',
  'blog/2021/03/03/ci-cd-labs-part-1-integrate-jenkins-with-nexus-repository-oss',
  'blog/2021/03/05/ci-cd-labs-part-2-integrate-jenkins-with-bitbucket-server',
  'blog/2021/03/10/menambahkan-trusted-certificate-pada-jvm-di-jenkins',
  'blog/2021/03/10/namespace-openshift-tidak-dapat-dihapus',
  'blog/2021/03/10/storagecluster-ocs-tidak-dapat-dihapus',
  'blog/2021/03/20/machineconfigpool-degraded-saat-updating-error-when-evicting-pod',
  'blog/2021/03/26/ci-cd-labs-part-3-integrate-jenkins-with-openshift',
  'blog/2021/07/23/collecting-network-traffic-using-tcpdump-on-pod-level-in-openshift',
  'blog/2021/08/01/service-mesh-istio-and-kiali-setup',
  'blog/2021/09/26/secure-k8s-secret-object-using-sealedsecret',
  'blog/2021/10/08/proxying-pypi-repository-in-nexus-repository-manager',
  'blog/2021/10/14/proxying-docker-registry-through-nexus-repository-manager',
  'blog/2021/10/17/highly-available-kubernetes-cluster-with-haproxy-and-keepalived',
  'blog/2022/02/06/immutable-infrastructure-treating-servers-like-cattle-does-it-sound-ridiculous',
  'blog/2022/02/18/jcasc-jenkins-configuration-as-code-setting-up-jenkins-in-a-fully-reproducible-way',
];

const THOUGHTS_POSTS = [
  'thoughts/trade-off',
  'thoughts/daring-echo',
  'thoughts/generational-dispute',
  'thoughts/upon-midst-of-war',
  'thoughts/pewaris-atau-perintis',
];

// Fallback for posts with no .post-date AND no real RSS <pubDate> — see spec.md.
const DATE_FALLBACK = {
  'thoughts/trade-off': '2021-09-27',
  'thoughts/daring-echo': '2024-02-26',
};

function extractRssDate(rssContent, urlPath) {
  const guid = `https://fauzislami.github.io${urlPath}`;
  const items = rssContent.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const item of items) {
    if (item.includes(`<guid>${guid}</guid>`)) {
      const m = item.match(/<pubDate>(.*?)<\/pubDate>/);
      if (m) return parseRssPubDate(m[1]);
    }
  }
  return null;
}

function convertOne(relPath, section, rssContent) {
  const slug = relPath.split('/').pop();
  const urlPath = `/${relPath}/`;
  const htmlPath = path.join(masterRef, relPath, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  const title = $('.post-header-section h1').first().text().trim();
  const dateText = $('.post-date').first().text().trim();
  let date = dateText ? parsePostDate(dateText) : null;
  if (!date) date = extractRssDate(rssContent, urlPath);
  if (!date) date = DATE_FALLBACK[relPath];
  if (!date) throw new Error(`No date resolved for ${relPath}`);

  const tags = $('.post-tags .post-tag a').map((_, el) => $(el).text().trim()).get();
  const bodyMarkdown = htmlToMarkdownWithNotices($, $('.post-content').first());

  const frontMatter = buildFrontMatter({ title, date, tags, url: urlPath });
  const outDir = path.join(REPO_ROOT, 'content', section);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}.md`);
  fs.writeFileSync(outPath, `${frontMatter}\n\n${bodyMarkdown}\n`);
  console.log(`wrote ${path.relative(REPO_ROOT, outPath)}  (url: ${urlPath}, date: ${date}, tags: [${tags.join(', ')}])`);
}

const rssContent = fs.readFileSync(path.join(masterRef, 'index.xml'), 'utf8');
for (const relPath of BLOG_POSTS) convertOne(relPath, 'blog', rssContent);
for (const relPath of THOUGHTS_POSTS) convertOne(relPath, 'thoughts', rssContent);

console.log(`\nConverted ${BLOG_POSTS.length + THOUGHTS_POSTS.length} posts.`);
```

- [ ] **Step 2: Run it against the reference worktree**

Run: `node scripts/recovery/convert.mjs "$MASTER_REF"`
Expected: 28 `wrote ...` lines followed by `Converted 28 posts.`, no errors thrown.

- [ ] **Step 3: Verify the expected file counts**

Run: `ls content/blog/*.md | wc -l && ls content/thoughts/*.md | wc -l`
Expected: `23` then `5`.

- [ ] **Step 4: Spot-check one flat-permalink post's front matter**

Run: `head -8 content/blog/pod-topology-spread-constraints.md`
Expected:
```
---
title: "Distribute Pods Across Nodes With topologySpreadConstraints"
date: 2022-11-01
type: post
url: "/blog/pod-topology-spread-constraints/"
tags: ["Kubernetes"]
draft: false
---
```

- [ ] **Step 5: Spot-check a date-fallback thoughts post**

Run: `head -8 content/thoughts/trade-off.md`
Expected: `date: 2021-09-27` and `url: "/thoughts/trade-off/"` present.

- [ ] **Step 6: Commit**

```bash
git add scripts/recovery/convert.mjs content/
git commit -m "feat: convert all 28 real posts from published HTML into Markdown content"
```

---

### Task 7: Local build + automated content-parity verification

**Files:**
- Create: `scripts/recovery/verify.mjs`

**Interfaces:**
- Consumes: `public/` (from `hugo --minify`, using everything from Tasks 1-6) and
  `$MASTER_REF`.
- Produces: a pass/fail report. This is the gate before Task 8's workflow is ever allowed
  to run for real.

- [ ] **Step 1: Write `verify.mjs`**

```js
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

const masterRef = process.argv[2];
const publicDir = process.argv[3] || path.join(REPO_ROOT, 'public');
if (!masterRef) {
  console.error('Usage: node verify.mjs <path-to-master-worktree> [path-to-public-dir]');
  process.exit(1);
}

const ALL_POSTS = [
  'blog/pod-topology-spread-constraints',
  'blog/terratest-golang-for-infrastructure-e2e-testing',
  'blog/k8s-thing-how-linux-namespace-Plays-a-role-in-Kubernetes',
  'blog/k8s-thing-how-linux-namespace-works-in-a-pod',
  'blog/fluxcd-image-watcher',
  'blog/flux-image-watcher',
  'blog/linter-aggregator-golangci-lint',
  'blog/2021/01/18/automating-k8s-cluster-installation-with-kubespray',
  'blog/2021/03/03/ci-cd-labs-part-1-integrate-jenkins-with-nexus-repository-oss',
  'blog/2021/03/05/ci-cd-labs-part-2-integrate-jenkins-with-bitbucket-server',
  'blog/2021/03/10/menambahkan-trusted-certificate-pada-jvm-di-jenkins',
  'blog/2021/03/10/namespace-openshift-tidak-dapat-dihapus',
  'blog/2021/03/10/storagecluster-ocs-tidak-dapat-dihapus',
  'blog/2021/03/20/machineconfigpool-degraded-saat-updating-error-when-evicting-pod',
  'blog/2021/03/26/ci-cd-labs-part-3-integrate-jenkins-with-openshift',
  'blog/2021/07/23/collecting-network-traffic-using-tcpdump-on-pod-level-in-openshift',
  'blog/2021/08/01/service-mesh-istio-and-kiali-setup',
  'blog/2021/09/26/secure-k8s-secret-object-using-sealedsecret',
  'blog/2021/10/08/proxying-pypi-repository-in-nexus-repository-manager',
  'blog/2021/10/14/proxying-docker-registry-through-nexus-repository-manager',
  'blog/2021/10/17/highly-available-kubernetes-cluster-with-haproxy-and-keepalived',
  'blog/2022/02/06/immutable-infrastructure-treating-servers-like-cattle-does-it-sound-ridiculous',
  'blog/2022/02/18/jcasc-jenkins-configuration-as-code-setting-up-jenkins-in-a-fully-reproducible-way',
  'thoughts/trade-off',
  'thoughts/daring-echo',
  'thoughts/generational-dispute',
  'thoughts/upon-midst-of-war',
  'thoughts/pewaris-atau-perintis',
];

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function loadPost(dir, relPath) {
  const htmlPath = path.join(dir, relPath, 'index.html');
  if (!fs.existsSync(htmlPath)) return null;
  const $ = cheerio.load(fs.readFileSync(htmlPath, 'utf8'));
  return {
    title: normalizeText($('.post-header-section h1').first().text()),
    tags: $('.post-tags .post-tag a').map((_, el) => normalizeText($(el).text())).get(),
    body: normalizeText($('.post-content').first().text()),
  };
}

let failures = 0;
for (const relPath of ALL_POSTS) {
  const expected = loadPost(masterRef, relPath);
  const actual = loadPost(publicDir, relPath);
  if (!expected) {
    console.error(`FAIL ${relPath}: missing from reference (unexpected)`);
    failures++;
    continue;
  }
  if (!actual) {
    console.error(`FAIL ${relPath}: missing from public/ output`);
    failures++;
    continue;
  }
  if (expected.title !== actual.title) {
    console.error(`FAIL ${relPath}: title mismatch\n  expected: ${expected.title}\n  actual:   ${actual.title}`);
    failures++;
  }
  if (JSON.stringify(expected.tags) !== JSON.stringify(actual.tags)) {
    console.error(`FAIL ${relPath}: tags mismatch\n  expected: ${JSON.stringify(expected.tags)}\n  actual:   ${JSON.stringify(actual.tags)}`);
    failures++;
  }
  if (expected.body !== actual.body) {
    console.error(`FAIL ${relPath}: body text mismatch`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed out of ${ALL_POSTS.length} posts.`);
  process.exit(1);
}
console.log(`All ${ALL_POSTS.length} posts verified OK (title, tags, body text match).`);
```

- [ ] **Step 2: Build the full site**

Run: `hugo --minify`
Expected: exits 0, prints a page count of roughly 28 posts + list/taxonomy pages (no
errors about missing shortcodes or templates).

- [ ] **Step 3: Run the verification script**

Run: `node scripts/recovery/verify.mjs "$MASTER_REF"`
Expected: `All 28 posts verified OK (title, tags, body text match).` printed, exit 0.

- [ ] **Step 4: If it fails, fix and re-run**

For any `FAIL` line: open both `content/<section>/<slug>.md` and the corresponding file
under `$MASTER_REF/<relPath>/index.html`, find the discrepancy (usually a body-text
extraction edge case in `convert.mjs`/`lib.mjs`), fix the script or the generated
Markdown, re-run `node scripts/recovery/convert.mjs "$MASTER_REF"` then `hugo --minify`
then Step 3 again, until it passes clean.

- [ ] **Step 5: Commit**

```bash
git add scripts/recovery/verify.mjs
git commit -m "test: add build-vs-published content parity verification script"
```

---

### Task 8: GitHub Actions build-and-publish workflow

**Files:**
- Create: `.github/workflows/build-deploy.yml`

**Interfaces:**
- Consumes: everything from Tasks 1-7 (the whole `source` branch).
- Produces: on every future push to `source`, builds with Hugo and pushes the generated
  `public/` output to `master`. **This task creates and commits the workflow file only —
  it must NOT be triggered (no push of `source` to the remote, no manual workflow
  dispatch) without separate, explicit user confirmation, since that write to `master`
  affects the live published site.**

- [ ] **Step 1: Write the workflow**

```yaml
name: Build and Publish

on:
  push:
    branches: [source]
  workflow_dispatch: {}

permissions:
  contents: write

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: '0.152.2'
          extended: true

      - name: Build site
        run: hugo --minify

      - name: Publish to master
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git fetch origin master
          git worktree add /tmp/master-publish origin/master
          rsync -a --delete --exclude='.git' public/ /tmp/master-publish/
          cd /tmp/master-publish
          git add -A
          if git diff --cached --quiet; then
            echo "No changes to publish"
          else
            git commit -m "Publish site from source@${GITHUB_SHA}"
            git push origin HEAD:master
          fi
```

- [ ] **Step 2: Validate the YAML syntax locally**

Run: `npx -y js-yaml .github/workflows/build-deploy.yml`
Expected: prints the parsed document back as YAML (confirms it parses without error);
a syntax mistake instead prints a `YAMLException` with a line/column pointer.

- [ ] **Step 3: Commit (do not push, do not trigger)**

```bash
git add .github/workflows/build-deploy.yml
git commit -m "ci: add workflow to build source and publish to master on push"
```

- [ ] **Step 4: Report completion to the user without pushing anything**

State clearly that `source` now has 8 commits building a complete, locally-verified Hugo
project, and that pushing `source` to the remote (which is needed for the workflow to
ever run) requires their explicit go-ahead, since it's the step that will eventually
overwrite `master`'s published content.
