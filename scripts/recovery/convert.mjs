#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { parsePostDate, parseRssPubDate, buildFrontMatter, htmlToMarkdownWithNotices } from './lib.mjs';
import { BLOG_POSTS, THOUGHTS_POSTS, DATE_FALLBACK } from './posts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

const masterRef = process.argv[2];
if (!masterRef) {
  console.error('Usage: node convert.mjs <path-to-master-worktree>');
  process.exit(1);
}

function extractRssDate(rssContent, urlPath) {
  const guid = `https://fauzislami.github.io${urlPath}`;
  const items = rssContent.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const item of items) {
    if (item.includes(`<guid>${guid}</guid>`)) {
      const m = item.match(/<pubDate>(.*?)<\/pubDate>/);
      if (m) {
        const parsed = parseRssPubDate(m[1]);
        // "Mon, 01 Jan 0001 00:00:00 +0000" is Go's zero-value time.Time,
        // i.e. no real pubDate was ever set for this post — not a real date.
        if (parsed && parsed !== '0001-01-01') return parsed;
      }
      return null;
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
