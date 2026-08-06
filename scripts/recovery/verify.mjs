#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { BLOG_POSTS, THOUGHTS_POSTS } from './posts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

const masterRef = process.argv[2];
const publicDir = process.argv[3] || path.join(REPO_ROOT, 'public');
if (!masterRef) {
  console.error('Usage: node verify.mjs <path-to-master-worktree> [path-to-public-dir]');
  process.exit(1);
}

const ALL_POSTS = [...BLOG_POSTS, ...THOUGHTS_POSTS];

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

// Hugo's `--minify` strips insignificant whitespace between block-level
// tags (e.g. `</h1>\n<p>` becomes `</h1><p>`). The currently-published
// site was built without --minify, so its HTML still has that whitespace.
// A naive $(el).text() would then run words at block boundaries together
// (e.g. "IntroI had...") for minified output only, producing a false
// mismatch. Insert an explicit space after every block-level element so
// text extraction is robust to minification either way.
const BLOCK_TAGS = 'p,div,li,ul,ol,blockquote,pre,h1,h2,h3,h4,h5,h6,br,hr,table,tr,td,th,section,article,figure,figcaption';

function blockAwareText($, el) {
  const $clone = $(el).clone();
  // <style>/<script> tag contents are text nodes in the DOM but are never
  // rendered as reader-visible text; the notice shortcode's one-time CSS
  // injection lands at a different position in minified vs unminified
  // output, which would otherwise produce a false-positive body mismatch.
  $clone.find('style,script').remove();
  $clone.find(BLOCK_TAGS).after(' ');
  return $clone.text();
}

function loadPost(dir, relPath) {
  const htmlPath = path.join(dir, relPath, 'index.html');
  if (!fs.existsSync(htmlPath)) return null;
  const $ = cheerio.load(fs.readFileSync(htmlPath, 'utf8'));
  return {
    title: normalizeText($('.post-header-section h1').first().text()),
    tags: $('.post-tags .post-tag a').map((_, el) => normalizeText($(el).text())).get(),
    body: normalizeText(blockAwareText($, $('.post-content').first())),
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
