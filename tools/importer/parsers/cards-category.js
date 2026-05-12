/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-category
 * Base block: cards
 * Source: https://www.edmundoptics.com/
 * Selector: .shop-by-cat .row
 * Generated: 2026-05-06
 *
 * Converts a grid of product category links (each with image + h3 name)
 * into a Cards block table with 2 columns: image | linked heading.
 */
export default function parse(element, { document }) {
  const cardLinks = element.querySelectorAll('a[href]');
  const cells = [];

  cardLinks.forEach((link) => {
    const img = link.querySelector('img');
    const heading = link.querySelector('h3');

    if (!heading) return;

    // Column 1: image (may not exist for "All Products" card)
    const imageCell = img ? [img] : [];

    // Column 2: linked heading - wrap the heading text in an anchor
    const anchor = document.createElement('a');
    anchor.setAttribute('href', link.getAttribute('href'));
    anchor.textContent = heading.textContent.trim();
    const h3El = document.createElement('h3');
    h3El.append(anchor);
    const textCell = [h3El];

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });
  element.replaceWith(block);
}
