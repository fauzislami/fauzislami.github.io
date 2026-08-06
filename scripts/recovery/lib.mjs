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
  // Some pages embed a per-post <style> (notice CSS) or <script> inside
  // .post-content; Turndown doesn't strip these by default, so their raw
  // text would otherwise leak into the converted markdown body.
  $content.find('style, script').remove();
  $content.find('div.notice').each((_, el) => {
    const $el = $(el);
    const classAttr = $el.attr('class') || '';
    const type = classAttr.split(/\s+/)[1] || 'note';
    $el.find('.notice-title').remove();
    const inner = $el.html().trim();
    $el.replaceWith(`<p>%%NOTICE-OPEN-${type}%%</p>${inner}<p>%%NOTICE-CLOSE%%</p>`);
  });
  const html = $content.html();
  let markdown = turndownService.turndown(html);
  markdown = markdown
    .replace(/%%NOTICE-OPEN-(\w+)%%/g, '{{< notice "$1" >}}')
    .replace(/%%NOTICE-CLOSE%%/g, '{{< /notice >}}');
  return markdown;
}
