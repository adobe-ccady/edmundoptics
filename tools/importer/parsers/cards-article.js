/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-article
 * Base block: cards
 * Source: https://www.edmundoptics.com/
 * Selector: #dv-resources .row.respd:has(.card-rc)
 * Generated: 2026-05-06
 *
 * Converts knowledge center article cards into a Cards block table.
 * Each card (div.card-rc) contains: image | content type text + linked heading title
 *
 * Source structure (validated against live DOM via MCP browser):
 *   .card-rc > .webinar1 > div.image#panelImage > img
 *   .card-rc > .webinar1 > div.image#panelDescription > .trending (content type) + h2.toheader > a (title link)
 */
export default function parse(element, { document }) {
  // Each card is a div.card-rc inside the row container
  const cards = element.querySelectorAll('.card-rc');

  const cells = [];

  cards.forEach((card) => {
    // Extract article image from the panelImage div
    const image = card.querySelector('img');

    // Extract content type tag (e.g., "Application Note", "Trending in Optics")
    // The .trending div contains a span icon + text
    const trendingDiv = card.querySelector('.trending');

    // Extract article title heading with link
    const heading = card.querySelector('h2, h3');

    // Build the text content cell: content type + linked heading
    const contentCell = [];

    if (trendingDiv) {
      // Create a clean paragraph for the content type text (without the icon span)
      const contentTypeText = trendingDiv.textContent.trim();
      const p = document.createElement('p');
      p.textContent = contentTypeText;
      contentCell.push(p);
    }

    if (heading) contentCell.push(heading);

    // Row: [image cell, text content cell]
    cells.push([image || '', contentCell.length ? contentCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
