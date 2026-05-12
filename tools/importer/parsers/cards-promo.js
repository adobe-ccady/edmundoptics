/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo
 * Base block: cards
 * Source: https://www.edmundoptics.com/
 * Selectors: #bannerParent2, #bannerParent3
 * Generated: 2026-05-06
 *
 * Converts promotional banner elements into Cards block rows.
 * Each banner has a linked title and optional subtitle/description.
 * Source does not include images; parser inserts a placeholder.
 *
 * Target table structure (from library-example.md):
 *   | cards-promo |           |
 *   | image       | title/CTA |
 */
export default function parse(element, { document }) {
  // Extract the primary link wrapping the banner content
  const link = element.querySelector('a');
  if (!link) {
    // No actionable content - replace with empty fragment
    element.replaceWith(document.createDocumentFragment());
    return;
  }

  // Extract the title (.bannerheader-h1 in source, fallback to headings)
  const titleEl = element.querySelector('.bannerheader-h1, .banner-title, h1, h2, h3');

  // Extract optional subtitle/description (p.brandText in source)
  const subtitleEl = element.querySelector('p.brandText, p.banner-subtitle');

  // Build content cell (second column): title + optional subtitle + CTA link
  const contentCell = document.createElement('div');

  if (titleEl) {
    const heading = document.createElement('strong');
    heading.textContent = titleEl.textContent.trim();
    contentCell.appendChild(heading);
    contentCell.appendChild(document.createElement('br'));
  }

  if (subtitleEl && subtitleEl.textContent.trim()) {
    const desc = document.createElement('p');
    desc.textContent = subtitleEl.textContent.trim();
    contentCell.appendChild(desc);
  }

  // Add CTA link preserving the href
  const cta = document.createElement('a');
  cta.href = link.getAttribute('href') || link.href;
  cta.textContent = titleEl ? titleEl.textContent.trim() : 'Learn More';
  contentCell.appendChild(cta);

  // Build image cell (first column) - use existing image or placeholder
  const img = element.querySelector('img');
  let imageEl;
  if (img) {
    imageEl = img;
  } else {
    imageEl = document.createElement('img');
    imageEl.src = '/placeholder.png';
    imageEl.alt = titleEl ? titleEl.textContent.trim() : 'Promo';
  }

  // Build cells: one row with [image, content]
  // Matches Cards block library structure: image | text content
  const cells = [
    [[imageEl], [contentCell]],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
