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

test('htmlToMarkdownWithNotices strips style and script elements', () => {
  const html = '<div class="post-content"><style>.notice{padding:18px}</style><p>Hello world</p></div>';
  const $ = cheerio.load(html);
  const markdown = htmlToMarkdownWithNotices($, $('.post-content'));
  assert.doesNotMatch(markdown, /padding:18px/);
  assert.match(markdown, /Hello world/);
});
