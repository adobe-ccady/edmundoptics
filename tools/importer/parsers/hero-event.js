/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-event variant.
 * Base block: hero
 * Source selector: #bannerParent4
 * Source: https://www.edmundoptics.com/
 * Generated: 2026-05-06
 * Note: Live validation may fail due to cookie consent gating on edmundoptics.com.
 * The banner content loads dynamically after cookie acceptance.
 *
 * Extracts a featured event hero banner with badge text, heading, and CTA link.
 * Source structure: <a id="bannerParent4"> wrapping a <div id="webinarHeader"> with
 * background-image style, containing <p class="series"> badge, <h1> title, and <button> CTA.
 * Target: 1-column, 3-row table (block name | background image | badge + heading + CTA).
 */
export default function parse(element, { document }) {
  // The element is #bannerParent4, an <a> tag wrapping the entire hero event block.
  // Extract the link href from the wrapping <a> element (used for CTA)
  const wrapperLink = element.tagName === 'A' ? element : element.querySelector('a');
  const ctaHref = wrapperLink ? wrapperLink.getAttribute('href') : null;

  // Extract background image from #webinarHeader style attribute
  const webinarHeader = element.querySelector('#webinarHeader, [id*="webinar"], [style*="background-image"]');
  let bgImageUrl = null;
  if (webinarHeader) {
    const style = webinarHeader.getAttribute('style') || '';
    const match = style.match(/background-image\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/i);
    if (match) {
      bgImageUrl = match[1];
    }
  }

  // Extract badge text (e.g. "FEATURED EVENT")
  const badgeEl = element.querySelector('p.series, p[class*="series"], .series');

  // Extract heading (h1, h2, or any heading)
  const heading = element.querySelector('h1, h2, h3, [class*="title"]');

  // Extract CTA button text
  const ctaButton = element.querySelector('button, a.button, .btn-other, [class*="btn"]');
  const ctaText = ctaButton ? ctaButton.textContent.trim() : 'Learn More';

  // Build cells array matching library example:
  // Row 1 (implicit via createBlock name): block name "hero-event"
  // Row 2: background image
  // Row 3: badge text + heading + CTA link
  const cells = [];

  // Row 2: Background image (from inline style or img element)
  if (bgImageUrl) {
    const img = document.createElement('img');
    img.src = bgImageUrl;
    img.alt = '';
    cells.push([img]);
  } else {
    // Fallback: check for any img element
    const imgEl = element.querySelector('img');
    if (imgEl) {
      cells.push([imgEl]);
    }
  }

  // Row 3: Content cell with badge, heading, and CTA
  const contentCell = [];

  // Add badge text as a paragraph element
  if (badgeEl) {
    const badgePara = document.createElement('p');
    badgePara.innerHTML = badgeEl.innerHTML;
    contentCell.push(badgePara);
  }

  // Add heading
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.trim();
    contentCell.push(h1);
  }

  // Create CTA link element
  if (ctaHref) {
    const ctaLink = document.createElement('a');
    ctaLink.href = ctaHref;
    ctaLink.textContent = ctaText;
    contentCell.push(ctaLink);
  }

  if (contentCell.length > 0) {
    cells.push(contentCell);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-event', cells });
  element.replaceWith(block);
}
