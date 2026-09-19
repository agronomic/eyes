import { marked } from 'marked';

/**
 * Markdown → HTML, wrapping leading field labels (Growth:, Credits:, …)
 * in .label-caps so they share MetaLabel / Title: styling.
 */
export function markedWithFieldLabels(markdown) {
  if (!markdown) return '';

  return markdown
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      const match = trimmed.match(
        /^([A-Za-z][A-Za-z0-9 /&-]{0,40}):\s+([\s\S]+)$/
      );
      if (!match) return marked.parse(trimmed);

      const [, label, body] = match;
      return `<p><span class="label-caps">${label}:</span> ${marked.parseInline(body)}</p>\n`;
    })
    .join('');
}
