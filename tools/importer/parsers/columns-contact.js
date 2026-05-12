/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-contact.
 * Base block: columns.
 * Source selector: .contactbanner_whitefooter .row
 * Generated: 2026-05-06
 *
 * Produces a 4-column Columns block with one data row.
 * Source structure: div.row > div.col-lg-3 (x4)
 *   Col 1: Sales & Expert Advice + phone number link + regional numbers link
 *   Col 2: LIVE CHAT button
 *   Col 3: EMAIL link to /contact-support/
 *   Col 4: Easy-to-Use + QUOTE TOOL link + description text
 */
export default function parse(element, { document }) {
  // Source element is div.row with 4 col-lg-3 child divs
  const columns = element.querySelectorAll(':scope > div[class*="col-"]');
  const cols = columns.length > 0 ? columns : element.querySelectorAll(':scope > div');

  const row = [];

  cols.forEach((col) => {
    const cellContent = [];

    // Check for .upper/.inlineBlock wrapper (columns 1 and 4 pattern)
    const upperDiv = col.querySelector('.upper, .inlineBlock');
    if (upperDiv) {
      const children = upperDiv.childNodes;
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.nodeType !== 1) continue; // skip text/comment nodes
        if (node.tagName === 'BR') continue; // skip line breaks

        if (node.tagName === 'SPAN') {
          const innerLink = node.querySelector('a[href]');
          if (innerLink && node.textContent.trim() === innerLink.textContent.trim()) {
            // Span only wraps a link (e.g. phone number) - extract the link
            const a = document.createElement('a');
            a.href = innerLink.getAttribute('href');
            a.textContent = innerLink.textContent.trim();
            if (a.textContent) cellContent.push(a);
          } else if (innerLink) {
            // Span has mixed text and link (e.g. "or view [regional numbers]")
            const p = document.createElement('p');
            p.innerHTML = node.innerHTML;
            if (p.textContent.trim()) cellContent.push(p);
          } else {
            // Plain text span (e.g. "Sales & Expert Advice", "Easy-to-Use")
            if (node.textContent.trim()) {
              const p = document.createElement('p');
              p.textContent = node.textContent.trim();
              cellContent.push(p);
            }
          }
        } else if (node.tagName === 'A') {
          // Direct link (e.g. QUOTE TOOL)
          const a = document.createElement('a');
          a.href = node.getAttribute('href');
          a.textContent = node.textContent.trim();
          if (a.textContent) cellContent.push(a);
        } else {
          // Other elements - extract links or text
          const links = node.querySelectorAll('a[href]');
          if (links.length > 0) {
            links.forEach((link) => {
              const a = document.createElement('a');
              a.href = link.getAttribute('href');
              a.textContent = link.textContent.trim();
              if (a.textContent) cellContent.push(a);
            });
          } else if (node.textContent.trim()) {
            const p = document.createElement('p');
            p.textContent = node.textContent.trim();
            cellContent.push(p);
          }
        }
      }
    } else {
      // Columns 2 and 3: button or direct link
      const button = col.querySelector('button');
      const link = col.querySelector('a[href]');

      if (button) {
        const p = document.createElement('p');
        p.textContent = button.textContent.trim();
        cellContent.push(p);
      }
      if (link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        if (a.textContent) cellContent.push(a);
      }
    }

    // Fallback: use column text content if nothing extracted
    if (cellContent.length === 0) {
      const p = document.createElement('p');
      p.textContent = col.textContent.trim();
      if (p.textContent) cellContent.push(p);
    }

    row.push(cellContent);
  });

  // cells: array of rows, each row is array of cells
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-contact', cells });
  element.replaceWith(block);
}
