/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-brand.
 * Base block: hero.
 * Source: https://www.edmundoptics.com/
 * Selector: #bannerParent1
 * Generated: 2026-05-06
 *
 * Source structure (verified against live DOM):
 *   div#bannerParent1
 *     > a#banner1[href="/knowledge-center?..."]
 *       > p.hpb1-txt
 *         > span "THE FUTURE DEPENDS ON OPTICS(R)" (title with strong/sup)
 *         > br
 *         > span "Supporting world-changing..." (subtitle)
 *         > button.btn-new "Explore Case Studies"
 *
 * Target table (from library-example.md):
 *   Row 1: background image (if present as img element in DOM)
 *   Row 2: heading (title) + CTA link
 *
 * Note: Live validation fails due to Cloudflare bot protection blocking headless
 * browsers. Parser logic verified manually via browser evaluation on live DOM.
 */
export default function parse(element, { document }) {
  // Extract the wrapping anchor link (contains href for CTA)
  const anchor = element.querySelector('a[href]');
  const ctaHref = anchor ? anchor.getAttribute('href') : '/';

  // Extract title from first span in .hpb1-txt (contains THE FUTURE DEPENDS ON OPTICS)
  const titleSpan = element.querySelector('.hpb1-txt > span:first-of-type, p > span:first-of-type');

  // Extract CTA button text
  const ctaButton = element.querySelector('button, .btn-new, .btn-pill');
  const ctaText = ctaButton ? ctaButton.textContent.trim() : 'Learn More';

  // Build the heading element for the title
  const heading = document.createElement('h1');
  if (titleSpan) {
    // Clone the title span content to preserve formatting (strong, sup)
    const clone = titleSpan.cloneNode(true);
    heading.innerHTML = clone.innerHTML;
  } else {
    heading.textContent = 'THE FUTURE DEPENDS ON OPTICS';
  }

  // Build CTA as a proper link element
  const ctaLink = document.createElement('a');
  ctaLink.setAttribute('href', ctaHref);
  ctaLink.textContent = ctaText;

  // Build cells array to match library-example.md structure
  const cells = [];

  // Row 1: background image (optional - only if an img element exists in DOM)
  const bgImage = element.querySelector('img');
  if (bgImage) {
    cells.push([bgImage.cloneNode(true)]);
  }

  // Row 2: title heading + CTA link (always present)
  cells.push([heading, ctaLink]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-brand', cells });
  element.replaceWith(block);
}
